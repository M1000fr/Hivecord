import type { CommandOptions } from "@interfaces/CommandOptions";
import { InteractionContextType } from "discord.js";

export const pingOptions: CommandOptions = {
	name: "ping",
	description: "Replies with Pong!",
	contexts: [InteractionContextType.Guild],
};
