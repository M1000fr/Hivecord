import { Events, type Interaction } from "discord.js";
import { BaseEvent } from '@class/BaseEvent';
import { Event } from '@decorators/Event';
import { LeBotClient } from '@class/LeBotClient';
import { SanctionService } from "@services/SanctionService";

@Event({
	name: Events.InteractionCreate,
})
export default class ModerationAutocompleteHandler extends BaseEvent<Events.InteractionCreate> {
	async run(client: LeBotClient<true>, interaction: Interaction) {
		if (!interaction.isAutocomplete()) return;

		if (interaction.commandName === "unwarn") {
			const focusedOption = interaction.options.getFocused(true);
            
            if (focusedOption.name === "warn_id") {
                const userId = interaction.options.get("user")?.value as string;
                if (!userId) {
                    await interaction.respond([]);
                    return;
                }

                const warns = await SanctionService.getActiveWarns(userId);
                const filtered = warns
                    .map(w => ({
                        name: `#${w.id} - ${w.reason.substring(0, 50)}... (${w.createdAt.toLocaleDateString()})`,
                        value: w.id
                    }))
                    .slice(0, 25);

                await interaction.respond(filtered);
            }
		}
	}
}
