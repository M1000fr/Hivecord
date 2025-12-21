import { EConfigType } from "@decorators/ConfigProperty";
import { Inject } from "@decorators/Inject";
import { Injectable } from "@decorators/Injectable";
import { ButtonPattern, SelectMenuPattern } from "@decorators/Interaction";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { GeneralConfig } from "@src/modules/General/GeneralConfig";
import { ConfigHelper } from "@utils/ConfigHelper";
import { InteractionHelper } from "@utils/InteractionHelper";
import {
	type ButtonInteraction,
	type StringSelectMenuInteraction,
} from "discord.js";
import { AttachmentConfigInteractions } from "./AttachmentConfigInteractions";
import { BaseConfigInteractions } from "./BaseConfigInteractions";
import { BooleanConfigInteractions } from "./BooleanConfigInteractions";
import { CustomEmbedConfigInteractions } from "./CustomEmbedConfigInteractions";
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
		@Inject(CustomEmbedConfigInteractions)
		private readonly customEmbedHandler: CustomEmbedConfigInteractions,
	) {
		super(configHelper, configService);
	}

	@SelectMenuPattern("module_config:*")
	async handlePropertySelection(interaction: StringSelectMenuInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;
		const { client, parts, userId } = ctx;
		const moduleName = parts[1];

		if (moduleName) {
			const selectedProperty = interaction.values[0];
			if (!selectedProperty) {
				await InteractionHelper.respond(interaction, {
					content: "❌ No property selected.",
				});
				return;
			}

			const { module, propertyOptions } = this.getPropertyContext(
				client,
				moduleName,
				selectedProperty,
			);

			if (!module?.options.config) {
				await InteractionHelper.respond(interaction, {
					content: "❌ Module not found.",
				});
				return;
			}

			if (!propertyOptions) {
				await InteractionHelper.respond(interaction, {
					content: "❌ Property not found.",
				});
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

			const isRoleOrChannel = [
				EConfigType.Role,
				EConfigType.RoleArray,
				EConfigType.Channel,
			].includes(propertyOptions.type);

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
			} else if (propertyOptions.type === EConfigType.CustomEmbed) {
				await this.customEmbedHandler.show(
					interaction,
					propertyOptions,
					selectedProperty,
					moduleName,
				);
			} else {
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
	async handleCancelButton(interaction: ButtonInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;

		await interaction.deferUpdate();
		if (interaction.message?.deletable) {
			await interaction.message.delete().catch(() => {});
		}
	}

	@ButtonPattern("module_config_clear:*")
	async handleClearButton(interaction: ButtonInteraction) {
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
