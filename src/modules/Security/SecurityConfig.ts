import { ApplicationCommandOptionType } from "discord.js";
import { ConfigProperty } from "@decorators/ConfigProperty";

export class SecurityConfig {
	@ConfigProperty({
		description: "Points given for joining a voice channel",
		displayName: "Heatpoints for joining voice",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 10,
	})
	securityHeatpointJoinVoice: number = 10;

	@ConfigProperty({
		description: "Points given for switching voice channels",
		displayName: "Heatpoints for switching voice",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 5,
	})
	securityHeatpointSwitchVoice: number = 5;

	@ConfigProperty({
		description: "Points given for starting a stream",
		displayName: "Heatpoints for starting a stream",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 20,
	})
	securityHeatpointStream: number = 20;

	@ConfigProperty({
		description: "Points given for adding a reaction",
		displayName: "Heatpoints for adding a reaction",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 2,
	})
	securityHeatpointReaction: number = 2;

	@ConfigProperty({
		description: "Points given for sending a message",
		displayName: "Heatpoints for sending a message",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 5,
	})
	securityHeatpointMessage: number = 5;

	@ConfigProperty({
		description: "Points lost per second (Decay rate)",
		displayName: "Heatpoints decay rate",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 1,
	})
	securityHeatpointDecayRate: number = 1;

	@ConfigProperty({
		description: "Threshold for channel lockdown",
		displayName: "Heatpoints channel threshold",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 100,
	})
	securityHeatpointChannelThreshold: number = 100;

	@ConfigProperty({
		description: "Threshold for global server lockdown",
		displayName: "Heatpoints global threshold",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 500,
	})
	securityHeatpointGlobalThreshold: number = 500;

	@ConfigProperty({
		description: "Duration of lockdown in seconds",
		displayName: "Lockdown duration",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 60,
	})
	securityHeatpointLockDuration: number = 60;

	@ConfigProperty({
		description: "Channel ID for security alerts",
		displayName: "Alert Channel",
		type: ApplicationCommandOptionType.Channel,
		required: false,
	})
	securityAlertChannelId: string | null = null;

	@ConfigProperty({
		description: "User heat threshold for warning",
		displayName: "User Warn Threshold",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 50,
	})
	securityHeatpointUserWarnThreshold: number = 50;

	@ConfigProperty({
		description: "User heat threshold for mute (1h)",
		displayName: "User Mute Threshold",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 80,
	})
	securityHeatpointUserMuteThreshold: number = 80;

	@ConfigProperty({
		description: "Duration of mute in seconds (default 1h)",
		displayName: "Mute Duration",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 3600,
	})
	securityHeatpointMuteDuration: number = 3600;

	@ConfigProperty({
		description: "Role ID that bypasses locks (but still gains heat)",
		displayName: "Bypass Role",
		type: ApplicationCommandOptionType.Role,
		required: false,
	})
	securityBypassRoleId: string | null = null;

	@ConfigProperty({
		description: "Number of messages to check for deletion when sanctioning",
		displayName: "Delete Messages Limit",
		type: ApplicationCommandOptionType.Integer,
		defaultValue: 50,
	})
	securityHeatpointDeleteMessagesLimit: number = 50;
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
	heatpointDeleteMessagesLimit: "security_heatpoint_delete_messages_limit",
};
