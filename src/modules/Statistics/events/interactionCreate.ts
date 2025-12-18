import { BaseEvent } from "@class/BaseEvent";
import type { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { StatsWriter } from "@modules/Statistics/services/StatsWriter";
import { BotEvents } from "@src/enums/BotEvents";
import type { Interaction } from "discord.js";

@Event({ name: BotEvents.InteractionCreate })
export default class InteractionCreateEvent extends BaseEvent<
	typeof BotEvents.InteractionCreate
> {
	async run(
		client: LeBotClient<true>,
		interaction: Interaction,
	): Promise<void> {
		if (!interaction.guild || !interaction.isCommand()) return;

		try {
			await StatsWriter.incrementCommandCount(
				client,
				interaction.user.id,
				interaction.guild.id,
			);
			await StatsWriter.updateDailyStreak(
				client,
				interaction.user.id,
				interaction.guild.id,
			);
		} catch (error) {
			console.error("Failed to record command stat:", error);
		}
	}
}
