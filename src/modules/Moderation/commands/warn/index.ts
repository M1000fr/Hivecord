import { BaseCommand } from "@class/BaseCommand";
import { LeBotClient } from "@class/LeBotClient";
import { Autocomplete } from "@decorators/Autocomplete";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import { SanctionReasonService } from "@modules/Moderation/services/SanctionReasonService";
import { SanctionService } from "@modules/Moderation/services/SanctionService";
import { SanctionType } from "@prisma/client/client";
import {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	MessageFlags,
} from "discord.js";
import { warnOptions } from "./options";

@Command({
	name: "warn",
	description: "Warn a user",
	options: warnOptions,
})
export default class WarnCommand extends BaseCommand {
	@Autocomplete({ optionName: "reason" })
	async autocompleteReason(
		client: LeBotClient<true>,
		interaction: AutocompleteInteraction,
	) {
		const focusedOption = interaction.options.getFocused(true);
		const reasons = await SanctionReasonService.getByType(
			SanctionType.WARN,
			false,
		);
		const filtered = reasons
			.filter((r) =>
				r.text
					.toLowerCase()
					.includes(focusedOption.value.toLowerCase()),
			)
			.map((r) => ({ name: r.text, value: r.text }))
			.slice(0, 25);
		await interaction.respond(filtered);
	}

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
