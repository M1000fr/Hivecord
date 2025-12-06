import { BaseCommand } from "@class/BaseCommand";
import { LeBotClient } from "@class/LeBotClient";
import { Autocomplete } from "@decorators/Autocomplete";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import { GeneralConfigKeys } from "@modules/General/GeneralConfig";
import { SanctionReasonService } from "@modules/Moderation/services/SanctionReasonService";
import { SanctionService } from "@modules/Moderation/services/SanctionService";
import { SanctionType } from "@prisma/client/client";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	MessageFlags,
} from "discord.js";
import { warnOptions } from "./options";

@Command({
	name: "warn",
	description: "Warn a user",
	nameLocalizations: {
		fr: "avertir",
	},
	descriptionLocalizations: {
		fr: "Avertir un utilisateur",
	},
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
			interaction.guildId!,
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
		const lng =
			(await ConfigService.get(
				interaction.guildId!,
				GeneralConfigKeys.language,
			)) ?? "en";
		const t = I18nService.getFixedT(lng);
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
			await interaction.editReply(
				t("modules.moderation.commands.warn.success", {
					userTag: user.tag,
					reason,
				}),
			);
		} catch (error: any) {
			await interaction.editReply(
				t("modules.moderation.commands.warn.failed_with_error", {
					error: error.message,
				}),
			);
		}
	}
}
