import { Events, GuildMember } from "discord.js";
import { BaseEvent } from "../../class/BaseEvent";
import { Event } from "../../decorators/Event";
import { LeBotClient } from "../../class/LeBotClient";
import { ConfigService } from "../../services/ConfigService";
import { ERoleConfigKey } from "../../enums/EConfigKey";
import { Logger } from "../../utils/Logger";

@Event({
	name: Events.GuildMemberAdd,
})
export default class AutoRoleEvent extends BaseEvent<Events.GuildMemberAdd> {
	private logger = new Logger("AutoRoleEvent");

	async run(client: LeBotClient<true>, member: GuildMember) {
		try {
			const roleIds = await ConfigService.getRoles(
				ERoleConfigKey.NewMemberRoles,
			);

			if (roleIds.length > 0) {
				await member.roles.add(roleIds);
				this.logger.log(
					`Added auto roles to ${member.user.tag}: ${roleIds.join(", ")}`,
				);
			}
		} catch (error) {
			this.logger.error(
				`Failed to add auto roles to ${member.user.tag}:`,
				(error as Error)?.stack || String(error),
			);
		}
	}
}
