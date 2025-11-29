import { RedisService } from "@services/RedisService";
import { ConfigService } from "@services/ConfigService";
import { SecurityConfigKeys } from "@modules/Security/SecurityConfig";
import { Guild, GuildChannel, User, PermissionsBitField, TextChannel, ChannelType, CategoryChannel, VoiceChannel } from "discord.js";
import { Logger } from "@utils/Logger";
import { SanctionService } from "@services/SanctionService";
import { SanctionReasonService } from "@services/SanctionReasonService";
import { SanctionType } from "@prisma/client/client";
import { DurationParser } from "@utils/DurationParser";

export class HeatpointService {
    private static logger = new Logger("HeatpointService");
    private static readonly LUA_SCRIPT = `
        local key_value = KEYS[1]
        local key_time = KEYS[2]
        local points = tonumber(ARGV[1])
        local decay_rate = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])

        local current_val = tonumber(redis.call('GET', key_value) or 0)
        local last_time = tonumber(redis.call('GET', key_time) or now)

        local time_diff = now - last_time
        local decay = time_diff * decay_rate

        if decay < 0 then decay = 0 end

        local new_val = current_val - decay
        if new_val < 0 then new_val = 0 end

        new_val = new_val + points

        redis.call('SET', key_value, new_val)
        redis.call('SET', key_time, now)
        redis.call('EXPIRE', key_value, 3600)
        redis.call('EXPIRE', key_time, 3600)

        return new_val
    `;

    static async addHeat(id: string, points: number): Promise<number> {
        const redis = RedisService.getInstance();
        const decayRateStr = await ConfigService.get(SecurityConfigKeys.heatpointDecayRate);
        const decayRate = parseInt(decayRateStr || "1", 10);
        const now = Math.floor(Date.now() / 1000);

        const result = await redis.eval(
            this.LUA_SCRIPT,
            2,
            `heat:${id}`,
            `heat:${id}:last_update`,
            points,
            decayRate,
            now
        );

        return result as number;
    }

    static async processAction(guild: Guild, channel: GuildChannel | null, user: User, actionType: string): Promise<void> {
        let points = 0;

        switch (actionType) {
            case 'join_voice':
                points = parseInt(await ConfigService.get(SecurityConfigKeys.heatpointJoinVoice) || "10", 10);
                break;
            case 'switch_voice':
                points = parseInt(await ConfigService.get(SecurityConfigKeys.heatpointSwitchVoice) || "5", 10);
                break;
            case 'stream':
                points = parseInt(await ConfigService.get(SecurityConfigKeys.heatpointStream) || "20", 10);
                break;
            case 'message':
                points = parseInt(await ConfigService.get(SecurityConfigKeys.heatpointMessage) || "5", 10);
                break;
            case 'reaction':
                points = parseInt(await ConfigService.get(SecurityConfigKeys.heatpointReaction) || "2", 10);
                break;
        }

        if (points === 0) return;

        // User Heat
        const userHeat = await this.addHeat(`user:${user.id}`, points);
        const userSanctioned = await this.handleUserSanction(guild, user, userHeat, channel);

        if (userSanctioned) return;

        // Channel Heat
        if (channel) {
            const channelHeat = await this.addHeat(`channel:${channel.id}`, points);
            const channelThreshold = parseInt(await ConfigService.get(SecurityConfigKeys.heatpointChannelThreshold) || "100", 10);

            if (channelHeat > channelThreshold) {
                await this.lockChannel(channel);
            }
        }

        // Global Heat
        const globalHeat = await this.addHeat(`global:${guild.id}`, points);
        const globalThreshold = parseInt(await ConfigService.get(SecurityConfigKeys.heatpointGlobalThreshold) || "500", 10);

        if (globalHeat > globalThreshold) {
            await this.lockServer(guild);
        }
    }

