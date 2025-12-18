import { ConfigProperty, EConfigType } from "@decorators/ConfigProperty";

export class SecurityConfig {
	@ConfigProperty({
		description: "Points given for joining a voice channel",
		descriptionLocalizations: {
			fr: "Points donnés pour rejoindre un canal vocal",
			"en-US": "Points given for joining a voice channel",
		},
		displayName: "Heatpoints for joining voice",
		displayNameLocalizations: {
			fr: "Points de chaleur pour rejoindre un canal vocal",
			"en-US": "Heatpoints for joining voice",
		},
		type: EConfigType.Integer,
		defaultValue: 10,
	})
	securityHeatpointJoinVoice: number = 10;

	@ConfigProperty({
		description: "Points given for switching voice channels",
		descriptionLocalizations: {
			fr: "Points donnés pour changer de canal vocal",
			"en-US": "Points given for switching voice channels",
		},
		displayName: "Heatpoints for switching voice",
		displayNameLocalizations: {
			fr: "Points de chaleur pour changer de canal vocal",
			"en-US": "Heatpoints for switching voice",
		},
		type: EConfigType.Integer,
		defaultValue: 5,
	})
	securityHeatpointSwitchVoice: number = 5;

	@ConfigProperty({
		description: "Points given for starting a stream",
		descriptionLocalizations: {
			fr: "Points donnés pour démarrer un stream",
			"en-US": "Points given for starting a stream",
		},
		displayName: "Heatpoints for starting a stream",
		displayNameLocalizations: {
			fr: "Points de chaleur pour démarrer un stream",
			"en-US": "Heatpoints for starting a stream",
		},
		type: EConfigType.Integer,
		defaultValue: 20,
	})
	securityHeatpointStream: number = 20;

	@ConfigProperty({
		description: "Points given for adding a reaction",
		descriptionLocalizations: {
			fr: "Points donnés pour ajouter une réaction",
			"en-US": "Points given for adding a reaction",
		},
		displayName: "Heatpoints for adding a reaction",
		displayNameLocalizations: {
			fr: "Points de chaleur pour ajouter une réaction",
			"en-US": "Heatpoints for adding a reaction",
		},
		type: EConfigType.Integer,
		defaultValue: 2,
	})
	securityHeatpointReaction: number = 2;

	@ConfigProperty({
		description: "Points given for sending a message",
		descriptionLocalizations: {
			fr: "Points donnés pour envoyer un message",
			"en-US": "Points given for sending a message",
		},
		displayName: "Heatpoints for sending a message",
		displayNameLocalizations: {
			fr: "Points de chaleur pour envoyer un message",
			"en-US": "Heatpoints for sending a message",
		},
		type: EConfigType.Integer,
		defaultValue: 5,
	})
	securityHeatpointMessage: number = 5;

	@ConfigProperty({
		description: "Points lost per second (Decay rate)",
		descriptionLocalizations: {
			fr: "Points perdus par seconde (Taux de décroissance)",
			"en-US": "Points lost per second (Decay rate)",
		},
		displayName: "Heatpoints decay rate",
		displayNameLocalizations: {
			fr: "Taux de décroissance des points de chaleur",
			"en-US": "Heatpoints decay rate",
		},
		type: EConfigType.Integer,
		defaultValue: 1,
	})
	securityHeatpointDecayRate: number = 1;

	@ConfigProperty({
		description: "Threshold for channel lockdown",
		descriptionLocalizations: {
			fr: "Seuil pour le verrouillage du canal",
			"en-US": "Threshold for channel lockdown",
		},
		displayName: "Heatpoints channel threshold",
		displayNameLocalizations: {
			fr: "Seuil de points de chaleur pour le verrouillage du canal",
			"en-US": "Heatpoints channel threshold",
		},
		type: EConfigType.Integer,
		defaultValue: 100,
	})
	securityHeatpointChannelThreshold: number = 100;

