import { LeBotClient } from "@class/LeBotClient";
import type { ConfigPropertyOptions } from "@decorators/ConfigProperty";
import { EConfigType } from "@decorators/ConfigProperty";
import { Injectable } from "@decorators/Injectable";
import { GeneralConfig } from "@modules/General/GeneralConfig";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { InteractionHelper } from "@src/utils/InteractionHelper";
import { ConfigHelper } from "@utils/ConfigHelper";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Message,
	type MessageActionRowComponentBuilder,
	type RepliableInteraction,
} from "discord.js";
import { BaseConfigInteractions } from "./BaseConfigInteractions";

@Injectable()
export class AttachmentConfigInteractions extends BaseConfigInteractions {
	constructor(configHelper: ConfigHelper, configService: ConfigService) {
		super(configHelper, configService);
	}

	async show(
		interaction: RepliableInteraction,
		propertyOptions: ConfigPropertyOptions,
		selectedProperty: string,
		moduleName: string,
	) {
		if (!interaction.guildId || !interaction.channel) return;
		const lng = await this.configService.of(
			interaction.guildId,
			GeneralConfig,
		).generalLanguage;
		const t = I18nService.getFixedT(lng);
		const currentValue = await this.configHelper.getCurrentValue(
			interaction.guildId,
			selectedProperty,
			propertyOptions.type,
			t,
			propertyOptions.defaultValue,
		);
		const embed = this.buildPropertyEmbed(
			propertyOptions,
			selectedProperty,
			currentValue,
			t,
			lng,
		);

		embed.setDescription(
			embed.data.description +
				"\n\n**Please reply to this message with the file you want to upload.**\nSupported formats: Images, GIFs, Videos, Audio.",
		);

		const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] =
			[];

		const buttonRow = new ActionRowBuilder<ButtonBuilder>();

		if (!propertyOptions.nonNull) {
			buttonRow.addComponents(
				this.createConfigButton(
					"module_config_clear",
					moduleName,
					selectedProperty,
					interaction.user.id,
					"Clear File",
					ButtonStyle.Danger,
				),
			);
		}

		buttonRow.addComponents(
			this.createConfigButton(
				"module_config_cancel",
				moduleName,
				selectedProperty,
				interaction.user.id,
				"Cancel",
				ButtonStyle.Secondary,
			),
		);

		components.push(buttonRow);

		await interaction.reply({
			embeds: [embed],
			components: components,
		});

		const filter = (m: Message) =>
			m.author.id === interaction.user.id && m.attachments.size > 0;

		if (!interaction.channel) return;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const collector = (interaction.channel as any).createMessageCollector({
			filter,
			time: 60000,
			max: 1,
		});

		collector.on("collect", async (m: Message) => {
			const attachment = m.attachments.first();
			if (!attachment) return;

			try {
				// Download and save file
				const response = await fetch(attachment.url);
				if (!response.ok) throw new Error("Failed to download file");

				const arrayBuffer = await response.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);

				const fileName = `${moduleName}_${selectedProperty}_${Date.now()}_${attachment.name}`;
				const filePath = `data/${fileName}`;

				// Ensure data directory exists
				const fs = await import("fs/promises");
				try {
					await fs.access("data");
				} catch {
					await fs.mkdir("data");
				}

				await fs.writeFile(filePath, buffer);

				// Update config with file path
				await this.updateConfig(
					interaction.client as LeBotClient<true>,
					interaction,
					moduleName,
					selectedProperty,
					filePath,
					EConfigType.Attachment,
					true,
				);

				// Delete interaction response and user message to reduce clutter
				await InteractionHelper.deleteReply(interaction).catch(
					() => {},
				);

				await m.delete().catch(() => {}); // Clean up user message
			} catch (error) {
				console.error("Failed to upload file:", error);
				await InteractionHelper.respond(interaction, {
					content: "❌ Failed to upload file.",
				});
			}
		});
	}
}
