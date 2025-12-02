import {
	ConfigProperty,
	EConfigType,
	toConfigKey,
} from "@decorators/ConfigProperty";

export class ModerationConfig {
	@ConfigProperty({
		displayName: "Mute Role",
		description: "The role to give to muted users",
		type: EConfigType.Role,
	})
	moderationMuteRoleId: string = "";
}

export const ModerationConfigKeys = {
	get muteRoleId() {
		return toConfigKey("moderationMuteRoleId");
	},
} as const;