    private static async handleUserSanction(
		guild: Guild,
		user: User,
		heat: number,
		channel: GuildChannel | null,
	): Promise<boolean> {
		const warnThreshold = parseInt(
			(await ConfigService.get(
				SecurityConfigKeys.heatpointUserWarnThreshold,
			)) || "50",
			10,
		);
		const muteThreshold = parseInt(
			(await ConfigService.get(
				SecurityConfigKeys.heatpointUserMuteThreshold,
			)) || "80",
			10,
		);
		const configMuteDuration = parseInt(
			(await ConfigService.get(
				SecurityConfigKeys.heatpointMuteDuration,
			)) || "3600",
			10,
		);
		const deleteMessagesLimit = parseInt(
			(await ConfigService.get(
				SecurityConfigKeys.heatpointDeleteMessagesLimit,
			)) || "50",
			10,
		);

		const redis = RedisService.getInstance();
		const warnedKey = `warned:${guild.id}:${user.id}`;
		const processingKey = `processing:sanction:${guild.id}:${user.id}`;

		// Prevent spamming actions by checking a short-lived lock
		if (await redis.get(processingKey)) return true;

		if (heat >= muteThreshold) {
			// Set processing lock
			await redis.set(processingKey, "true", "EX", 10);

			try {
				const moderator = guild.client.user;
				if (moderator) {
					const reasonObj =
						await SanctionReasonService.getOrCreateSystemReason(
							"HEATPOINT_MUTE",
							"Excessive activity (Heatpoint threshold exceeded)",
							SanctionType.MUTE,
							"1h",
						);

					const durationStr = reasonObj.duration || "1h";
					const durationMs =
						DurationParser.parse(durationStr) ||
						configMuteDuration * 1000;

					await SanctionService.mute(
						guild,
						user,
						moderator,
						durationMs,
						durationStr,
						reasonObj.text,
					);
					this.logger.log(
						`Muted user ${user.tag} for excessive heat.`,
					);

					// Delete recent messages if channel is text-based
					if (channel && channel.isTextBased()) {
						try {
							const textChannel = channel as TextChannel; // or other text based channels
							const messages = await textChannel.messages.fetch({
								limit: deleteMessagesLimit,
							});
							const userMessages = messages.filter(
								(m) => m.author.id === user.id,
							);
							if (userMessages.size > 0) {
								await textChannel.bulkDelete(userMessages);
								this.logger.log(
									`Deleted ${userMessages.size} messages from ${user.tag} in ${channel.name}.`,
								);
							}
						} catch (delError: any) {
							this.logger.error(
								`Failed to delete messages for ${user.tag}: ${delError.message}`,
							);
						}
					}
                    return true;
				}
			} catch (error: any) {
				if (error.message !== "User is already muted.") {
					this.logger.error(
						`Failed to mute user ${user.tag}: ${error.message}`,
					);
				}
                // Even if mute failed (e.g. already muted), we consider it handled
                return true;
			}
		} else if (heat >= warnThreshold) {
            const alreadyWarned = await redis.get(warnedKey);
            if (!alreadyWarned) {
                // Set processing lock
                await redis.set(processingKey, "true", "EX", 5);
                
                try {
                    const moderator = guild.client.user;
                    if (moderator) {
                        const reasonObj = await SanctionReasonService.getOrCreateSystemReason(
                            "HEATPOINT_WARN",
                            "You are generating too much activity. Please slow down or you will be muted.",
                            SanctionType.WARN
                        );

                        await SanctionService.warn(
                            guild,
                            user,
                            moderator,
                            reasonObj.text
                        );
                        await redis.set(warnedKey, "true", "EX", 300); // 5 minutes cooldown for warning
                        this.logger.log(`Warned user ${user.tag} for high heat.`);
                    }
                } catch (e) {
                    this.logger.error(`Could not warn user ${user.tag}: ${e}`);
                }
            }
        }
        return false;
    }

    static async isLocked(id: string): Promise<boolean> {
        const redis = RedisService.getInstance();
        const locked = await redis.get(`lock:${id}`);
        return !!locked;
    }

    static async lock(id: string, duration: number): Promise<void> {
        const redis = RedisService.getInstance();
        await redis.set(`lock:${id}`, "true", "EX", duration);
    }

