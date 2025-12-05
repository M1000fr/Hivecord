import { I18nService } from "@services/I18nService";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ModalBuilder,
	StringSelectMenuBuilder,
	TextInputBuilder,
	TextInputStyle,
	type APIEmbed,
} from "discord.js";

export class EmbedEditorUtils {
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

	static getModal(
		lng: string,
		type: string,
		currentData?: any,
	): ModalBuilder {
		const t = I18nService.getFixedT(lng);
		const modal = new ModalBuilder();

		switch (type) {
			case "edit_title":
				modal
					.setCustomId("modal_embed_title")
					.setTitle(
						t(
							"modules.configuration.utils.embed_editor.modals.title.title",
						),
					);
				modal.addComponents(
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("title")
							.setLabel(
								t(
									"modules.configuration.utils.embed_editor.modals.title.label",
								),
							)
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
							.setValue(currentData?.title || ""),
					),
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("url")
							.setLabel(
								t(
									"modules.configuration.utils.embed_editor.modals.title.url_label",
								),
							)
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
							.setValue(currentData?.url || ""),
					),
				);
				break;

			case "edit_description":
				modal
					.setCustomId("modal_embed_description")
					.setTitle(
						t(
							"modules.configuration.utils.embed_editor.modals.description.title",
						),
					);
				modal.addComponents(
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("description")
							.setLabel(
								t(
									"modules.configuration.utils.embed_editor.modals.description.label",
								),
							)
							.setStyle(TextInputStyle.Paragraph)
							.setRequired(false)
							.setValue(currentData?.description || ""),
					),
				);
				break;

			case "edit_author":
				modal
					.setCustomId("modal_embed_author")
					.setTitle(
						t(
							"modules.configuration.utils.embed_editor.modals.author.title",
						),
					);
				modal.addComponents(
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("name")
							.setLabel(
								t(
									"modules.configuration.utils.embed_editor.modals.author.name_label",
								),
							)
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
							.setValue(currentData?.author?.name || ""),
					),
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("icon_url")
							.setLabel(
								t(
									"modules.configuration.utils.embed_editor.modals.author.icon_label",
								),
							)
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
							.setValue(currentData?.author?.icon_url || ""),
					),
				);
				break;

			case "edit_footer":
				modal
					.setCustomId("modal_embed_footer")
					.setTitle(
						t(
							"modules.configuration.utils.embed_editor.modals.footer.title",
						),
					);
				modal.addComponents(
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("text")
							.setLabel(
								t(
									"modules.configuration.utils.embed_editor.modals.footer.text_label",
								),
							)
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
							.setValue(currentData?.footer?.text || ""),
					),
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("icon_url")
							.setLabel(
								t(
									"modules.configuration.utils.embed_editor.modals.footer.icon_label",
								),
							)
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
							.setValue(currentData?.footer?.icon_url || ""),
					),
				);
				break;

			case "edit_images":
				modal
					.setCustomId("modal_embed_images")
					.setTitle(
						t(
							"modules.configuration.utils.embed_editor.modals.images.title",
						),
					);
				modal.addComponents(
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("image")
							.setLabel(
								t(
									"modules.configuration.utils.embed_editor.modals.images.image_label",
								),
							)
							.setPlaceholder(
								t(
									"modules.configuration.utils.embed_editor.modals.images.image_placeholder",
								),
							)
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
							.setValue(currentData?.image?.url || ""),
					),
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("thumbnail")
							.setLabel(
								t(
									"modules.configuration.utils.embed_editor.modals.images.thumbnail_label",
								),
							)
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
							.setValue(currentData?.thumbnail?.url || ""),
					),
				);
				break;

			case "edit_color":
				modal
					.setCustomId("modal_embed_color")
					.setTitle(
						t(
							"modules.configuration.utils.embed_editor.modals.color.title",
						),
					);
				modal.addComponents(
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("color")
							.setLabel(
								t(
									"modules.configuration.utils.embed_editor.modals.color.label",
								),
							)
							.setPlaceholder(
								t(
									"modules.configuration.utils.embed_editor.modals.color.placeholder",
								),
							)
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
							.setValue(
								currentData?.color
									? `#${currentData.color.toString(16)}`
									: "",
							),
					),
				);
				break;

			case "field_add":
			case "field_edit":
				modal
					.setCustomId("modal_embed_field")
					.setTitle(
						t(
							"modules.configuration.utils.embed_editor.modals.field.title",
						),
					);

				modal.addComponents(
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("name")
							.setLabel(
								t(
									"modules.configuration.utils.embed_editor.modals.field.name_label",
								),
							)
							.setStyle(TextInputStyle.Short)
							.setRequired(true)
							.setValue(currentData?.field?.name || ""),
					),
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("value")
							.setLabel(
								t(
									"modules.configuration.utils.embed_editor.modals.field.value_label",
								),
							)
							.setStyle(TextInputStyle.Paragraph)
							.setRequired(true)
							.setValue(currentData?.field?.value || ""),
					),
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("inline")
							.setLabel(
								t(
									"modules.configuration.utils.embed_editor.modals.field.inline_label",
								),
							)
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
							.setValue(
								currentData?.field?.inline ? "true" : "false",
							),
					),
				);
				break;
		}

		return modal;
	}
}
