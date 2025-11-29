import { ApplicationCommandOptionType } from "discord.js";
import { ConfigProperty, toConfigKey } from '@decorators/ConfigProperty';

export class LogConfig {
    @ConfigProperty({
        displayName: "Log Channel",
        description: "The channel where logs will be sent",
        type: ApplicationCommandOptionType.Channel,
    })
    logChannelId: string = "";

    @ConfigProperty({
        displayName: "Enable Sanction Logs",
        description: "Enable logs for sanctions (ban, mute, etc.)",
        type: ApplicationCommandOptionType.Boolean,
    })
    enableSanctionLogs: boolean = true;

    @ConfigProperty({
        displayName: "Enable Voice Logs",
        description: "Enable logs for private voice channels (create, whitelist, blacklist)",
        type: ApplicationCommandOptionType.Boolean,
    })
    enableVoiceLogs: boolean = true;

    @ConfigProperty({
        displayName: "Enable Member Logs",
        description: "Enable logs for member join/leave",
        type: ApplicationCommandOptionType.Boolean,
    })
    enableMemberLogs: boolean = true;

    @ConfigProperty({
        displayName: "Enable Voice Connection Logs",
        description: "Enable logs for voice connection/disconnection/stream",
        type: ApplicationCommandOptionType.Boolean,
    })
    enableVoiceConnectionLogs: boolean = true;
}

export const LogConfigKeys = {
    get logChannelId() { return toConfigKey('logChannelId'); },
    get enableSanctionLogs() { return toConfigKey('enableSanctionLogs'); },
    get enableVoiceLogs() { return toConfigKey('enableVoiceLogs'); },
    get enableMemberLogs() { return toConfigKey('enableMemberLogs'); },
    get enableVoiceConnectionLogs() { return toConfigKey('enableVoiceConnectionLogs'); },
} as const;
