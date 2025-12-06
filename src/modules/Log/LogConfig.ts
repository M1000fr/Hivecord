import {
	ConfigProperty,
	EConfigType,
	toConfigKey,
} from "@decorators/ConfigProperty";

export class LogConfig {
	@ConfigProperty({
		displayName: "Log Channel",
		displayNameLocalizations: {
			fr: "Canal de journalisation",
			"en-US": "Log Channel",
		},
		description: "The channel where logs will be sent",
		descriptionLocalizations: {
			fr: "Le canal où les journaux seront envoyés",
			"en-US": "The channel where logs will be sent",
		},
		type: EConfigType.Channel,
	})
	logChannelId: string = "";

	@ConfigProperty({
		displayName: "Enable Sanction Logs",
		displayNameLocalizations: {
			fr: "Activer les journaux de sanctions",
			"en-US": "Enable Sanction Logs",
		},
		description: "Enable logs for sanctions (ban, mute, etc.)",
		descriptionLocalizations: {
			fr: "Activer les journaux pour les sanctions (ban, mute, etc.)",
			"en-US": "Enable logs for sanctions (ban, mute, etc.)",
		},
		type: EConfigType.Boolean,
		defaultValue: true,
		nonNull: true,
	})
	logEnableSanctionLogs: boolean = true;

	@ConfigProperty({
		displayName: "Enable Voice Logs",
		displayNameLocalizations: {
			fr: "Activer les journaux vocaux",
			"en-US": "Enable Voice Logs",
		},
		description:
			"Enable logs for private voice channels (create, whitelist, blacklist)",
		descriptionLocalizations: {
			fr: "Activer les journaux pour les canaux vocaux privés (création, liste blanche, liste noire)",
			"en-US":
				"Enable logs for private voice channels (create, whitelist, blacklist)",
		},
		type: EConfigType.Boolean,
		defaultValue: true,
		nonNull: true,
	})
	logEnableVoiceLogs: boolean = true;

	@ConfigProperty({
		displayName: "Enable Member Logs",
		displayNameLocalizations: {
			fr: "Activer les journaux des membres",
			"en-US": "Enable Member Logs",
		},
		description: "Enable logs for member join/leave",
		descriptionLocalizations: {
			fr: "Activer les journaux pour les membres qui rejoignent/quittent",
			"en-US": "Enable logs for member join/leave",
		},
		type: EConfigType.Boolean,
		defaultValue: true,
		nonNull: true,
	})
	logEnableMemberLogs: boolean = true;

	@ConfigProperty({
		displayName: "Enable Voice Connection Logs",
		displayNameLocalizations: {
			fr: "Activer les journaux de connexion vocale",
			"en-US": "Enable Voice Connection Logs",
		},
		description: "Enable logs for voice connection/disconnection/stream",
		descriptionLocalizations: {
			fr: "Activer les journaux pour la connexion/déconnexion/stream vocal",
			"en-US": "Enable logs for voice connection/disconnection/stream",
		},
		type: EConfigType.Boolean,
		defaultValue: true,
		nonNull: true,
	})
	logEnableVoiceConnectionLogs: boolean = true;

	@ConfigProperty({
		displayName: "Enable Message Edit/Delete Logs",
		displayNameLocalizations: {
			fr: "Activer les journaux de modification/suppression de messages",
			"en-US": "Enable Message Edit/Delete Logs",
		},
		description: "Enable logs for message edits and deletions",
		descriptionLocalizations: {
			fr: "Activer les journaux pour les modifications et suppressions de messages",
			"en-US": "Enable logs for message edits and deletions",
		},
		type: EConfigType.Boolean,
		defaultValue: true,
		nonNull: true,
	})
	logEnableMessageLogs: boolean = true;

	@ConfigProperty({
		displayName: "Enable Role Update Logs",
		displayNameLocalizations: {
			fr: "Activer les journaux de mise à jour des rôles",
			"en-US": "Enable Role Update Logs",
		},
		description: "Enable logs for role creations, deletions and updates",
		descriptionLocalizations: {
			fr: "Activer les journaux pour les créations, suppressions et mises à jour des rôles",
			"en-US": "Enable logs for role creations, deletions and updates",
		},
		type: EConfigType.Boolean,
		defaultValue: true,
		nonNull: true,
	})
	logEnableRoleUpdateLogs: boolean = true;
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
