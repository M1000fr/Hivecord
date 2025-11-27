import { Events, GuildMember, PartialGuildMember } from "discord.js";
import { BaseEvent } from "../../class/BaseEvent";
import { Event } from "../../decorators/Event";
import { LeBotClient } from "../../class/LeBotClient";
import { prismaClient } from "../../services/prismaService";

@Event({
    name: Events.GuildMemberRemove,
})
export default class GuildMemberRemoveEvent extends BaseEvent<Events.GuildMemberRemove> {
    async run(client: LeBotClient<true>, member: GuildMember | PartialGuildMember) {
        try {
            await prismaClient.user.update({
                where: { id: member.id },
                data: {
                    leftAt: new Date(),
                }
            });
            console.log(`User ${member.user?.username || member.id} marked as left in DB.`);
        } catch (error) {
            console.error(`Failed to mark user ${member.id} as left:`, error);
        }
    }
}
