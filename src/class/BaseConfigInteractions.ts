import type { LeBotClient } from "@class/LeBotClient";
import type { ConfigPropertyOptions } from "@decorators/ConfigProperty";
import { EConfigType } from "@decorators/ConfigProperty";
import {
	ConfigContextData,
	ConfigContextVariable,
} from "@enums/ConfigContextVariable";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { I18nService } from "@modules/Shared/services/I18nService";
import type { GuildLanguageContext } from "@src/types/GuildLanguageContext";
import { ConfigUIBuilderService } from "@utils/ConfigUIBuilderService";
import { ConfigValueResolverService } from "@utils/ConfigValueResolverService";
import { ConfigValueService } from "@utils/ConfigValueService";
import { CustomIdHelper } from "@utils/CustomIdHelper";
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
		protected readonly valueService: ConfigValueService,
		protected readonly uiBuilder: ConfigUIBuilderService,
		protected readonly resolverService: ConfigValueResolverService,
		protected readonly configService: ConfigService,
	) {}

	protected async respondToInteraction(
		interaction: RepliableInteraction,
		content: string,
		_isError = false,
	) {
		const payload = { content };
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp(payload);
		} else {
			await interaction.reply(payload);
		}
	}

	protected async getMainMessage(
		interaction: RepliableInteraction,
	): Promise<Message | null> {
		let customId = "";
		if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
			customId = interaction.customId;
		}
		const parts = CustomIdHelper.parse(customId);

		// If it's the main config message itself
		if (parts[0] === "module_config") {
			if (interaction.isMessageComponent()) {
				if (interaction.message instanceof Message)
					return interaction.message;
			}
			return null;
		}

		// Try to get messageId from parts[3] (standardized position: action:module:prop:messageId:userId)
		const messageId = parts[3];
		if (messageId && /^\d{17,20}$/.test(messageId)) {
			try {
				const message =
					await interaction.channel?.messages.fetch(messageId);
				if (message) return message;
			} catch {
				// Ignore
			}
		}

		// Fallback for components: check reference
		if (interaction.isMessageComponent()) {
			const message = interaction.message;
			if (message instanceof Message) {
				const refId = message.reference?.messageId;
				if (refId) {
					try {
						return (
							(await interaction.channel?.messages.fetch(
								refId,
							)) || null
						);
					} catch {
						// Ignore
					}
				}
			}
		}

		// Last fallback: if it's a modal and we have a message attached
		if (
			interaction.isModalSubmit() &&
			interaction.message instanceof Message
		) {
			return interaction.message;
		}

		return null;
	}

	protected async updateConfig(
		client: LeBotClient<true>,
		interaction: RepliableInteraction,
		moduleName: string,
		propertyKey: string,
		value: string | string[],
		type: EConfigType | string,
		silent = false,
		deleteMessage = false,
	) {
		if (!interaction.guildId) return;

		try {
			await this.valueService.saveValue(
				interaction.guild!,
				propertyKey,
				value,
				type,
			);

			const mainMessage = await this.getMainMessage(interaction);
			if (mainMessage) {
				const { lng, t } = await this.getLanguageContext(interaction);
				const config = await this.uiBuilder.buildModuleConfigEmbed(
					interaction.guild!,
					moduleName,
					interaction.user,
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

	protected async deleteConfig(
		client: LeBotClient<true>,
		interaction: RepliableInteraction,
		moduleName: string,
		propertyKey: string,
		type: EConfigType | string,
	) {
		if (!interaction.guildId) return;

		try {
			await this.valueService.deleteValue(
				interaction.guild!,
				propertyKey,
				type,
			);

			const mainMessage = await this.getMainMessage(interaction);
			if (mainMessage) {
				const { lng, t } = await this.getLanguageContext(interaction);
				const config = await this.uiBuilder.buildModuleConfigEmbed(
					interaction.guild!,
					moduleName,
					interaction.user,
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
				interaction.isMessageComponent() ||
				interaction.isModalSubmit()
			) {
				await interaction.deferUpdate().catch(() => {});
				if (interaction.message?.deletable) {
					await interaction.message.delete().catch(() => {});
				}
			}
		} catch (error) {
			console.error("Failed to delete config:", error);
			await this.respondToInteraction(
				interaction,
				"❌ Failed to clear configuration.",
				true,
			);
		}
	}

	protected async getShowContext(
		interaction: RepliableInteraction,
		moduleName: string,
		selectedProperty: string,
		propertyOptions: ConfigPropertyOptions,
	) {
		const lng = await this.configService.getLanguage(interaction.guild!);
		const t = I18nService.getFixedT(lng);

		const module = (interaction.client as LeBotClient).modules.get(
			moduleName.toLowerCase(),
		);
		const defaultValue = this.getDefaultValue(module, selectedProperty);

		const currentValue = await this.resolverService.getCurrentValue(
			interaction.guild!,
			selectedProperty,
			propertyOptions.type,
			t,
			propertyOptions,
			lng,
			defaultValue,
		);

		const configContexts = (
			module?.options.config as unknown as {
				configContexts?: Record<string, ConfigContextVariable[]>;
			}
		)?.configContexts;

		const embed = this.buildPropertyEmbed(
			propertyOptions,
			selectedProperty,
			currentValue,
			{ locale: lng, t },
			configContexts,
		);

		const messageId = interaction.isMessageComponent()
			? interaction.message.id
			: "";

		return {
			lng,
			t,
			module,
			defaultValue,
			currentValue,
			configContexts,
			embed,
			messageId,
		};
	}

	protected createClearButton(
		moduleName: string,
		propertyKey: string,
		userId: string,
		t: TFunction,
		messageId: string,
	) {
		return this.createConfigButton(
			"module_config_clear",
			moduleName,
			propertyKey,
			userId,
			t("common.clear"),
			ButtonStyle.Danger,
			[messageId],
		);
	}

	protected createCancelButton(
		moduleName: string,
		propertyKey: string,
		userId: string,
		t: TFunction,
	) {
		return this.createConfigButton(
			"module_config_cancel",
			moduleName,
			propertyKey,
			userId,
			t("common.cancel"),
			ButtonStyle.Secondary,
		);
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
		const parts = CustomIdHelper.parse(interaction.customId);
		const userId = parts[parts.length - 1];

		if (!userId || !(await this.validateUser(interaction, userId))) {
			return null;
		}

		return { client, parts, userId };
	}

	protected async getHandleContext(interaction: ConfigInteraction) {
		const baseCtx = await this.getInteractionContext(interaction);
		if (!baseCtx) return null;

		const { client, parts, userId } = baseCtx;
		const moduleName = parts[1];
		const propertyKey = parts[2];

		if (!moduleName || !propertyKey) return null;

		const { module, propertyOptions } = this.getPropertyContext(
			client,
			moduleName,
			propertyKey,
		);

		if (!propertyOptions) return null;

		return {
			client,
			parts,
			userId,
			moduleName,
			propertyKey,
			module,
			propertyOptions,
		};
	}

	protected async getLanguageContext(interaction: RepliableInteraction) {
		const lng = await this.configService.getLanguage(interaction.guild!);
		const t = I18nService.getFixedT(lng);
		return { lng, t };
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

	protected getDefaultValue(
		module: { options: { config?: unknown } } | undefined,
		propertyKey: string,
	): string | string[] | undefined {
		if (!module?.options?.config) return undefined;
		const configClass = module.options.config as Record<string, unknown>;
		const propertyValue = configClass[propertyKey];
		return propertyValue &&
			typeof propertyValue === "object" &&
			"__isConfigKey" in propertyValue
			? ((propertyValue as unknown as { defaultValue: unknown })
					.defaultValue as string | string[])
			: undefined;
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
				CustomIdHelper.build([
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
		lang: GuildLanguageContext,
		configContexts?: Record<string, ConfigContextVariable[]>,
	) {
		const embed = new EmbedBuilder()
			.setTitle(
				lang.t("utils.config_helper.configure_property", {
					property: propertyOptions.displayName || selectedProperty,
				}),
			)
			.setDescription(
				`${propertyOptions.description}\n\n**${lang.t("common.current")}:** ${currentValue}`,
			)
			.setColor("#5865F2")
			.setTimestamp();

		if (configContexts && configContexts[selectedProperty]) {
			const variables = configContexts[selectedProperty];
			const variablesDescription = variables
				.map((v) => {
					const data = ConfigContextData[v];
					const desc =
						data.descriptionLocalizations?.[
							lang.locale as Locale
						] || data.description;
					return `- \`{${v}}\`: ${desc}`;
				})
				.join("\n");

			embed.addFields({
				name: lang.t(
					"utils.config_helper.available_variables",
					"Available Variables",
				),
				value: variablesDescription,
			});
		}

		return embed;
	}
}
