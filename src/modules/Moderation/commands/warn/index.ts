import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { BaseCommand } from "@class/BaseCommand";
import { EPermission } from "@enums/EPermission";
import { SanctionService } from "@services/SanctionService";
import { LeBotClient } from "@class/LeBotClient";
import { warnOptions } from "./options";

@Command({
	name: "warn",
	description: "Warn a user",
	options: warnOptions,
})
export default class WarnCommand extends BaseCommand {
	@DefaultCommand(EPermission.Warn)
	async run(
		client: LeBotClient<true>,
		interaction: ChatInputCommandInteraction,
	) {
		const user = interaction.options.getUser("user", true);
		const reason = interaction.options.getString("reason", true);
		const moderator = interaction.user;

		if (!interaction.guild) return;

		await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

		try {
			await SanctionService.warn(
				interaction.guild,
				user,
				moderator,
				reason,
			);
			await interaction.editReply(`✅ Warned ${user.tag} for: ${reason}`);
		} catch (error: any) {
			await interaction.editReply(
				`❌ Failed to warn user: ${error.message}`,
			);
		}
	}
}
