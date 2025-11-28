import { Guild, ChannelType as DiscordChannelType } from "discord.js";
import { prismaClient } from "./prismaService";
import { Logger } from "../utils/Logger";
import { ChannelType } from "../prisma/client/enums";

export class SyncService {
    private static logger = new Logger('SyncService');

    static async syncGuild(guild: Guild) {
        this.logger.log(`Syncing guild ${guild.name}...`);
        await this.syncRoles(guild);
        await this.syncMembers(guild);
        await this.syncChannels(guild);
        this.logger.log(`Guild ${guild.name} synced.`);
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

    static async syncChannels(guild: Guild) {
        const channels = await guild.channels.fetch();

        for (const [id, channel] of channels) {
            if (!channel) continue;
            
            let type: ChannelType;
            if (channel.type === DiscordChannelType.GuildText) {
                type = ChannelType.TEXT;
            } else if (channel.type === DiscordChannelType.GuildVoice) {
                type = ChannelType.VOICE;
            } else if (channel.type === DiscordChannelType.GuildCategory) {
                type = ChannelType.CATEGORY;
            } else {
                // Skip other channel types for now or map them to a default if needed
                continue; 
            }

            await prismaClient.channel.upsert({
                where: { id },
                update: { type },
                create: { id, type }
            });
        }
    }
}
