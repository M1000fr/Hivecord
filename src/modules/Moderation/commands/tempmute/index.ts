import { BaseCommand } from "@class/BaseCommand";
import { Autocomplete } from "@decorators/Autocomplete";
import { BotPermission } from "@decorators/BotPermission";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import { SanctionReasonService } from "@modules/Moderation/services/SanctionReasonService";
import { SanctionService } from "@modules/Moderation/services/SanctionService";
import { SanctionType } from "@prisma/client/client";
import { DurationParser } from "@utils/DurationParser";
import {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	MessageFlags,
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
		const user = interaction.options.getUser("user", true);
		const reason = interaction.options.getString("reason", true);

		let finalDurationString: string | undefined;

		const reasons = await SanctionReasonService.getByType(
			SanctionType.MUTE,
		);
		const reasonObj = reasons.find((r) => r.text === reason);
		if (reasonObj && reasonObj.duration) {
			finalDurationString = reasonObj.duration;
		}

		if (!finalDurationString) {
			await interaction.reply({
				content: "You must select a predefined reason with a duration.",
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		const duration = DurationParser.parse(finalDurationString);
		if (!duration) {
			await interaction.reply({
				content:
					"Invalid duration format. Use format like 10m, 1h, 1d.",
				flags: [MessageFlags.Ephemeral],
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
			await interaction.reply(
				`User ${user.tag} has been muted for ${finalDurationString}. Reason: ${reason}`,
			);
		} catch (error: any) {
			await interaction.reply({
				content:
					error.message || "An error occurred while muting the user.",
				flags: [MessageFlags.Ephemeral],
			});
		}
	}
}
