import { BaseCommand } from "@class/BaseCommand";
import type { CommandOptions } from "@interfaces/CommandOptions";

export function Command(options: CommandOptions) {
	return function (target: Function) {
		// Validation: @Command ne peut être utilisé que sur des classes étendant BaseCommand
		if (!(target.prototype instanceof BaseCommand)) {
			throw new Error(
				`@Command decorator can only be used on classes extending BaseCommand. ` +
					`Class "${target.name}" does not extend BaseCommand.`,
			);
		}
		(target as any).commandOptions = options;
	};
}
