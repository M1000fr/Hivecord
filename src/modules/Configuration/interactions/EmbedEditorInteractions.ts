import {
	EmbedBuilder,
	type StringSelectMenuInteraction,
	type ModalSubmitInteraction,
	type ButtonInteraction,
	type Interaction,
	MessageFlags,
} from "discord.js";
import { Button, SelectMenu, Modal } from "@decorators/Interaction";
import { EmbedService } from "@modules/Configuration/services/EmbedService";
import { EmbedEditorUtils } from "../commands/embed/EmbedEditorUtils";

export class EmbedEditorInteractions {
	private async getSession(interaction: Interaction) {
		// Use message ID as session key if available (for buttons/select menus/modals on messages)
		const sessionId =
			interaction.isMessageComponent() || interaction.isModalSubmit()
				? interaction.message?.id || interaction.user.id
				: interaction.user.id;

		const session = await EmbedService.getEditorSession(sessionId);
		if (!session) {
			if (interaction.isRepliable()) {
				await interaction.reply({
					content: "❌ Session expired. Please start over.",
					flags: [MessageFlags.Ephemeral],
				});
			}
			return null;
		}

		if (session.userId && session.userId !== interaction.user.id) {
			if (interaction.isRepliable()) {
				await interaction.reply({
					content:
						"❌ You are not allowed to interact with this editor.",
					flags: [MessageFlags.Ephemeral],
				});
			}
			return null;
		}

		return session;
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

	@SelectMenu("embed_editor_menu")
	async handleMainMenu(interaction: StringSelectMenuInteraction) {
		const session = await this.getSession(interaction);
		if (!session) return;

		const value = interaction.values[0];
		if (!value) return;

		if (value === "edit_fields") {
			// Show fields submenu
			await interaction.update({
				components: [
					EmbedEditorUtils.getFieldsSubMenu(session.data.fields),
					EmbedEditorUtils.getControlButtons(),
				],
			});
			return;
		}

		// Reset the menu selection by editing the message directly
		const embed = new EmbedBuilder(session.data);
		await interaction.message.edit({
			content: `**Embed Editor**: Editing \`${session.name}\`\nUse the menu below to edit properties. Click **Save** when finished.`,
			embeds: [embed],
			components: [
				EmbedEditorUtils.getMainMenu(),
				EmbedEditorUtils.getControlButtons(),
			],
		});

		const modal = EmbedEditorUtils.getModal(value, session.data);
		await interaction.showModal(modal);
	}

	@SelectMenu("embed_editor_fields_menu")
	async handleFieldsMenu(interaction: StringSelectMenuInteraction) {
		const session = await this.getSession(interaction);
		if (!session) return;

		const value = interaction.values[0];
		if (!value) return;

		if (value === "back") {
			await this.updateEditorMessage(interaction, session);
			return;
		}

		if (value === "field_add") {
			// Reset the menu selection
			await interaction.message.edit({
				components: [
					EmbedEditorUtils.getFieldsSubMenu(session.data.fields),
					EmbedEditorUtils.getControlButtons(),
				],
			});

			// Clear editing index in session
			await EmbedService.setEditorSession(
				interaction.message.id,
				session.name,
				session.data,
				{ ...session.meta, editingFieldIndex: undefined },
				session.userId,
			);

			const modal = EmbedEditorUtils.getModal("field_add");
			await interaction.showModal(modal);
		} else if (value.startsWith("field_edit_")) {
			// Reset the menu selection
			await interaction.message.edit({
				components: [
					EmbedEditorUtils.getFieldsSubMenu(session.data.fields),
					EmbedEditorUtils.getControlButtons(),
				],
			});

			const index = parseInt(value.split("_")[2] || "0");
			const field = session.data.fields?.[index];
			if (field) {
				// Set editing index in session
				await EmbedService.setEditorSession(
					interaction.message.id,
					session.name,
					session.data,
					{ ...session.meta, editingFieldIndex: index },
					session.userId,
				);

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
					interaction.message.id,
					session.name,
					session.data,
					session.meta,
					session.userId,
				);
				// Go back to main menu
				await this.updateEditorMessage(interaction, session);
			}
		}
	}

	@Button("embed_editor_save")
	async handleSave(interaction: ButtonInteraction) {
		const session = await this.getSession(interaction);
		if (!session) return;

		await EmbedService.save(session.name, session.data);
		await EmbedService.clearEditorSession(interaction.message.id);
		await interaction.update({
			content: `✅ Embed \`${session.name}\` saved successfully!`,
			components: [],
			embeds: [new EmbedBuilder(session.data)],
		});
	}

	@Button("embed_editor_cancel")
	async handleCancel(interaction: ButtonInteraction) {
		const session = await this.getSession(interaction);
		if (!session) return;

		await EmbedService.clearEditorSession(interaction.message.id);
		await interaction.update({
			content: "❌ Editor cancelled.",
			components: [],
			embeds: [],
		});
	}

