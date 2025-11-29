import {
	ChatInputCommandInteraction,
	Client,
	MessageFlags,
	PermissionsBitField,
    AutocompleteInteraction
} from "discord.js";
import { BaseCommand } from '@class/BaseCommand';
import { Command } from '@decorators/Command';
import { DefaultCommand } from '@decorators/DefaultCommand';
import { Autocomplete } from '@decorators/Autocomplete';
import { EPermission } from '@enums/EPermission';
import { tempMuteOptions } from "./tempMuteOptions";
import { DurationParser } from '@utils/DurationParser';
import { BotPermission } from '@decorators/BotPermission';
import { SanctionService } from '@services/SanctionService';
import { SanctionReasonService } from '@services/SanctionReasonService';
import { SanctionType } from "@prisma/client/client";

@Command(tempMuteOptions)
export default class TempMuteCommand extends BaseCommand {
    @Autocomplete({ optionName: "reason" })
    async autocompleteReason(client: Client, interaction: AutocompleteInteraction) {
        const focusedOption = interaction.options.getFocused(true);
        const reasons = await SanctionReasonService.getByType(SanctionType.MUTE, false);
        const filtered = reasons
            .filter(r => r.text.toLowerCase().includes(focusedOption.value.toLowerCase()))
            .map(r => {
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
		const durationString = interaction.options.getString("duration");
		const reason =
			interaction.options.getString("reason") || "No reason provided";

        let finalDurationString = durationString;

        if (!finalDurationString) {
            const reasons = await SanctionReasonService.getByType(SanctionType.MUTE);
            const reasonObj = reasons.find(r => r.text === reason);
            if (reasonObj && reasonObj.duration) {
                finalDurationString = reasonObj.duration;
            }
        }

        if (!finalDurationString) {
			await interaction.reply({
				content:
					"You must provide a duration or select a reason with a default duration.",
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
