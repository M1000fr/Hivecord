import { Events } from "discord.js";
import { BaseEvent } from "../../class/BaseEvent";
import { Event } from "../../decorators/Event";
import { LeBotClient } from "../../class/LeBotClient";

@Event({
    name: Events.ClientReady,
    once: true,
})
export default class ReadyEvent extends BaseEvent<Events.ClientReady> {
    async run(client: LeBotClient<true>) {
        console.log(`Logged in as ${client.user?.tag}!`);
        await client.deployCommands();
    }
}
