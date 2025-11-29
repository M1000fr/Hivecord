import { Events, GuildMember, type PartialGuildMember } from "discord.js";
import { BaseEvent } from '@class/BaseEvent';
import { Event } from '@decorators/Event';
import { LogService } from "@services/LogService";
import { LeBotClient } from "@class/LeBotClient";

@Event({
    name: Events.GuildMemberRemove,
})
export default class GuildMemberRemoveEvent extends BaseEvent<Events.GuildMemberRemove> {
    async run(client: LeBotClient<true>, member: GuildMember | PartialGuildMember) {
        await LogService.logMemberLeave(member);
    }
}
