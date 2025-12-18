import { BaseEvent } from "@class/BaseEvent";
import type { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { StatsWriter } from "@modules/Statistics/services/StatsWriter";
import { BotEvents } from "@src/enums/BotEvents";
import type { VoiceState } from "discord.js";

@Event({ name: BotEvents.VoiceStateUpdate })
export default class VoiceStateUpdateEvent extends BaseEvent<
	typeof BotEvents.VoiceStateUpdate
> {
	async run(
		client: LeBotClient<true>,
		oldState: VoiceState,
		newState: VoiceState,
	): Promise<void> {
		// Ignore bot voice states
		if (newState.member?.user.bot) return;

		const userId = newState.member?.id;
		const guildId = newState.guild.id;

		if (!userId) return;

		try {
			// User joined a voice channel
			if (!oldState.channel && newState.channel) {
				await StatsWriter.startVoiceSession(
					client,
					userId,
					newState.channel.id,
					guildId,
				);
				if (newState.streaming) {
					await StatsWriter.startStreamSession(
						userId,
						newState.channel.id,
						guildId,
					);
				}
			}
			// User left a voice channel
			else if (oldState.channel && !newState.channel) {
				await StatsWriter.endVoiceSession(
					client,
					userId,
					oldState.channel.id,
					guildId,
				);
				if (oldState.streaming) {
					await StatsWriter.endStreamSession(
						client,
						userId,
						oldState.channel.id,
						guildId,
					);
				}
			}
			// User switched channels
			else if (
				oldState.channel &&
				newState.channel &&
				oldState.channel.id !== newState.channel.id
			) {
				await StatsWriter.endVoiceSession(
					client,
					userId,
					oldState.channel.id,
					guildId,
				);
				if (oldState.streaming) {
					await StatsWriter.endStreamSession(
						client,
						userId,
						oldState.channel.id,
						guildId,
					);
				}

				await StatsWriter.startVoiceSession(
					client,
					userId,
					newState.channel.id,
					guildId,
				);
				if (newState.streaming) {
					await StatsWriter.startStreamSession(
						userId,
						newState.channel.id,
						guildId,
					);
				}
			}
			// Stream state change (in same channel)
			else if (
				oldState.channel &&
				newState.channel &&
				oldState.channel.id === newState.channel.id
			) {
				if (!oldState.streaming && newState.streaming) {
					await StatsWriter.startStreamSession(
						userId,
						newState.channel.id,
						guildId,
					);
				} else if (oldState.streaming && !newState.streaming) {
					await StatsWriter.endStreamSession(
						client,
						userId,
						newState.channel.id,
						guildId,
					);
				}
			}
		} catch (error) {
			console.error("Failed to record voice stat:", error);
		}
	}
}
