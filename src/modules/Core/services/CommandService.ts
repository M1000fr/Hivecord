import {
	COMMAND_PARAMS_METADATA_KEY,
	CommandParamType,
	type CommandParameter,
} from "@decorators/params";
import type { ICommandClass } from "@interfaces/ICommandClass.ts";
import type { ICommandInstance } from "@interfaces/ICommandInstance.ts";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { I18nService } from "@modules/Core/services/I18nService";
import { PermissionService } from "@modules/Core/services/PermissionService";
import { GeneralConfig } from "@modules/General/GeneralConfig";
import type { CommandArgument } from "@src/types/CommandArgument";
import type { GuildLanguageContext } from "@src/types/GuildLanguageContext";
import { Logger } from "@utils/Logger";
import {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	MessageFlags,
	UserContextMenuCommandInteraction,
	MessageContextMenuCommandInteraction,
} from "discord.js";

import { Injectable } from "@decorators/Injectable";

@Injectable()
export class CommandService {
	private logger = new Logger("CommandService");

	constructor(
		private readonly configService: ConfigService,
		private readonly permissionService: PermissionService,
	) {}

	/**
	 * Resolves i18n translation function and language code for a guild.
	 * @param guildId The ID of the guild.
	 * @returns GuildLanguageContext containing locale and translation function.
	 * @private
	 */
	private async getI18n(
		guildId: string | null,
	): Promise<GuildLanguageContext> {
		const locale = await this.configService.of(guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(locale);
		return { locale, t };
	}

	/**
	 * Invokes a command method on a command instance with resolved arguments.
	 * @param client The Discord client.
	 * @param interaction The interaction that triggered the command.
	 * @param commandInstance The instance of the command class.
	 * @param method The name of the method to invoke.
	 * @param langCtx The guild language context.
	 * @param logSuffix Optional suffix for the success log message.
	 * @private
	 */
	private async invoke(
		client: Client,
		interaction:
			| ChatInputCommandInteraction
			| AutocompleteInteraction
			| UserContextMenuCommandInteraction
			| MessageContextMenuCommandInteraction,
		commandInstance: object,
		method: string,
		langCtx: GuildLanguageContext,
		logSuffix?: string,
	): Promise<void> {
		const args = this.resolveArguments(
			commandInstance,
			method,
			client,
			interaction,
			langCtx,
		);

		await (
			(commandInstance as unknown as ICommandInstance)[method] as (
				...args: CommandArgument[]
			) => Promise<void>
		)(...args);

		if (logSuffix !== undefined) {
			this.logger.log(
				`Command ${commandInstance.constructor.name}${logSuffix} executed successfully`,
			);
		}
	}

	/**
	 * Handles autocomplete interactions by identifying and invoking the registered autocomplete method.
	 * @param client The Discord client.
	 * @param interaction The autocomplete interaction.
	 * @param commandInstance The instance of the command class.
	 */
	async handleAutocomplete(
		client: Client,
		interaction: AutocompleteInteraction,
		commandInstance: object,
	): Promise<void> {
		const focusedOption = interaction.options.getFocused(true);
		const autocompletes = (commandInstance.constructor as ICommandClass)
			.autocompletes;

		const method = autocompletes?.get(focusedOption.name);
		if (method) {
			const langCtx = await this.getI18n(interaction.guildId);
			await this.invoke(
				client,
				interaction,
				commandInstance,
				method,
				langCtx,
			);
		}
	}

	/**
	 * Executes a chat input command by routing it to the appropriate subcommand, option route, or default method.
	 * It also handles permission checks before execution.
	 * @param client The Discord client.
	 * @param interaction The chat input command interaction.
	 * @param commandInstance The instance of the command class.
	 */
	async execute(
		client: Client,
		interaction: ChatInputCommandInteraction,
		commandInstance: object,
	): Promise<void> {
		const langCtx = await this.getI18n(interaction.guildId);
		const commandClass = commandInstance.constructor as ICommandClass;

		// 1. Try Subcommands
		const subcommand = interaction.options.getSubcommand(false);
		const subcommandGroup = interaction.options.getSubcommandGroup(false);

		if (subcommand) {
			const key = subcommandGroup
				? `${subcommandGroup}:${subcommand}`
				: subcommand;
			const subcommandInfo = commandClass.subcommands?.get(key);

			if (subcommandInfo) {
				const { method, permission } = subcommandInfo;
				if (
					permission &&
					!(await this.checkPermission(
						interaction,
						permission,
						commandInstance,
					))
				) {
					return;
				}

				await this.invoke(
					client,
					interaction,
					commandInstance,
					method,
					langCtx,
					` (subcommand: ${key})`,
				);
				return;
			}
		}

		// 2. Try Option Routes
		if (commandClass.optionRoutes) {
			for (const [optionName, valueMap] of commandClass.optionRoutes) {
				const optionValue = interaction.options.get(optionName)?.value;
				const route =
					optionValue !== undefined
						? valueMap.get(optionValue)
						: null;

				if (route) {
					const { method, permission } = route;
					if (
						permission &&
						!(await this.checkPermission(
							interaction,
							permission,
							commandInstance,
						))
					) {
						return;
					}

					await this.invoke(
						client,
						interaction,
						commandInstance,
						method,
						langCtx,
						` (option: ${optionName})`,
					);
					return;
				}
			}
		}

		// 3. Fallback to Default Command
		const defaultCommand = commandClass.defaultCommand;
		if (defaultCommand) {
			const permission = commandClass.defaultCommandPermission;
			if (
				permission &&
				!(await this.checkPermission(
					interaction,
					permission,
					commandInstance,
				))
			) {
				return;
			}

			await this.invoke(
				client,
				interaction,
				commandInstance,
				defaultCommand,
				langCtx,
				"",
			);
		}
	}

	/**
	 * Resolves arguments for a command method based on parameter metadata.
	 * @param target The target object (command instance).
	 * @param method The method name.
	 * @param client The Discord client.
	 * @param interaction The interaction.
	 * @param t The translation function.
	 * @param lng The language code.
	 * @returns An array of arguments to be passed to the method.
	 * @private
	 */
	private resolveArguments(
		target: object,
		method: string,
		client: Client,
		interaction:
			| ChatInputCommandInteraction
			| AutocompleteInteraction
			| UserContextMenuCommandInteraction
			| MessageContextMenuCommandInteraction,
		langCtx?: GuildLanguageContext,
	): CommandArgument[] {
		const params: CommandParameter[] =
			Reflect.getMetadata(COMMAND_PARAMS_METADATA_KEY, target, method) ||
			[];

		if (params.length === 0) {
			return [client, interaction, langCtx];
		}

		const args: CommandArgument[] = [];
		for (const param of params) {
			switch (param.type) {
				case CommandParamType.Client:
					args[param.index] = client;
					break;
				case CommandParamType.Interaction:
				case CommandParamType.AutocompleteInteraction:
					args[param.index] = interaction;
					break;
				case CommandParamType.Translate:
					args[param.index] = langCtx;
					break;
				case CommandParamType.Context:
					if (
						interaction instanceof ChatInputCommandInteraction ||
						interaction instanceof UserContextMenuCommandInteraction ||
						interaction instanceof MessageContextMenuCommandInteraction
					) {
						args[param.index] = [interaction];
					}
					break;
				case CommandParamType.TargetUser:
					if (interaction instanceof UserContextMenuCommandInteraction) {
						args[param.index] = interaction.targetUser;
					}
					break;
				case CommandParamType.TargetMessage:
					if (
						interaction instanceof MessageContextMenuCommandInteraction
					) {
						args[param.index] = interaction.targetMessage;
					}
					break;
			}
		}
		return args;
	}

	/**
	 * Checks if a user has the required permission to execute a command.
	 * If permission is denied, it sends an ephemeral reply to the user.
	 * @param interaction The chat input command interaction.
	 * @param permission The permission string to check.
	 * @param commandInstance The instance of the command class.
	 * @returns A promise that resolves to true if the user has permission, false otherwise.
	 * @protected
	 */
	protected async checkPermission(
		interaction: ChatInputCommandInteraction,
		permission: string,
		commandInstance: object,
	): Promise<boolean> {
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
			this.logger.log(
				`Permission denied for command ${commandInstance.constructor.name}: User ${interaction.user.tag} missing ${permission}`,
			);
			await interaction.reply({
				content: `You need the permission \`${permission}\` to perform this action.`,
				flags: [MessageFlags.Ephemeral],
			});
			return false;
		}

		return true;
	}

	/**
	 * Executes a context menu command (user or message).
	 * @param client The Discord client.
	 * @param interaction The context menu command interaction.
	 * @param commandInstance The instance of the command class.
	 */
	async executeContextMenu(
		client: Client,
		interaction:
			| UserContextMenuCommandInteraction
			| MessageContextMenuCommandInteraction,
		commandInstance: object,
	): Promise<void> {
		const langCtx = await this.getI18n(interaction.guildId);

		// Look for a method decorated with the command decorator
		// For context menus, we'll use a convention: look for an 'execute' method
		const method = "execute";

		await this.invoke(
			client,
			interaction,
			commandInstance,
			method,
			langCtx,
			" (context menu)",
		);
	}
}
