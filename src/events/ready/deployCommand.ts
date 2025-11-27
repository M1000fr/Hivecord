import { Events } from "discord.js";
import { EventBuilder } from "../../class/EventBuilder";

export default new EventBuilder(Events.ClientReady)
	.setOnce(true)
	.setHandler(async (client) => {
		await client.deployCommands();
	});
