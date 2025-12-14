import { I18nService } from "@services/I18nService";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	LabelBuilder,
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
		currentData?: unknown,
	): ModalBuilder {
		const t = I18nService.getFixedT(lng);
		const modal = new ModalBuilder();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const data = currentData as any;

		switch (type) {
			case "edit_title":
				modal
					.setCustomId("modal_embed_title")
					.setTitle(
						t(
							"modules.configuration.utils.embed_editor.modals.title.title",
						),
					);
				modal.addLabelComponents(
					new LabelBuilder()
						.setLabel(
							t(
								"modules.configuration.utils.embed_editor.modals.title.label",
							),
						)
						.setTextInputComponent(
							new TextInputBuilder()
								.setCustomId("title")
								.setStyle(TextInputStyle.Short)
								.setRequired(false)
								.setValue(data?.title || ""),
						),
					new LabelBuilder()
						.setLabel(
							t(
								"modules.configuration.utils.embed_editor.modals.title.url_label",
							),
						)
						.setTextInputComponent(
							new TextInputBuilder()
								.setCustomId("url")
								.setStyle(TextInputStyle.Short)
								.setRequired(false)
								.setValue(data?.url || ""),
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
				modal.addLabelComponents(
					new LabelBuilder()
						.setLabel(
							t(
								"modules.configuration.utils.embed_editor.modals.description.label",
							),
						)
						.setTextInputComponent(
							new TextInputBuilder()
								.setCustomId("description")
								.setStyle(TextInputStyle.Paragraph)
								.setRequired(false)
								.setValue(data?.description || ""),
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
				modal.addLabelComponents(
					new LabelBuilder()
						.setLabel(
							t(
								"modules.configuration.utils.embed_editor.modals.author.name_label",
							),
						)
						.setTextInputComponent(
							new TextInputBuilder()
								.setCustomId("name")
								.setStyle(TextInputStyle.Short)
								.setRequired(false)
								.setValue(data?.author?.name || ""),
						),
					new LabelBuilder()
						.setLabel(
							t(
								"modules.configuration.utils.embed_editor.modals.author.icon_label",
							),
						)
						.setTextInputComponent(
							new TextInputBuilder()
								.setCustomId("icon_url")
								.setStyle(TextInputStyle.Short)
								.setRequired(false)
								.setValue(data?.author?.icon_url || ""),
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
				modal.addLabelComponents(
					new LabelBuilder()
						.setLabel(
							t(
								"modules.configuration.utils.embed_editor.modals.footer.text_label",
							),
						)
						.setTextInputComponent(
							new TextInputBuilder()
								.setCustomId("text")
								.setStyle(TextInputStyle.Short)
								.setRequired(false)
								.setValue(data?.footer?.text || ""),
						),
					new LabelBuilder()
						.setLabel(
							t(
								"modules.configuration.utils.embed_editor.modals.footer.icon_label",
							),
						)
						.setTextInputComponent(
							new TextInputBuilder()
								.setCustomId("icon_url")
								.setStyle(TextInputStyle.Short)
								.setRequired(false)
								.setValue(data?.footer?.icon_url || ""),
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
				modal.addLabelComponents(
					new LabelBuilder()
						.setLabel(
							t(
								"modules.configuration.utils.embed_editor.modals.images.image_label",
							),
						)
						.setTextInputComponent(
							new TextInputBuilder()
								.setCustomId("image")
								.setPlaceholder(
									t(
										"modules.configuration.utils.embed_editor.modals.images.image_placeholder",
									),
								)
								.setStyle(TextInputStyle.Short)
								.setRequired(false)
								.setValue(data?.image?.url || ""),
						),
					new LabelBuilder()
						.setLabel(
							t(
								"modules.configuration.utils.embed_editor.modals.images.thumbnail_label",
							),
						)
						.setTextInputComponent(
							new TextInputBuilder()
								.setCustomId("thumbnail")
								.setStyle(TextInputStyle.Short)
								.setRequired(false)
								.setValue(data?.thumbnail?.url || ""),
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
				modal.addLabelComponents(
					new LabelBuilder()
						.setLabel(
							t(
								"modules.configuration.utils.embed_editor.modals.color.label",
							),
						)
						.setTextInputComponent(
							new TextInputBuilder()
								.setCustomId("color")
								.setPlaceholder(
									t(
										"modules.configuration.utils.embed_editor.modals.color.placeholder",
									),
								)
								.setStyle(TextInputStyle.Short)
								.setRequired(false)
								.setValue(
									data?.color
										? `#${data.color.toString(16)}`
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

				modal.addLabelComponents(
					new LabelBuilder()
						.setLabel(
							t(
								"modules.configuration.utils.embed_editor.modals.field.name_label",
							),
						)
						.setTextInputComponent(
							new TextInputBuilder()
								.setCustomId("name")
								.setStyle(TextInputStyle.Short)
								.setRequired(true)
								.setValue(data?.field?.name || ""),
						),
					new LabelBuilder()
						.setLabel(
							t(
								"modules.configuration.utils.embed_editor.modals.field.value_label",
							),
						)
						.setTextInputComponent(
							new TextInputBuilder()
								.setCustomId("value")
								.setStyle(TextInputStyle.Paragraph)
								.setRequired(true)
								.setValue(data?.field?.value || ""),
						),
					new LabelBuilder()
						.setLabel(
							t(
								"modules.configuration.utils.embed_editor.modals.field.inline_label",
							),
						)
						.setTextInputComponent(
							new TextInputBuilder()
								.setCustomId("inline")
								.setStyle(TextInputStyle.Short)
								.setRequired(false)
								.setValue(
									data?.field?.inline ? "true" : "false",
								),
						),
				);
				break;
		}

		return modal;
	}
}