    static async lockChannel(channel: GuildChannel): Promise<void> {
        if (await this.isLocked(`channel:${channel.id}`)) return;

        const duration = parseInt(await ConfigService.get(SecurityConfigKeys.heatpointLockDuration) || "60", 10);
        const bypassRoleId = await ConfigService.get(SecurityConfigKeys.bypassRoleId);
        
        this.logger.log(`Locking channel ${channel.name} (${channel.id}) for ${duration}s due to high heat.`);

        await this.lock(`channel:${channel.id}`, duration);

        // Check if channel supports SendMessages permission (Text, Voice, Stage, News)
        // We use a type guard or check for the method
        if ('permissionOverwrites' in channel) {
             const ch = channel as TextChannel | VoiceChannel; // Cast to common interface with permissionOverwrites
             
             // Lock @everyone
             await ch.permissionOverwrites.edit(channel.guild.roles.everyone, {
                SendMessages: false
             });

             // Allow Bypass Role
             if (bypassRoleId) {
                 await ch.permissionOverwrites.edit(bypassRoleId, {
                     SendMessages: true
                 });
             }

             if (ch.isTextBased()) {
                 await (ch as TextChannel).send(`🔒 Channel locked for ${duration} seconds due to high activity.`);
             }

             // Alert
             await this.sendAlert(channel.guild, `🔒 **Channel Locked**: ${channel.toString()} has been locked for ${duration}s due to high activity. @everyone`);

             setTimeout(async () => {
                // Unlock @everyone
                await ch.permissionOverwrites.edit(channel.guild.roles.everyone, {
                    SendMessages: null
                });
                
                // Remove Bypass Role overwrite (optional, but cleaner to reset)
                if (bypassRoleId) {
                    await ch.permissionOverwrites.edit(bypassRoleId, {
                        SendMessages: null
                    });
                }

                if (ch.isTextBased()) {
                    await (ch as TextChannel).send(`🔓 Channel unlocked.`);
                }
             }, duration * 1000);
        }
    }

    static async lockServer(guild: Guild): Promise<void> {
        if (await this.isLocked(`global:${guild.id}`)) return;

        const duration = parseInt(await ConfigService.get(SecurityConfigKeys.heatpointLockDuration) || "60", 10);
        const bypassRoleId = await ConfigService.get(SecurityConfigKeys.bypassRoleId);

        this.logger.log(`Locking server ${guild.name} (${guild.id}) for ${duration}s due to high global heat.`);

        await this.lock(`global:${guild.id}`, duration);

        // Lock @everyone role
        const everyoneRole = guild.roles.everyone;
        const originalPermissions = everyoneRole.permissions;
        
        const newPermissions = new PermissionsBitField(originalPermissions);
        newPermissions.remove(PermissionsBitField.Flags.SendMessages);
        
        await everyoneRole.setPermissions(newPermissions, "Global Heat Lockdown");

        // Handle Bypass Role
        let bypassRole = null;
        let bypassOriginalPermissions = null;
        if (bypassRoleId) {
            bypassRole = guild.roles.cache.get(bypassRoleId);
            if (bypassRole) {
                bypassOriginalPermissions = bypassRole.permissions;
                const newBypassPermissions = new PermissionsBitField(bypassOriginalPermissions);
                newBypassPermissions.add(PermissionsBitField.Flags.SendMessages);
                await bypassRole.setPermissions(newBypassPermissions, "Global Heat Lockdown Bypass");
            }
        }

        // Notify in system channel or first text channel
        const notifyChannel = guild.systemChannel || guild.channels.cache.find(c => c.isTextBased()) as TextChannel;
        if (notifyChannel) {
            await notifyChannel.send(`🚨 **SERVER LOCKDOWN** 🚨\nGlobal activity threshold exceeded. Server locked for ${duration} seconds.`);
        }

        // Alert
        await this.sendAlert(guild, `🚨 **SERVER LOCKDOWN** 🚨\nGlobal activity threshold exceeded. Server locked for ${duration} seconds. @everyone`);

        setTimeout(async () => {
            // Restore permissions for @everyone
            const currentPerms = guild.roles.everyone.permissions;
            const restorePerms = new PermissionsBitField(currentPerms);
            restorePerms.add(PermissionsBitField.Flags.SendMessages);
            
            await guild.roles.everyone.setPermissions(restorePerms, "Global Heat Lockdown End");

            // Restore permissions for Bypass Role
            if (bypassRole && bypassOriginalPermissions) {
                 await bypassRole.setPermissions(bypassOriginalPermissions, "Global Heat Lockdown Bypass End");
            }
            
            if (notifyChannel) {
                await notifyChannel.send(`✅ **SERVER UNLOCKED**`);
            }
        }, duration * 1000);
    }

    private static async sendAlert(guild: Guild, message: string): Promise<void> {
        const alertChannelId = await ConfigService.get(SecurityConfigKeys.alertChannelId);
        if (alertChannelId) {
            const channel = guild.channels.cache.get(alertChannelId) as TextChannel;
            if (channel && channel.isTextBased()) {
                try {
                    await channel.send(message);
                } catch (e) {
                    this.logger.error(`Failed to send alert to channel ${alertChannelId}`);
                }
            }
        }
    }
}
