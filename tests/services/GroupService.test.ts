import { describe, expect, test, mock, beforeEach } from "bun:test";

// Mocks
const mockPrisma = {
    role: {
        findUnique: mock(),
        create: mock(),
    },
    group: {
        create: mock(),
        findFirst: mock(),
        delete: mock(),
    },
    permission: {
        findFirst: mock(),
    },
    groupPermission: {
        findFirst: mock(),
        create: mock(),
    }
};

const mockRedis = {
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

import { GroupService } from "../../src/modules/Configuration/services/GroupService";

describe("GroupService", () => {
    beforeEach(() => {
        mockPrisma.role.findUnique.mockClear();
        mockPrisma.role.create.mockClear();
        mockPrisma.group.create.mockClear();
        mockPrisma.group.findFirst.mockClear();
        mockPrisma.group.delete.mockClear();
        mockPrisma.permission.findFirst.mockClear();
        mockPrisma.groupPermission.findFirst.mockClear();
        mockPrisma.groupPermission.create.mockClear();
        mockRedis.del.mockClear();
    });

    test("createGroup creates role if not exists and creates group", async () => {
        mockPrisma.role.findUnique.mockResolvedValue(null);
        mockPrisma.role.create.mockResolvedValue({ id: "role_id" });
        mockPrisma.group.create.mockResolvedValue({ id: 1, name: "group_name", roleId: "role_id" });

        const result = await GroupService.createGroup("group_name", "role_id");

        expect(mockPrisma.role.create).toHaveBeenCalledWith({ data: { id: "role_id" } });
        expect(mockPrisma.group.create).toHaveBeenCalledWith({
            data: { name: "group_name", roleId: "role_id" }
        });
        expect(result).toEqual({ id: 1, name: "group_name", roleId: "role_id" });
    });

    test("deleteGroup deletes group and clears cache", async () => {
        mockPrisma.group.findFirst.mockResolvedValue({ id: 1, name: "group_name", roleId: "role_id" });
        mockPrisma.group.delete.mockResolvedValue({ id: 1 });

        await GroupService.deleteGroup("group_name");

        expect(mockRedis.del).toHaveBeenCalledWith("permissions:role:role_id");
        expect(mockPrisma.group.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    test("addPermission adds permission to group", async () => {
        mockPrisma.group.findFirst.mockResolvedValue({ id: 1, name: "group_name", roleId: "role_id" });
        mockPrisma.permission.findFirst.mockResolvedValue({ id: 10, name: "perm" });
        mockPrisma.groupPermission.findFirst.mockResolvedValue(null);

        await GroupService.addPermission("group_name", "perm");

        expect(mockPrisma.groupPermission.create).toHaveBeenCalledWith({
            data: { groupId: 1, permissionId: 10 }
        });
        expect(mockRedis.del).toHaveBeenCalledWith("permissions:role:role_id");
    });
});
