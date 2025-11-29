import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { BaseCommand } from "@class/BaseCommand";
import { EPermission } from "@enums/EPermission";
import { SanctionService } from "@services/SanctionService";
import { LeBotClient } from "@class/LeBotClient";
import { unwarnOptions } from "./options";

@Command({
	name: "unwarn",
	description: "Remove a warning from a user",
	options: unwarnOptions,
})
export default class UnwarnCommand extends BaseCommand {
	@DefaultCommand(EPermission.Unwarn)
	async run(
		client: LeBotClient<true>,
		interaction: ChatInputCommandInteraction,
	) {
		const user = interaction.options.getUser("user", true);
		const warnId = interaction.options.getInteger("warn_id", true);
		const moderator = interaction.user;

		if (!interaction.guild) return;

		await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

		try {
			await SanctionService.unwarn(
				interaction.guild,
				user,
				moderator,
				warnId,
			);
			await interaction.editReply(
				`✅ Removed warning #${warnId} for ${user.tag}.`,
			);
		} catch (error: any) {
			await interaction.editReply(
				`❌ Failed to unwarn user: ${error.message}`,
			);
		}
	}
}
