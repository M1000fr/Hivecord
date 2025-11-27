import { Events, MessageFlags, type Interaction } from "discord.js";
import { BaseEvent } from "../../class/BaseEvent";
import { Event } from "../../decorators/Event";
import { LeBotClient } from "../../class/LeBotClient";
import { PermissionService } from "../../services/PermissionService";
import { Logger } from "../../utils/Logger";

@Event({
    name: Events.InteractionCreate,
})
export default class InteractionCreateEvent extends BaseEvent<Events.InteractionCreate> {
    private logger = new Logger('InteractionCreateEvent');

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
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: "There was an error while executing this command!",
                    flags: [MessageFlags.Ephemeral],
                });
            } else {
                await interaction.reply({
                    content: "There was an error while executing this command!",
                    flags: [MessageFlags.Ephemeral],
                });
            }
        }
    }
}
