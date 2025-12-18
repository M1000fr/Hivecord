import { BaseCommand } from "@class/BaseCommand";
import { BotPermission } from "@decorators/BotPermission";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import { HeatpointService } from "@modules/Security/services/HeatpointService";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { GeneralConfig } from "@src/modules/General/GeneralConfig";
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
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		const subcommandGroup = interaction.options.getSubcommandGroup();
		const subcommand = interaction.options.getSubcommand();

		if (subcommandGroup === "heatpoint") {
			if (subcommand === "user") {
				const user = interaction.options.getUser("user", true);
				const heat = await HeatpointService.getHeat(
					interaction.guildId!,
					`user:${user.id}`,
				);

				await interaction.reply({
					content: t(
						"modules.security.commands.security.heatpoints_user",
						{
							userTag: user.tag,
							heatpoints: Math.round(heat),
						},
					),
					flags: [MessageFlags.Ephemeral],
				});
			} else if (subcommand === "reset") {
				const target = interaction.options.getString("target", true);
				const guild = interaction.guild;
				if (!guild) return;

				if (target === "all_users") {
					await HeatpointService.resetAllUserHeat(
						interaction.guildId!,
					);
					await interaction.reply({
						content: t(
							"modules.security.commands.security.reset_all_users",
						),
						flags: [MessageFlags.Ephemeral],
					});
				} else if (target === "channel") {
					const channel =
						interaction.options.getChannel("channel") ||
						interaction.channel;
					if (channel) {
						await HeatpointService.resetHeat(
							interaction.guildId!,
							`channel:${channel.id}`,
						);
						await interaction.reply({
							content: t(
								"modules.security.commands.security.reset_channel",
								{ channel: channel.toString() },
							),
							flags: [MessageFlags.Ephemeral],
						});
					} else {
						await interaction.reply({
							content: t(
								"modules.security.commands.security.channel_not_found",
							),
							flags: [MessageFlags.Ephemeral],
						});
					}
				} else if (target === "server") {
					await HeatpointService.resetHeat(
						interaction.guildId!,
						`global:${guild.id}`,
					);
					await interaction.reply({
						content: t(
							"modules.security.commands.security.reset_server",
						),
						flags: [MessageFlags.Ephemeral],
					});
				}
			}
		}
	}
}
