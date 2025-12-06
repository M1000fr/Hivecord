import { LeBotClient } from "@class/LeBotClient";
import { ConfigService } from "@services/ConfigService";
import { RedisService } from "@services/RedisService";
import { Logger } from "@utils/Logger";
import { Guild } from "discord.js";
import { GeneralConfigKeys } from "../GeneralConfig";
import { WelcomeRoleService } from "./WelcomeRoleService";

interface SyncState {
	isRunning: boolean;
	lastMemberId: string | null;
}

export class WelcomeRoleSyncService {
	private static logger = new Logger("WelcomeRoleSyncService");
	private static readonly REDIS_KEY = "bot:welcome_sync:state";
	private static readonly BATCH_SIZE = 50;

	static async getState(guildId: string): Promise<SyncState> {
		const redis = RedisService.getInstance();
		const state = await redis.get(`${this.REDIS_KEY}:${guildId}`);
		return state
			? JSON.parse(state)
			: { isRunning: false, lastMemberId: null };
	}

	static async setState(guildId: string, state: SyncState) {
		const redis = RedisService.getInstance();
		await redis.set(`${this.REDIS_KEY}:${guildId}`, JSON.stringify(state));
	}

	static async start(guild: Guild) {
		const state = await this.getState(guild.id);
		if (state.isRunning) {
			this.logger.warn(`Sync already running for guild ${guild.id}.`);
			return;
		}

		await this.setState(guild.id, {
			isRunning: true,
			lastMemberId: null,
		});
		this.process(guild);
	}

	static async resume(client: LeBotClient<true>) {
		// Check all guilds for running state
		const guilds = client.guilds.cache;
		for (const guild of guilds.values()) {
			const state = await this.getState(guild.id);
			if (state.isRunning) {
				this.logger.log(
					`Resuming welcome role sync for guild ${guild.name}...`,
				);
				this.process(guild);
			}
		}
	}

	static async stop(guildId: string) {
		const state = await this.getState(guildId);
		await this.setState(guildId, { ...state, isRunning: false });
		this.logger.log(`Welcome role sync stopped for guild ${guildId}.`);
	}

	private static async process(guild: Guild) {
		try {
			let state = await this.getState(guild.id);
			if (!state.isRunning) return;

			await this.processGuild(guild);

			await this.setState(guild.id, {
				isRunning: false,
				lastMemberId: null,
			});
			this.logger.log(
				`Welcome role sync completed for guild ${guild.name}.`,
			);
		} catch (error) {
			this.logger.error(
				`Error in welcome role sync process for guild ${guild.name}:`,
				error as any,
			);
		}
	}

	private static async processGuild(guild: Guild) {
		this.logger.log(`Processing guild ${guild.name} (${guild.id})...`);

		const roleIds = await ConfigService.getRoles(
			guild.id,
			GeneralConfigKeys.welcomeRoles,
		);
		if (!roleIds || roleIds.length === 0) {
			return;
		}

		// Filter roles that exist in this guild
		const guildRoleIds = roleIds.filter((roleId) =>
			guild.roles.cache.has(roleId),
		);
		if (guildRoleIds.length === 0) return;

		let lastMemberId =
			(await this.getState(guild.id)).lastMemberId || undefined;

		try {
			// Fetch all members (no pagination supported in fetch for all members)
			const members = await guild.members.fetch();

			let skip = !!lastMemberId;

			for (const member of members.values()) {
				const state = await this.getState(guild.id);
				if (!state.isRunning) return;

				if (skip) {
					if (member.id === lastMemberId) {
						skip = false;
					}
					continue;
				}

				if (member.user.bot) continue;

				// Check if member is missing any role
				const missingRoles = guildRoleIds.filter(
					(roleId) => !member.roles.cache.has(roleId),
				);

				if (missingRoles.length > 0) {
					await WelcomeRoleService.addWelcomeRoles(member);
					// Small delay to prevent rate limits even with the service queue
					await new Promise((resolve) => setTimeout(resolve, 200));
				}

				await this.setState(guild.id, {
					...state,
					lastMemberId: member.id,
				});
			}
		} catch (error) {
			this.logger.error(
				`Error processing guild ${guild.name}:`,
				error as any,
			);
		}
	}
}
