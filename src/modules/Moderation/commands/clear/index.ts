import { BaseCommand } from "@class/BaseCommand";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { BotPermission } from "@src/decorators/BotPermission";
import { GeneralConfig } from "@src/modules/General/GeneralConfig";
import {
	ChatInputCommandInteraction,
	Client,
	PermissionFlagsBits,
} from "discord.js";
import { clearOptions } from "./clearOptions";

@Command(clearOptions)
export default class ClearCommand extends BaseCommand {
	@DefaultCommand(EPermission.ChannelClear)
	@BotPermission(PermissionFlagsBits.ManageMessages)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		const amount = interaction.options.getString("amount", true);
		const user = interaction.options.getUser("user");
		let deletedMessages;

		if (isNaN(Number(amount)) || Number(amount) <= 0) {
			await interaction.editReply({
				content: t("modules.moderation.commands.clear.invalid_amount"),
			});
			return;
		}

		const fetchedMessages = await interaction.channel?.messages.fetch({
			limit: Math.min(Number(amount), 100),
		});

		if (fetchedMessages) {
			const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
			const validMessages = fetchedMessages.filter(
				(msg) => msg.createdTimestamp > twoWeeksAgo,
			);

			let messagesToDelete;
			if (user) {
				messagesToDelete = validMessages
					.filter((msg) => msg.author.id === user.id)
					.first(Number(amount));
			} else {
				messagesToDelete = validMessages.first(Number(amount));
			}
			if (
				messagesToDelete &&
				messagesToDelete.length > 0 &&
				interaction.channel &&
				"bulkDelete" in interaction.channel
			) {
				deletedMessages =
					await interaction.channel.bulkDelete(messagesToDelete);
			}
		}

		await interaction
			.reply({
				content: t("modules.moderation.commands.clear.success", {
					count: deletedMessages?.size || 0,
				}),
			})
			.then((msg) => {
				setTimeout(() => {
					msg.delete().catch(() => {});
				}, 5000);
			});
	}
}
