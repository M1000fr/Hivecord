import { BaseCommand } from "@class/BaseCommand";
import { BotPermission } from "@decorators/BotPermission";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import { GeneralConfigKeys } from "@modules/General/GeneralConfig";
import { SanctionService } from "@modules/Moderation/services/SanctionService";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import {
	ChatInputCommandInteraction,
	Client,
	MessageFlags,
	PermissionsBitField,
} from "discord.js";
import { unmuteOptions } from "./unmuteOptions";

@Command(unmuteOptions)
export default class UnmuteCommand extends BaseCommand {
	@DefaultCommand(EPermission.Unmute)
	@BotPermission(PermissionsBitField.Flags.ManageRoles)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		const lng =
			(await ConfigService.get(
				interaction.guildId!,
				GeneralConfigKeys.language,
			)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const user = interaction.options.getUser("user", true);

		if (!interaction.guild) return;

		try {
			await SanctionService.unmute(interaction.guild, user);
			await interaction.reply(
				t("modules.moderation.commands.unmute.success", {
					userTag: user.tag,
				}),
			);
		} catch (error: unknown) {
			await interaction.reply({
				content:
					(error instanceof Error ? error.message : null) ||
					t("modules.moderation.commands.unmute.failed"),
				flags: [MessageFlags.Ephemeral],
			});
		}
	}
}
