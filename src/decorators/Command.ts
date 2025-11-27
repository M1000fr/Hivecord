import type { CommandOptions } from "../interfaces/CommandOptions";
import { EPermission } from "../enums/EPermission";

export function Command(options: CommandOptions, permission?: EPermission) {
    return function (target: Function) {
        (target as any).commandOptions = options;
        if (permission) {
            (target as any).permission = permission;
        }
    };
}
