import { MessageCommand } from "@src/decorators/commands/MessageCommand";
import {
	SlashCommand,
	SlashCommandController,
} from "@src/decorators/commands/SlashCommand";
import { UserCommand } from "@src/decorators/commands/UserCommand";
import { CommandInteraction } from "@src/decorators/Interaction";
import { TargetMessage, TargetUser } from "@src/decorators/params";
import {
	type ChatInputCommandInteraction,
	Message,
	MessageContextMenuCommandInteraction,
	MessageFlags,
	type User,
	type UserContextMenuCommandInteraction,
} from "discord.js";

@SlashCommandController({
	name: "ping",
	description: "Replies with Pong!",
})
export class PingCommand {
	@SlashCommand()
	public async ping(
		@CommandInteraction() interaction: ChatInputCommandInteraction,
	) {
		await interaction.reply("Pong!");
	}
}

@UserCommand({
	name: "Get User Avatar",
})
export default class GetAvatarCommand {
	async execute(
		@CommandInteraction() interaction: UserContextMenuCommandInteraction,
		@TargetUser() user: User,
	) {
		const avatarUrl = user.displayAvatarURL({ size: 1024 });

		await interaction.reply({
			content: avatarUrl,
			flags: [MessageFlags.Ephemeral],
		});
	}
}

@MessageCommand({
	name: "Get User Avatar",
})
export class GetAvatarMessageCommand {
	async execute(
		@CommandInteraction() interaction: MessageContextMenuCommandInteraction,
		@TargetMessage() message: Message,
	) {
		const author = message.author;
		const avatarUrl = author.displayAvatarURL({ size: 1024 });

		await interaction.reply({
			content: avatarUrl,
			flags: [MessageFlags.Ephemeral],
		});
	}
}
