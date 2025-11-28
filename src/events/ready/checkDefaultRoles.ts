import { Events } from "discord.js";
import { BaseEvent } from "../../class/BaseEvent";
import { Event } from "../../decorators/Event";
import { LeBotClient } from "../../class/LeBotClient";
import { ConfigService } from "../../services/ConfigService";
import { ERoleConfigKey } from "../../enums/EConfigKey";
import { Logger } from "../../utils/Logger";

@Event({
	name: Events.ClientReady,
	once: true,
})
export default class CheckDefaultRolesEvent extends BaseEvent<Events.ClientReady> {
	private logger = new Logger("CheckDefaultRoles");

	async run(client: LeBotClient<true>) {
		const guildId = process.env.DISCORD_GUILD_ID;
		if (!guildId) return;

		const guild = client.guilds.cache.get(guildId);
		if (!guild) return;

		this.logger.log("Checking default roles for all members...");

		const defaultRoleIds = await ConfigService.getRoles(ERoleConfigKey.NewMemberRoles);
		if (defaultRoleIds.length === 0) {
			this.logger.log("No default roles configured.");
			return;
		}

		try {
			const members = await guild.members.fetch();
			let updatedCount = 0;

			for (const [_, member] of members) {
				if (member.user.bot) continue;

				const rolesToAdd = defaultRoleIds.filter(roleId => !member.roles.cache.has(roleId));
				
				if (rolesToAdd.length > 0) {
					try {
						await member.roles.add(rolesToAdd);
						updatedCount++;
					} catch (error) {
						this.logger.error(
							`Failed to add roles to ${member.user.tag}`,
							(error as Error)?.stack || String(error),
						);
					}
				}
			}

			if (updatedCount > 0) {
				this.logger.log(`Added default roles to ${updatedCount} members.`);
			} else {
				this.logger.log("All members already have default roles.");
			}
		} catch (error) {
			this.logger.error(
				"Error fetching members or assigning roles",
				(error as Error)?.stack || String(error),
			);
		}
	}
}
