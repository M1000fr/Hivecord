import { describe, expect, test, mock, beforeEach } from "bun:test";

// Mock ConfigService
const mockConfigService = {
    get: mock(),
    getChannel: mock(),
};

mock.module("@services/ConfigService", () => ({
    ConfigService: mockConfigService
}));

// Mock LogConfigKeys
mock.module("@modules/Log/LogConfig", () => ({
    LogConfigKeys: {
        logChannelId: "logChannelId",
        enableSanctionLogs: "enableSanctionLogs",
        enableVoiceLogs: "enableVoiceLogs",
        enableMemberLogs: "enableMemberLogs",
        enableVoiceConnectionLogs: "enableVoiceConnectionLogs",
    }
}));

import { LogService } from "../../src/modules/Log/services/LogService";

describe("LogService", () => {
    beforeEach(() => {
        mockConfigService.get.mockClear();
        mockConfigService.getChannel.mockClear();
    });

    test("logSanction sends embed to log channel", async () => {
        mockConfigService.get.mockResolvedValue("true");
        mockConfigService.getChannel.mockResolvedValue("123456789");

        const mockSend = mock();
        const mockChannel = {
            isTextBased: () => true,
            send: mockSend,
        };

        const mockGuild = {
            channels: {
                cache: {
                    get: mock().mockReturnValue(mockChannel),
                }
            }
        };

        const mockUser = {
            tag: "User#1234",
            id: "111",
            displayAvatarURL: () => "url",
        };
        
        const mockModerator = {
            tag: "Mod#1234",
            id: "222",
        };

        await LogService.logSanction(mockGuild as any, mockUser as any, mockModerator as any, "WARN", "Reason");

        expect(mockConfigService.get).toHaveBeenCalledWith("enableSanctionLogs");
        expect(mockConfigService.getChannel).toHaveBeenCalledWith("logChannelId");
        expect(mockSend).toHaveBeenCalled();
        
        const firstCall = mockSend.mock.calls[0];
        if (!firstCall) throw new Error("mockSend was not called");
        const callArg = firstCall[0];
        
        if (!callArg) throw new Error("No arguments passed to send");
        expect(callArg.embeds).toHaveLength(1);
        expect(callArg.embeds[0].data.title).toBe("Sanction: WARN");
    });

    test("logSanction does nothing if disabled", async () => {
        mockConfigService.get.mockResolvedValue("false");

        await LogService.logSanction({} as any, {} as any, {} as any, "WARN", "Reason");

        expect(mockConfigService.getChannel).not.toHaveBeenCalled();
    });
});
