import { toConfigKey } from "@decorators/ConfigProperty";
import {
	COMMAND_PARAMS_METADATA_KEY,
	CommandParamType,
	type CommandParameter,
} from "@decorators/params";
import { DependencyContainer } from "@di/DependencyContainer";
import type { Constructor } from "@di/types";
import { ConfigUpdateRegistry } from "@registers/ConfigUpdateRegistry";

export function OnConfigUpdate(propertyName: string) {
	return function (
		target: object,
		propertyKey: string,
		_descriptor: PropertyDescriptor,
	) {
		const configKey = toConfigKey(propertyName);

		ConfigUpdateRegistry.register(
			configKey,
			async (guildId, key, value) => {
				const container = DependencyContainer.getInstance();
				const instance = container.resolve(
					target.constructor as Constructor,
				) as Record<string, (...args: unknown[]) => Promise<void>>;
				const method = instance[propertyKey];

				if (method) {
					const params: CommandParameter[] =
						Reflect.getMetadata(
							COMMAND_PARAMS_METADATA_KEY,
							target,
							propertyKey,
						) || [];

					const args: unknown[] = [];
					for (const param of params) {
						switch (param.type) {
							case CommandParamType.GuildId:
								args[param.index] = guildId;
								break;
							case CommandParamType.ConfigKey:
								args[param.index] = key;
								break;
							case CommandParamType.ConfigValue:
								args[param.index] = value;
								break;
							case CommandParamType.Client:
								args[param.index] =
									container.resolve("Client");
								break;
							default:
								break;
						}
					}

					await method.call(instance, ...args);
				}
			},
		);
	};
}
