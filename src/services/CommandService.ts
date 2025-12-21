import {
	COMMAND_PARAMS_METADATA_KEY,
	CommandParamType,
	type CommandParameter,
} from "@decorators/params";
import type { ICommandClass } from "@interfaces/ICommandClass";
import type { ICommandInstance } from "@interfaces/ICommandInstance";
import { GeneralConfig } from "@modules/General/GeneralConfig";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { PermissionService } from "@services/PermissionService";
import { Logger } from "@utils/Logger";
import {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	MessageFlags,
} from "discord.js";
import type { CommandArgument } from "../types/CommandArgument";

import { Injectable } from "@decorators/Injectable";
import type { TFunction } from "i18next";

@Injectable()
export class CommandService {
	private logger = new Logger("CommandService");

	constructor(
		private readonly configService: ConfigService,
		private readonly permissionService: PermissionService,
	) {}

	async handleAutocomplete(
		client: Client,
		interaction: AutocompleteInteraction,
		commandInstance: object,
	): Promise<void> {
		const focusedOption = interaction.options.getFocused(true);
		const autocompletes = (commandInstance.constructor as ICommandClass)
			.autocompletes;

		if (autocompletes && autocompletes.has(focusedOption.name)) {
			const method = autocompletes.get(focusedOption.name);
			if (method) {
				const lng = await this.configService.of(
					interaction.guildId!,
					GeneralConfig,
				).generalLanguage;
				const t = I18nService.getFixedT(lng);

				const args = this.resolveArguments(
					commandInstance,
					method,
					client,
					interaction,
					t,
					lng,
				);

				await (
					(commandInstance as unknown as ICommandInstance)[
						method
					] as (...args: CommandArgument[]) => Promise<void>
				)(...args);
			}
		}
	}

	async execute(
		client: Client,
		interaction: ChatInputCommandInteraction,
		commandInstance: object,
	): Promise<void> {
		const lng = await this.configService.of(
			interaction.guildId!,
			GeneralConfig,
		).generalLanguage;
		const t = I18nService.getFixedT(lng);

		const subcommand = interaction.options.getSubcommand(false);
		const subcommandGroup = interaction.options.getSubcommandGroup(false);
		let executed = false;

		if (subcommand) {
			const key = subcommandGroup
				? `${subcommandGroup}:${subcommand}`
				: subcommand;
			const subcommands = (commandInstance.constructor as ICommandClass)
				.subcommands;

			if (subcommands && subcommands.has(key)) {
				const subcommandInfo = subcommands.get(key);
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

					const args = this.resolveArguments(
						commandInstance,
						method,
						client,
						interaction,
						t,
					);
					await (
						(commandInstance as unknown as ICommandInstance)[
							method
						] as (...args: CommandArgument[]) => Promise<void>
					)(...args);
					this.logger.log(
						`Command ${commandInstance.constructor.name} (subcommand: ${key}) executed successfully`,
					);
					executed = true;
				}
			}
		}

		if (!executed) {
			const optionRoutes = (commandInstance.constructor as ICommandClass)
				.optionRoutes;
			if (optionRoutes) {
				for (const [optionName, valueMap] of optionRoutes) {
					const optionValue =
						interaction.options.get(optionName)?.value;
					if (
						optionValue !== undefined &&
						valueMap.has(optionValue)
					) {
						const route = valueMap.get(optionValue);
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

							const args = this.resolveArguments(
								commandInstance,
								method,
								client,
								interaction,
								t,
								lng,
							);
							await (
								(
									commandInstance as unknown as ICommandInstance
								)[method] as (
									...args: CommandArgument[]
								) => Promise<void>
							)(...args);
							this.logger.log(
								`Command ${commandInstance.constructor.name} (option: ${optionName}) executed successfully`,
							);
							executed = true;
							break;
						}
					}
				}
			}
		}

		if (!executed) {
			const defaultCommand = (
				commandInstance.constructor as ICommandClass
			).defaultCommand;
			if (defaultCommand) {
				const permission = (
					commandInstance.constructor as ICommandClass
				).defaultCommandPermission;

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

				const args = this.resolveArguments(
					commandInstance,
					defaultCommand,
					client,
					interaction,
					t,
					lng,
				);

				await (
					(commandInstance as unknown as ICommandInstance)[
						defaultCommand
					] as (...args: CommandArgument[]) => Promise<void>
				)(...args);
				this.logger.log(
					`Command ${commandInstance.constructor.name} executed successfully`,
				);
			}
		}
	}

	private resolveArguments(
		target: object,
		method: string,
		client: Client,
		interaction: ChatInputCommandInteraction | AutocompleteInteraction,
		t?: TFunction<"translation", undefined>,
		lng?: string,
	): CommandArgument[] {
		const params: CommandParameter[] =
			Reflect.getMetadata(COMMAND_PARAMS_METADATA_KEY, target, method) ||
			[];

		if (params.length === 0) {
			return [client, interaction, t];
		}

		const args: CommandArgument[] = [];
		for (const param of params) {
			switch (param.type) {
				case CommandParamType.Client:
					args[param.index] = client;
					break;
				case CommandParamType.Interaction:
					args[param.index] = interaction;
					break;
				case CommandParamType.AutocompleteInteraction:
					args[param.index] = interaction;
					break;
				case CommandParamType.Translate:
					args[param.index] = t;
					break;
				case CommandParamType.GuildLocale:
					args[param.index] = lng;
					break;
			}
		}
		return args;
	}

	protected async checkPermission(
		interaction: ChatInputCommandInteraction,
		permission: string,
		commandInstance: object,
	): Promise<boolean> {
		let roleIds: string[] = [];
		if (interaction.member) {
			if (Array.isArray(interaction.member.roles)) {
				roleIds = interaction.member.roles;
			} else {
				roleIds = interaction.member.roles.cache.map((r) => r.id);
			}
		}

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
}
