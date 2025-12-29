import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	type APIEmbed,
} from "discord.js";
import type { TFunction } from "i18next";

export class EmbedEditorMenus {
	static getMainMenu(t: TFunction) {
		return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId("embed_editor_menu")
				.setPlaceholder(
					t(
						"modules.configuration.utils.embed_editor.menu.placeholder",
					),
				)
				.addOptions([
					{
						label: t("common.title_url"),
						value: "edit_title",
						description: t(
							"modules.configuration.utils.embed_editor.menu.title_url.description",
						),
						emoji: "📝",
					},
					{
						label: t("common.description"),
						value: "edit_description",
						description: t(
							"modules.configuration.utils.embed_editor.menu.description.description",
						),
						emoji: "📄",
					},
					{
						label: t("common.author"),
						value: "edit_author",
						description: t(
							"modules.configuration.utils.embed_editor.menu.author.description",
						),
						emoji: "👤",
					},
					{
						label: t("common.footer"),
						value: "edit_footer",
						description: t(
							"modules.configuration.utils.embed_editor.menu.footer.description",
						),
						emoji: "🦶",
					},
					{
						label: t("common.images"),
						value: "edit_images",
						description: t(
							"modules.configuration.utils.embed_editor.menu.images.description",
						),
						emoji: "🖼️",
					},
					{
						label: t("common.color"),
						value: "edit_color",
						description: t(
							"modules.configuration.utils.embed_editor.menu.color.description",
						),
						emoji: "🎨",
					},
					{
						label: t("common.fields"),
						value: "edit_fields",
						description: t(
							"modules.configuration.utils.embed_editor.menu.fields.description",
						),
						emoji: "📋",
					},
				]),
		);
	}

	static getControlButtons(t: TFunction) {
		return new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId("embed_editor_save")
				.setLabel(t("common.save"))
				.setStyle(ButtonStyle.Success)
				.setEmoji("💾"),
			new ButtonBuilder()
				.setCustomId("embed_editor_cancel")
				.setLabel(t("common.cancel"))
				.setStyle(ButtonStyle.Secondary)
				.setEmoji("❌"),
		);
	}

	static getFieldsSubMenu(t: TFunction, fields: APIEmbed["fields"] = []) {
		const options = [
			{
				label: t("common.back"),
				value: "back",
				description: t(
					"modules.configuration.utils.embed_editor.fields.back.description",
				),
				emoji: "⬅️",
			},
			{
				label: t("common.add"),
				value: "field_add",
				description: t(
					"modules.configuration.utils.embed_editor.fields.add.description",
				),
				emoji: "➕",
			},
		];

		if (fields && fields.length > 0) {
			fields.forEach((field, index) => {
				options.push({
					label: t("common.edit", {
						name: field.name.substring(0, 20),
					}),
					value: `field_edit_${index}`,
					description: t(
						"modules.configuration.utils.embed_editor.fields.edit.description",
					),
					emoji: "✏️",
				});
				options.push({
					label: t("common.remove", {
						name: field.name.substring(0, 20),
					}),
					value: `field_remove_${index}`,
					description: t(
						"modules.configuration.utils.embed_editor.fields.remove.description",
					),
					emoji: "🗑️",
				});
			});
		}

		return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId("embed_editor_fields_menu")
				.setPlaceholder(
					t(
						"modules.configuration.utils.embed_editor.fields.placeholder",
					),
				)
				.addOptions(options),
		);
	}
}
