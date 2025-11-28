import {
	ChatInputCommandInteraction,
	Client,
	MessageFlags,
	AttachmentBuilder,
} from "discord.js";
import { BaseCommand } from "../../class/BaseCommand";
import { Command } from "../../decorators/Command";
import { DefaultCommand } from "../../decorators/DefaultCommand";
import { Subcommand } from "../../decorators/Subcommand";
import { EPermission } from "../../enums/EPermission";
import { configOptions } from "./configOptions";
import { ConfigService } from "../../services/ConfigService";
import { EConfigKey, EChannelConfigKey, ERoleConfigKey } from "../../enums/EConfigKey";
import { ChannelType } from "../../prisma/client/enums";
import { ChannelType as DiscordChannelType } from "discord.js";

@Command(configOptions)
export default class ConfigCommand extends BaseCommand {
	@DefaultCommand(EPermission.Config)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		// This method is required by BaseCommand but won't be called directly if subcommands are used properly
	}

	@Subcommand({
		name: "show",
		permission: EPermission.Config,
	})
	async showConfig(client: Client, interaction: ChatInputCommandInteraction) {
		const muteRoleId = await ConfigService.getRole(ERoleConfigKey.MuteRoleId);
		const welcomeChannelId = await ConfigService.getChannel(
			EChannelConfigKey.WelcomeChannelId,
		);
		const welcomeMessage = await ConfigService.get(
			EConfigKey.WelcomeMessageImage,
		);

		const muteRole = muteRoleId
			? interaction.guild?.roles.cache.get(muteRoleId)
			: null;
		const welcomeChannel = welcomeChannelId
			? interaction.guild?.channels.cache.get(welcomeChannelId)
			: null;

		let content = "**Current Configuration**\n\n";
		content += `**Mute Role:** ${
			muteRole
				? muteRole
				: muteRoleId
				? muteRoleId + " (Not found)"
				: "Not set"
		}\n`;
		content += `**Welcome Channel:** ${
			welcomeChannel
				? welcomeChannel
				: welcomeChannelId
				? welcomeChannelId + " (Not found)"
				: "Not set"
		}\n`;
		content += `**Welcome Message:** ${
			welcomeMessage ? welcomeMessage : "Not set"
		}\n`;

		await interaction.reply({
			content,
			flags: [MessageFlags.Ephemeral],
		});
	}

	@Subcommand({
		name: "edit",
		permission: EPermission.Config,
	})
	async editConfig(client: Client, interaction: ChatInputCommandInteraction) {
		const role = interaction.options.getRole("mute_role");
		const channelOption = interaction.options.getChannel("welcome_channel");
		const message = interaction.options.getString("welcome_message");

		if (!role && !channelOption && !message) {
			await interaction.reply({
				content: "No changes provided.",
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		const updates: string[] = [];

		if (role) {
			await ConfigService.setRole(ERoleConfigKey.MuteRoleId, role.id);
			updates.push(`Mute role set to ${role}`);
		}

		if (channelOption) {
			const channel = interaction.guild?.channels.cache.get(
				channelOption.id,
			);
			if (!channel || !channel.isTextBased()) {
				updates.push(
					`Failed to set welcome channel: ${channelOption} is not a text channel.`,
				);
			} else {
				await ConfigService.setChannel(
					EChannelConfigKey.WelcomeChannelId,
					channel.id,
					ChannelType.TEXT
				);
				updates.push(`Welcome channel set to ${channel}`);
			}
		}

		if (message) {
			await ConfigService.set(EConfigKey.WelcomeMessageImage, message);
			updates.push(`Welcome message set to: ${message}`);
		}

		await interaction.reply({
			content: `Configuration updated:\n- ${updates.join("\n- ")}`,
			flags: [MessageFlags.Ephemeral],
		});
	}

	@Subcommand({ name: "export", permission: EPermission.Config })
	async exportConfig(
		client: Client,
		interaction: ChatInputCommandInteraction,
	) {
		const backup = await ConfigService.getFullBackup();
		const json = JSON.stringify(backup, null, 2);
		const encrypted = ConfigService.encrypt(json);
		const buffer = Buffer.from(encrypted, "utf-8");
		const attachment = new AttachmentBuilder(buffer, {
			name: "backup.enc",
		});

		await interaction.reply({
			files: [attachment],
			flags: [MessageFlags.Ephemeral],
		});
	}

	@Subcommand({ name: "import", permission: EPermission.Config })
	async importConfig(
		client: Client,
		interaction: ChatInputCommandInteraction,
	) {
		const file = interaction.options.getAttachment("file", true);

		if (
			!file.name.endsWith(".enc") &&
			!file.name.endsWith(".json")
		) {
			await interaction.reply({
				content: "Please upload a valid backup file (.enc or .json).",
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		try {
			const response = await fetch(file.url);
			if (!response.ok) throw new Error("Failed to fetch file");
			
			let json: any;
			if (file.name.endsWith(".enc")) {
				const text = await response.text();
				const decrypted = ConfigService.decrypt(text);
				json = JSON.parse(decrypted);
			} else {
				json = await response.json();
			}

			if (typeof json !== "object" || json === null) {
				throw new Error("Invalid JSON format");
			}

			if ('configuration' in json && Array.isArray((json as any).configuration)) {
				await ConfigService.restoreFullBackup(json);
				await interaction.reply({
					content: "Full backup imported successfully.",
					flags: [MessageFlags.Ephemeral],
				});
			} else {
				await ConfigService.import(json as Record<string, string>);
				await interaction.reply({
					content: "Configuration imported successfully.",
					flags: [MessageFlags.Ephemeral],
				});
			}
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content: "Failed to import configuration. Ensure the file is valid and the encryption key matches.",
				flags: [MessageFlags.Ephemeral],
			});
		}
	}
}
