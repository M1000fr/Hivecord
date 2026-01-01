import { Logger } from "@utils/Logger";
import {
	ChatInputCommandInteraction,
	Guild,
	type PermissionResolvable,
} from "discord.js";

const logger = new Logger("BotPermission");

export function BotPermission(...permissions: PermissionResolvable[]) {
	return function (
		target: unknown,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		const originalMethod = descriptor.value;

		descriptor.value = async function (...args: unknown[]) {
			let guild: Guild | undefined;
			let interaction: ChatInputCommandInteraction | undefined;

			for (const arg of args) {
				if (arg instanceof Guild) {
					guild = arg;
				} else if (arg && typeof arg === "object") {
					const typedArg = arg as {
						guild?: unknown;
						reply?: unknown;
					};
					if (typedArg.guild instanceof Guild) {
						guild = typedArg.guild;
						if (typeof typedArg.reply === "function") {
							interaction = arg as ChatInputCommandInteraction;
						}
					}
				}
			}

			if (interaction && !guild) {
				const payload = {
					content: "This command can only be used in a server.",
				};
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp(payload);
				} else {
					await interaction.reply(payload);
				}
				return;
			}

			if (guild) {
				const me = guild.members.me;
				if (!me) {
					if (interaction) {
						const payload = {
							content: "I cannot verify my permissions.",
						};
						if (interaction.replied || interaction.deferred) {
							await interaction.followUp(payload);
						} else {
							await interaction.reply(payload);
						}
					} else {
						logger.warn(
							`Cannot verify permissions in guild ${guild.id} (me is missing)`,
						);
					}
					return;
				}

				const missingPermissions = me.permissions.missing(permissions);

				if (missingPermissions.length > 0) {
					const formattedPermissions = missingPermissions
						.map((p) => `\`${p}\``)
						.join(", ");

					if (interaction) {
						const payload = {
							content: `I am missing the following permissions to perform this action: ${formattedPermissions}`,
						};
						if (interaction.replied || interaction.deferred) {
							await interaction.followUp(payload);
						} else {
							await interaction.reply(payload);
						}
					} else {
						logger.warn(
							`Missing permissions in guild ${guild.name} (${guild.id}) for method ${propertyKey}: ${formattedPermissions}`,
						);
					}
					return;
				}
			}

			return originalMethod.apply(this, args);
		};

		return descriptor;
	};
}
