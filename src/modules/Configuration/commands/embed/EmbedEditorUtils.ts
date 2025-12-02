import {
	ActionRowBuilder,
	StringSelectMenuBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ButtonBuilder,
	ButtonStyle,
	type APIEmbed,
	Colors,
} from "discord.js";

export class EmbedEditorUtils {
	static getMainMenu() {
		return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId("embed_editor_menu")
				.setPlaceholder("Select an element to edit")
				.addOptions([
					{
						label: "Title & URL",
						value: "edit_title",
						description: "Edit the title and the title URL",
						emoji: "📝",
					},
					{
						label: "Description",
						value: "edit_description",
						description: "Edit the main content",
						emoji: "📄",
					},
					{
						label: "Author",
						value: "edit_author",
						description: "Edit author name and icon",
						emoji: "👤",
					},
					{
						label: "Footer",
						value: "edit_footer",
						description: "Edit footer text and icon",
						emoji: "🦶",
					},
					{
						label: "Thumbnail & Image",
						value: "edit_images",
						description: "Edit thumbnail and main image",
						emoji: "🖼️",
					},
					{
						label: "Color",
						value: "edit_color",
						description: "Change the embed color",
						emoji: "🎨",
					},
					{
						label: "Fields",
						value: "edit_fields",
						description: "Add, edit or remove fields",
						emoji: "📋",
					},
				]),
		);
	}

	static getControlButtons() {
		return new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId("embed_editor_save")
				.setLabel("Save")
				.setStyle(ButtonStyle.Success)
				.setEmoji("💾"),
			new ButtonBuilder()
				.setCustomId("embed_editor_cancel")
				.setLabel("Cancel")
				.setStyle(ButtonStyle.Secondary)
				.setEmoji("❌"),
		);
	}

	static getFieldsSubMenu(fields: APIEmbed["fields"] = []) {
		const options = [
			{
				label: "Back",
				value: "back",
				description: "Return to main menu",
				emoji: "⬅️",
			},
			{
				label: "Add Field",
				value: "field_add",
				description: "Add a new field",
				emoji: "➕",
			},
		];

		if (fields && fields.length > 0) {
			fields.forEach((field, index) => {
				options.push({
					label: `Edit: ${field.name.substring(0, 20)}...`,
					value: `field_edit_${index}`,
					description: "Edit this field",
					emoji: "✏️",
				});
				options.push({
					label: `Remove: ${field.name.substring(0, 20)}...`,
					value: `field_remove_${index}`,
					description: "Remove this field",
					emoji: "🗑️",
				});
			});
		}

		return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId("embed_editor_fields_menu")
				.setPlaceholder("Manage Fields")
				.addOptions(options),
		);
	}

	static getModal(type: string, currentData?: any): ModalBuilder {
		const modal = new ModalBuilder();

		switch (type) {
			case "edit_title":
				modal.setCustomId("modal_embed_title").setTitle("Edit Title");
				modal.addComponents(
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("title")
							.setLabel("Title")
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
							.setValue(currentData?.title || ""),
					),
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("url")
							.setLabel("URL")
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
							.setValue(currentData?.url || ""),
					),
				);
				break;

			case "edit_description":
				modal
					.setCustomId("modal_embed_description")
					.setTitle("Edit Description");
				modal.addComponents(
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("description")
							.setLabel("Description")
							.setStyle(TextInputStyle.Paragraph)
							.setRequired(false)
							.setValue(currentData?.description || ""),
					),
				);
				break;

			case "edit_author":
				modal.setCustomId("modal_embed_author").setTitle("Edit Author");
				modal.addComponents(
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("name")
							.setLabel("Name")
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
							.setValue(currentData?.author?.name || ""),
					),
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("icon_url")
							.setLabel("Icon URL")
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
							.setValue(currentData?.author?.icon_url || ""),
					),
				);
				break;

			case "edit_footer":
				modal.setCustomId("modal_embed_footer").setTitle("Edit Footer");
				modal.addComponents(
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("text")
							.setLabel("Text")
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
							.setValue(currentData?.footer?.text || ""),
					),
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("icon_url")
							.setLabel("Icon URL")
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
							.setValue(currentData?.footer?.icon_url || ""),
					),
				);
				break;

			case "edit_images":
				modal.setCustomId("modal_embed_images").setTitle("Edit Images");
				modal.addComponents(
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("image")
							.setLabel("Main Image URL")
							.setPlaceholder(
								"https://... or attachment://filename.png",
							)
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
							.setValue(currentData?.image?.url || ""),
					),
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("thumbnail")
							.setLabel("Thumbnail URL")
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
							.setValue(currentData?.thumbnail?.url || ""),
					),
				);
				break;

			case "edit_color":
				modal.setCustomId("modal_embed_color").setTitle("Edit Color");
				modal.addComponents(
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("color")
							.setLabel("Color (Hex or Int)")
							.setPlaceholder("#FF0000 or 16711680")
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
				modal.setCustomId("modal_embed_field").setTitle("Edit Field");

				modal.addComponents(
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("name")
							.setLabel("Name")
							.setStyle(TextInputStyle.Short)
							.setRequired(true)
							.setValue(currentData?.field?.name || ""),
					),
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("value")
							.setLabel("Value")
							.setStyle(TextInputStyle.Paragraph)
							.setRequired(true)
							.setValue(currentData?.field?.value || ""),
					),
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("inline")
							.setLabel("Inline? (true/false)")
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
