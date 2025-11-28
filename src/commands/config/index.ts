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

@Command(configOptions)
export default class ConfigCommand extends BaseCommand {
	@DefaultCommand(EPermission.Config)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		// This method is required by BaseCommand but won't be called directly if subcommands are used properly
	}

	@Subcommand({
		group: "mute-role",
		name: "set",
		permission: EPermission.Config,
	})
	async setMuteRole(
		client: Client,
		interaction: ChatInputCommandInteraction,
	) {
		const role = interaction.options.getRole("role", true);

		await ConfigService.set("mute_role_id", role.id);

		await interaction.reply({
			content: `Mute role has been set to ${role.name}`,
			flags: [MessageFlags.Ephemeral],
		});
	}

	@Subcommand({
		group: "mute-role",
		name: "get",
		permission: EPermission.Config,
	})
	async getMuteRole(
		client: Client,
		interaction: ChatInputCommandInteraction,
	) {
		const roleId = await ConfigService.get("mute_role_id");

		if (!roleId) {
			await interaction.reply({
				content: "Mute role is not configured.",
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		const role = interaction.guild?.roles.cache.get(roleId);
		if (!role) {
			await interaction.reply({
				content: `Mute role ID is configured as ${roleId}, but the role was not found in this guild.`,
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		await interaction.reply({
			content: `Current mute role is ${role.name} (${role.id})`,
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
