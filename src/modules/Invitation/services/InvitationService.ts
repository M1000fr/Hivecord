import type { LeBotClient } from "@class/LeBotClient";
import { BotPermission } from "@decorators/BotPermission";
import { Service } from "@decorators/Service";
import { StatsWriter } from "@modules/Statistics/services/StatsWriter";
import { EntityService } from "@services/EntityService";
import { prismaClient } from "@services/prismaService";
import { RedisService } from "@services/RedisService";
import { Logger } from "@utils/Logger";
import { Guild, Invite, PermissionsBitField } from "discord.js";

@Service()
export class InvitationService {
	private static logger = new Logger("InvitationService");
	private static redis = RedisService.getInstance();

	/**
	 * Syncs all invites from a guild to Redis.
	 */
	@BotPermission(PermissionsBitField.Flags.ManageGuild)
	public static async syncInvites(guild: Guild): Promise<void> {
		try {
			const invites = await guild.invites.fetch();
			const pipeline = this.redis.pipeline();

			// Clear existing cache for this guild to avoid stale data
			pipeline.del(`invites:${guild.id}`);
			// We don't clear invite_owners to keep history for deleted invites if needed,
			// or we should clear it? If we clear it, we lose owner info for deleted invites.
			// But we only need owner info for currently active invites to track them.
			// Actually, for the "deleted invite" logic to work, we need the owner info to persist
			// slightly longer than the invite itself if we rely on Redis.
			// But syncInvites is called frequently.
			// Let's NOT clear invite_owners, but maybe use hset to update/add.
			// Over time this hash might grow with stale codes.
			// A better approach is to set it fresh but maybe keep old ones?
			// For simplicity, let's just set the new ones. If an invite is deleted,
			// we hope we captured the owner ID before deletion or we have it in the "deleted" logic?
			// Wait, if we delete `invites:${guild.id}`, we lose the uses count.
			// If we delete `invite_owners:${guild.id}`, we lose the owner.

			// If we want to support "deleted invite" detection, we need the owner ID to be available
			// even after the invite is gone from Discord list.
			// So we should probably NOT delete `invite_owners` blindly.
			// But if we don't delete, it grows forever.
			// Maybe we can rely on the fact that we sync often.

			invites.forEach((invite) => {
				if (invite.code) {
					pipeline.hset(
						`invites:${guild.id}`,
						invite.code,
						invite.uses || 0,
					);
					if (invite.inviter) {
						pipeline.hset(
							`invite_owners:${guild.id}`,
							invite.code,
							invite.inviter.id,
						);
					}
				}
			});

			await pipeline.exec();
		} catch (error) {
			this.logger.error(
				`Failed to sync invites for guild ${guild.id}`,
				(error as Error).stack,
			);
		}
	}

	/**
	 * Handles an invite deletion by caching it temporarily and then syncing.
	 */
	public static async handleInviteDelete(
		guild: Guild,
		code: string,
	): Promise<void> {
		try {
			// Cache the deleted invite code for a short duration (e.g., 10 seconds)
			// This allows findUsedInvite to detect it if the deletion happened before the join event processing
			await this.redis.setex(
				`deleted_invite:${guild.id}:${code}`,
				10,
				"1",
			);

			await this.syncInvites(guild);
		} catch (error) {
			this.logger.error(
				`Failed to handle invite delete for guild ${guild.id}`,
				(error as Error).stack,
			);
		}
	}

