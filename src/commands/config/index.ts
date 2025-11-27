import { ChatInputCommandInteraction, Client, MessageFlags } from "discord.js";
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

	@Subcommand({ name: "mute-role:set", permission: EPermission.Config })
	async setMuteRole(
		client: Client,
		interaction: ChatInputCommandInteraction,
	) {
		const role = interaction.options.getRole("role", true);

		await ConfigService.set("mute_role_id", role.id);

		await interaction.reply({
			content: `Mute role has been set to ${role}`,
			flags: [MessageFlags.Ephemeral],
		});
	}

	@Subcommand({ name: "mute-role:get", permission: EPermission.Config })
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
			content: `Current mute role is ${role} (${role.id})`,
			flags: [MessageFlags.Ephemeral],
		});
	}
}
