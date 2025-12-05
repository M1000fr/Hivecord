import { InfluxService } from "@services/InfluxService";

interface MeasureTimeOptions {
	name?: string;
	trackInteraction?: boolean;
	trackComponents?: any[];
}

/**
 * Decorator to measure the execution time of a method and log it to InfluxDB.
 * @param nameOrOptions Optional custom name for the metric or options object.
 */
export function MeasureTime(nameOrOptions?: string | MeasureTimeOptions) {
	const options: MeasureTimeOptions =
		typeof nameOrOptions === "string"
			? { name: nameOrOptions }
			: nameOrOptions || {};

	return function (
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		const originalMethod = descriptor.value;
		const metricName = options.name || propertyKey;

		// Instrument requested components
		if (options.trackComponents) {
			for (const component of options.trackComponents) {
				if (component && component.name) {
					InfluxService.instrument(component, component.name);
				}
			}
		}

		descriptor.value = async function (this: any, ...args: any[]) {
			// If tracking is enabled, look for an interaction object in args and proxy it
			if (options.trackInteraction) {
				args = args.map((arg) => {
					// Simple check if it looks like a discord interaction (has reply and client)
					if (
						arg &&
						typeof arg === "object" &&
						"reply" in arg &&
						"client" in arg
					) {
						return createInteractionProxy(arg, metricName);
					}
					return arg;
				});
			}

			return InfluxService.runInContext(metricName, async () => {
				const start = performance.now();
				let success = true;
				try {
					const result = await originalMethod.apply(this, args);
					return result;
				} catch (error) {
					success = false;
					throw error;
				} finally {
					const end = performance.now();
					const duration = end - start;
					// Fire and forget - don't await the write
					InfluxService.writeExecutionMetric(
						metricName,
						duration,
						success,
					);
				}
			});
		};

		return descriptor;
	};
}

function createInteractionProxy(interaction: any, parentMetric: string) {
	return new Proxy(interaction, {
		get(target, prop, receiver) {
			const value = Reflect.get(target, prop, receiver);

			// We only want to wrap specific methods that do network calls
			const methodsToTrack = [
				"reply",
				"editReply",
				"followUp",
				"deferReply",
				"deleteReply",
				"fetchReply",
			];

			if (
				typeof value === "function" &&
				typeof prop === "string" &&
				methodsToTrack.includes(prop)
			) {
				return async function (this: any, ...args: any[]) {
					const start = performance.now();
					let success = true;
					try {
						return await value.apply(this, args);
					} catch (error) {
						success = false;
						throw error;
					} finally {
						const end = performance.now();
						InfluxService.writeExecutionMetric(
							`${parentMetric}_${prop}`, // e.g. ping_command_execution_time_reply
							end - start,
							success,
							{
								parent_metric: parentMetric,
								type: "discord_api",
							},
						);
					}
				};
			}
			return value;
		},
	});
}
