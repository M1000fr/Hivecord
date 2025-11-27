import { Events, Role } from "discord.js";
import { BaseEvent } from "../../class/BaseEvent";
import { Event } from "../../decorators/Event";
import { LeBotClient } from "../../class/LeBotClient";
import { prismaClient } from "../../services/prismaService";

@Event({
    name: Events.GuildRoleCreate,
})
export default class RoleCreateEvent extends BaseEvent<Events.GuildRoleCreate> {
    async run(client: LeBotClient<true>, role: Role) {
        await prismaClient.role.create({
            data: {
                id: role.id,
            }
        });
        console.log(`Role ${role.name} created in DB.`);
    }
}
