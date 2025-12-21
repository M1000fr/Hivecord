import { I18nService } from "@modules/Core/services/I18nService";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	type APIEmbed,
} from "discord.js";

export class EmbedEditorMenus {
	static getMainMenu(lng: string) {
		const t = I18nService.getFixedT(lng);
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
						label: t(
							"modules.configuration.utils.embed_editor.menu.title_url.label",
						),
						value: "edit_title",
						description: t(
							"modules.configuration.utils.embed_editor.menu.title_url.description",
						),
						emoji: "📝",
					},
					{
						label: t(
							"modules.configuration.utils.embed_editor.menu.description.label",
						),
						value: "edit_description",
						description: t(
							"modules.configuration.utils.embed_editor.menu.description.description",
						),
						emoji: "📄",
					},
					{
						label: t(
							"modules.configuration.utils.embed_editor.menu.author.label",
						),
						value: "edit_author",
						description: t(
							"modules.configuration.utils.embed_editor.menu.author.description",
						),
						emoji: "👤",
					},
					{
						label: t(
							"modules.configuration.utils.embed_editor.menu.footer.label",
						),
						value: "edit_footer",
						description: t(
							"modules.configuration.utils.embed_editor.menu.footer.description",
						),
						emoji: "🦶",
					},
					{
						label: t(
							"modules.configuration.utils.embed_editor.menu.images.label",
						),
						value: "edit_images",
						description: t(
							"modules.configuration.utils.embed_editor.menu.images.description",
						),
						emoji: "🖼️",
					},
					{
						label: t(
							"modules.configuration.utils.embed_editor.menu.color.label",
						),
						value: "edit_color",
						description: t(
							"modules.configuration.utils.embed_editor.menu.color.description",
						),
						emoji: "🎨",
					},
					{
						label: t(
							"modules.configuration.utils.embed_editor.menu.fields.label",
						),
						value: "edit_fields",
						description: t(
							"modules.configuration.utils.embed_editor.menu.fields.description",
						),
						emoji: "📋",
					},
				]),
		);
	}

	static getControlButtons(lng: string) {
		const t = I18nService.getFixedT(lng);
		return new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId("embed_editor_save")
				.setLabel(
					t("modules.configuration.utils.embed_editor.buttons.save"),
				)
				.setStyle(ButtonStyle.Success)
				.setEmoji("💾"),
			new ButtonBuilder()
				.setCustomId("embed_editor_cancel")
				.setLabel(
					t(
						"modules.configuration.utils.embed_editor.buttons.cancel",
					),
				)
				.setStyle(ButtonStyle.Secondary)
				.setEmoji("❌"),
		);
	}

	static getFieldsSubMenu(lng: string, fields: APIEmbed["fields"] = []) {
		const t = I18nService.getFixedT(lng);
		const options = [
			{
				label: t(
					"modules.configuration.utils.embed_editor.fields.back.label",
				),
				value: "back",
				description: t(
					"modules.configuration.utils.embed_editor.fields.back.description",
				),
				emoji: "⬅️",
			},
			{
				label: t(
					"modules.configuration.utils.embed_editor.fields.add.label",
				),
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
					label: t(
						"modules.configuration.utils.embed_editor.fields.edit.label",
						{ name: field.name.substring(0, 20) },
					),
					value: `field_edit_${index}`,
					description: t(
						"modules.configuration.utils.embed_editor.fields.edit.description",
					),
					emoji: "✏️",
				});
				options.push({
					label: t(
						"modules.configuration.utils.embed_editor.fields.remove.label",
						{ name: field.name.substring(0, 20) },
					),
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
