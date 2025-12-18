import {
	ConfigProperty,
	EConfigType,
	getConfigKey,
} from "@decorators/ConfigProperty";

export class AchievementConfig {
	@ConfigProperty({
		displayName: "Global Completion Role",
		description: "Role given when all global achievements are completed",
		type: EConfigType.Role,
		required: false,
	})
	globalCompletionRoleId: string | null = null;

	@ConfigProperty({
		displayName: "Rotated Completion Role",
		description:
			"Role given when all active rotated achievements are completed",
		type: EConfigType.Role,
		required: false,
	})
	rotatedCompletionRoleId: string | null = null;

	@ConfigProperty({
		displayName: "Announcement Channel",
		description: "Channel where achievement unlocks are announced",
		type: EConfigType.Channel,
		required: false,
	})
	announcementChannelId: string | null = null;

	@ConfigProperty({
		displayName: "Rotation Interval",
		description: "Interval for rotating achievements (in days)",
		type: EConfigType.Integer,
		defaultValue: 7,
		required: true,
	})
	rotationIntervalDays: number = 7;

	@ConfigProperty({
		displayName: "Announcement Message",
		description: "Message template for achievement announcements",
		type: EConfigType.String,
		defaultValue:
			"🏆 **Achievement Unlocked!**\n{user} has unlocked **{achievement.name}**!\n*{achievement.description}*",
		required: true,
	})
	announcementMessage: string =
		"🏆 **Achievement Unlocked!**\n{user} has unlocked **{achievement.name}**!\n*{achievement.description}*";
}

export const AchievementConfigKeys = {
	get globalCompletionRoleId() {
		return getConfigKey<string | null>("globalCompletionRoleId");
	},
	get rotatedCompletionRoleId() {
		return getConfigKey<string | null>("rotatedCompletionRoleId");
	},
	get announcementChannelId() {
		return getConfigKey<string | null>("announcementChannelId");
	},
	get rotationIntervalDays() {
		return getConfigKey<string>("rotationIntervalDays");
	},
	get announcementMessage() {
		return getConfigKey<string>("announcementMessage");
	},
};
