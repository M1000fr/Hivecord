import { ApplicationCommandOptionType } from "discord.js";
import { ConfigProperty, toConfigKey } from "../../decorators/ConfigProperty";

export class ModerationConfig {
    @ConfigProperty({
        displayName: "Mute Role",
        description: "The role to give to muted users",
        type: ApplicationCommandOptionType.Role,
    })
    muteRoleId: string = "";
}

export const ModerationConfigKeys = {
    get muteRoleId() { return toConfigKey('muteRoleId'); },
} as const;
