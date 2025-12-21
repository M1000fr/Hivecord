import { Button } from "@decorators/Interaction";
import { ButtonInteraction, MessageFlags } from "discord.js";

export class PingCommandInteractions {
	@Button("ping_button")
	async handlePingButton(interaction: ButtonInteraction) {
		await interaction.reply({
			content: "Pong from interaction!",
			flags: MessageFlags.Ephemeral,
		});
	}
}
