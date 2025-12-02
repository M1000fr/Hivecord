import type { CommandOptions } from "@interfaces/CommandOptions";
import { ApplicationCommandOptionType } from "discord.js";

export const securityOptions: CommandOptions = {
	name: "security",
	description: "Security module commands",
	options: [
		{
			name: "heatpoint",
			description: "Heatpoint commands",
			type: ApplicationCommandOptionType.SubcommandGroup,
			options: [
				{
					name: "user",
					description: "Get heatpoints for a user",
					type: ApplicationCommandOptionType.Subcommand,
					options: [
						{
							name: "user",
							description: "The user to check",
							type: ApplicationCommandOptionType.User,
							required: true,
						},
					],
				},
				{
					name: "reset",
					description: "Reset heatpoints",
					type: ApplicationCommandOptionType.Subcommand,
					options: [
						{
							name: "target",
							description: "What to reset",
							type: ApplicationCommandOptionType.String,
							required: true,
							choices: [
								{ name: "All Users", value: "all_users" },
								{ name: "Channel", value: "channel" },
								{ name: "Server", value: "server" },
							],
						},
						{
							name: "channel",
							description:
								"The channel to reset (if target is channel)",
							type: ApplicationCommandOptionType.Channel,
							required: false,
						},
					],
				},
			],
		},
	],
};
