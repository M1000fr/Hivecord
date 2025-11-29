import { ApplicationCommandOptionType } from "discord.js";
import { ConfigProperty } from "@decorators/ConfigProperty";

export class SecurityConfig {
	@ConfigProperty({
		description: "Points given for joining a voice channel",
		displayName: "Heatpoints for joining voice",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 10,
	})
	heatpointJoinVoice: number = 10;

	@ConfigProperty({
		description: "Points given for switching voice channels",
		displayName: "Heatpoints for switching voice",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 5,
	})
	heatpointSwitchVoice: number = 5;

	@ConfigProperty({
		description: "Points given for starting a stream",
		displayName: "Heatpoints for starting a stream",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 20,
	})
	heatpointStream: number = 20;

	@ConfigProperty({
		description: "Points given for adding a reaction",
		displayName: "Heatpoints for adding a reaction",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 2,
	})
	heatpointReaction: number = 2;

	@ConfigProperty({
		description: "Points given for sending a message",
		displayName: "Heatpoints for sending a message",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 5,
	})
	heatpointMessage: number = 5;

	@ConfigProperty({
		description: "Points lost per second (Decay rate)",
		displayName: "Heatpoints decay rate",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 1,
	})
	heatpointDecayRate: number = 1;

	@ConfigProperty({
		description: "Threshold for channel lockdown",
		displayName: "Heatpoints channel threshold",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 100,
	})
	heatpointChannelThreshold: number = 100;

	@ConfigProperty({
		description: "Threshold for global server lockdown",
		displayName: "Heatpoints global threshold",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 500,
	})
	heatpointGlobalThreshold: number = 500;

	@ConfigProperty({
		description: "Duration of lockdown in seconds",
		displayName: "Lockdown duration",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 60,
	})
	heatpointLockDuration: number = 60;

	@ConfigProperty({
		description: "Channel ID for security alerts",
		displayName: "Alert Channel",
		type: ApplicationCommandOptionType.Channel,
		required: false,
	})
	alertChannelId: string | null = null;

	@ConfigProperty({
		description: "User heat threshold for warning",
		displayName: "User Warn Threshold",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 50,
	})
	heatpointUserWarnThreshold: number = 50;

	@ConfigProperty({
		description: "User heat threshold for mute (1h)",
		displayName: "User Mute Threshold",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 80,
	})
	heatpointUserMuteThreshold: number = 80;

	@ConfigProperty({
		description: "Duration of mute in seconds (default 1h)",
		displayName: "Mute Duration",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 3600,
	})
	heatpointMuteDuration: number = 3600;

	@ConfigProperty({
		description: "Role ID that bypasses locks (but still gains heat)",
		displayName: "Bypass Role",
		type: ApplicationCommandOptionType.Role,
		required: false,
	})
	bypassRoleId: string | null = null;
}

export const SecurityConfigKeys = {
	heatpointJoinVoice: "security_heatpoint_join_voice",
	heatpointSwitchVoice: "security_heatpoint_switch_voice",
	heatpointStream: "security_heatpoint_stream",
	heatpointReaction: "security_heatpoint_reaction",
	heatpointMessage: "security_heatpoint_message",
	heatpointDecayRate: "security_heatpoint_decay_rate",
	heatpointChannelThreshold: "security_heatpoint_channel_threshold",
	heatpointGlobalThreshold: "security_heatpoint_global_threshold",
	heatpointLockDuration: "security_heatpoint_lock_duration",
	alertChannelId: "security_alert_channel_id",
	heatpointUserWarnThreshold: "security_heatpoint_user_warn_threshold",
	heatpointUserMuteThreshold: "security_heatpoint_user_mute_threshold",
	heatpointMuteDuration: "security_heatpoint_mute_duration",
	bypassRoleId: "security_bypass_role_id",
};
