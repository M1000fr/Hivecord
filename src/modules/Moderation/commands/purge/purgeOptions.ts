import { ApplicationCommandType } from "discord.js";
import type { CommandOptions } from "../../../../interfaces/CommandOptions";

export const purgeOptions: CommandOptions = {
	name: "purge",
	description: "Nuke and recreate the current channel",
};
