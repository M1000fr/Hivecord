import {
	ChatInputCommandInteraction,
	Client,
	EmbedBuilder,
	MessageFlags,
	ApplicationCommandOptionType,
	AutocompleteInteraction,
} from "discord.js";
import { BaseCommand } from "@class/BaseCommand";
import { Command } from "@decorators/Command";
import { Subcommand } from "@decorators/Subcommand";
import { Autocomplete } from "@decorators/Autocomplete";
import { EPermission } from "@enums/EPermission";
import { EmbedService } from "@services/EmbedService";
import { EmbedEditorUtils } from "./EmbedEditorUtils";
import { embedOptions } from "./embedOptions";

@Command(embedOptions)
export default class EmbedCommand extends BaseCommand {
	@Autocomplete({ optionName: "name" })
	async autocompleteName(
		client: Client,
		interaction: AutocompleteInteraction,
	) {
		const focusedValue = interaction.options.getFocused();
		const embeds = await EmbedService.list();
		const filtered = embeds.filter((choice) =>
			choice.toLowerCase().includes(focusedValue.toLowerCase()),
		);
		await interaction.respond(
			filtered
				.slice(0, 25)
				.map((choice) => ({ name: choice, value: choice })),
		);
	}

	@Subcommand({ name: "builder", permission: EPermission.ConfigureModules })
	async builder(client: Client, interaction: ChatInputCommandInteraction) {
		const name = interaction.options.getString("name", true);
		let data = await EmbedService.get(name);

		if (!data) {
			// Default template for new embed
			data = {
				title: "New Embed",
				description: "This is a new embed.",
				color: 0x0099ff,
			};
		}

		const embed = new EmbedBuilder(data);
		await interaction.reply({
			content: `**Embed Editor**: Editing \`${name}\`\nUse the menu below to edit properties. Click **Save** when finished.`,
			embeds: [embed],
			components: [
				EmbedEditorUtils.getMainMenu(),
				EmbedEditorUtils.getControlButtons(),
			],
		});
		const response = await interaction.fetchReply();

		// Save to session
		await EmbedService.setEditorSession(response.id, name, data);
	}

	@Subcommand({ name: "edit", permission: EPermission.ConfigureModules })
	async edit(client: Client, interaction: ChatInputCommandInteraction) {
		const name = interaction.options.getString("name", true);
		const data = await EmbedService.get(name);

		if (!data) {
			await interaction.reply({
				content: `❌ Embed \`${name}\` not found.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const embed = new EmbedBuilder(data);
		await interaction.reply({
			content: `**Embed Editor**: Editing \`${name}\`\nUse the menu below to edit properties. Click **Save** when finished.`,
			embeds: [embed],
			components: [
				EmbedEditorUtils.getMainMenu(),
				EmbedEditorUtils.getControlButtons(),
			],
		});
		const response = await interaction.fetchReply();

		// Save to session
		await EmbedService.setEditorSession(response.id, name, data);
	}

	@Subcommand({ name: "delete", permission: EPermission.ConfigureModules })
	async delete(client: Client, interaction: ChatInputCommandInteraction) {
		const name = interaction.options.getString("name", true);
		await EmbedService.delete(name);
		await interaction.reply({
			content: `✅ Embed \`${name}\` deleted.`,
			flags: MessageFlags.Ephemeral,
		});
	}

	@Subcommand({ name: "list", permission: EPermission.ConfigureModules })
	async list(client: Client, interaction: ChatInputCommandInteraction) {
		const embeds = await EmbedService.list();
		await interaction.reply({
			content: `**Custom Embeds:**\n${embeds.map((e) => `- \`${e}\``).join("\n") || "None"}`,
			flags: MessageFlags.Ephemeral,
		});
	}

	@Subcommand({ name: "preview", permission: EPermission.ConfigureModules })
	async preview(client: Client, interaction: ChatInputCommandInteraction) {
		const name = interaction.options.getString("name", true);

		// Dummy context
		const context = {};

		const embed = await EmbedService.render(name, context);
		if (!embed) {
			await interaction.reply({
				content: `❌ Embed \`${name}\` not found.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		await interaction.reply({
			content: `**Preview of \`${name}\`:**`,
			embeds: [embed],
			flags: MessageFlags.Ephemeral,
		});
	}
}
