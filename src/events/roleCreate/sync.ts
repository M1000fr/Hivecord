import { Events, Role } from "discord.js";
import { BaseEvent } from "../../class/BaseEvent";
import { Event } from "../../decorators/Event";
import { LeBotClient } from "../../class/LeBotClient";
import { prismaClient } from "../../services/prismaService";
import { Logger } from "../../utils/Logger";

@Event({
    name: Events.GuildRoleCreate,
})
export default class RoleCreateEvent extends BaseEvent<Events.GuildRoleCreate> {
    private logger = new Logger('RoleCreateEvent');

    async run(client: LeBotClient<true>, role: Role) {
        await prismaClient.role.create({
            data: {
                id: role.id,
            }
        });
        this.logger.log(`Role ${role.name} created in DB.`);
    }
}
