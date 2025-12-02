import {
	ConfigProperty,
	toConfigKey,
	EConfigType,
} from "@decorators/ConfigProperty";

export class SecurityConfig {
	@ConfigProperty({
		description: "Points given for joining a voice channel",
		displayName: "Heatpoints for joining voice",
		type: EConfigType.Integer,
		defaultValue: 10,
	})
	securityHeatpointJoinVoice: number = 10;

	@ConfigProperty({
		description: "Points given for switching voice channels",
		displayName: "Heatpoints for switching voice",
		type: EConfigType.Integer,
		defaultValue: 5,
	})
	securityHeatpointSwitchVoice: number = 5;

	@ConfigProperty({
		description: "Points given for starting a stream",
		displayName: "Heatpoints for starting a stream",
		type: EConfigType.Integer,
		defaultValue: 20,
	})
	securityHeatpointStream: number = 20;

	@ConfigProperty({
		description: "Points given for adding a reaction",
		displayName: "Heatpoints for adding a reaction",
		type: EConfigType.Integer,
		defaultValue: 2,
	})
	securityHeatpointReaction: number = 2;

	@ConfigProperty({
		description: "Points given for sending a message",
		displayName: "Heatpoints for sending a message",
		type: EConfigType.Integer,
		defaultValue: 5,
	})
	securityHeatpointMessage: number = 5;

	@ConfigProperty({
		description: "Points lost per second (Decay rate)",
		displayName: "Heatpoints decay rate",
		type: EConfigType.Integer,
		defaultValue: 1,
	})
	securityHeatpointDecayRate: number = 1;

	@ConfigProperty({
		description: "Threshold for channel lockdown",
		displayName: "Heatpoints channel threshold",
		type: EConfigType.Integer,
		defaultValue: 100,
	})
	securityHeatpointChannelThreshold: number = 100;

	@ConfigProperty({
		description: "Threshold for global server lockdown",
		displayName: "Heatpoints global threshold",
		type: EConfigType.Integer,
		defaultValue: 500,
	})
	securityHeatpointGlobalThreshold: number = 500;

	@ConfigProperty({
		description: "Duration of lockdown in seconds",
		displayName: "Lockdown duration",
		type: EConfigType.Integer,
		defaultValue: 60,
	})
	securityHeatpointLockDuration: number = 60;

	@ConfigProperty({
		description: "Channel ID for security alerts",
		displayName: "Alert Channel",
		type: EConfigType.Channel,
		required: false,
	})
	securityAlertChannelId: string | null = null;

	@ConfigProperty({
		description: "User heat threshold for warning",
		displayName: "User Warn Threshold",
		type: EConfigType.Integer,
		defaultValue: 50,
	})
	securityHeatpointUserWarnThreshold: number = 50;

	@ConfigProperty({
		description: "User heat threshold for mute (1h)",
		displayName: "User Mute Threshold",
		type: EConfigType.Integer,
		defaultValue: 80,
	})
	securityHeatpointUserMuteThreshold: number = 80;

	@ConfigProperty({
		description: "Duration of mute in seconds (default 1h)",
		displayName: "Mute Duration",
		type: EConfigType.Integer,
		defaultValue: 3600,
	})
	securityHeatpointMuteDuration: number = 3600;

	@ConfigProperty({
		description: "Role ID that bypasses locks (but still gains heat)",
		displayName: "Bypass Role",
		type: EConfigType.Role,
		required: false,
	})
	securityBypassRoleId: string | null = null;

	@ConfigProperty({
		description:
			"Number of messages to check for deletion when sanctioning",
		displayName: "Delete Messages Limit",
		type: EConfigType.Integer,
		defaultValue: 50,
	})
	securityHeatpointDeleteMessagesLimit: number = 50;
}

export const SecurityConfigKeys = {
	get heatpointJoinVoice() {
		return toConfigKey("securityHeatpointJoinVoice");
	},
	get heatpointSwitchVoice() {
		return toConfigKey("securityHeatpointSwitchVoice");
	},
	get heatpointStream() {
		return toConfigKey("securityHeatpointStream");
	},
	get heatpointReaction() {
		return toConfigKey("securityHeatpointReaction");
	},
	get heatpointMessage() {
		return toConfigKey("securityHeatpointMessage");
	},
	get heatpointDecayRate() {
		return toConfigKey("securityHeatpointDecayRate");
	},
	get heatpointChannelThreshold() {
		return toConfigKey("securityHeatpointChannelThreshold");
	},
	get heatpointGlobalThreshold() {
		return toConfigKey("securityHeatpointGlobalThreshold");
	},
	get heatpointLockDuration() {
		return toConfigKey("securityHeatpointLockDuration");
	},
	get alertChannelId() {
		return toConfigKey("securityAlertChannelId");
	},
	get heatpointUserWarnThreshold() {
		return toConfigKey("securityHeatpointUserWarnThreshold");
	},
	get heatpointUserMuteThreshold() {
		return toConfigKey("securityHeatpointUserMuteThreshold");
	},
	get heatpointMuteDuration() {
		return toConfigKey("securityHeatpointMuteDuration");
	},
	get bypassRoleId() {
		return toConfigKey("securityBypassRoleId");
	},
	get heatpointDeleteMessagesLimit() {
		return toConfigKey("securityHeatpointDeleteMessagesLimit");
	},
} as const;
