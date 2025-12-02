import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { HeatpointService } from "@modules/Security/services/HeatpointService";
import { BotEvents } from "@src/enums/BotEvents";
import { VoiceState } from "discord.js";

@Event({ name: BotEvents.VoiceStateUpdate })
export class VoiceStateUpdateEvent extends BaseEvent<
	typeof BotEvents.VoiceStateUpdate
> {
	async run(
		client: LeBotClient<true>,
		oldState: VoiceState,
		newState: VoiceState,
	) {
		const member = newState.member;
		if (!member || member.user.bot) return;

		const guild = newState.guild;

		// Join
		if (!oldState.channelId && newState.channelId) {
			await HeatpointService.processAction(
				guild,
				newState.channel,
				member.user,
				"join_voice",
			);
		}
		// Switch
		else if (
			oldState.channelId &&
			newState.channelId &&
			oldState.channelId !== newState.channelId
		) {
			await HeatpointService.processAction(
				guild,
				newState.channel,
				member.user,
				"switch_voice",
			);
		}
		// Stream
		else if (!oldState.streaming && newState.streaming) {
			await HeatpointService.processAction(
				guild,
				newState.channel,
				member.user,
				"stream",
			);
		}
	}
}
