import { Events, Role } from "discord.js";
import { BaseEvent } from "../../class/BaseEvent";
import { Event } from "../../decorators/Event";
import { LeBotClient } from "../../class/LeBotClient";
import { prismaClient } from "../../services/prismaService";

@Event({
    name: Events.GuildRoleDelete,
})
export default class RoleDeleteEvent extends BaseEvent<Events.GuildRoleDelete> {
    async run(client: LeBotClient<true>, role: Role) {
        try {
            await prismaClient.role.update({
                where: { id: role.id },
                data: {
                    deletedAt: new Date(),
                }
            });
            console.log(`Role ${role.name} marked as deleted in DB.`);
        } catch (error) {
            console.error(`Failed to mark role ${role.name} as deleted:`, error);
        }
    }
}
