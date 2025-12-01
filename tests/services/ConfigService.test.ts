import { describe, expect, test, mock, beforeEach } from "bun:test";

// Mocks
const mockPrisma = {
    configuration: {
        findUnique: mock(),
        upsert: mock(),
        delete: mock(),
    },
    role: {
        upsert: mock(),
    }
};

const mockRedis = {
    get: mock(),
    set: mock(),
    del: mock(),
};

mock.module("@services/prismaService", () => ({
    prismaClient: mockPrisma
}));

mock.module("@services/RedisService", () => ({
    RedisService: {
        getInstance: () => mockRedis
    }
}));

import { ConfigService } from "@services/ConfigService";

console.log("DEBUG: ConfigService:", ConfigService);
console.log("DEBUG: ConfigService.get:", ConfigService?.get);
console.log("DEBUG: ConfigService prototype:", ConfigService?.prototype);

describe("ConfigService", () => {
    beforeEach(() => {
        mockPrisma.configuration.findUnique.mockClear();
        mockPrisma.configuration.upsert.mockClear();
        mockPrisma.configuration.delete.mockClear();
        mockRedis.get.mockClear();
        mockRedis.set.mockClear();
        mockRedis.del.mockClear();
    });

    test("get returns value from redis if cached", async () => {
        mockRedis.get.mockResolvedValue("cached_value");
        
        const result = await ConfigService.get("some_key");
        
        expect(result).toBe("cached_value");
        expect(mockRedis.get).toHaveBeenCalledWith("config:value:some_key");
        expect(mockPrisma.configuration.findUnique).not.toHaveBeenCalled();
    });

    test("get fetches from db if not cached", async () => {
        mockRedis.get.mockResolvedValue(null);
        mockPrisma.configuration.findUnique.mockResolvedValue({ key: "some_key", value: "db_value" });
        
        const result = await ConfigService.get("some_key");
        
        expect(result).toBe("db_value");
        expect(mockPrisma.configuration.findUnique).toHaveBeenCalledWith({ where: { key: "some_key" } });
        expect(mockRedis.set).toHaveBeenCalledWith("config:value:some_key", "db_value", "EX", 60);
    });

    test("get returns null if not found in db", async () => {
        mockRedis.get.mockResolvedValue(null);
        mockPrisma.configuration.findUnique.mockResolvedValue(null);
        
        const result = await ConfigService.get("some_key");
        
        expect(result).toBeNull();
    });

    test("set updates db and cache", async () => {
        await ConfigService.set("some_key", "new_value");
        
        expect(mockRedis.del).toHaveBeenCalledWith("config:value:some_key");
        expect(mockPrisma.configuration.upsert).toHaveBeenCalled();
        expect(mockRedis.set).toHaveBeenCalledWith("config:value:some_key", "new_value", "EX", 60);
    });
});
