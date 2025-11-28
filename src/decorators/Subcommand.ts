import { EPermission } from '@enums/EPermission';

export interface SubcommandOptions {
	name: string;
	group?: string;
	permission?: EPermission;
}

export function Subcommand(options: SubcommandOptions) {
	return function (
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		if (!target.constructor.subcommands) {
			target.constructor.subcommands = new Map();
		}
		target.constructor.subcommands.set(
			options.group ? `${options.group}:${options.name}` : options.name,
			{
				method: propertyKey,
				permission: options.permission,
			},
		);
	};
}
