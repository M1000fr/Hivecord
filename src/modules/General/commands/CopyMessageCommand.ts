import { MessageCommand } from "@decorators/MessageCommand";
import { Context } from "@decorators/params/Context";
import { TargetMessage } from "@decorators/params/TargetMessage";
import type { MessageCommandContext } from "@src/types/MessageCommandContext";
import type { Message } from "discord.js";

@MessageCommand({ name: "Copy Message" })
export class CopyMessageCommand {
	async execute(
		@Context() [interaction]: MessageCommandContext,
		@TargetMessage() message: Message,
	) {
		return interaction.reply({
			content: message.content || "(No text content)",
		});
	}
}
