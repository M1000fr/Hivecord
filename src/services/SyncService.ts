import { Guild } from "discord.js";
import { prismaClient } from "./prismaService";

export class SyncService {
    static async syncGuild(guild: Guild) {
        console.log(`Syncing guild ${guild.name}...`);
        await this.syncRoles(guild);
        await this.syncMembers(guild);
        console.log(`Guild ${guild.name} synced.`);
    }

    static async syncRoles(guild: Guild) {
        const roles = await guild.roles.fetch();
        
        for (const [id, role] of roles) {
            await prismaClient.role.upsert({
                where: { id },
                update: { 
                    deletedAt: null 
                },
                create: {
                    id,
                }
            });
        }
    }

    static async syncMembers(guild: Guild) {
        const members = await guild.members.fetch();
        
        for (const [id, member] of members) {
            await prismaClient.user.upsert({
                where: { id },
                update: { 
                    leftAt: null
                },
                create: {
                    id,
                }
            });
        }
    }
}
