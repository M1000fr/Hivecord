import type { ICommandClass } from "@interfaces/ICommandClass";
import { PermissionService } from "@services/PermissionService";
import { Logger } from "@utils/Logger";
import {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	MessageFlags,
} from "discord.js";

export abstract class BaseCommand {
	protected logger = new Logger(this.constructor.name);

	async handleAutocomplete(
		client: Client,
		interaction: AutocompleteInteraction,
	): Promise<void> {
		const focusedOption = interaction.options.getFocused(true);
		const autocompletes = (this.constructor as ICommandClass).autocompletes;

		if (autocompletes && autocompletes.has(focusedOption.name)) {
			const method = autocompletes.get(focusedOption.name);
			if (method) {
				await (
					this as unknown as Record<
						string,
						(
							client: Client,
							interaction: AutocompleteInteraction,
						) => Promise<void>
					>
				)[method]!(client, interaction);
			}
		}
	}

	async execute(
		client: Client,
		interaction: ChatInputCommandInteraction,
	): Promise<void> {
		const subcommand = interaction.options.getSubcommand(false);
		const subcommandGroup = interaction.options.getSubcommandGroup(false);
		let executed = false;

		if (subcommand) {
			const key = subcommandGroup
				? `${subcommandGroup}:${subcommand}`
				: subcommand;
			const subcommands = (this.constructor as ICommandClass).subcommands;

			if (subcommands && subcommands.has(key)) {
				const subcommandInfo = subcommands.get(key);
				if (subcommandInfo) {
					const { method, permission } = subcommandInfo;

					if (
						permission &&
						!(await this.checkPermission(interaction, permission))
					) {
						return;
					}

					await (
						this as unknown as Record<
							string,
							(
								client: Client,
								interaction: ChatInputCommandInteraction,
							) => Promise<void>
						>
					)[method]!(client, interaction);
					this.logger.log(
						`Command ${this.constructor.name} (subcommand: ${key}) executed successfully`,
					);
					executed = true;
				}
			}
		}

		if (!executed) {
			const optionRoutes = (this.constructor as ICommandClass)
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
								))
							) {
								return;
							}

							await (
								this as unknown as Record<
									string,
									(
										client: Client,
										interaction: ChatInputCommandInteraction,
									) => Promise<void>
								>
							)[method]!(client, interaction);
							this.logger.log(
								`Command ${this.constructor.name} (option: ${optionName}) executed successfully`,
							);
							executed = true;
							break;
						}
					}
				}
			}
		}

		if (!executed) {
			const defaultCommand = (this.constructor as ICommandClass)
				.defaultCommand;
			if (defaultCommand) {
				const permission = (this.constructor as ICommandClass)
					.defaultCommandPermission;

				if (
					permission &&
					!(await this.checkPermission(interaction, permission))
				) {
					return;
				}

				await (
					this as unknown as Record<
						string,
						(
							client: Client,
							interaction: ChatInputCommandInteraction,
						) => Promise<void>
					>
				)[defaultCommand]!(client, interaction);
				this.logger.log(
					`Command ${this.constructor.name} executed successfully`,
				);
			}
		}
	}

	protected async checkPermission(
		interaction: ChatInputCommandInteraction,
		permission: string,
	): Promise<boolean> {
		let roleIds: string[] = [];
		if (interaction.member) {
			if (Array.isArray(interaction.member.roles)) {
				roleIds = interaction.member.roles;
			} else {
				roleIds = interaction.member.roles.cache.map((r) => r.id);
			}
		}

		const hasPermission = await PermissionService.hasPermission(
			interaction.user.id,
			interaction.guild?.ownerId,
			roleIds,
			permission,
		);

		if (!hasPermission) {
			this.logger.log(
				`Permission denied for command ${this.constructor.name}: User ${interaction.user.tag} missing ${permission}`,
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
