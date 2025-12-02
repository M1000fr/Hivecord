import { ChatInputCommandInteraction, Client, MessageFlags, AutocompleteInteraction } from "discord.js";
import { PermissionService } from '@services/PermissionService';

export abstract class BaseCommand {
    async handleAutocomplete(client: Client, interaction: AutocompleteInteraction): Promise<void> {
        const focusedOption = interaction.options.getFocused(true);
        const autocompletes = (this.constructor as any).autocompletes;

        if (autocompletes && autocompletes.has(focusedOption.name)) {
            const method = autocompletes.get(focusedOption.name);
            await (this as any)[method](client, interaction);
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
			const subcommands = (this.constructor as any).subcommands;

			if (subcommands && subcommands.has(key)) {
				const { method, permission } = subcommands.get(key);

				if (permission) {
					let roleIds: string[] = [];
					if (interaction.member) {
						if (Array.isArray(interaction.member.roles)) {
							roleIds = interaction.member.roles;
						} else {
							roleIds = interaction.member.roles.cache.map(
								(r) => r.id,
							);
						}
					}

					const hasPermission = await PermissionService.hasPermission(
						interaction.user.id,
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
				}

				await (this as any)[method](client, interaction);
				executed = true;
			}
		}

		if (!executed) {
			const optionRoutes = (this.constructor as any).optionRoutes;
			if (optionRoutes) {
				for (const [optionName, valueMap] of optionRoutes) {
					const optionValue = interaction.options.get(optionName)?.value;

					if (optionValue !== undefined && valueMap.has(optionValue)) {
						const { method, permission } = valueMap.get(optionValue);

						if (permission) {
							let roleIds: string[] = [];
							if (interaction.member) {
								if (Array.isArray(interaction.member.roles)) {
									roleIds = interaction.member.roles;
								} else {
									roleIds = interaction.member.roles.cache.map(
										(r) => r.id,
									);
								}
							}

							const hasPermission = await PermissionService.hasPermission(
								interaction.user.id,
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
						}

						await (this as any)[method](client, interaction);
						executed = true;
						break;
					}
				}
			}
		}

		if (!executed) {
			const defaultCommand = (this.constructor as any).defaultCommand;
			if (defaultCommand) {
				const permission = (this.constructor as any)
					.defaultCommandPermission;
				if (permission) {
					let roleIds: string[] = [];
					if (interaction.member) {
						if (Array.isArray(interaction.member.roles)) {
							roleIds = interaction.member.roles;
						} else {
							roleIds = interaction.member.roles.cache.map(
								(r) => r.id,
							);
						}
					}

					const hasPermission = await PermissionService.hasPermission(
						interaction.user.id,
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
				}
				await (this as any)[defaultCommand](client, interaction);
			}
		}
	}
}
