import { ConfigProperty, EConfigType } from "@decorators/ConfigProperty";

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
}

export const AchievementConfigKeys = {
	globalCompletionRoleId: "global_completion_role_id",
	rotatedCompletionRoleId: "rotated_completion_role_id",
	announcementChannelId: "announcement_channel_id",
	rotationIntervalDays: "rotation_interval_days",
};
