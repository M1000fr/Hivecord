import { Injectable } from "@decorators/Injectable";
import { Button } from "@decorators/Interaction";
import { Interaction } from "@decorators/params";
import { ButtonInteraction, MessageFlags } from "discord.js";

@Injectable()
export class PingCommandInteractions {
	@Button("ping_button")
	async handlePingButton(@Interaction() interaction: ButtonInteraction) {
		await interaction.reply({
			content: "Pong from interaction!",
			flags: MessageFlags.Ephemeral,
		});
	}
}
