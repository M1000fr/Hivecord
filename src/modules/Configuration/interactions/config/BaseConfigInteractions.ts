import { LeBotClient } from "@class/LeBotClient";
import { EConfigType } from "@decorators/ConfigProperty";
import {
	ConfigContextData,
	ConfigContextVariable,
} from "@enums/ConfigContextVariable";
import { GeneralConfigKeys } from "@modules/General/GeneralConfig";
import { ConfigService } from "@services/ConfigService";
import { ConfigHelper } from "@utils/ConfigHelper";
import { InteractionHelper } from "@utils/InteractionHelper";
import {
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	type Message,
	MessageFlags,
} from "discord.js";
import type { TFunction } from "i18next";

export abstract class BaseConfigInteractions {
	protected async respondToInteraction(
		interaction: any,
		content: string,
		isError = false,
	) {
		if (isError) {
			await InteractionHelper.respondError(interaction, content);
		} else {
			await InteractionHelper.respond(interaction, content);
		}
	}

	protected async getMainMessage(interaction: any): Promise<Message | null> {
		const parts = ConfigHelper.parseCustomId(interaction.customId || "");
		if (parts[0] === "module_config") {
			return interaction.message;
		}

		if (interaction.isModalSubmit()) return interaction.message;

		const refId = interaction.message.reference?.messageId;
		if (!refId) return null;

		return (
			(await interaction.channel?.messages
				.fetch(refId)
				.catch(() => null)) || null
		);
	}

	protected async updateConfig(
		client: LeBotClient<true>,
		interaction: any,
		moduleName: string,
		propertyKey: string,
		value: string | string[],
		type: EConfigType,
		silent = false,
	) {
		try {
			await ConfigHelper.saveValue(
				interaction.guildId,
				propertyKey,
				value,
				type,
			);

			const mainMessage = await this.getMainMessage(interaction);
			if (mainMessage) {
				const lng =
					(await ConfigService.get(
						interaction.guildId,
						GeneralConfigKeys.language,
					)) ?? "en";
				const config = await ConfigHelper.buildModuleConfigEmbed(
					client,
					interaction.guildId,
					moduleName,
					interaction.user.id,
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

			if (!silent) {
				await this.respondToInteraction(
					interaction,
					"✅ Configuration updated.",
				);
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
		interaction: any,
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

	protected async getInteractionContext(interaction: any) {
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
		const configProps = (module?.options.config as any)?.configProperties;
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
		propertyOptions: any,
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
						(data.descriptionLocalizations as any)?.[lng] ||
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
