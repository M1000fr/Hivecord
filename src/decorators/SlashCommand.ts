import type { CommandOptions } from "../interfaces/CommandOptions";

export function SlashCommand(options: CommandOptions) {
    return function (target: Function) {
        (target as any).commandOptions = options;
    };
}
