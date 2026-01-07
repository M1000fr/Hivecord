import { Logger } from "@utils/Logger";

type ConfigUpdateCallback = (
	guildId: string,
	key: string,
	value: unknown,
) => Promise<void> | void;

export class ConfigUpdateRegistry {
	private static listeners = new Map<string, ConfigUpdateCallback[]>();
	private static logger = new Logger("ConfigUpdateRegistry");

	static register(key: string, callback: ConfigUpdateCallback) {
		if (!ConfigUpdateRegistry.listeners.has(key)) {
			ConfigUpdateRegistry.listeners.set(key, []);
		}
		ConfigUpdateRegistry.listeners.get(key)!.push(callback);
	}

	static async execute(guildId: string, key: string, value: unknown) {
		const callbacks = ConfigUpdateRegistry.listeners.get(key);
		if (callbacks) {
			ConfigUpdateRegistry.logger.log(
				`Triggering ${callbacks.length} listeners for config update: ${key}`,
			);
			for (const callback of callbacks) {
				try {
					await callback(guildId, key, value);
				} catch (error) {
					ConfigUpdateRegistry.logger.error(
						`Error in config update listener for ${key}: ${error instanceof Error ? error.message : String(error)}`,
						error instanceof Error ? error.stack : undefined,
					);
				}
			}
		}
	}
}
