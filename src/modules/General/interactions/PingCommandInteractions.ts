import { ButtonInteraction } from "discord.js";
import { Button } from "@decorators/Interaction";

export class PingCommandInteractions {
	@Button("ping_button")
	async handlePingButton(interaction: ButtonInteraction) {
		await interaction.reply({
			content: "Pong from interaction!",
			flags: 64,
		});
	}
}
