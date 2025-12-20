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
import { DurationParser } from "@utils/DurationParser";
import {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	PermissionsBitField,
} from "discord.js";
import { tempMuteOptions } from "./tempMuteOptions";

@Command(tempMuteOptions)
export default class TempMuteCommand extends BaseCommand {
	@Autocomplete({ optionName: "reason" })
	async autocompleteReason(
		client: Client,
		interaction: AutocompleteInteraction,
	) {
		const focusedOption = interaction.options.getFocused(true);
		const reasons = await SanctionReasonService.getByType(
			interaction.guildId!,
			SanctionType.MUTE,
			false,
		);
		const filtered = reasons
			.filter((r) =>
				r.text
					.toLowerCase()
					.includes(focusedOption.value.toLowerCase()),
			)
			.map((r) => {
				let name = r.text;
				if (r.duration) name += ` (${r.duration})`;
				return { name: name, value: r.text };
			})
			.slice(0, 25);
		await interaction.respond(filtered);
	}

	@DefaultCommand(EPermission.TempMute)
	@BotPermission(PermissionsBitField.Flags.ManageRoles)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		const user = interaction.options.getUser("user", true);
		const reason = interaction.options.getString("reason", true);

		let finalDurationString: string | undefined;

		const reasons = await SanctionReasonService.getByType(
			interaction.guildId!,
			SanctionType.MUTE,
		);
		const reasonObj = reasons.find((r) => r.text === reason);
		if (reasonObj && reasonObj.duration) {
			finalDurationString = reasonObj.duration;
		}

		if (!finalDurationString) {
			await interaction.editReply({
				content: t(
					"modules.moderation.commands.tempmute.select_predefined_reason",
				),
			});
			return;
		}

		const duration = DurationParser.parse(finalDurationString);
		if (!duration) {
			await interaction.editReply({
				content: t(
					"modules.moderation.commands.tempmute.invalid_duration",
				),
			});
			return;
		}

		if (!interaction.guild) return;

		try {
			await SanctionService.mute(
				interaction.guild,
				user,
				interaction.user,
				duration,
				finalDurationString,
				reason,
			);
			await interaction.editReply(
				t("modules.moderation.commands.tempmute.success", {
					userTag: user.tag,
					duration: finalDurationString,
					reason,
				}),
			);
		} catch (error: unknown) {
			await interaction.editReply({
				content:
					(error instanceof Error ? error.message : null) ||
					t("modules.moderation.commands.tempmute.failed"),
			});
		}
	}
}
