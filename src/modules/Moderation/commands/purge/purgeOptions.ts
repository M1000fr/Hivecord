import type { CommandOptions } from "@interfaces/CommandOptions";
import { InteractionContextType } from "discord.js";

export const purgeOptions: CommandOptions = {
	name: "purge",
	description: "Nuke and recreate the current channel",
	contexts: [InteractionContextType.Guild],
};
