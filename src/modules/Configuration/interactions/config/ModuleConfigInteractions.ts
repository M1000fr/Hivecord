import { EConfigType } from "@decorators/ConfigProperty";
import { ButtonPattern, SelectMenuPattern } from "@decorators/Interaction";
import { GeneralConfigKeys } from "@modules/General/GeneralConfig";
import { ConfigService } from "@services/ConfigService";
import { ConfigHelper } from "@utils/ConfigHelper";
import { InteractionHelper } from "@utils/InteractionHelper";
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

export class ModuleConfigInteractions extends BaseConfigInteractions {
	private static booleanHandler = new BooleanConfigInteractions();
	private static stringHandler = new StringConfigInteractions();
	private static stringChoiceHandler = new StringChoiceConfigInteractions();
	private static roleChannelHandler = new RoleChannelConfigInteractions();
	private static attachmentHandler = new AttachmentConfigInteractions();
	private static stringArrayHandler = new StringArrayConfigInteractions();

	@SelectMenuPattern("module_config:*")
	async handlePropertySelection(interaction: StringSelectMenuInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;
		const { client, parts, userId } = ctx;
		const moduleName = parts[1];

		if (moduleName) {
			const selectedProperty = interaction.values[0];
			if (!selectedProperty) {
				await InteractionHelper.respondError(
					interaction,
					"No property selected.",
				);
				return;
			}

			const { module, propertyOptions } = this.getPropertyContext(
				client,
				moduleName,
				selectedProperty,
			);

			if (!module?.options.config) {
				await InteractionHelper.respondError(
					interaction,
					"Module not found.",
				);
				return;
			}

			if (!propertyOptions) {
				await InteractionHelper.respondError(
					interaction,
					"Property not found.",
				);
				return;
			}

			try {
				const lng =
					(await ConfigService.get(
						interaction.guildId!,
						GeneralConfigKeys.language,
					)) ?? "en";
				const config = await ConfigHelper.buildModuleConfigEmbed(
					client,
					interaction.guildId!,
					moduleName,
					userId,
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
				await ModuleConfigInteractions.roleChannelHandler.show(
					interaction,
					propertyOptions,
					selectedProperty,
					moduleName,
				);
			} else if (propertyOptions.type === EConfigType.Boolean) {
				await ModuleConfigInteractions.booleanHandler.show(
					interaction,
					propertyOptions,
					selectedProperty,
					moduleName,
				);
			} else if (propertyOptions.type === EConfigType.StringChoice) {
				await ModuleConfigInteractions.stringChoiceHandler.show(
					interaction,
					propertyOptions,
					selectedProperty,
					moduleName,
				);
			} else if (propertyOptions.type === EConfigType.Attachment) {
				await ModuleConfigInteractions.attachmentHandler.show(
					interaction,
					propertyOptions,
					selectedProperty,
					moduleName,
				);
			} else if (propertyOptions.type === EConfigType.StringArray) {
				await ModuleConfigInteractions.stringArrayHandler.show(
					interaction,
					propertyOptions,
					selectedProperty,
					moduleName,
				);
			} else {
				await ModuleConfigInteractions.stringHandler.show(
					interaction,
					propertyOptions,
					selectedProperty,
					moduleName,
				);
			}
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
				await ConfigHelper.deleteValue(
					interaction.guildId!,
					propertyKey,
					propertyOptions.type,
				);

				const mainMessage = await this.getMainMessage(interaction);
				if (mainMessage) {
					const lng =
						(await ConfigService.get(
							interaction.guildId!,
							GeneralConfigKeys.language,
						)) ?? "en";
					const config = await ConfigHelper.buildModuleConfigEmbed(
						client,
						interaction.guildId!,
						moduleName,
						userId,
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
					"✅ Configuration cleared.",
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
