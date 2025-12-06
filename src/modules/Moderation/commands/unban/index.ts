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
import { unbanOptions } from "./unbanOptions";

@Command(unbanOptions)
export default class UnbanCommand extends BaseCommand {
	@DefaultCommand(EPermission.Unban)
	@BotPermission(PermissionsBitField.Flags.BanMembers)
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
			await SanctionService.unban(interaction.guild, user);
			await interaction.reply(
				t("modules.moderation.commands.unban.success", {
					userTag: user.tag,
				}),
			);
		} catch (error: unknown) {
			await interaction.reply({
				content:
					(error instanceof Error ? error.message : null) ||
					t("modules.moderation.commands.unban.failed"),
				flags: [MessageFlags.Ephemeral],
			});
		}
	}
}
