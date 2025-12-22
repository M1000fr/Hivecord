import {
	type APIEmbed,
	type APIEmbedField,
	LabelBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import type { TFunction } from "i18next";

export interface EmbedEditorModalData extends Partial<APIEmbed> {
	field?: APIEmbedField;
}

export class EmbedEditorModals {
	static getModal(
		t: TFunction,
		type: string,
		data: EmbedEditorModalData = {},
	): ModalBuilder {
		switch (type) {
			case "edit_title":
				return this.getTitleModal(t, data);
			case "edit_description":
				return this.getDescriptionModal(t, data);
			case "edit_author":
				return this.getAuthorModal(t, data);
			case "edit_footer":
				return this.getFooterModal(t, data);
			case "edit_images":
				return this.getImagesModal(t, data);
			case "edit_color":
				return this.getColorModal(t, data);
			case "field_add":
			case "field_edit":
				return this.getFieldModal(t, data);
			default:
				return new ModalBuilder()
					.setCustomId("error")
					.setTitle("Error: Unknown modal type");
		}
	}

	private static getTitleModal(
		t: TFunction,
		data: EmbedEditorModalData,
	): ModalBuilder {
		const modal = new ModalBuilder()
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
		return modal;
	}

	private static getDescriptionModal(
		t: TFunction,
		data: EmbedEditorModalData,
	): ModalBuilder {
		const modal = new ModalBuilder()
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
		return modal;
	}

	private static getAuthorModal(
		t: TFunction,
		data: EmbedEditorModalData,
	): ModalBuilder {
		const modal = new ModalBuilder()
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
		return modal;
	}

	private static getFooterModal(
		t: TFunction,
		data: EmbedEditorModalData,
	): ModalBuilder {
		const modal = new ModalBuilder()
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
		return modal;
	}

	private static getImagesModal(
		t: TFunction,
		data: EmbedEditorModalData,
	): ModalBuilder {
		const modal = new ModalBuilder()
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
		return modal;
	}

	private static getColorModal(
		t: TFunction,
		data: EmbedEditorModalData,
	): ModalBuilder {
		const modal = new ModalBuilder()
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
							data?.color ? `#${data.color.toString(16)}` : "",
						),
				),
		);
		return modal;
	}

	private static getFieldModal(
		t: TFunction,
		data: EmbedEditorModalData,
	): ModalBuilder {
		const modal = new ModalBuilder()
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
						.setValue(data?.field?.inline ? "true" : "false"),
				),
		);
		return modal;
	}
}
