import { Events } from "discord.js";
import { BaseEvent } from '@class/BaseEvent';
import { Event } from '@decorators/Event';
import { LeBotClient } from '@class/LeBotClient';
import { SyncService } from '@modules/General/services/SyncService';

@Event({
    name: Events.ClientReady,
})
export default class ReadySyncEvent extends BaseEvent<Events.ClientReady> {
    async run(client: LeBotClient<true>) {
        for (const guild of client.guilds.cache.values()) {
            await SyncService.syncGuild(guild);
        }
    }
}
