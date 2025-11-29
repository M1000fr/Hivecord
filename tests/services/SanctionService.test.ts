import { describe, expect, test, mock, beforeEach } from "bun:test";
import { SanctionType } from '@prisma/client/enums';

// Mocks
const mockPrisma = {
    user: {
        upsert: mock(),
    },
    sanction: {
        findFirst: mock(),
        create: mock(),
        updateMany: mock(),
    }
};

mock.module("@services/prismaService", () => ({
    prismaClient: mockPrisma
}));

const mockConfigService = {
    getRole: mock(),
};

mock.module("@services/ConfigService", () => ({
    ConfigService: mockConfigService
}));

const mockLogService = {
    logSanction: mock(),
};

mock.module("@services/LogService", () => ({
    LogService: mockLogService
}));

mock.module("@modules/Moderation/ModerationConfig", () => ({
    ModerationConfigKeys: {
        muteRoleId: "muteRoleId",
    }
}));

import { SanctionService } from "../../src/services/SanctionService";

describe("SanctionService", () => {
    beforeEach(() => {
        mockPrisma.user.upsert.mockClear();
        mockPrisma.sanction.findFirst.mockClear();
        mockPrisma.sanction.create.mockClear();
        mockPrisma.sanction.updateMany.mockClear();
        mockConfigService.getRole.mockClear();
        mockLogService.logSanction.mockClear();
    });

    test("mute applies mute role and logs", async () => {
        mockConfigService.getRole.mockResolvedValue("mute_role_id");
        mockPrisma.sanction.findFirst.mockResolvedValue(null);

        const mockMuteRole = { id: "mute_role_id" };
        const mockMember = {
            moderatable: true,
            roles: {
                add: mock(),
            }
        };
        const mockGuild = {
            name: "Test Guild",
            members: {
                cache: {
                    get: mock().mockReturnValue(mockMember),
                },
                fetch: mock().mockResolvedValue(mockMember),
            },
            roles: {
                cache: {
                    get: mock().mockReturnValue(mockMuteRole),
                }
            }
        };
        const mockTarget = { id: "target_id", send: mock() };
        const mockModerator = { id: "mod_id" };

        await SanctionService.mute(
            mockGuild as any,
            mockTarget as any,
            mockModerator as any,
            60000,
            "1m",
            "Test Reason"
        );

        expect(mockConfigService.getRole).toHaveBeenCalledWith("muteRoleId");
        expect(mockMember.roles.add).toHaveBeenCalledWith(mockMuteRole);
        expect(mockLogService.logSanction).toHaveBeenCalled();
        expect(mockPrisma.sanction.create).toHaveBeenCalled();
    });

    test("mute throws if user already muted", async () => {
        mockPrisma.sanction.findFirst.mockResolvedValue({ id: 1 });

        const mockTarget = { id: "target_id" };

        expect(SanctionService.mute(
            {} as any,
            mockTarget as any,
            {} as any,
            60000,
            "1m",
            "Reason"
        )).rejects.toThrow("User is already muted.");
    });
});
