import {
	CONFIG_TYPE_METADATA_KEY,
	type ConfigTypeMetadata,
} from "@decorators/ConfigType";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import {
	type ConfigTypeHandler,
	ConfigTypeRegistry,
} from "@registers/ConfigTypeRegistry";
import { ConfigHelper } from "@utils/ConfigHelper";
import { BaseConfigInteractions } from "./BaseConfigInteractions";
import {
	ButtonInteraction,
	ChatInputCommandInteraction,
	type RepliableInteraction,
	StringSelectMenuInteraction,
} from "discord.js";
import type { ConfigPropertyOptions } from "@decorators/ConfigProperty";
import { LeBotClient } from "@class/LeBotClient";

export abstract class BaseConfigTypeHandler
	extends BaseConfigInteractions
	implements ConfigTypeHandler
{
	constructor(configHelper: ConfigHelper, configService: ConfigService) {
		super(configHelper, configService);

		const metadata = Reflect.getMetadata(
			CONFIG_TYPE_METADATA_KEY,
			this.constructor,
		) as ConfigTypeMetadata;

		if (metadata) {
			ConfigTypeRegistry.register({
				id: metadata.id,
				name: metadata.name,
				handler: this,
			});
		}
	}

	abstract show(
		interaction: RepliableInteraction,
		propertyOptions: ConfigPropertyOptions,
		selectedProperty: string,
		moduleName: string,
	): Promise<void>;

	async handleUpdate?(
		interaction:
			| StringSelectMenuInteraction
			| ButtonInteraction
			| ChatInputCommandInteraction,
		client: LeBotClient,
		moduleName: string,
		propertyKey: string,
		value: unknown,
	): Promise<void> {
		// Default implementation (can be overridden)
		const { propertyOptions } = this.getPropertyContext(
			client as LeBotClient<true>,
			moduleName,
			propertyKey,
		);
		if (propertyOptions) {
			await this.updateConfig(
				client as LeBotClient<true>,
				interaction,
				moduleName,
				propertyKey,
				value as string | string[],
				propertyOptions.type,
			);
		}
	}

	async formatValue?(guildId: string, value: unknown): Promise<string> {
		return String(value);
	}
}
