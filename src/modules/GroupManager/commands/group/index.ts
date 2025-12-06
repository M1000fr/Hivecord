import { BaseCommand } from "@class/BaseCommand";
import { Pager } from "@class/Pager";
import { Autocomplete } from "@decorators/Autocomplete";
import { Command } from "@decorators/Command";
import { Subcommand } from "@decorators/Subcommand";
import { EPermission } from "@enums/EPermission";
import { GeneralConfigKeys } from "@modules/General/GeneralConfig";
import { GroupService } from "@modules/GroupManager/services/GroupService";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { PermissionService } from "@services/PermissionService";
import { InteractionHelper } from "@utils/InteractionHelper";
import {
	ActionRowBuilder,
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	Colors,
	EmbedBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { groupOptions } from "./groupOptions";

@Command(groupOptions)
export default class GroupCommand extends BaseCommand {
	@Autocomplete({ optionName: "name" })
	@Autocomplete({ optionName: "group" })
	async autocompleteGroup(
		client: Client,
		interaction: AutocompleteInteraction,
	) {
		const focusedValue = interaction.options.getFocused().toLowerCase();
		const groups = await GroupService.listGroups(interaction.guildId!);

		const filtered = groups
			.filter(
				(g) =>
					g.name.toLowerCase().includes(focusedValue) ||
					g.id.toString().includes(focusedValue),
			)
			.map((g) => ({
				name: `${g.id}. ${g.name}`,
				value: g.name,
			}))
			.slice(0, 25);

		await interaction.respond(filtered);
	}

	@Subcommand({ name: "create", permission: EPermission.GroupsCreate })
	async create(client: Client, interaction: ChatInputCommandInteraction) {
		const lng =
			(await ConfigService.get(
				interaction.guildId!,
				GeneralConfigKeys.language,
			)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const name = interaction.options.getString("name", true);
		const role = interaction.options.getRole("role", true);

		await InteractionHelper.defer(interaction);

		if (!interaction.guild) return;

		try {
			await GroupService.createGroup(interaction.guild, name, role.id);
			await InteractionHelper.respondSuccess(
				interaction,
				t("modules.configuration.commands.group.created", { name }),
			);
		} catch (error: unknown) {
			await InteractionHelper.respondError(
				interaction,
				t("modules.configuration.commands.group.create_failed", {
					error:
						error instanceof Error ? error.message : String(error),
				}),
			);
		}
	}

	@Subcommand({ name: "delete", permission: EPermission.GroupsDelete })
	async delete(client: Client, interaction: ChatInputCommandInteraction) {
		const lng =
			(await ConfigService.get(
				interaction.guildId!,
				GeneralConfigKeys.language,
			)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const name = interaction.options.getString("name", true);

		await InteractionHelper.defer(interaction);

		try {
			await GroupService.deleteGroup(interaction.guildId!, name);
			await InteractionHelper.respondSuccess(
				interaction,
				t("modules.configuration.commands.group.deleted", { name }),
			);
		} catch (error: unknown) {
			await InteractionHelper.respondError(
				interaction,
				t("modules.configuration.commands.group.delete_failed", {
					error:
						error instanceof Error ? error.message : String(error),
				}),
			);
		}
	}

	@Subcommand({ name: "permissions", permission: EPermission.GroupsUpdate })
	async permissions(
		client: Client,
		interaction: ChatInputCommandInteraction,
	) {
		const lng =
			(await ConfigService.get(
				interaction.guildId!,
				GeneralConfigKeys.language,
			)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const groupName = interaction.options.getString("group", true);

		await InteractionHelper.defer(interaction, true);

		try {
			const group = await GroupService.getGroup(
				interaction.guildId!,
				groupName,
			);
			if (!group) {
				await InteractionHelper.respondError(
					interaction,
					t("modules.configuration.services.group.not_found", {
						lng,
						name: groupName,
					}),
				);
				return;
			}

			const groupPermissions = group.Permissions.map(
				(p) => p.Permissions.name,
			);
			const allPermissions = await PermissionService.getAllPermissions();
			const rows: ActionRowBuilder<StringSelectMenuBuilder>[] = [];

			// Split permissions into chunks of 25
			for (let i = 0; i < allPermissions.length; i += 25) {
				const chunk = allPermissions.slice(i, i + 25);
				const options = chunk.map((perm) => {
					return new StringSelectMenuOptionBuilder()
						.setLabel(perm)
						.setValue(perm)
						.setDefault(groupPermissions.includes(perm));
				});

				const selectMenu = new StringSelectMenuBuilder()
					.setCustomId(`group_permissions_${group.id}_${i}`)
					.setPlaceholder(
						t(
							"modules.configuration.commands.group.select_permissions",
						),
					)
					.setMinValues(0)
					.setMaxValues(chunk.length)
					.addOptions(options);

				rows.push(
					new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
						selectMenu,
					),
				);
			}

			const perms =
				groupPermissions.map((p) => `\`${p}\``).join(", ") ||
				t("common.none");

			const embed = new EmbedBuilder()
				.setTitle(
					t(
						"modules.configuration.commands.group.permissions_title",
						{
							group: group.name,
						},
					),
				)
				.setDescription(
					`**${t("modules.configuration.commands.group.group")}:** ${group.name}\n**${t("modules.configuration.commands.group.role")}:** <@&${group.roleId}>\n**${t("modules.configuration.commands.group.permissions")}:**\n${perms}`,
				)
				.setColor(Colors.Blue)
				.setTimestamp();

			await interaction.editReply({
				content: null,
				embeds: [embed],
				components: rows,
			});
		} catch (error: unknown) {
			await InteractionHelper.respondError(
				interaction,
				t("modules.configuration.commands.group.permissions_failed", {
					error:
						error instanceof Error ? error.message : String(error),
				}),
			);
		}
	}

	@Subcommand({ name: "list", permission: EPermission.GroupsList })
	async list(client: Client, interaction: ChatInputCommandInteraction) {
		const lng =
			(await ConfigService.get(
				interaction.guildId!,
				GeneralConfigKeys.language,
			)) ?? "en";
		const t = I18nService.getFixedT(lng);
		await InteractionHelper.defer(interaction, false);

		try {
			const groups = await GroupService.listGroups(interaction.guildId!);
			if (groups.length === 0) {
				await interaction.editReply(
					t("modules.configuration.commands.group.no_groups"),
				);
				return;
			}

			const pager = new Pager({
				items: groups,
				itemsPerPage: 1,
				userId: interaction.user.id,
				renderPage: async (items, pageIndex, totalPages) => {
					const group = items[0];
					if (!group) return { embeds: [], components: [] };

					const perms =
						group.Permissions.map(
							(p) => `\`${p.Permissions.name}\``,
						).join(", ") || t("common.none");

					const embed = new EmbedBuilder()
						.setTitle(
							t(
								"modules.configuration.commands.group.list_title",
								{
									current: pageIndex + 1,
									total: totalPages,
								},
							),
						)
						.setDescription(
							`**${t("modules.configuration.commands.group.group")}:** ${group.name}\n**${t("modules.configuration.commands.group.role")}:** <@&${group.roleId}>\n**${t("modules.configuration.commands.group.permissions")}:**\n${perms}`,
						)
						.setColor(Colors.Blue)
						.setTimestamp();

					return { embeds: [embed], components: [] };
				},
			});

			await pager.start(interaction);
		} catch (error: unknown) {
			await InteractionHelper.respondError(
				interaction,
				t("modules.configuration.commands.group.list_failed", {
					error:
						error instanceof Error ? error.message : String(error),
				}),
			);
		}
	}
}
