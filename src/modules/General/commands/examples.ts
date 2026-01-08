import { MessageCommand } from "@src/decorators/commands/MessageCommand";
import {
	SlashCommand,
	SlashCommandController,
} from "@src/decorators/commands/SlashCommand";
import { UserCommand } from "@src/decorators/commands/UserCommand";
import {
	Button,
	CommandInteraction,
	Context,
	Modal,
} from "@src/decorators/Interaction";
import { TargetMessage, TargetUser } from "@src/decorators/params";
import {
	type ButtonContext,
	type ModalContext,
} from "@src/types/InteractionContexts";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ChatInputCommandInteraction,
	LabelBuilder,
	Message,
	MessageContextMenuCommandInteraction,
	MessageFlags,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
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
		const modal = new ModalBuilder()
			.setCustomId("example_modal")
			.setTitle("Example Modal");

		const favoriteColorInput = new TextInputBuilder()
			.setCustomId("favoriteColorInput")
			.setStyle(TextInputStyle.Short);

		const label = new LabelBuilder()
			.setLabel("What's your favorite color?")
			.setTextInputComponent(favoriteColorInput);

		modal.addLabelComponents(label);

		await interaction.showModal(modal);
	}

	@Modal("example_modal")
	public async onModalSubmit(@Context() [interaction]: ModalContext) {
		const favoriteColor =
			interaction.fields.getTextInputValue("favoriteColorInput");

		await interaction.reply({
			content: `Your favorite color is: ${favoriteColor}`,
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
