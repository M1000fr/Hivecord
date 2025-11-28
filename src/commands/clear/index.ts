import {
	ChatInputCommandInteraction,
	Client,
	GuildChannel,
	MessageFlags,
} from "discord.js";
import { BaseCommand } from "../../class/BaseCommand";
import { Command } from "../../decorators/Command";
import { DefaultCommand } from "../../decorators/DefaultCommand";
import { EPermission } from "../../enums/EPermission";
import { clearOptions } from "./pingOptions";

@Command(clearOptions)
export default class ClearCommand extends BaseCommand {
	@DefaultCommand(EPermission.ChannelClear)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		const amount = interaction.options.getString("amount", true);
		const user = interaction.options.getUser("user");
		let deletedMessages;

		if (isNaN(Number(amount)) || Number(amount) <= 0) {
			await interaction.reply({
				content: "Please provide a valid number of messages to clear.",
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		const fetchedMessages = await interaction.channel?.messages.fetch({
			limit: Math.min(Number(amount), 100),
		});

		if (fetchedMessages) {
			let messagesToDelete;
			if (user) {
				messagesToDelete = fetchedMessages
					.filter((msg) => msg.author.id === user.id)
					.first(Number(amount));
			} else {
				messagesToDelete = fetchedMessages.first(Number(amount));
			}
			if (
				messagesToDelete &&
				interaction.channel &&
				"bulkDelete" in interaction.channel
			) {
				deletedMessages =
					await interaction.channel.bulkDelete(messagesToDelete);
			}
		}

		await interaction
			.reply({
				content: `Deleted ${deletedMessages?.size || 0} messages.`,
			})
			.then((msg) => {
				setTimeout(() => {
					msg.delete().catch(() => {});
				}, 5000);
			});
	}
}
