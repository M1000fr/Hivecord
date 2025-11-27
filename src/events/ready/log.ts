import { Events } from "discord.js";
import { BaseEvent } from "../../class/BaseEvent";
import { Event } from "../../decorators/Event";
import { LeBotClient } from "../../class/LeBotClient";
import { SyncService } from "../../services/SyncService";

@Event({
    name: Events.ClientReady,
    once: true,
})
export default class ReadyEvent extends BaseEvent<Events.ClientReady> {
    async run(client: LeBotClient<true>) {
        console.log(`Logged in as ${client.user?.tag}!`);
        await client.deployCommands();

        const guildId = process.env.DISCORD_GUILD_ID;
        if (guildId) {
            const guild = await client.guilds.fetch(guildId);
            if (guild) {
                await SyncService.syncGuild(guild);
            }
        }
    }
}
