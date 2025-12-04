import { LeBotClient } from "@class/LeBotClient";
import { EConfigType } from "@decorators/ConfigProperty";
import { ConfigHelper } from "@utils/ConfigHelper";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Message,
	MessageFlags,
} from "discord.js";
import { BaseConfigInteractions } from "./BaseConfigInteractions";

export class AttachmentConfigInteractions extends BaseConfigInteractions {
	async show(
		interaction: any,
		propertyOptions: any,
		selectedProperty: string,
		moduleName: string,
	) {
		const currentValue = await ConfigHelper.getCurrentValue(
			selectedProperty,
			propertyOptions.type,
			propertyOptions.defaultValue,
		);
		const embed = this.buildPropertyEmbed(
			propertyOptions,
			selectedProperty,
			currentValue,
		);

		embed.setDescription(
			embed.data.description +
				"\n\n**Please reply to this message with the file you want to upload.**\nSupported formats: Images, GIFs, Videos, Audio.",
		);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			this.createConfigButton(
				"module_config_clear",
				moduleName,
				selectedProperty,
				interaction.user.id,
				"Clear File",
				ButtonStyle.Danger,
			),
		);

		await interaction.reply({
			embeds: [embed],
			components: [row],
			flags: [MessageFlags.Ephemeral],
		});

		const filter = (m: Message) =>
			m.author.id === interaction.user.id && m.attachments.size > 0;

		const collector = interaction.channel.createMessageCollector({
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

				const formattedValue = ConfigHelper.formatValue(
					filePath,
					EConfigType.Attachment,
				);
				const newEmbed = this.buildPropertyEmbed(
					propertyOptions,
					selectedProperty,
					formattedValue,
				);
				newEmbed.setDescription(
					`${propertyOptions.description}\n\n**Current value:** ${formattedValue}\n\n✅ **File uploaded successfully!**`,
				);

				await interaction.editReply({
					embeds: [newEmbed],
				});

				await m.delete().catch(() => {}); // Clean up user message
			} catch (error) {
				console.error("Failed to upload file:", error);
				await interaction.followUp({
					content: "❌ Failed to upload file.",
					flags: [MessageFlags.Ephemeral],
				});
			}
		});
	}
}
