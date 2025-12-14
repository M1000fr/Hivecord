import { toConfigKey } from "@decorators/ConfigProperty";
import { ConfigUpdateRegistry } from "@registers/ConfigUpdateRegistry";

export function OnConfigUpdate(propertyName: string) {
	return function (
		target: object,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		const originalMethod = descriptor.value;
		const configKey = toConfigKey(propertyName);

		ConfigUpdateRegistry.register(
			configKey,
			async (guildId, key, value) => {
				await originalMethod.call(target, guildId, key, value);
			},
		);
	};
}
