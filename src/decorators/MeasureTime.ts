import { InfluxService } from "@services/InfluxService";

/**
 * Decorator to measure the execution time of a method and log it to InfluxDB.
 * @param metricName Optional custom name for the metric. Defaults to the method name.
 */
export function MeasureTime(metricName?: string) {
	return function (
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		const originalMethod = descriptor.value;
		const name = metricName || propertyKey;

		descriptor.value = async function (...args: any[]) {
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
				InfluxService.writeExecutionMetric(name, duration, success);
			}
		};

		return descriptor;
	};
}
