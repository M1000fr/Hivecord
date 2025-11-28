import { ApplicationCommandOptionType } from "discord.js";
import { ConfigProperty } from "../../decorators/ConfigProperty";

export class ModerationConfig {
    @ConfigProperty({
        description: "The role to give to muted users",
        type: ApplicationCommandOptionType.Role,
    })
    muteRoleId: string = "";
}
