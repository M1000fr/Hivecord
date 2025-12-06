import { InteractionHelper } from "@utils/InteractionHelper";
import { Logger } from "@utils/Logger";
import {
	ChatInputCommandInteraction,
	Guild,
	type PermissionResolvable,
} from "discord.js";

const logger = new Logger("BotPermission");

export function BotPermission(...permissions: PermissionResolvable[]) {
	return function (
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		const originalMethod = descriptor.value;

		descriptor.value = async function (...args: any[]) {
			let guild: Guild | undefined;
			let interaction: ChatInputCommandInteraction | undefined;

			for (const arg of args) {
				if (arg instanceof Guild) {
					guild = arg;
				} else if (arg?.guild instanceof Guild) {
					guild = arg.guild;
					if ("reply" in arg && typeof arg.reply === "function") {
						interaction = arg as ChatInputCommandInteraction;
					}
				}
			}

			if (interaction && !guild) {
				await InteractionHelper.respondError(
					interaction,
					"This command can only be used in a server.",
				);
				return;
			}

			if (guild) {
				const me = guild.members.me;
				if (!me) {
					if (interaction) {
						await InteractionHelper.respondError(
							interaction,
							"I cannot verify my permissions.",
						);
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
						await InteractionHelper.respondError(
							interaction,
							`I am missing the following permissions to perform this action: ${formattedPermissions}`,
						);
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
