import { ConfigProperty, EConfigType } from "@decorators/ConfigProperty";
import { ModuleConfig } from "@decorators/ModuleConfig";

@ModuleConfig()
export class ModerationConfig {
	@ConfigProperty({
		displayName: "Mute Role",
		displayNameLocalizations: {
			fr: "Rôle Muet",
		},
		description: "The role to give to muted users",
		descriptionLocalizations: {
			fr: "Le rôle à donner aux utilisateurs muets",
		},
		type: EConfigType.Role,
	})
	moderationMuteRoleId: string = "";
}
