import { Events, GuildChannel, ChannelType as DiscordChannelType } from "discord.js";
import { BaseEvent } from "../../class/BaseEvent";
import { Event } from "../../decorators/Event";
import { LeBotClient } from "../../class/LeBotClient";
import { prismaClient } from "../../services/prismaService";
import { ChannelType } from "../../prisma/client/enums";

@Event({
    name: Events.ChannelUpdate,
})
export default class ChannelUpdateSync extends BaseEvent<Events.ChannelUpdate> {
    async run(client: LeBotClient<true>, oldChannel: GuildChannel, newChannel: GuildChannel) {
        if (!newChannel.guild) return;

        let type: ChannelType;
        if (newChannel.type === DiscordChannelType.GuildText) {
            type = ChannelType.TEXT;
        } else if (newChannel.type === DiscordChannelType.GuildVoice) {
            type = ChannelType.VOICE;
        } else if (newChannel.type === DiscordChannelType.GuildCategory) {
            type = ChannelType.CATEGORY;
        } else {
            return;
        }

        await prismaClient.channel.upsert({
            where: { id: newChannel.id },
            update: { type: type },
            create: {
                id: newChannel.id,
                type: type,
            },
        });
    }
}
