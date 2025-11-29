import { ChatInputCommandInteraction, MessageFlags, AutocompleteInteraction } from "discord.js";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { Autocomplete } from "@decorators/Autocomplete";
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
    @Autocomplete({ optionName: "warn_id" })
    async autocompleteWarnId(client: LeBotClient<true>, interaction: AutocompleteInteraction) {
        const userId = interaction.options.get("user")?.value as string;
        if (!userId) {
            await interaction.respond([]);
            return;
        }

        const warns = await SanctionService.getActiveWarns(userId);
        const filtered = warns
            .map(w => ({
                name: `#${w.id} - ${w.reason.substring(0, 50)}... (${w.createdAt.toLocaleDateString()})`,
                value: w.id
            }))
            .slice(0, 25);

        await interaction.respond(filtered);
    }

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
