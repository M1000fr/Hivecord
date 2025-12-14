import { ModerationConfigKeys } from "@modules/Moderation/ModerationConfig";
import { SanctionType } from "@prisma/client/client";
import { ConfigService } from "@services/ConfigService";
import { prismaClient } from "@services/prismaService";
import { Logger } from "@utils/Logger";
import { Client } from "discord.js";

const CHECK_EXPIRED_INTERVAL = 10 * 1000; // 10 seconds
const CHECK_MUTE_CONSISTENCY_INTERVAL = 10 * 1000; // 10 seconds

export class SanctionScheduler {
	private client: Client;
	private logger = new Logger("SanctionScheduler");

	constructor(client: Client) {
		this.client = client;
	}

	public start() {
		setInterval(() => this.checkExpiredSanctions(), CHECK_EXPIRED_INTERVAL);
		setInterval(
			() => this.checkMuteConsistency(),
			CHECK_MUTE_CONSISTENCY_INTERVAL,
		);
		this.logger.log("SanctionScheduler started.");
	}

	private async checkMuteConsistency() {
		for (const guild of this.client.guilds.cache.values()) {
			const muteRoleId = await ConfigService.getRole(
				guild.id,
				ModerationConfigKeys.muteRoleId,
			);
			if (!muteRoleId) continue;

			const muteRole = guild.roles.cache.get(muteRoleId);
			if (!muteRole) continue;

			// Fetch active mutes for this guild
			const activeMutes = await prismaClient.sanction.findMany({
				where: {
					guildId: guild.id,
					type: SanctionType.MUTE,
					active: true,
				},
				select: {
					userId: true,
				},
			});

			const activeMuteUserIds = new Set(activeMutes.map((s) => s.userId));

			// 1. Remove role if no active sanction
			for (const [memberId, member] of muteRole.members) {
				if (!activeMuteUserIds.has(memberId)) {
					try {
						try {
							await member.send(
								`You have been \`unmuted\` in \`${guild.name}\`.`,
							);
						} catch {
							// Could not send DM
						}
						await member.roles.remove(
							muteRole,
							"Sanction consistency check: No active mute found",
						);
					} catch (error: unknown) {
						this.logger.error(
							`Error removing mute role from ${memberId} during consistency check in guild ${guild.name}:`,
							error instanceof Error
								? error.stack
								: String(error),
						);
					}
				}
			}

			// 2. Add role if active sanction but no role
			for (const userId of activeMuteUserIds) {
				if (!muteRole.members.has(userId)) {
					try {
						let member = guild.members.cache.get(userId);
						if (!member) {
							member = await guild.members
								.fetch(userId)
								.catch(() => undefined);
						}

						if (member) {
							await member.roles.add(
								muteRole,
								"Sanction consistency check: Active mute found",
							);
							this.logger.log(
								`Re-applied mute role to ${member.user.tag} (${member.id}) during consistency check.`,
							);
						}
					} catch (error) {
						this.logger.error(
							`Error applying mute role to ${userId} during consistency check in guild ${guild.name}:`,
							error instanceof Error
								? error.stack
								: String(error),
						);
					}
				}
			}
		}
	}

	private async checkExpiredSanctions() {
		const now = new Date();

		// Fetch active sanctions that have expired
		const expiredSanctions = await prismaClient.sanction.findMany({
			where: {
				active: true,
				expiresAt: {
					lte: now,
				},
			},
		});

		for (const sanction of expiredSanctions) {
			try {
				const guild = await this.client.guilds
					.fetch(sanction.guildId)
					.catch(() => null);
				if (!guild) {
					// Guild not found, maybe bot left?
					// Deactivate sanction
					await prismaClient.sanction.update({
						where: { id: sanction.id },
						data: { active: false },
					});
					continue;
				}

				let member = guild.members.cache.get(sanction.userId);
				if (!member) {
					member = await guild.members
						.fetch(sanction.userId)
						.catch(() => undefined);
				}

				if (sanction.type === SanctionType.MUTE) {
					const muteRoleId = await ConfigService.getRole(
						guild.id,
						ModerationConfigKeys.muteRoleId,
					);
					if (muteRoleId && member) {
						await member.roles.remove(muteRoleId, "Mute expired");
						try {
							await member.send(
								`Your mute in \`${guild.name}\` has expired.`,
							);
						} catch {
							// Ignore
						}
					}
				} else if (sanction.type === SanctionType.BAN) {
					// Unban? Usually bans are permanent unless specified.
					// If it has expiresAt, it's a tempban.
					await guild.members.unban(sanction.userId, "Ban expired");
				}

				await prismaClient.sanction.update({
					where: { id: sanction.id },
					data: { active: false },
				});

				this.logger.log(
					`Sanction ${sanction.id} expired for user ${sanction.userId} in guild ${guild.name}`,
				);
			} catch (error: unknown) {
				this.logger.error(
					`Error processing expired sanction ${sanction.id}:`,
					error instanceof Error ? error.stack : String(error),
				);
			}
		}
	}
}
