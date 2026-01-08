import { MessageCommand } from "@src/decorators/commands/MessageCommand";
import {
	SlashCommand,
	SlashCommandController,
} from "@src/decorators/commands/SlashCommand";
import { UserCommand } from "@src/decorators/commands/UserCommand";
import { Injectable } from "@src/decorators/Injectable";
import {
	Button,
	CommandInteraction,
	Context,
} from "@src/decorators/Interaction";
import { TargetMessage, TargetUser } from "@src/decorators/params";
import { type ButtonContext } from "@src/types/InteractionContexts";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
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
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId("my_unique_button")
				.setLabel("Push me!")
				.setStyle(ButtonStyle.Primary),
		);

		await interaction.reply({
			content: "Pong!",
			components: [row],
		});
	}

	@Button("my_unique_button")
	public async onMyUniqueButtonPress(
		@Context() [interaction]: ButtonContext,
	) {
		await interaction.reply({
			content: "You pushed the button!",
			flags: [MessageFlags.Ephemeral],
		});
	}
}

@UserCommand({
	name: "Get User Avatar",
})
export default class GetAvatarUserCommand {
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
