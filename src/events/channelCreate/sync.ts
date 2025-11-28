import { Events, GuildChannel, ChannelType as DiscordChannelType } from "discord.js";
import { BaseEvent } from "../../class/BaseEvent";
import { Event } from "../../decorators/Event";
import { LeBotClient } from "../../class/LeBotClient";
import { prismaClient } from "../../services/prismaService";
import { ChannelType } from "../../prisma/client/enums";

@Event({
    name: Events.ChannelCreate,
})
export default class ChannelCreateSync extends BaseEvent<Events.ChannelCreate> {
    async run(client: LeBotClient<true>, channel: GuildChannel) {
        if (!channel.guild) return;

        let type: ChannelType;
        if (channel.type === DiscordChannelType.GuildText) {
            type = ChannelType.TEXT;
        } else if (channel.type === DiscordChannelType.GuildVoice) {
            type = ChannelType.VOICE;
        } else if (channel.type === DiscordChannelType.GuildCategory) {
            type = ChannelType.CATEGORY;
        } else {
            return;
        }

        await prismaClient.channel.create({
            data: {
                id: channel.id,
                type: type,
            },
        });
    }
}
