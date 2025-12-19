import { ConfigProperty, EConfigType } from "@decorators/ConfigProperty";

export class AchievementConfig {
	@ConfigProperty({
		displayName: "Global Completion Role",
		displayNameLocalizations: {
			fr: "Rôle de Complétion Globale",
			"en-US": "Global Completion Role",
		},
		description: "Role given when all global achievements are completed",
		descriptionLocalizations: {
			fr: "Rôle donné lorsque toutes les réalisations globales sont complétées",
			"en-US": "Role given when all global achievements are completed",
		},
		type: EConfigType.Role,
		required: false,
	})
	globalCompletionRoleId: string | null = null;

	@ConfigProperty({
		displayName: "Rotated Completion Role",
		displayNameLocalizations: {
			fr: "Rôle de Complétion Rotative",
			"en-US": "Rotated Completion Role",
		},
		description:
			"Role given when all active rotated achievements are completed",
		descriptionLocalizations: {
			fr: "Rôle donné lorsque toutes les réalisations rotatives actives sont complétées",
			"en-US":
				"Role given when all active rotated achievements are completed",
		},
		type: EConfigType.Role,
		required: false,
	})
	rotatedCompletionRoleId: string | null = null;

	@ConfigProperty({
		displayName: "Announcement Channel",
		displayNameLocalizations: {
			fr: "Canal d'Annonce",
			"en-US": "Announcement Channel",
		},
		description: "Channel where achievement unlocks are announced",
		descriptionLocalizations: {
			fr: "Canal où les déblocages de réalisations sont annoncés",
			"en-US": "Channel where achievement unlocks are announced",
		},
		type: EConfigType.Channel,
		required: false,
	})
	announcementChannelId: string | null = null;

	@ConfigProperty({
		displayName: "Rotation Interval",
		displayNameLocalizations: {
			fr: "Intervalle de Rotation",
			"en-US": "Rotation Interval",
		},
		description: "Interval for rotating achievements (in days)",
		descriptionLocalizations: {
			fr: "Intervalle pour la rotation des réalisations (en jours)",
			"en-US": "Interval for rotating achievements (in days)",
		},
		type: EConfigType.Integer,
		defaultValue: 7,
		required: true,
	})
	rotationIntervalDays: number = 7;

	@ConfigProperty({
		displayName: "Announcement Message",
		displayNameLocalizations: {
			fr: "Message d'Annonce",
			"en-US": "Announcement Message",
		},
		description: "Message template for achievement announcements",
		descriptionLocalizations: {
			fr: "Modèle de message pour les annonces de réalisations",
			"en-US": "Message template for achievement announcements",
		},
		type: EConfigType.String,
		defaultValue:
			"🏆 **Achievement Unlocked!**\n{user} has unlocked **{achievement.name}**!\n*{achievement.description}*",
		required: true,
	})
	announcementMessage: string =
		"🏆 **Achievement Unlocked!**\n{user} has unlocked **{achievement.name}**!\n*{achievement.description}*";
}
