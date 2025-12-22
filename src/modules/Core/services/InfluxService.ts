import { Injectable } from "@decorators/Injectable";
import type { QueryApi, WriteApi } from "@influxdata/influxdb-client";
import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { Logger } from "@utils/Logger";
import { AsyncLocalStorage } from "async_hooks";

interface TraceContext {
	traceId: string;
	parentMetric: string;
}

@Injectable()
export class InfluxService {
	private static instance: InfluxDB;
	private static writeApi: WriteApi;
	private static queryApi: QueryApi;
	private static logger = new Logger("InfluxService");
	private static asyncLocalStorage = new AsyncLocalStorage<TraceContext>();
	private static instrumentedObjects = new WeakSet<object>();

	private static url = process.env.INFLUX_URL || "http://localhost:8086";
	private static token = process.env.INFLUX_TOKEN || "";
	private static org = process.env.INFLUX_ORG || "lebot";
	private static bucket = process.env.INFLUX_BUCKET || "stats";

	public static getInstance(): InfluxDB {
		if (!this.instance) {
			this.instance = new InfluxDB({ url: this.url, token: this.token });
			this.logger.log("InfluxDB instance created");
		}
		return this.instance;
	}

	public static getWriteApi(): WriteApi {
		if (!this.writeApi) {
			const client = this.getInstance();
			this.writeApi = client.getWriteApi(this.org, this.bucket, "ms", {
				flushInterval: 1000,
			});
			this.writeApi.useDefaultTags({ app: "lebot" });
		}
		return this.writeApi;
	}

	public static getQueryApi(): QueryApi {
		if (!this.queryApi) {
			const client = this.getInstance();
			this.queryApi = client.getQueryApi(this.org);
		}
		return this.queryApi;
	}

	public static async checkConnection(): Promise<void> {
		try {
			const queryApi = this.getQueryApi();
			// Test connection with a simple query
			const testQuery = `from(bucket: "${this.bucket}") |> range(start: -1m) |> limit(n: 1)`;

			await new Promise<void>((resolve, reject) => {
				queryApi.queryRows(testQuery, {
					next: () => {
						// Data received
					},
					error: (error) => reject(error),
					complete: () => resolve(),
				});
			});

			this.logger.log("Connected to InfluxDB");
		} catch (error) {
			const trace = error instanceof Error ? error.stack : String(error);
			this.logger.error("InfluxDB connection failed:", trace);
			process.exit(1);
		}
	}

	// Helper methods for writing data
	public static writePoint(point: Point): void {
		const writeApi = this.getWriteApi();
		writeApi.writePoint(point);
	}

	public static writeExecutionMetric(
		functionName: string,
		durationMs: number,
		success: boolean = true,
		additionalTags: Record<string, string> = {},
	): void {
		const context = this.asyncLocalStorage.getStore();
		const point = new Point("function_execution")
			.tag("function", functionName)
			.tag("success", String(success))
			.floatField("duration_ms", durationMs)
			.timestamp(new Date());

		if (context) {
			point.tag("trace_id", context.traceId);
			if (!additionalTags["parent_metric"]) {
				point.tag("parent_metric", context.parentMetric);
			}
		}

		for (const [key, value] of Object.entries(additionalTags)) {
			point.tag(key, value);
		}

		this.writePoint(point);
	}

	/**
	 * Measure the execution time of a function and log it to InfluxDB.
	 * @param metricName The name of the metric to log
	 * @param fn The function to execute
	 * @param tags Optional tags to add to the metric
	 */
	public static async measure<T>(
		metricName: string,
		fn: () => Promise<T>,
		tags: Record<string, string> = {},
	): Promise<T> {
		const start = performance.now();
		let success = true;
		try {
			return await fn();
		} catch (error) {
			success = false;
			throw error;
		} finally {
			const end = performance.now();
			this.writeExecutionMetric(metricName, end - start, success, tags);
		}
	}

	public static async flush(): Promise<void> {
		const writeApi = this.getWriteApi();
		try {
			await writeApi.flush();
		} catch (error) {
			this.logger.error(
				"Failed to flush InfluxDB write API",
				error instanceof Error ? error.stack : String(error),
			);
		}
	}

	public static runInContext<T>(
		metricName: string,
		fn: () => Promise<T>,
	): Promise<T> {
		const context: TraceContext = {
			traceId: crypto.randomUUID(),
			parentMetric: metricName,
		};
		return this.asyncLocalStorage.run(context, fn);
	}

	public static instrument(target: object, targetName: string): void {
		if (this.instrumentedObjects.has(target)) {
			return;
		}

		const descriptors = Object.getOwnPropertyDescriptors(target);
		for (const [key, descriptor] of Object.entries(descriptors)) {
			if (
				typeof descriptor.value === "function" &&
				key !== "constructor" &&
				!key.startsWith("_")
			) {
				const originalMethod = descriptor.value;
				// eslint-disable-next-line @typescript-eslint/no-this-alias
				const self = this;

				// Replace the method
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(target as any)[key] = async function (...args: unknown[]) {
					const context = self.asyncLocalStorage.getStore();
					if (!context) {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						return originalMethod.apply(this as any, args);
					}

					const start = performance.now();
					let success = true;
					try {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						return await originalMethod.apply(this as any, args);
					} catch (error) {
						success = false;
						throw error;
					} finally {
						const end = performance.now();
						self.writeExecutionMetric(
							`${context.parentMetric}_${targetName}_${key}`,
							end - start,
							success,
							{
								parent_metric: context.parentMetric,
								trace_id: context.traceId,
								component: targetName,
							},
						);
					}
				};
			}
		}

		this.instrumentedObjects.add(target);
		this.logger.log(`Instrumented ${targetName}`);
	}

	public static async close(): Promise<void> {
		const writeApi = this.getWriteApi();
		try {
			await writeApi.close();
			this.logger.log("InfluxDB write API closed");
		} catch (error) {
			this.logger.error(
				"Failed to close InfluxDB write API",
				error instanceof Error ? error.stack : String(error),
			);
		}
	}

	// Query helpers
	public static async query<T>(fluxQuery: string): Promise<T[]> {
		const queryApi = this.getQueryApi();
		const results: T[] = [];

		return new Promise((resolve, reject) => {
			queryApi.queryRows(fluxQuery, {
				next: (row, tableMeta) => {
					const record = tableMeta.toObject(row) as T;
					results.push(record);
				},
				error: (error) => {
					this.logger.error("Query failed", error.message);
					reject(error);
				},
				complete: () => {
					resolve(results);
				},
			});
		});
	}

	// Convenience method to get bucket name
	public static getBucket(): string {
		return this.bucket;
	}

	public static getOrg(): string {
		return this.org;
	}
}
