import { BaseCommand } from "@class/BaseCommand";
import { Pager } from "@class/Pager";
import { Autocomplete } from "@decorators/Autocomplete";
import { Command } from "@decorators/Command";
import { Subcommand } from "@decorators/Subcommand";
import { EPermission } from "@enums/EPermission";
import { GroupService } from "@modules/Configuration/services/GroupService";
import { GeneralConfigKeys } from "@modules/General/GeneralConfig";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { InteractionHelper } from "@utils/InteractionHelper";
import {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	Colors,
	EmbedBuilder,
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
		const groups = await GroupService.listGroups();

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

	@Autocomplete({ optionName: "permission" })
	async autocompletePermission(
		client: Client,
		interaction: AutocompleteInteraction,
	) {
		const focusedValue = interaction.options.getFocused().toLowerCase();
		const subcommandGroup = interaction.options.getSubcommandGroup();
		const subcommand = interaction.options.getSubcommand();
		const groupName = interaction.options.getString("group");

		let permissions: string[] = [];

		if (subcommandGroup === "permissions") {
			if (groupName) {
				const group = await GroupService.getGroup(groupName);
				if (group) {
					const groupPermissions = group.Permissions.map(
						(p) => p.Permissions.name,
					);

					if (subcommand === "add") {
						permissions = Object.values(EPermission).filter(
							(p) => !groupPermissions.includes(p),
						);
					} else if (subcommand === "remove") {
						permissions = groupPermissions;
					}
				} else if (subcommand === "add") {
					permissions = Object.values(EPermission);
				}
			} else if (subcommand === "add") {
				permissions = Object.values(EPermission);
			}
		}

		const filtered = permissions
			.filter((p) => p.toLowerCase().includes(focusedValue))
			.map((p) => ({
				name: p,
				value: p,
			}))
			.slice(0, 25);

		await interaction.respond(filtered);
	}

	private async sendGroupEmbed(
		interaction: ChatInputCommandInteraction,
		groupName: string,
		title: string,
	) {
		const lng =
			(await ConfigService.get(GeneralConfigKeys.language)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const group = await GroupService.getGroup(groupName);
		if (!group) return;

		const perms =
			group.Permissions.map((p) => `\`${p.Permissions.name}\``).join(
				", ",
			) || t("common.none");

		const embed = new EmbedBuilder()
			.setTitle(title)
			.setDescription(
				`**${t("modules.configuration.commands.group.group")}:** ${group.name}\n**${t("modules.configuration.commands.group.role")}:** <@&${group.roleId}>\n**${t("modules.configuration.commands.group.permissions")}:**\n${perms}`,
			)
			.setColor(Colors.Blue)
			.setTimestamp();

		await interaction.editReply({ content: null, embeds: [embed] });
	}

	@Subcommand({ name: "create", permission: EPermission.GroupsCreate })
	async create(client: Client, interaction: ChatInputCommandInteraction) {
		const lng =
			(await ConfigService.get(GeneralConfigKeys.language)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const name = interaction.options.getString("name", true);
		const role = interaction.options.getRole("role", true);

		await InteractionHelper.defer(interaction, true);

		try {
			await GroupService.createGroup(name, role.id);
			await this.sendGroupEmbed(
				interaction,
				name,
				t("modules.configuration.commands.group.created"),
			);
		} catch (error: any) {
			await InteractionHelper.respondError(
				interaction,
				t("modules.configuration.commands.group.create_failed", {
					error: error.message,
				}),
			);
		}
	}

	@Subcommand({ name: "delete", permission: EPermission.GroupsDelete })
	async delete(client: Client, interaction: ChatInputCommandInteraction) {
		const lng =
			(await ConfigService.get(GeneralConfigKeys.language)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const name = interaction.options.getString("name", true);

		await InteractionHelper.defer(interaction, true);

		try {
			await GroupService.deleteGroup(name);
			await interaction.editReply(
				t("modules.configuration.commands.group.deleted", { name }),
			);
		} catch (error: any) {
			await InteractionHelper.respondError(
				interaction,
				t("modules.configuration.commands.group.delete_failed", {
					error: error.message,
				}),
			);
		}
	}

	@Subcommand({
		name: "add",
		group: "permissions",
		permission: EPermission.GroupsUpdate,
	})
	async addPerm(client: Client, interaction: ChatInputCommandInteraction) {
		const lng =
			(await ConfigService.get(GeneralConfigKeys.language)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const groupName = interaction.options.getString("group", true);
		const permission = interaction.options.getString("permission", true);

		await InteractionHelper.defer(interaction, true);

		try {
			await GroupService.addPermission(groupName, permission);
			await this.sendGroupEmbed(
				interaction,
				groupName,
				t("modules.configuration.commands.group.permission_added"),
			);
		} catch (error: any) {
			await InteractionHelper.respondError(
				interaction,
				t(
					"modules.configuration.commands.group.permission_add_failed",
					{
						error: error.message,
					},
				),
			);
		}
	}

	@Subcommand({
		name: "remove",
		group: "permissions",
		permission: EPermission.GroupsUpdate,
	})
	async removePerm(client: Client, interaction: ChatInputCommandInteraction) {
		const lng =
			(await ConfigService.get(GeneralConfigKeys.language)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const groupName = interaction.options.getString("group", true);
		const permission = interaction.options.getString("permission", true);

		await InteractionHelper.defer(interaction, true);

		try {
			await GroupService.removePermission(groupName, permission);
			await this.sendGroupEmbed(
				interaction,
				groupName,
				t("modules.configuration.commands.group.permission_removed"),
			);
		} catch (error: any) {
			await InteractionHelper.respondError(
				interaction,
				t(
					"modules.configuration.commands.group.permission_remove_failed",
					{ error: error.message },
				),
			);
		}
	}

	@Subcommand({ name: "list", permission: EPermission.GroupsList })
	async list(client: Client, interaction: ChatInputCommandInteraction) {
		const lng =
			(await ConfigService.get(GeneralConfigKeys.language)) ?? "en";
		const t = I18nService.getFixedT(lng);
		await InteractionHelper.defer(interaction, false);

		try {
			const groups = await GroupService.listGroups();
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
		} catch (error: any) {
			await InteractionHelper.respondError(
				interaction,
				t("modules.configuration.commands.group.list_failed", {
					error: error.message,
				}),
			);
		}
	}
}
