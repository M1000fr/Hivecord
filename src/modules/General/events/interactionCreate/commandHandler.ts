import { Events, MessageFlags, type Interaction } from "discord.js";
import { BaseEvent } from "../../../../class/BaseEvent";
import { Event } from "../../../../decorators/Event";
import { LeBotClient } from "../../../../class/LeBotClient";
import { PermissionService } from "../../../../services/PermissionService";
import { Logger } from "../../../../utils/Logger";

@Event({
	name: Events.InteractionCreate,
})
export default class InteractionCreateEvent extends BaseEvent<Events.InteractionCreate> {
	private logger = new Logger("InteractionCreateEvent");

	private async sendErrorResponse(interaction: any, message: string): Promise<void> {
		const payload = { content: message, flags: [MessageFlags.Ephemeral] };
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp(payload);
		} else {
			await interaction.reply(payload);
		}
	}

	async run(client: LeBotClient<true>, interaction: Interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = client.commands.get(interaction.commandName);

		if (!command) {
			this.logger.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.instance.execute(client, interaction);
		} catch (error) {
			this.logger.error(error);
			await this.sendErrorResponse(interaction, "There was an error while executing this command!");
		}
	}
}
