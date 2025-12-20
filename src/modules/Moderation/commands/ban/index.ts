import { BaseCommand } from "@class/BaseCommand";
import { Autocomplete } from "@decorators/Autocomplete";
import { BotPermission } from "@decorators/BotPermission";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import { SanctionReasonService } from "@modules/Moderation/services/SanctionReasonService";
import { SanctionService } from "@modules/Moderation/services/SanctionService";
import { SanctionType } from "@prisma/client/client";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { GeneralConfig } from "@src/modules/General/GeneralConfig";
import { InteractionHelper } from "@src/utils/InteractionHelper";
import {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	PermissionsBitField,
} from "discord.js";
import { banOptions } from "./banOptions";

@Command(banOptions)
export default class BanCommand extends BaseCommand {
	@Autocomplete({ optionName: "reason" })
	async autocompleteReason(
		client: Client,
		interaction: AutocompleteInteraction,
	) {
		const focusedOption = interaction.options.getFocused(true);
		const reasons = await SanctionReasonService.getByType(
			interaction.guildId!,
			SanctionType.BAN,
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

	@DefaultCommand(EPermission.Ban)
	@BotPermission(PermissionsBitField.Flags.BanMembers)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		await InteractionHelper.defer(interaction);
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		const user = interaction.options.getUser("user", true);
		const reason =
			interaction.options.getString("reason") || t("common.no_reason");
		const deleteMessagesDays =
			interaction.options.getInteger("delete_messages") || 0;

		if (!interaction.guild) return;

		try {
			await SanctionService.ban(
				interaction.guild,
				user,
				interaction.user,
				reason,
				deleteMessagesDays * 24 * 60 * 60,
			);
			await InteractionHelper.respond(interaction, {
				content: t("modules.moderation.commands.ban.success", {
					userTag: user.tag,
					reason: reason,
				}),
			});
		} catch (error: unknown) {
			await InteractionHelper.respond(interaction, {
				content:
					(error instanceof Error ? error.message : null) ||
					t("modules.moderation.commands.ban.error"),
			});
		}
	}
}