	@ConfigProperty({
		description: "Threshold for global server lockdown",
		descriptionLocalizations: {
			fr: "Seuil pour le verrouillage global du serveur",
			"en-US": "Threshold for global server lockdown",
		},
		displayName: "Heatpoints global threshold",
		displayNameLocalizations: {
			fr: "Seuil de points de chaleur pour le verrouillage global",
			"en-US": "Heatpoints global threshold",
		},
		type: EConfigType.Integer,
		defaultValue: 500,
	})
	securityHeatpointGlobalThreshold: number = 500;

	@ConfigProperty({
		description: "Duration of lockdown in seconds",
		descriptionLocalizations: {
			fr: "Durée du verrouillage en secondes",
			"en-US": "Duration of lockdown in seconds",
		},
		displayName: "Lockdown duration",
		displayNameLocalizations: {
			fr: "Durée du verrouillage",
			"en-US": "Lockdown duration",
		},
		type: EConfigType.Integer,
		defaultValue: 60,
	})
	securityHeatpointLockDuration: number = 60;

	@ConfigProperty({
		description: "Channel ID for security alerts",
		descriptionLocalizations: {
			fr: "ID du canal pour les alertes de sécurité",
			"en-US": "Channel ID for security alerts",
		},
		displayName: "Alert Channel",
		displayNameLocalizations: {
			fr: "Canal d'alerte",
			"en-US": "Alert Channel",
		},
		type: EConfigType.Channel,
		required: false,
	})
	securityAlertChannelId: string | null = null;

	@ConfigProperty({
		description: "User heat threshold for warning",
		descriptionLocalizations: {
			fr: "Seuil de chaleur utilisateur pour l'avertissement",
			"en-US": "User heat threshold for warning",
		},
		displayName: "User Warn Threshold",
		displayNameLocalizations: {
			fr: "Seuil d'avertissement utilisateur",
			"en-US": "User Warn Threshold",
		},
		type: EConfigType.Integer,
		defaultValue: 50,
	})
	securityHeatpointUserWarnThreshold: number = 50;

	@ConfigProperty({
		description: "User heat threshold for mute (1h)",
		descriptionLocalizations: {
			fr: "Seuil de chaleur utilisateur pour le mute (1h)",
			"en-US": "User heat threshold for mute (1h)",
		},
		displayName: "User Mute Threshold",
		displayNameLocalizations: {
			fr: "Seuil de mute utilisateur",
			"en-US": "User Mute Threshold",
		},
		type: EConfigType.Integer,
		defaultValue: 80,
	})
	securityHeatpointUserMuteThreshold: number = 80;

	@ConfigProperty({
		description: "Duration of mute in seconds (default 1h)",
		descriptionLocalizations: {
			fr: "Durée du mute en secondes (par défaut 1h)",
			"en-US": "Duration of mute in seconds (default 1h)",
		},
		displayName: "Mute Duration",
		displayNameLocalizations: {
			fr: "Durée du mute",
			"en-US": "Mute Duration",
		},
		type: EConfigType.Integer,
		defaultValue: 3600,
	})
	securityHeatpointMuteDuration: number = 3600;

	@ConfigProperty({
		displayName: "Bypass Role",
		displayNameLocalizations: {
			fr: "Rôle de contournement",
			"en-US": "Bypass Role",
		},
		description: "Role ID that bypasses locks (but still gains heat)",
		descriptionLocalizations: {
			fr: "ID du rôle qui contourne les verrouillages (mais gagne toujours de la chaleur)",
			"en-US": "Role ID that bypasses locks (but still gains heat)",
		},
		type: EConfigType.Role,
		required: false,
	})
	securityBypassRoleId: string | null = null;

	@ConfigProperty({
		description:
			"Number of messages to check for deletion when sanctioning",
		descriptionLocalizations: {
			fr: "Nombre de messages à vérifier pour la suppression lors de la sanction",
			"en-US":
				"Number of messages to check for deletion when sanctioning",
		},
		displayName: "Delete Messages Limit",
		displayNameLocalizations: {
			fr: "Limite de suppression de messages",
			"en-US": "Delete Messages Limit",
		},
		type: EConfigType.Integer,
		defaultValue: 50,
	})
	securityHeatpointDeleteMessagesLimit: number = 50;
}
