import { BaseCommand } from "@class/BaseCommand";
import type { CommandOptions } from "@interfaces/CommandOptions";
import type { ICommandClass } from "@interfaces/ICommandClass";

export function Command(options: CommandOptions) {
	return function (target: unknown) {
		const commandClass = target as ICommandClass;
		// Validation: @Command ne peut être utilisé que sur des classes étendant BaseCommand
		if (!(commandClass.prototype instanceof BaseCommand)) {
			throw new Error(
				`@Command decorator can only be used on classes extending BaseCommand. ` +
					`Class "${commandClass.name}" does not extend BaseCommand.`,
			);
		}
		commandClass.commandOptions = options;
	};
}
