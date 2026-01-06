import { Injectable } from "@decorators/Injectable";
import { COMMAND_PERMISSION_METADATA_KEY } from "@di/types";
import { EPermission } from "@enums/EPermission";
import type { IExecutionContext } from "@interfaces/IExecutionContext";
import type { IInterceptor } from "@interfaces/IInterceptor";
import { PermissionService } from "@modules/Core/services/PermissionService";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import "reflect-metadata";

@Injectable()
export class CommandPermissionInterceptor implements IInterceptor {
	constructor(private readonly permissionService: PermissionService) {}

	async intercept(
		context: IExecutionContext,
		next: () => Promise<void>,
	): Promise<void> {
		const interaction = context.getInteraction();

		// Currently, we only handle permissions for ChatInputCommandInteraction
		if (!(interaction instanceof ChatInputCommandInteraction)) {
			return next();
		}

		const target = context.getClass();
		const methodName = context.getMethodName();

		// Get permission from method first, then class
		let permission = Reflect.getMetadata(
			COMMAND_PERMISSION_METADATA_KEY,
			target,
			methodName,
		) as EPermission;

		if (!permission) {
			permission = Reflect.getMetadata(
				COMMAND_PERMISSION_METADATA_KEY,
				target.constructor,
			) as EPermission;
		}

		if (!permission) {
			return next();
		}

		const roleIds =
			interaction.member && "roles" in interaction.member
				? Array.isArray(interaction.member.roles)
					? interaction.member.roles
					: interaction.member.roles.cache.map((r) => r.id)
				: [];

		const hasPermission = await this.permissionService.hasPermission(
			interaction.user.id,
			interaction.guild?.ownerId,
			roleIds,
			permission,
		);

		if (!hasPermission) {
			await interaction.reply({
				content: `You need the permission \`${permission}\` to perform this action.`,
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		return next();
	}
}
