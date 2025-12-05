import type { QueryApi, WriteApi } from "@influxdata/influxdb-client";
import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { Logger } from "@utils/Logger";

export class InfluxService {
	private static instance: InfluxDB;
	private static writeApi: WriteApi;
	private static queryApi: QueryApi;
	private static logger = new Logger("InfluxService");

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
			this.writeApi = client.getWriteApi(this.org, this.bucket, "s");
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
				let hasData = false;
				queryApi.queryRows(testQuery, {
					next: () => {
						hasData = true;
					},
					error: (error) => reject(error),
					complete: () => resolve(),
				});
			});

			this.logger.log("✅ Connected to InfluxDB");
		} catch (error) {
			const trace = error instanceof Error ? error.stack : String(error);
			this.logger.error("❌ InfluxDB connection failed:", trace);
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
		const point = new Point("function_execution")
			.tag("function", functionName)
			.tag("success", String(success))
			.floatField("duration_ms", durationMs);

		for (const [key, value] of Object.entries(additionalTags)) {
			point.tag(key, value);
		}

		this.writePoint(point);
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
