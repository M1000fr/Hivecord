import { BaseCommand } from "@class/BaseCommand";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import { ChatInputCommandInteraction, Client, MessageFlags } from "discord.js";
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
				content: `Deleted ${deletedMessages?.size || 0} messages.`,
			})
			.then((msg) => {
				setTimeout(() => {
					msg.delete().catch(() => {});
				}, 5000);
			});
	}
}
