import type { LeBotClient } from "@class/LeBotClient";
import { Injectable } from "@decorators/Injectable";
import { EPermission } from "@enums/EPermission";
import { PermissionService } from "@modules/Core/services/PermissionService";
import { BotStateRepository } from "@src/repositories";
import { Logger } from "@utils/Logger";
import { createHash } from "crypto";
import {
	type ApplicationCommandDataResolvable,
	type PermissionResolvable,
	PermissionsBitField,
} from "discord.js";

@Injectable()
export class CommandDeploymentService {
	private logger = new Logger("CommandDeploymentService");

	constructor(
		private readonly botStateRepository: BotStateRepository,
		private readonly permissionService: PermissionService,
	) {}

	public async deploy(client: LeBotClient<true>) {
		if (!client.token || !client.user) {
			this.logger.error("Client not logged in or token missing.");
			return;
		}

		const debugGuildId = process.env.DEBUG_DISCORD_GUILD_ID;

		const commandsData = client.commands.map((c) => {
			const options = { ...c.options } as Record<string, unknown>;
			if (options.defaultMemberPermissions) {
				options.defaultMemberPermissions = PermissionsBitField.resolve(
					options.defaultMemberPermissions as PermissionResolvable,
				).toString();
			}
			return options;
		});
		const permissions = Object.values(EPermission);

		try {
			await this.permissionService.registerPermissions(permissions);

			// Calculate hash of commands
			const hash = createHash("md5")
				.update(JSON.stringify(commandsData))
				.digest("hex");
			const dbKey = `commands_hash:${debugGuildId || "global"}`;
			const storedState = await this.botStateRepository.get(dbKey);
			const storedHash = storedState?.value;

			if (hash === storedHash) {
				this.logger.log("Commands are up to date (hash match).");
				if (debugGuildId) {
					const currentGlobalCommands =
						await client.application?.commands.fetch();
					if (
						currentGlobalCommands &&
						currentGlobalCommands.size > 0
					) {
						this.logger.log(
							"Clearing global commands (DEBUG mode)...",
						);
						await client.application?.commands.set([]);
					}
				}
				return;
			}

			if (debugGuildId) {
				this.logger.log(
					`Started refreshing ${commandsData.length} application (/) commands for DEBUG guild ${debugGuildId}.`,
				);
				const guild = await client.guilds.fetch(debugGuildId);
				await guild.commands.set(
					commandsData as unknown as ApplicationCommandDataResolvable[],
				);

				const currentGlobalCommands =
					await client.application?.commands.fetch();
				if (currentGlobalCommands && currentGlobalCommands.size > 0) {
					this.logger.log("Clearing global commands (DEBUG mode)...");
					await client.application?.commands.set([]);
				}
			} else {
				this.logger.log(
					`Started refreshing ${commandsData.length} application (/) commands GLOBALLY.`,
				);
				await client.application?.commands.set(
					commandsData as unknown as ApplicationCommandDataResolvable[],
				);

				// Clear guild-specific commands to avoid duplicates
				this.logger.log("Clearing guild-specific commands...");
				for (const guild of client.guilds.cache.values()) {
					try {
						const currentCommands = await guild.commands.fetch();

						if (currentCommands.size > 0) {
							this.logger.log(
								`Clearing commands for guild ${guild.name} (${guild.id})`,
							);
							await guild.commands.set([]);
						}
					} catch (error) {
						this.logger.error(
							`Failed to clear commands for guild ${guild.name} (${guild.id})`,
							(error as Error).stack,
						);
					}
				}
			}

			// Update hash in DB
			await this.botStateRepository.upsert(dbKey, hash);

			this.logger.log(
				`Successfully reloaded ${commandsData.length} application (/) commands.`,
			);
		} catch (error) {
			this.logger.error(error);
		}
	}
}