	/**
	 * Finds the invite that was used by comparing current invites with Redis cache.
	 */
	public static async findUsedInvite(
		guild: Guild,
		shouldUpdateCache = true,
	): Promise<Invite | null> {
		try {
			const currentInvites = await guild.invites.fetch();
			const cachedInvites = await this.redis.hgetall(
				`invites:${guild.id}`,
			);

			let usedInvite: Invite | null = null;

			// 1. Check for incremented uses
			for (const [code, invite] of currentInvites) {
				const cachedUses = parseInt(cachedInvites[code] || "0", 10);
				if (invite.uses && invite.uses > cachedUses) {
					usedInvite = invite;
					break;
				}
			}

			// If we found the used invite, update the cache immediately
			if (usedInvite) {
				if (shouldUpdateCache) {
					await this.redis.hset(
						`invites:${guild.id}`,
						usedInvite.code,
						usedInvite.uses || 0,
					);
				}
			} else {
				// 2. Check for missing codes (Invite deleted AFTER GuildMemberAdd started but BEFORE InviteDelete synced, OR InviteDelete hasn't run yet)
				const currentCodes = new Set(currentInvites.keys());
				const missingCodes = Object.keys(cachedInvites).filter(
					(code) => !currentCodes.has(code),
				);

				// 3. Check for recently deleted codes (InviteDelete ran BEFORE GuildMemberAdd)
				const deletedKeys = await this.redis.keys(
					`deleted_invite:${guild.id}:*`,
				);
				const recentlyDeletedCodes = deletedKeys.map(
					(key) => key.split(":").pop() as string,
				);

				// Combine candidates
				const candidates = new Set([
					...missingCodes,
					...recentlyDeletedCodes,
				]);

				if (candidates.size === 1) {
					const code = [...candidates][0];
					this.logger.log(
						`Identified single-use/deleted invite: ${code}`,
					);

					// Construct a partial invite object since we can't fetch it
					// We try to find who created it from our DB if possible, or just return a mock
					// Since we need to return an Invite object, we might need to fetch the inviter from DB if we tracked invite creation.
					// But we don't track invite creation in DB yet (only in Redis uses).
					// However, the caller (GuildMemberAdd) expects an Invite to get the inviter.
					// If we can't get the inviter, we can't attribute it.

					// Ideally we should have stored the inviter ID in Redis too.
					// Let's update syncInvites to store inviter ID.

					// For now, let's see if we can retrieve inviter from Redis if we store it.
					const inviterId = code
						? await this.redis.hget(
								`invite_owners:${guild.id}`,
								code,
							)
						: null;

					if (inviterId) {
						let inviterUser =
							guild.client.users.cache.get(inviterId);
						if (!inviterUser) {
							try {
								inviterUser =
									await guild.client.users.fetch(inviterId);
							} catch (error) {
								this.logger.error(
									`Failed to fetch inviter ${inviterId}`,
									(error as Error).stack,
								);
							}
						}

						// Mock an Invite object
						usedInvite = {
							code,
							guild,
							inviter: inviterUser || {
								id: inviterId,
								tag: "Unknown User",
							},
							uses: 1,
						} as unknown as Invite;
					}
				}
			}

			// Re-sync to be safe
			if (shouldUpdateCache) {
				await this.syncInvites(guild);
			}

			return usedInvite;
		} catch (error) {
			this.logger.error(
				`Failed to find used invite for guild ${guild.id}`,
				(error as Error).stack,
			);
			return null;
		}
	}

	/**
	 * Records a new invitation in the database.
	 */
	public static async addInvitation(
		guild: Guild,
		inviterId: string,
		invitedId: string,
		code: string,
	): Promise<void> {
		try {
			await EntityService.ensureGuild(guild);
			const guildId = guild.id;
			await EntityService.ensureUserById(inviterId);
			await EntityService.ensureUserById(invitedId);

			// Deactivate any previous active invitations for this user in this guild
			await prismaClient.invitation.updateMany({
				where: { invitedId, guildId, active: true },
				data: { active: false },
			});

			await prismaClient.invitation.create({
				data: {
					guildId,
					inviterId,
					invitedId,
					code,
					active: true,
				},
			});

			await StatsWriter.incrementInviteCount(
				guild.client as LeBotClient,
				inviterId,
				guildId,
			);
		} catch (error) {
			this.logger.error(
				`Failed to add invitation for ${invitedId}`,
				(error as Error).stack,
			);
		}
	}

	/**
	 * Marks an invitation as inactive (user left).
	 */
	public static async removeInvitation(
		guildId: string,
		invitedId: string,
	): Promise<void> {
		try {
			const invitation = await prismaClient.invitation.findFirst({
				where: {
					guildId,
					invitedId,
					active: true,
				},
			});

			if (invitation) {
				await prismaClient.invitation.update({
					where: { id: invitation.id },
					data: { active: false },
				});
			}
		} catch (error) {
			this.logger.error(
				`Failed to remove invitation for ${invitedId}`,
				(error as Error).stack,
			);
		}
	}

	/**
	 * Retrieves the leaderboard of inviters.
	 */
	public static async getLeaderboard(
		guildId: string,
		limit = 10,
	): Promise<
		{
			inviterId: string;
			active: number;
			total: number;
		}[]
	> {
		try {
			const result = await prismaClient.$queryRaw<
				{
					inviterId: string;
					active: bigint;
					total: bigint;
				}[]
			>`
                SELECT 
                    inviterId, 
                    COUNT(*) as total, 
                    SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active 
                FROM Invitation 
				WHERE guildId = ${guildId}
                GROUP BY inviterId 
                ORDER BY active DESC 
                LIMIT ${limit}
            `;

			return result.map((row) => ({
				inviterId: row.inviterId,
				active: Number(row.active),
				total: Number(row.total),
			}));
		} catch (error) {
			this.logger.error(
				"Failed to get leaderboard",
				(error as Error).stack,
			);
			return [];
		}
	}

	public static async getInviteCounts(
		guildId: string,
		userId: string,
	): Promise<{
		active: number;
		fake: number;
		total: number;
	}> {
		const allInvites = await prismaClient.invitation.findMany({
			where: { inviterId: userId, guildId },
			select: { invitedId: true, active: true },
		});

		const activeSet = new Set<string>();
		const inactiveSet = new Set<string>();

		for (const inv of allInvites) {
			if (inv.active) {
				activeSet.add(inv.invitedId);
			} else {
				inactiveSet.add(inv.invitedId);
			}
		}

		let fakeCount = 0;
		for (const id of inactiveSet) {
			if (!activeSet.has(id)) {
				fakeCount++;
			}
		}

		return {
			active: activeSet.size,
			fake: fakeCount,
			total: allInvites.length,
		};
	}
}
