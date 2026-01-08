import { toConfigKey } from "@decorators/ConfigProperty";
import {
	COMMAND_PARAMS_METADATA_KEY,
	type CommandParameter,
	CommandParamType,
} from "@decorators/params";
import { DependencyContainer } from "@di/DependencyContainer";
import { type Constructor } from "@di/types";
import { ConfigUpdateRegistry } from "@registers/ConfigUpdateRegistry";

export function OnConfigUpdate(propertyName: string): MethodDecorator {
	return (
		target: object,
		propertyKey: string | symbol,
		_descriptor: PropertyDescriptor,
	) => {
		const configKey = toConfigKey(propertyName);

		ConfigUpdateRegistry.register(
			configKey,
			async (_guildId, _key, _value) => {
				const container = DependencyContainer.getInstance();
				const instance = container.resolve(
					target.constructor as Constructor,
				) as Record<
					string | symbol,
					(...args: unknown[]) => Promise<void>
				>;
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
							case CommandParamType.Client:
								args[param.index] = container.resolve("Client");
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
