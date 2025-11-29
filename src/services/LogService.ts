import { EmbedBuilder, Guild, User, GuildMember, type PartialGuildMember, VoiceState, Colors, TextChannel, type ColorResolvable } from "discord.js";
import { ConfigService } from "@services/ConfigService";
import { LogConfigKeys } from "@modules/Log/LogConfig";

export class LogService {
    private static async getLogChannel(guild: Guild): Promise<TextChannel | null> {
        const channelId = await ConfigService.getChannel(LogConfigKeys.logChannelId);
        if (!channelId) return null;
        const channel = guild.channels.cache.get(channelId);
        if (!channel || !channel.isTextBased()) return null;
        return channel as TextChannel;
    }

    private static async isEnabled(key: string): Promise<boolean> {
        const value = await ConfigService.get(key);
        return value === "true";
    }

    static async logSanction(guild: Guild, target: User, moderator: User, type: string, reason: string, duration?: string) {
        if (!await this.isEnabled(LogConfigKeys.enableSanctionLogs)) return;
        const channel = await this.getLogChannel(guild);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle(`Sanction: ${type}`)
            .setColor(Colors.Red)
            .addFields(
                { name: "User", value: `${target.tag} (${target.id})`, inline: true },
                { name: "Moderator", value: `${moderator.tag} (${moderator.id})`, inline: true },
                { name: "Reason", value: reason },
            )
            .setTimestamp();

        if (duration) {
            embed.addFields({ name: "Duration", value: duration, inline: true });
        }

        await channel.send({ embeds: [embed] });
    }

    static async logTempVoice(guild: Guild, user: User, action: string, details: string) {
        if (!await this.isEnabled(LogConfigKeys.enableVoiceLogs)) return;
        const channel = await this.getLogChannel(guild);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle(`Temp Voice: ${action}`)
            .setColor(Colors.Blue)
            .setDescription(details)
            .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }

    static async logMemberJoin(member: GuildMember) {
        if (!await this.isEnabled(LogConfigKeys.enableMemberLogs)) return;
        const channel = await this.getLogChannel(member.guild);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle("Member Joined")
            .setColor(Colors.Green)
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                { name: "User", value: `${member.user.tag} (${member.id})` },
                { name: "Created At", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>` }
            )
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }

    static async logMemberLeave(member: GuildMember | PartialGuildMember) {
        if (!await this.isEnabled(LogConfigKeys.enableMemberLogs)) return;
        const channel = await this.getLogChannel(member.guild);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle("Member Left")
            .setColor(Colors.Orange)
            .setThumbnail(member.user?.displayAvatarURL() ?? "")
            .addFields(
                { name: "User", value: `${member.user?.tag ?? "Unknown"} (${member.id})` },
                { name: "Joined At", value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "Unknown" }
            )
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }

    static async logVoiceState(oldState: VoiceState, newState: VoiceState) {
        if (!await this.isEnabled(LogConfigKeys.enableVoiceConnectionLogs)) return;
        const channel = await this.getLogChannel(newState.guild);
        if (!channel) return;

        const member = newState.member;
        if (!member) return;

        let action = "";
        let color: ColorResolvable = Colors.Grey;
        let details = "";

        if (!oldState.channelId && newState.channelId) {
            action = "Connected";
            color = Colors.Green;
            details = `Connected to <#${newState.channelId}>`;
        } else if (oldState.channelId && !newState.channelId) {
            action = "Disconnected";
            color = Colors.Red;
            details = `Disconnected from <#${oldState.channelId}>`;
        } else if (oldState.channelId !== newState.channelId) {
            action = "Moved";
            color = Colors.Yellow;
            details = `Moved from <#${oldState.channelId}> to <#${newState.channelId}>`;
        } else if (!oldState.streaming && newState.streaming) {
            action = "Started Streaming";
            color = Colors.Purple;
            details = `Started streaming in <#${newState.channelId}>`;
        } else if (oldState.streaming && !newState.streaming) {
            action = "Stopped Streaming";
            color = Colors.Grey;
            details = `Stopped streaming in <#${newState.channelId}>`;
        } else {
            return; // Ignore other updates (mute/deafen)
        }

        const embed = new EmbedBuilder()
            .setTitle(`Voice: ${action}`)
            .setColor(color)
            .setDescription(details)
            .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }
}
