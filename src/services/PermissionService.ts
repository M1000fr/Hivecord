import { prismaClient } from "./prismaService";

export class PermissionService {
    static async hasPermission(userId: string, requiredPermission: string): Promise<boolean> {
        const user = await prismaClient.user.findUnique({
            where: { id: userId },
            include: {
                Groups: {
                    include: {
                        Groups: {
                            include: {
                                Permissions: {
                                    include: {
                                        Permissions: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!user) return false;

        const userPermissions = user.Groups.flatMap(ug => 
            ug.Groups.Permissions.map(gp => gp.Permissions.name)
        );

        return this.checkPermission(userPermissions, requiredPermission);
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
