import { describe, expect, test, mock, beforeEach } from "bun:test";

// Mocks
const mockPrisma = {
    group: {
        findMany: mock(),
    },
    permission: {
        findMany: mock(),
    }
};

const mockRedis = {
    get: mock(),
    set: mock(),
};

mock.module("@services/prismaService", () => ({
    prismaClient: mockPrisma
}));

mock.module("@services/RedisService", () => ({
    RedisService: {
        getInstance: () => mockRedis
    }
}));

// Import after mocks
import { PermissionService } from "../../src/services/PermissionService";

describe("PermissionService", () => {
    beforeEach(() => {
        mockPrisma.group.findMany.mockClear();
        mockPrisma.permission.findMany.mockClear();
        mockRedis.get.mockClear();
        mockRedis.set.mockClear();
    });

    test("hasPermission returns true for owner", async () => {
        const originalOwnerId = process.env.DISCORD_OWNER_ID;
        process.env.DISCORD_OWNER_ID = "123";
        const result = await PermissionService.hasPermission("123", [], "any.permission");
        expect(result).toBe(true);
        process.env.DISCORD_OWNER_ID = originalOwnerId;
    });

    test("hasPermission checks redis cache first", async () => {
        mockRedis.get.mockResolvedValue(JSON.stringify(["test.permission"]));
        
        const result = await PermissionService.hasPermission("456", ["role1"], "test.permission");
        
        expect(result).toBe(true);
        expect(mockRedis.get).toHaveBeenCalled();
        expect(mockPrisma.group.findMany).not.toHaveBeenCalled();
    });

    test("hasPermission fetches from db if cache miss", async () => {
        mockRedis.get.mockResolvedValue(null);
        mockPrisma.group.findMany.mockResolvedValue([
            {
                Permissions: [
                    { Permissions: { name: "test.permission" } }
                ]
            }
        ]);

        const result = await PermissionService.hasPermission("456", ["role1"], "test.permission");

        expect(result).toBe(true);
        expect(mockPrisma.group.findMany).toHaveBeenCalled();
        expect(mockRedis.set).toHaveBeenCalled();
    });

    test("hasPermission handles wildcards", async () => {
        mockRedis.get.mockResolvedValue(JSON.stringify(["test.*"]));
        
        const result = await PermissionService.hasPermission("456", ["role1"], "test.sub.permission");
        
        expect(result).toBe(true);
    });
    
    test("hasPermission returns false if permission not found", async () => {
        mockRedis.get.mockResolvedValue(JSON.stringify(["other.permission"]));
        
        const result = await PermissionService.hasPermission("456", ["role1"], "test.permission");
        
        expect(result).toBe(false);
    });
});
