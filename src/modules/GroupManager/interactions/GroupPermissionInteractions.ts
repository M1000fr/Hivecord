import { SelectMenuPattern } from "@decorators/Interaction";
import { GeneralConfigKeys } from "@modules/General/GeneralConfig";
import { GroupService } from "@modules/GroupManager/services/GroupService";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { PermissionService } from "@services/PermissionService";
import { InteractionHelper } from "@utils/InteractionHelper";
import {
	ActionRowBuilder,
	Colors,
	EmbedBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
	StringSelectMenuOptionBuilder,
} from "discord.js";

export class GroupPermissionInteractions {
	@SelectMenuPattern("group_permissions_*")
	async handlePermissions(interaction: StringSelectMenuInteraction) {
		const lng =
			(await ConfigService.get(
				interaction.guildId!,
				GeneralConfigKeys.language,
			)) ?? "en";
		const t = I18nService.getFixedT(lng);

		const parts = interaction.customId.split("_");
		const groupId = parts[2];
		const offsetStr = parts[3];

		if (!groupId || !offsetStr) return;

		const id = parseInt(groupId);
		const offset = parseInt(offsetStr);

		await InteractionHelper.defer(interaction, true);

		try {
			const group = await GroupService.getGroupById(id);
			if (!group) {
				await InteractionHelper.respondError(
					interaction,
					t("modules.configuration.services.group.not_found_id", {
						lng,
						id,
					}),
				);
				return;
			}

			const allPermissions = await PermissionService.getAllPermissions();
			const chunk = allPermissions.slice(offset, offset + 25);
			const selectedValues = interaction.values;

			const toAdd = selectedValues.filter((p) => chunk.includes(p));
			const toRemove = chunk.filter((p) => !selectedValues.includes(p));

			await GroupService.updatePermissions(
				id,
				toAdd,
				toRemove as string[],
			);

			// Re-fetch group to get updated permissions
			const updatedGroup = await GroupService.getGroupById(id);
			if (!updatedGroup) return;

			const groupPermissions = updatedGroup.Permissions.map(
				(p) => p.Permissions.name,
			);
			const rows: ActionRowBuilder<StringSelectMenuBuilder>[] = [];

			// Re-build all select menus
			for (let i = 0; i < allPermissions.length; i += 25) {
				const currentChunk = allPermissions.slice(i, i + 25);
				const options = currentChunk.map((perm) => {
					return new StringSelectMenuOptionBuilder()
						.setLabel(perm)
						.setValue(perm)
						.setDefault(groupPermissions.includes(perm));
				});

				const selectMenu = new StringSelectMenuBuilder()
					.setCustomId(`group_permissions_${updatedGroup.id}_${i}`)
					.setPlaceholder(
						t(
							"modules.configuration.commands.group.select_permissions",
						),
					)
					.setMinValues(0)
					.setMaxValues(currentChunk.length)
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
							group: updatedGroup.name,
						},
					),
				)
				.setDescription(
					`**${t("modules.configuration.commands.group.group")}:** ${updatedGroup.name}\n**${t("modules.configuration.commands.group.role")}:** <@&${updatedGroup.roleId}>\n**${t("modules.configuration.commands.group.permissions")}:**\n${perms}`,
				)
				.setColor(Colors.Blue)
				.setTimestamp();

			await interaction.editReply({
				content: null,
				embeds: [embed],
				components: rows,
			});
		} catch (error) {
			await InteractionHelper.respondError(
				interaction,
				t("modules.configuration.commands.group.permissions_failed", {
					error:
						error instanceof Error ? error.message : String(error),
				}),
			);
		}
	}
}
