import { BaseCommand } from "@class/BaseCommand";
import { LeBotClient } from "@class/LeBotClient";
import { Autocomplete } from "@decorators/Autocomplete";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import { SanctionService } from "@modules/Moderation/services/SanctionService";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { GeneralConfig } from "@src/modules/General/GeneralConfig";
import { InteractionHelper } from "@src/utils/InteractionHelper";
import {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	InteractionContextType,
	MessageFlags,
} from "discord.js";
import { unwarnOptions } from "./options";

@Command({
	name: "unwarn",
	description: "Remove a warning from a user",
	options: unwarnOptions,
	contexts: [InteractionContextType.Guild],
})
export default class UnwarnCommand extends BaseCommand {
	@Autocomplete({ optionName: "warn_id" })
	async autocompleteWarnId(
		client: LeBotClient<true>,
		interaction: AutocompleteInteraction,
	) {
		const userId = interaction.options.get("user")?.value as string;
		if (!userId) {
			await interaction.respond([]);
			return;
		}

		const warns = await SanctionService.getActiveWarns(
			interaction.guildId!,
			userId,
		);
		const filtered = warns
			.map((w) => ({
				name: `#${w.id} - ${w.reason.substring(0, 50)}... (${w.createdAt.toLocaleDateString()})`,
				value: w.id,
			}))
			.slice(0, 25);

		await interaction.respond(filtered);
	}

	@DefaultCommand(EPermission.Unwarn)
	async run(
		client: LeBotClient<true>,
		interaction: ChatInputCommandInteraction,
	) {
		await InteractionHelper.defer(interaction);
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
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
			await InteractionHelper.respond(interaction, {
				content: t("modules.moderation.commands.unwarn.success", {
					id: warnId,
					userTag: user.tag,
				}),
			});
		} catch (error: unknown) {
			await InteractionHelper.respond(interaction, {
				content: t(
					"modules.moderation.commands.unwarn.failed_with_error",
					{
						error:
							error instanceof Error
								? error.message
								: String(error),
					},
				),
			});
		}
	}
}
