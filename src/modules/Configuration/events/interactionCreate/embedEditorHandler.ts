import {
	Events,
	type Interaction,
	EmbedBuilder,
	type StringSelectMenuInteraction,
	type ModalSubmitInteraction,
	type ButtonInteraction,
	Colors,
} from "discord.js";
import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { EmbedService } from "@services/EmbedService";
import { EmbedEditorUtils } from "../../commands/embed/EmbedEditorUtils";

@Event({
	name: Events.InteractionCreate,
})
export default class EmbedEditorInteractionHandler extends BaseEvent<Events.InteractionCreate> {
	async run(client: any, interaction: Interaction) {
		if (
			!interaction.isStringSelectMenu() &&
			!interaction.isModalSubmit() &&
			!interaction.isButton()
		)
			return;

		// Check if it's an embed editor interaction
		if (
			!interaction.customId.startsWith("embed_editor_") &&
			!interaction.customId.startsWith("modal_embed_")
		)
			return;

		const session = await EmbedService.getEditorSession(interaction.user.id);
		if (!session) {
			if (interaction.isRepliable()) {
				await interaction.reply({
					content: "❌ Session expired. Please start over.",
					ephemeral: true,
				});
			}
			return;
		}

		if (interaction.isStringSelectMenu()) {
			await this.handleSelectMenu(interaction, session);
		} else if (interaction.isModalSubmit()) {
			await this.handleModalSubmit(interaction, session);
		} else if (interaction.isButton()) {
			await this.handleButton(interaction, session);
		}
	}

	private async updateEditorMessage(interaction: any, session: any) {
		const embed = new EmbedBuilder(session.data);
		await interaction.update({
			content: `**Embed Editor**: Editing \`${session.name}\`\nUse the menu below to edit properties. Click **Save** when finished.`,
			embeds: [embed],
			components: [
				EmbedEditorUtils.getMainMenu(),
				EmbedEditorUtils.getControlButtons(),
			],
		});
	}

	private async handleSelectMenu(
		interaction: StringSelectMenuInteraction,
		session: any,
	) {
		const value = interaction.values[0];
		if (!value) return;

		if (interaction.customId === "embed_editor_menu") {
			if (value === "edit_fields") {
				// Show fields submenu
				const embed = new EmbedBuilder(session.data);
				await interaction.update({
					components: [
						EmbedEditorUtils.getFieldsSubMenu(session.data.fields),
						EmbedEditorUtils.getControlButtons(),
					],
				});
				return;
			}

			// Open modal for other properties
			const modal = EmbedEditorUtils.getModal(value, session.data);
			await interaction.showModal(modal);
		} else if (interaction.customId === "embed_editor_fields_menu") {
			if (value === "field_add") {
				const modal = EmbedEditorUtils.getModal("field_add");
				await interaction.showModal(modal);
			} else if (value.startsWith("field_edit_")) {
				const index = parseInt(value.split("_")[2] || "0");
				const field = session.data.fields?.[index];
				if (field) {
					const modal = EmbedEditorUtils.getModal("field_edit", {
						index,
						field,
					});
					await interaction.showModal(modal);
				}
			} else if (value.startsWith("field_remove_")) {
				const index = parseInt(value.split("_")[2] || "0");
				if (session.data.fields) {
					session.data.fields.splice(index, 1);
					await EmbedService.setEditorSession(
						interaction.user.id,
						session.name,
						session.data,
					);
					// Go back to main menu
					await this.updateEditorMessage(interaction, session);
				}
			}
		}
	}

	private async handleModalSubmit(
		interaction: ModalSubmitInteraction,
		session: any,
	) {
		const data = session.data;

		if (interaction.customId === "modal_embed_title") {
			data.title = interaction.fields.getTextInputValue("title") || undefined;
			data.url = interaction.fields.getTextInputValue("url") || undefined;
		} else if (interaction.customId === "modal_embed_description") {
			data.description =
				interaction.fields.getTextInputValue("description") || undefined;
		} else if (interaction.customId === "modal_embed_author") {
			if (!data.author) data.author = {};
			data.author.name = interaction.fields.getTextInputValue("name");
			data.author.icon_url =
				interaction.fields.getTextInputValue("icon_url") || undefined;
			if (!data.author.name) delete data.author;
		} else if (interaction.customId === "modal_embed_footer") {
			if (!data.footer) data.footer = {};
			data.footer.text = interaction.fields.getTextInputValue("text");
			data.footer.icon_url =
				interaction.fields.getTextInputValue("icon_url") || undefined;
			if (!data.footer.text) delete data.footer;
		} else if (interaction.customId === "modal_embed_images") {
			if (!data.image) data.image = {};
			if (!data.thumbnail) data.thumbnail = {};
			
			const imageUrl = interaction.fields.getTextInputValue("image");
			const thumbnailUrl = interaction.fields.getTextInputValue("thumbnail");

			if (imageUrl) data.image.url = imageUrl;
			else delete data.image;

			if (thumbnailUrl) data.thumbnail.url = thumbnailUrl;
			else delete data.thumbnail;
		} else if (interaction.customId === "modal_embed_color") {
			const colorInput = interaction.fields.getTextInputValue("color");
			if (colorInput) {
				if (colorInput.startsWith("#")) {
					data.color = parseInt(colorInput.replace("#", ""), 16);
				} else {
					data.color = parseInt(colorInput);
				}
			} else {
				delete data.color;
			}
		} else if (interaction.customId.startsWith("modal_embed_field")) {
			if (!data.fields) data.fields = [];
			
			const name = interaction.fields.getTextInputValue("name");
			const value = interaction.fields.getTextInputValue("value");
			const inline =
				interaction.fields.getTextInputValue("inline").toLowerCase() === "true";

			const newField = { name, value, inline };

			if (interaction.customId.startsWith("modal_embed_field_")) {
				// Edit existing
				const index = parseInt(interaction.customId.split("_")[3] || "0");
				if (data.fields[index]) {
					data.fields[index] = newField;
				}
			} else {
				// Add new
				data.fields.push(newField);
			}
		}

		await EmbedService.setEditorSession(
			interaction.user.id,
			session.name,
			data,
		);
		await this.updateEditorMessage(interaction, session);
	}

	private async handleButton(interaction: ButtonInteraction, session: any) {
		if (interaction.customId === "embed_editor_save") {
			await EmbedService.save(session.name, session.data);
			await EmbedService.clearEditorSession(interaction.user.id);
			await interaction.update({
				content: `✅ Embed \`${session.name}\` saved successfully!`,
				components: [],
				embeds: [new EmbedBuilder(session.data)],
			});
		} else if (interaction.customId === "embed_editor_cancel") {
			await EmbedService.clearEditorSession(interaction.user.id);
			await interaction.update({
				content: "❌ Editor cancelled.",
				components: [],
				embeds: [],
			});
		}
	}
}
