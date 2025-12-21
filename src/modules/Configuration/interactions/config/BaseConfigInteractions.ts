import { LeBotClient } from "@class/LeBotClient";
import type { ConfigPropertyOptions } from "@decorators/ConfigProperty";
import { EConfigType } from "@decorators/ConfigProperty";
import {
	ConfigContextData,
	ConfigContextVariable,
} from "@enums/ConfigContextVariable";
import { GeneralConfig } from "@modules/General/GeneralConfig";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { ConfigHelper } from "@utils/ConfigHelper";
import { InteractionHelper } from "@utils/InteractionHelper";
import {
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	Locale,
	Message,
	MessageFlags,
	type ButtonInteraction,
	type ChannelSelectMenuInteraction,
	type MentionableSelectMenuInteraction,
	type ModalSubmitInteraction,
	type RepliableInteraction,
	type RoleSelectMenuInteraction,
	type StringSelectMenuInteraction,
	type UserSelectMenuInteraction,
} from "discord.js";
import type { TFunction } from "i18next";

export type ConfigInteraction =
	| ButtonInteraction
	| StringSelectMenuInteraction
	| ModalSubmitInteraction
	| RoleSelectMenuInteraction
	| ChannelSelectMenuInteraction
	| UserSelectMenuInteraction
	| MentionableSelectMenuInteraction;

export abstract class BaseConfigInteractions {
	constructor(
		protected readonly configHelper: ConfigHelper,
		protected readonly configService: ConfigService,
	) {}

	protected async respondToInteraction(
		interaction: RepliableInteraction,
		content: string,
		isError = false,
	) {
		if (isError) {
			await InteractionHelper.respond(interaction, { content });
		} else {
			await InteractionHelper.respond(interaction, { content });
		}
	}

	protected async getMainMessage(
		interaction: RepliableInteraction,
	): Promise<Message | null> {
		let customId = "";
		if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
			customId = interaction.customId;
		}
		const parts = ConfigHelper.parseCustomId(customId);
		if (parts[0] === "module_config") {
			if (
				interaction.isMessageComponent() ||
				interaction.isModalSubmit()
			) {
				if (interaction.message instanceof Message)
					return interaction.message;
			}
			return null;
		}

		if (interaction.isModalSubmit()) {
			if (parts[0] === "module_config_modal" && parts[3]) {
				try {
					return (
						(await interaction.channel?.messages.fetch(parts[3])) ??
						null
					);
				} catch {
					// Ignore
				}
			}
			if (interaction.message instanceof Message)
				return interaction.message;
			return null;
		}

		if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
			const message = interaction.message;
			if (!message) return null;

			const refId = message.reference?.messageId;
			if (!refId) return null;

			return (
				(await interaction.channel?.messages
					.fetch(refId)
					.catch(() => null)) || null
			);
		}
		return null;
	}

	protected async updateConfig(
		client: LeBotClient<true>,
		interaction: RepliableInteraction,
		moduleName: string,
		propertyKey: string,
		value: string | string[],
		type: EConfigType,
		silent = false,
		deleteMessage = false,
	) {
		if (!interaction.guildId) return;

		try {
			await this.configHelper.saveValue(
				interaction.guildId,
				propertyKey,
				value,
				type,
			);

			const mainMessage = await this.getMainMessage(interaction);
			if (mainMessage) {
				const lng =
					(await this.configService.of(
						interaction.guildId,
						GeneralConfig,
					).generalLanguage) ?? "en";
				const t = I18nService.getFixedT(lng);
				const config = await this.configHelper.buildModuleConfigEmbed(
					client,
					interaction.guildId,
					moduleName,
					interaction.user.id,
					t,
					lng,
				);
				if (config) {
					try {
						await mainMessage.edit({
							embeds: [config.embed],
							components: [config.row],
						});
					} catch (error) {
						console.warn(
							"Failed to update config UI message:",
							error,
						);
					}
				}
			}

			if (
				deleteMessage &&
				(interaction.isMessageComponent() ||
					interaction.isModalSubmit())
			) {
				await interaction.deferUpdate().catch(() => {});
				if (interaction.message?.deletable) {
					await interaction.message.delete().catch(() => {});
				}
			} else if (!silent) {
				if (
					interaction.isRepliable() &&
					!interaction.replied &&
					!interaction.deferred
				) {
					if (
						interaction.isMessageComponent() ||
						interaction.isModalSubmit()
					) {
						await interaction.deferUpdate().catch(() => {});
					}
				}
			}
		} catch (error) {
			console.error("Failed to update config:", error);
			if (!silent) {
				await this.respondToInteraction(
					interaction,
					"❌ Failed to update configuration.",
					true,
				);
			}
		}
	}

	protected async validateUser(
		interaction: ConfigInteraction,
		userId: string,
	): Promise<boolean> {
		if (interaction.user.id !== userId) {
			await interaction.reply({
				content:
					"❌ You are not allowed to interact with this component.",
				flags: [MessageFlags.Ephemeral],
			});
			return false;
		}
		return true;
	}

	protected async getInteractionContext(interaction: ConfigInteraction) {
		const client = interaction.client as LeBotClient<true>;
		const parts = ConfigHelper.parseCustomId(interaction.customId);
		const userId = parts[parts.length - 1];

		if (!userId || !(await this.validateUser(interaction, userId))) {
			return null;
		}

		return { client, parts, userId };
	}

	protected getPropertyContext(
		client: LeBotClient<true>,
		moduleName: string,
		propertyKey: string,
	) {
		const module = client.modules.get(moduleName.toLowerCase());
		const configProps = (
			module?.options.config as unknown as {
				configProperties?: Record<string, ConfigPropertyOptions>;
			}
		)?.configProperties;
		const propertyOptions = configProps?.[propertyKey];
		return { module, propertyOptions };
	}

	protected createConfigButton(
		action: string,
		moduleName: string,
		propertyKey: string,
		userId: string,
		label: string,
		style: ButtonStyle,
		extraArgs: string[] = [],
	) {
		return new ButtonBuilder()
			.setCustomId(
				ConfigHelper.buildCustomId([
					action,
					moduleName,
					propertyKey,
					...extraArgs,
					userId,
				]),
			)
			.setLabel(label)
			.setStyle(style);
	}

	protected buildPropertyEmbed(
		propertyOptions: ConfigPropertyOptions,
		selectedProperty: string,
		currentValue: string,
		t: TFunction,
		lng: string,
		configContexts?: Record<string, ConfigContextVariable[]>,
	) {
		const embed = new EmbedBuilder()
			.setTitle(
				t("utils.config_helper.configure_property", {
					property: propertyOptions.displayName || selectedProperty,
				}),
			)
			.setDescription(
				`${propertyOptions.description}\n\n**${t("utils.config_helper.current")}:** ${currentValue}`,
			)
			.setColor("#5865F2")
			.setTimestamp();

		if (configContexts && configContexts[selectedProperty]) {
			const variables = configContexts[selectedProperty];
			const variablesDescription = variables
				.map((v) => {
					const data = ConfigContextData[v];
					const desc =
						data.descriptionLocalizations?.[lng as Locale] ||
						data.description;
					return `- \`{${v}}\`: ${desc}`;
				})
				.join("\n");

			embed.addFields({
				name: t(
					"utils.config_helper.available_variables",
					"Available Variables",
				),
				value: variablesDescription,
			});
		}

		return embed;
	}
}
