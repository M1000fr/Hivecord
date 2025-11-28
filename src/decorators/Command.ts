import type { CommandOptions } from '@interfaces/CommandOptions';

export function Command(options: CommandOptions) {
	return function (target: Function) {
		(target as any).commandOptions = options;
	};
}
