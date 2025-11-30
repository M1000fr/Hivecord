import { ConfigProperty, toConfigKey, EConfigType } from "@decorators/ConfigProperty";

export class LogConfig {
	@ConfigProperty({
		displayName: "Log Channel",
		description: "The channel where logs will be sent",
		type: EConfigType.Channel,
	})
	logChannelId: string = "";

	@ConfigProperty({
		displayName: "Enable Sanction Logs",
		description: "Enable logs for sanctions (ban, mute, etc.)",
		type: EConfigType.Boolean,
		defaultValue: false,
	})
	logEnableSanctionLogs: boolean = false;

	@ConfigProperty({
		displayName: "Enable Voice Logs",
		description:
			"Enable logs for private voice channels (create, whitelist, blacklist)",
		type: EConfigType.Boolean,
		defaultValue: false,
	})
	logEnableVoiceLogs: boolean = false;

	@ConfigProperty({
		displayName: "Enable Member Logs",
		description: "Enable logs for member join/leave",
		type: EConfigType.Boolean,
		defaultValue: false,
	})
	logEnableMemberLogs: boolean = false;

	@ConfigProperty({
		displayName: "Enable Voice Connection Logs",
		description: "Enable logs for voice connection/disconnection/stream",
		type: EConfigType.Boolean,
		defaultValue: false,
	})
	logEnableVoiceConnectionLogs: boolean = false;

	@ConfigProperty({
		displayName: "Enable Message Edit/Delete Logs",
		description: "Enable logs for message edits and deletions",
		type: EConfigType.Boolean,
		defaultValue: false,
	})
	logEnableMessageLogs: boolean = false;

	@ConfigProperty({
		displayName: "Enable Role Update Logs",
		description: "Enable logs for role creations, deletions and updates",
		type: EConfigType.Boolean,
		defaultValue: false,
	})
	logEnableRoleUpdateLogs: boolean = false;
}

export const LogConfigKeys = {
	get logChannelId() {
		return toConfigKey("logChannelId");
	},
	get enableSanctionLogs() {
		return toConfigKey("logEnableSanctionLogs");
	},
	get enableVoiceLogs() {
		return toConfigKey("logEnableVoiceLogs");
	},
	get enableMemberLogs() {
		return toConfigKey("logEnableMemberLogs");
	},
	get enableVoiceConnectionLogs() {
		return toConfigKey("logEnableVoiceConnectionLogs");
	},
	get enableMessageLogs() {
		return toConfigKey("logEnableMessageLogs");
	},
	get enableRoleUpdateLogs() {
		return toConfigKey("logEnableRoleUpdateLogs");
	},
} as const;
