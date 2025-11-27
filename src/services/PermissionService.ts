import { prismaClient } from "./prismaService";

export class PermissionService {
    static async hasPermission(userRoleIds: string[], requiredPermission: string): Promise<boolean> {
        const groups = await prismaClient.group.findMany({
            where: {
                roleId: {
                    in: userRoleIds
                }
            },
            include: {
                Permissions: {
                    include: {
                        Permissions: true
                    }
                }
            }
        });

        const permissions = groups.flatMap(g => 
            g.Permissions.map(gp => gp.Permissions.name)
        );

        return this.checkPermission(permissions, requiredPermission);
    }

    private static checkPermission(userPermissions: string[], requiredPermission: string): boolean {
        for (const permission of userPermissions) {
            if (permission === requiredPermission) return true;
            if (permission === '*') return true;
            
            if (permission.endsWith('*')) {
                const prefix = permission.slice(0, -1);
                if (requiredPermission.startsWith(prefix)) return true;
            }
        }
        return false;
    }
}
