import { Client } from "discord.js";
import { prismaClient } from "../services/prismaService";
import { SanctionType } from "../prisma/client/enums";
import { ConfigService } from "../services/ConfigService";

export class SanctionScheduler {
    private client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    public start() {
        // Check every 10 seconds
        setInterval(() => this.checkExpiredSanctions(), 10 * 1000);
        // Check every 60 seconds
        setInterval(() => this.checkMuteConsistency(), 60 * 1000);
        console.log("SanctionScheduler started.");
    }

    private async checkMuteConsistency() {
        const guildId = process.env.DISCORD_GUILD_ID;
        if (!guildId) return;

        const guild = await this.client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return;

        const muteRoleId = await ConfigService.get("mute_role_id");
        if (!muteRoleId) return;

        const muteRole = guild.roles.cache.get(muteRoleId);
        if (!muteRole) return;

        // Fetch active mutes
        const activeMutes = await prismaClient.sanction.findMany({
            where: {
                type: SanctionType.MUTE,
                active: true
            },
            select: {
                userId: true
            }
        });

        const activeMuteUserIds = new Set(activeMutes.map(s => s.userId));

        for (const [memberId, member] of muteRole.members) {
            if (!activeMuteUserIds.has(memberId)) {
                try {
                    await member.roles.remove(muteRole, "Sanction consistency check: No active mute found");
                } catch (error) {
                    console.error(`Error removing mute role from ${memberId} during consistency check:`, error);
                }
            }
        }
    }

    private async checkExpiredSanctions() {
        const now = new Date();
        const guildId = process.env.DISCORD_GUILD_ID;

        if (!guildId) {
            console.error("DISCORD_GUILD_ID is not defined in environment variables.");
            return;
        }

        // Fetch active sanctions that have expired
        const expiredSanctions = await prismaClient.sanction.findMany({
            where: {
                active: true,
                expiresAt: {
                    lte: now
                }
            }
        });

        for (const sanction of expiredSanctions) {
            try {
                const guild = await this.client.guilds.fetch(guildId);
                if (!guild) continue;

                if (sanction.type === SanctionType.MUTE) {
                    const muteRoleId = await ConfigService.get("mute_role_id");
                    if (muteRoleId) {
                        const member = await guild.members.fetch(sanction.userId).catch(() => null);
                        
                        // If member is still in guild, remove role
                        if (member) {
                            const muteRole = guild.roles.cache.get(muteRoleId);
                            if (muteRole && member.roles.cache.has(muteRoleId)) {
                                await member.roles.remove(muteRole, "TempMute expired");
                            }
                        }
                    }
                } else if (sanction.type === SanctionType.BAN) {
                    await guild.members.unban(sanction.userId, "Ban expired").catch(() => {});
                }

                // Mark sanction as inactive
                await prismaClient.sanction.update({
                    where: { id: sanction.id },
                    data: { active: false }
                });

            } catch (error) {
                console.error(`Error processing expired sanction ${sanction.id}:`, error);
            }
        }
    }
}
