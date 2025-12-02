import { BaseCommand } from "@class/BaseCommand";
import { BotPermission } from "@decorators/BotPermission";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import { HeatpointService } from "@modules/Security/services/HeatpointService";
import {
	ChatInputCommandInteraction,
	Client,
	MessageFlags,
	PermissionsBitField,
} from "discord.js";
import { securityOptions } from "./securityOptions";

@Command(securityOptions)
export default class SecurityCommand extends BaseCommand {
	@DefaultCommand(EPermission.SecurityHeatpoint)
	@BotPermission(PermissionsBitField.Flags.ModerateMembers)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		const subcommandGroup = interaction.options.getSubcommandGroup();
		const subcommand = interaction.options.getSubcommand();

		if (subcommandGroup === "heatpoint") {
			if (subcommand === "user") {
				const user = interaction.options.getUser("user", true);
				const heat = await HeatpointService.getHeat(`user:${user.id}`);

				await interaction.reply({
					content: `🔥 **Heatpoints for ${user.tag}**: ${Math.round(heat)}`,
					flags: [MessageFlags.Ephemeral],
				});
			} else if (subcommand === "reset") {
				const target = interaction.options.getString("target", true);
				const guild = interaction.guild;
				if (!guild) return;

				if (target === "all_users") {
					await HeatpointService.resetAllUserHeat();
					await interaction.reply({
						content: "✅ Reset heatpoints for all users.",
						flags: [MessageFlags.Ephemeral],
					});
				} else if (target === "channel") {
					const channel =
						interaction.options.getChannel("channel") ||
						interaction.channel;
					if (channel) {
						await HeatpointService.resetHeat(
							`channel:${channel.id}`,
						);
						await interaction.reply({
							content: `✅ Reset heatpoints for channel ${channel.toString()}.`,
							flags: [MessageFlags.Ephemeral],
						});
					} else {
						await interaction.reply({
							content: "❌ Channel not found.",
							flags: [MessageFlags.Ephemeral],
						});
					}
				} else if (target === "server") {
					await HeatpointService.resetHeat(`global:${guild.id}`);
					await interaction.reply({
						content: "✅ Reset global server heatpoints.",
						flags: [MessageFlags.Ephemeral],
					});
				}
			}
		}
	}
}
