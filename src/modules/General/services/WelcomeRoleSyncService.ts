import { LeBotClient } from "@class/LeBotClient";
import { ConfigService } from "@services/ConfigService";
import { RedisService } from "@services/RedisService";
import { Logger } from "@utils/Logger";
import { Guild } from "discord.js";
import { GeneralConfigKeys } from "../GeneralConfig";
import { WelcomeRoleService } from "./WelcomeRoleService";

interface SyncState {
	isRunning: boolean;
	currentGuildId: string | null;
	lastMemberId: string | null;
}

export class WelcomeRoleSyncService {
	private static logger = new Logger("WelcomeRoleSyncService");
	private static readonly REDIS_KEY = "bot:welcome_sync:state";
	private static readonly BATCH_SIZE = 50;

	static async getState(): Promise<SyncState> {
		const redis = RedisService.getInstance();
		const state = await redis.get(this.REDIS_KEY);
		return state
			? JSON.parse(state)
			: { isRunning: false, currentGuildId: null, lastMemberId: null };
	}

	static async setState(state: SyncState) {
		const redis = RedisService.getInstance();
		await redis.set(this.REDIS_KEY, JSON.stringify(state));
	}

	static async start(client: LeBotClient<true>) {
		const state = await this.getState();
		if (state.isRunning) {
			this.logger.warn("Sync already running.");
			return;
		}

		await this.setState({
			isRunning: true,
			currentGuildId: null,
			lastMemberId: null,
		});
		this.process(client);
	}

	static async resume(client: LeBotClient<true>) {
		const state = await this.getState();
		if (state.isRunning) {
			this.logger.log("Resuming welcome role sync...");
			this.process(client);
		}
	}

	static async stop() {
		const state = await this.getState();
		await this.setState({ ...state, isRunning: false });
		this.logger.log("Welcome role sync stopped.");
	}

	private static async process(client: LeBotClient<true>) {
		try {
			let state = await this.getState();
			if (!state.isRunning) return;

			const guilds = client.guilds.cache;
			const guildIds = Array.from(guilds.keys());

			// Determine start index
			let startIndex = 0;
			if (state.currentGuildId) {
				startIndex = guildIds.indexOf(state.currentGuildId);
				if (startIndex === -1) startIndex = 0; // Guild left? Start over or next?
			}

			for (let i = startIndex; i < guildIds.length; i++) {
				state = await this.getState();
				if (!state.isRunning) break;

				const guildId = guildIds[i];
				if (!guildId) continue;

				const guild = guilds.get(guildId);
				if (!guild) continue;

				await this.setState({
					...state,
					currentGuildId: guildId,
					// If we are resuming the same guild, keep lastMemberId, else reset it
					lastMemberId:
						guildId === state.currentGuildId
							? state.lastMemberId
							: null,
				});

				await this.processGuild(guild);
			}

			// Finished
			await this.setState({
				isRunning: false,
				currentGuildId: null,
				lastMemberId: null,
			});
			this.logger.log("Welcome role sync completed.");
		} catch (error) {
			this.logger.error(
				"Error in welcome role sync process:",
				error as any,
			);
			// Don't reset state, so we can resume later/on restart
		}
	}

	private static async processGuild(guild: Guild) {
		this.logger.log(`Processing guild ${guild.name} (${guild.id})...`);

		const roleIds = await ConfigService.getRoles(
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

		let lastMemberId = (await this.getState()).lastMemberId || undefined;

		try {
			// Fetch all members (no pagination supported in fetch for all members)
			const members = await guild.members.fetch();

			let skip = !!lastMemberId;

			for (const member of members.values()) {
				const state = await this.getState();
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

				// Update state periodically or after each member?
				// Updating after each member is safe but slow on Redis.
				// Let's update every 10 members or so, or just keep it simple.
				// For robustness, let's update every member for now, or maybe every 10.
				// Given the delay of 200ms, Redis write is negligible.
				await this.setState({
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