	@Modal("modal_embed_title")
	async handleTitleModal(interaction: ModalSubmitInteraction) {
		const session = await this.getSession(interaction);
		if (!session) return;

		session.data.title =
			interaction.fields.getTextInputValue("title") || undefined;
		session.data.url =
			interaction.fields.getTextInputValue("url") || undefined;

		await EmbedService.setEditorSession(
			interaction.message!.id,
			session.name,
			session.data,
			session.meta,
			session.userId,
		);
		await this.updateEditorMessage(interaction, session);
	}

	@Modal("modal_embed_description")
	async handleDescriptionModal(interaction: ModalSubmitInteraction) {
		const session = await this.getSession(interaction);
		if (!session) return;

		session.data.description =
			interaction.fields.getTextInputValue("description") || undefined;

		await EmbedService.setEditorSession(
			interaction.message!.id,
			session.name,
			session.data,
			session.meta,
			session.userId,
		);
		await this.updateEditorMessage(interaction, session);
	}

	@Modal("modal_embed_author")
	async handleAuthorModal(interaction: ModalSubmitInteraction) {
		const session = await this.getSession(interaction);
		if (!session) return;

		const name = interaction.fields.getTextInputValue("name");
		const icon_url =
			interaction.fields.getTextInputValue("icon_url") || undefined;

		if (name) {
			session.data.author = { name, icon_url };
		} else {
			delete session.data.author;
		}

		await EmbedService.setEditorSession(
			interaction.message!.id,
			session.name,
			session.data,
			session.meta,
			session.userId,
		);
		await this.updateEditorMessage(interaction, session);
	}

	@Modal("modal_embed_footer")
	async handleFooterModal(interaction: ModalSubmitInteraction) {
		const session = await this.getSession(interaction);
		if (!session) return;

		const text = interaction.fields.getTextInputValue("text");
		const icon_url =
			interaction.fields.getTextInputValue("icon_url") || undefined;

		if (text) {
			session.data.footer = { text, icon_url };
		} else {
			delete session.data.footer;
		}

		await EmbedService.setEditorSession(
			interaction.message!.id,
			session.name,
			session.data,
			session.meta,
			session.userId,
		);
		await this.updateEditorMessage(interaction, session);
	}

	@Modal("modal_embed_images")
	async handleImagesModal(interaction: ModalSubmitInteraction) {
		const session = await this.getSession(interaction);
		if (!session) return;

		const imageUrl = interaction.fields.getTextInputValue("image");
		const thumbnailUrl = interaction.fields.getTextInputValue("thumbnail");

		if (imageUrl) {
			session.data.image = { url: imageUrl };
		} else {
			delete session.data.image;
		}

		if (thumbnailUrl) {
			session.data.thumbnail = { url: thumbnailUrl };
		} else {
			delete session.data.thumbnail;
		}

		await EmbedService.setEditorSession(
			interaction.message!.id,
			session.name,
			session.data,
			session.meta,
			session.userId,
		);
		await this.updateEditorMessage(interaction, session);
	}

	@Modal("modal_embed_color")
	async handleColorModal(interaction: ModalSubmitInteraction) {
		const session = await this.getSession(interaction);
		if (!session) return;

		const colorInput = interaction.fields.getTextInputValue("color");
		if (colorInput) {
			if (colorInput.startsWith("#")) {
				session.data.color = parseInt(colorInput.replace("#", ""), 16);
			} else {
				session.data.color = parseInt(colorInput);
			}
		} else {
			delete session.data.color;
		}

		await EmbedService.setEditorSession(
			interaction.message!.id,
			session.name,
			session.data,
			session.meta,
			session.userId,
		);
		await this.updateEditorMessage(interaction, session);
	}

	@Modal("modal_embed_field")
	async handleFieldModal(interaction: ModalSubmitInteraction) {
		const session = await this.getSession(interaction);
		if (!session) return;

		if (!session.data.fields) session.data.fields = [];

		const name = interaction.fields.getTextInputValue("name");
		const value = interaction.fields.getTextInputValue("value");
		const inline =
			interaction.fields.getTextInputValue("inline").toLowerCase() ===
			"true";

		const newField = { name, value, inline };
		const editingIndex = session.meta?.editingFieldIndex;

		if (
			typeof editingIndex === "number" &&
			session.data.fields[editingIndex]
		) {
			// Edit existing
			session.data.fields[editingIndex] = newField;
		} else {
			// Add new
			session.data.fields.push(newField);
		}

		// Clear editing index
		await EmbedService.setEditorSession(
			interaction.message!.id,
			session.name,
			session.data,
			{ ...session.meta, editingFieldIndex: undefined },
			session.userId,
		);

		await this.updateEditorMessage(interaction, session);
	}
}
