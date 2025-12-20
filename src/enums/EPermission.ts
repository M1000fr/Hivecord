export enum EPermission {
	Ping = "commands.ping",
	ReplaceRole = "commands.replaceRole",
	ChannelClear = "commands.clear",
	ChannelPurge = "commands.purge",
	Config = "commands.config",
	Invites = "commands.invites",

	AchievementSeed = "commands.achievement.seed",
	AchievementCreate = "commands.achievement.create",
	AchievementDelete = "commands.achievement.delete",
	AchievementEdit = "commands.achievement.edit",

	GroupsCreate = "commands.groups.create",
	GroupsUpdate = "commands.groups.update",
	GroupsDelete = "commands.groups.delete",
	GroupsList = "commands.groups.list",

	TempMute = "commands.tempmute",
	Unmute = "commands.unmute",

	Ban = "commands.ban",
	Unban = "commands.unban",

	SyncWelcomeRoles = "commands.sync.welcomeRoles",
	SyncBackup = "commands.sync.backup",
	SyncRestore = "commands.sync.restore",

	SanctionsList = "commands.sanctions.list",
	ConfigureModules = "commands.modules",
	Debug = "commands.debug",

	Warn = "commands.warn",
	Unwarn = "commands.unwarn",

	Lock = "commands.lock",
	Unlock = "commands.unlock",

	ReasonAdd = "commands.reason.add",
	ReasonList = "commands.reason.list",
	ReasonRemove = "commands.reason.remove",
	ReasonEdit = "commands.reason.edit",

	SecurityHeatpoint = "commands.security.heatpoint",

	StatsServer = "commands.stats.server",
	StatsUser = "commands.stats.user",
}
