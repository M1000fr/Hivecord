import { BaseConfigInteractions } from "@class/BaseConfigInteractions";
import { EConfigType } from "@decorators/ConfigProperty";
import { Inject } from "@decorators/Inject";
import { Injectable } from "@decorators/Injectable";
import { Button, SelectMenu } from "@decorators/Interaction";
import { Interaction } from "@decorators/params";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { ConfigTypeRegistry } from "@registers/ConfigTypeRegistry";
import { ConfigHelper } from "@utils/ConfigHelper";
import {
	type ButtonInteraction,
	type StringSelectMenuInteraction,
} from "discord.js";
import { AttachmentConfigInteractions } from "./AttachmentConfigInteractions";
import { BooleanConfigInteractions } from "./BooleanConfigInteractions";
import { RoleChannelConfigInteractions } from "./RoleChannelConfigInteractions";
import { StringArrayConfigInteractions } from "./StringArrayConfigInteractions";
import { StringChoiceConfigInteractions } from "./StringChoiceConfigInteractions";
import { StringConfigInteractions } from "./StringConfigInteractions";

@Injectable()
export class ModuleConfigInteractions extends BaseConfigInteractions {
	constructor(
		configHelper: ConfigHelper,
		configService: ConfigService,
		@Inject(BooleanConfigInteractions)
		private readonly booleanHandler: BooleanConfigInteractions,
		@Inject(StringConfigInteractions)
		private readonly stringHandler: StringConfigInteractions,
		@Inject(StringChoiceConfigInteractions)
		private readonly stringChoiceHandler: StringChoiceConfigInteractions,
		@Inject(RoleChannelConfigInteractions)
		private readonly roleChannelHandler: RoleChannelConfigInteractions,
		@Inject(AttachmentConfigInteractions)
		private readonly attachmentHandler: AttachmentConfigInteractions,
		@Inject(StringArrayConfigInteractions)
		private readonly stringArrayHandler: StringArrayConfigInteractions,
	) {
		super(configHelper, configService);
	}

	@SelectMenu("module_config:*")
	async handlePropertySelection(
		@Interaction() interaction: StringSelectMenuInteraction,
	) {
		const selectedProperty = interaction.values[0];
		if (!selectedProperty) {
			await this.respondToInteraction(
				interaction,
				"❌ No property selected.",
			);
			return;
		}

		const baseCtx = await this.getInteractionContext(interaction);
		if (!baseCtx) return;
		const { client, parts } = baseCtx;
		const moduleName = parts[1];

		if (!moduleName) return;

		const { module, propertyOptions } = this.getPropertyContext(
			client,
			moduleName,
			selectedProperty,
		);

		if (!module?.options.config) {
			await this.respondToInteraction(
				interaction,
				"❌ Module not found.",
			);
			return;
		}

		if (!propertyOptions) {
			await this.respondToInteraction(
				interaction,
				"❌ Property not found.",
			);
			return;
		}

		try {
			const { lng, t } = await this.getLanguageContext(interaction);
			const config = await this.configHelper.buildModuleConfigEmbed(
				client,
				interaction.guild!,
				moduleName,
				interaction.user,
				t,
				lng,
			);
			if (config && interaction.message) {
				await interaction.message.edit({
					embeds: [config.embed],
					components: [config.row],
				});
			}
		} catch (error) {
			console.error("Failed to reset select menu:", error);
		}

		// Check if it's a custom registered type
		const customType = ConfigTypeRegistry.get(
			propertyOptions.type as string,
		);
		if (customType) {
			await customType.handler.show(
				interaction,
				propertyOptions,
				selectedProperty,
				moduleName,
			);
			return;
		}

		// Handle built-in types
		const isRoleOrChannel = [
			EConfigType.Role,
			EConfigType.RoleArray,
			EConfigType.Channel,
		].includes(propertyOptions.type as EConfigType);

		if (isRoleOrChannel) {
			await this.roleChannelHandler.show(
				interaction,
				propertyOptions,
				selectedProperty,
				moduleName,
			);
		} else if (propertyOptions.type === EConfigType.Boolean) {
			await this.booleanHandler.show(
				interaction,
				propertyOptions,
				selectedProperty,
				moduleName,
			);
		} else if (propertyOptions.type === EConfigType.StringChoice) {
			await this.stringChoiceHandler.show(
				interaction,
				propertyOptions,
				selectedProperty,
				moduleName,
			);
		} else if (propertyOptions.type === EConfigType.Attachment) {
			await this.attachmentHandler.show(
				interaction,
				propertyOptions,
				selectedProperty,
				moduleName,
			);
		} else if (propertyOptions.type === EConfigType.StringArray) {
			await this.stringArrayHandler.show(
				interaction,
				propertyOptions,
				selectedProperty,
				moduleName,
			);
		} else {
			// Default to string handler
			await this.stringHandler.show(
				interaction,
				propertyOptions,
				selectedProperty,
				moduleName,
			);
		}
	}

	@Button("module_config_cancel:*")
	async handleCancelButton(@Interaction() interaction: ButtonInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;

		await interaction.deferUpdate();
		if (interaction.message?.deletable) {
			await interaction.message.delete().catch(() => {});
		}
	}

	@Button("module_config_clear:*")
	async handleClearButton(@Interaction() interaction: ButtonInteraction) {
		const ctx = await this.getHandleContext(interaction);
		if (!ctx) return;
		const { client, moduleName, propertyKey, propertyOptions } = ctx;

		await this.deleteConfig(
			client,
			interaction,
			moduleName,
			propertyKey,
			propertyOptions.type,
		);
	}
}
