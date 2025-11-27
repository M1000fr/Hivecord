import { Events, GuildMember } from "discord.js";
import { BaseEvent } from "../../class/BaseEvent";
import { Event } from "../../decorators/Event";
import { LeBotClient } from "../../class/LeBotClient";
import { prismaClient } from "../../services/prismaService";

@Event({
    name: Events.GuildMemberAdd,
})
export default class GuildMemberAddEvent extends BaseEvent<Events.GuildMemberAdd> {
    async run(client: LeBotClient<true>, member: GuildMember) {
        await prismaClient.user.upsert({
            where: { id: member.id },
            update: {
                leftAt: null,
            },
            create: {
                id: member.id,
            }
        });
        console.log(`User ${member.user.username} added/updated in DB.`);
    }
}
