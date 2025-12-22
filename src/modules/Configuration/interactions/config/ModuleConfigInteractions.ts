import { EConfigType } from "@decorators/ConfigProperty";
import { Inject } from "@decorators/Inject";
import { Injectable } from "@decorators/Injectable";
import { ButtonPattern, SelectMenuPattern } from "@decorators/Interaction";
import { Interaction } from "@decorators/params";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { I18nService } from "@modules/Core/services/I18nService";
import { GeneralConfig } from "@modules/General/GeneralConfig";
import { ConfigTypeRegistry } from "@registers/ConfigTypeRegistry";
import { ConfigHelper } from "@utils/ConfigHelper";
import {
	type ButtonInteraction,
	type StringSelectMenuInteraction,
} from "discord.js";
import { AttachmentConfigInteractions } from "./AttachmentConfigInteractions";
import { BaseConfigInteractions } from "./BaseConfigInteractions";
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

	@SelectMenuPattern("module_config:*")
	async handlePropertySelection(@Interaction() interaction: StringSelectMenuInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;
		const { client, parts, userId } = ctx;
		const moduleName = parts[1];

		if (moduleName) {
			const selectedProperty = interaction.values[0];
			if (!selectedProperty) {
				const payload = { content: "❌ No property selected." };
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp(payload);
				} else {
					await interaction.reply(payload);
				}
				return;
			}

			const { module, propertyOptions } = this.getPropertyContext(
				client,
				moduleName,
				selectedProperty,
			);

			if (!module?.options.config) {
				const payload = { content: "❌ Module not found." };
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp(payload);
				} else {
					await interaction.reply(payload);
				}
				return;
			}

			if (!propertyOptions) {
				const payload = { content: "❌ Property not found." };
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp(payload);
				} else {
					await interaction.reply(payload);
				}
				return;
			}

			try {
				const lng =
					(await this.configService.of(
						interaction.guildId!,
						GeneralConfig,
					).generalLanguage) ?? "en";
				const t = I18nService.getFixedT(lng);
				const config = await this.configHelper.buildModuleConfigEmbed(
					client,
					interaction.guildId!,
					moduleName,
					userId,
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
	}

	@ButtonPattern("module_config_cancel:*")
	async handleCancelButton(@Interaction() interaction: ButtonInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;

		await interaction.deferUpdate();
		if (interaction.message?.deletable) {
			await interaction.message.delete().catch(() => {});
		}
	}

	@ButtonPattern("module_config_clear:*")
	async handleClearButton(@Interaction() interaction: ButtonInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;
		const { client, parts, userId } = ctx;
		const moduleName = parts[1];
		const propertyKey = parts[2];

		if (!moduleName || !propertyKey) return;

		const { propertyOptions } = this.getPropertyContext(
			client,
			moduleName,
			propertyKey,
		);

		if (propertyOptions) {
			try {
				await this.configHelper.deleteValue(
					interaction.guildId!,
					propertyKey,
					propertyOptions.type,
				);

				const mainMessage = await this.getMainMessage(interaction);
				if (mainMessage) {
					const lng =
						(await this.configService.of(
							interaction.guildId!,
							GeneralConfig,
						).generalLanguage) ?? "en";
					const t = I18nService.getFixedT(lng);
					const config =
						await this.configHelper.buildModuleConfigEmbed(
							client,
							interaction.guildId!,
							moduleName,
							userId,
							t,
							lng,
						);
					if (config) {
						await mainMessage.edit({
							embeds: [config.embed],
							components: [config.row],
						});
					}
				}
				await this.respondToInteraction(
					interaction,
					"Configuration cleared.",
				);
				if (interaction.message?.deletable) {
					await interaction.message.delete().catch(() => {});
				}
			} catch (error) {
				console.error("Failed to clear config:", error);
				await this.respondToInteraction(
					interaction,
					"❌ Failed to clear configuration.",
					true,
				);
			}
		}
	}
}
