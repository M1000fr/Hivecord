import { UserCommand } from "@decorators/UserCommand";
import { Context } from "@decorators/params/Context";
import { TargetUser } from "@decorators/params/TargetUser";
import type { UserCommandContext } from "@src/types/UserCommandContext";
import { EmbedBuilder, User } from "discord.js";

@UserCommand({ name: "Get Avatar" })
export class GetAvatarCommand {
	async execute(
		@Context() [interaction]: UserCommandContext,
		@TargetUser() user: User,
	) {
		return interaction.reply({
			embeds: [
				new EmbedBuilder().setTitle(`Avatar ${user.username}`).setImage(
					user.displayAvatarURL({
						size: 4096,
						forceStatic: false,
					}),
				),
			],
		});
	}
}
