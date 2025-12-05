import { BaseCommand } from "@class/BaseCommand";
import { Autocomplete } from "@decorators/Autocomplete";
import { Command } from "@decorators/Command";
import { Subcommand } from "@decorators/Subcommand";
import { EPermission } from "@enums/EPermission";
import { EmbedService } from "@modules/Configuration/services/EmbedService";
import { GeneralConfigKeys } from "@modules/General/GeneralConfig";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	EmbedBuilder,
	MessageFlags,
} from "discord.js";
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
		const lng =
			(await ConfigService.get(GeneralConfigKeys.language)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const name = interaction.options.getString("name", true);
		let data = await EmbedService.get(name);

		if (!data) {
			// Default template for new embed
			data = {
				title: t(
					"modules.configuration.commands.embed.new_embed_title",
				),
				description: t(
					"modules.configuration.commands.embed.new_embed_desc",
				),
				color: 0x0099ff,
			};
		}

		const embed = new EmbedBuilder(data);
		await interaction.reply({
			content: t("modules.configuration.commands.embed.editor_intro", {
				name,
			}),
			embeds: [embed],
			components: [
				EmbedEditorUtils.getMainMenu(lng),
				EmbedEditorUtils.getControlButtons(lng),
			],
		});
		const response = await interaction.fetchReply();

		// Save to session
		await EmbedService.setEditorSession(
			response.id,
			name,
			data,
			undefined,
			interaction.user.id,
		);
	}

	@Subcommand({ name: "edit", permission: EPermission.ConfigureModules })
	async edit(client: Client, interaction: ChatInputCommandInteraction) {
		const lng =
			(await ConfigService.get(GeneralConfigKeys.language)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const name = interaction.options.getString("name", true);
		const data = await EmbedService.get(name);

		if (!data) {
			await interaction.reply({
				content: t("modules.configuration.commands.embed.not_found", {
					name,
				}),
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const embed = new EmbedBuilder(data);
		await interaction.reply({
			content: t("modules.configuration.commands.embed.editor_intro", {
				name,
			}),
			embeds: [embed],
			components: [
				EmbedEditorUtils.getMainMenu(lng),
				EmbedEditorUtils.getControlButtons(lng),
			],
		});
		const response = await interaction.fetchReply();

		// Save to session
		await EmbedService.setEditorSession(
			response.id,
			name,
			data,
			undefined,
			interaction.user.id,
		);
	}

	@Subcommand({ name: "delete", permission: EPermission.ConfigureModules })
	async delete(client: Client, interaction: ChatInputCommandInteraction) {
		const lng =
			(await ConfigService.get(GeneralConfigKeys.language)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const name = interaction.options.getString("name", true);
		await EmbedService.delete(name);
		await interaction.reply({
			content: t("modules.configuration.commands.embed.deleted", {
				name,
			}),
			flags: MessageFlags.Ephemeral,
		});
	}

	@Subcommand({ name: "list", permission: EPermission.ConfigureModules })
	async list(client: Client, interaction: ChatInputCommandInteraction) {
		const lng =
			(await ConfigService.get(GeneralConfigKeys.language)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const embeds = await EmbedService.list();
		await interaction.reply({
			content: t("modules.configuration.commands.embed.list", {
				embeds: embeds.map((e) => `- \`${e}\``).join("\n") || "None",
			}),
			flags: MessageFlags.Ephemeral,
		});
	}

	@Subcommand({ name: "preview", permission: EPermission.ConfigureModules })
	async preview(client: Client, interaction: ChatInputCommandInteraction) {
		const lng =
			(await ConfigService.get(GeneralConfigKeys.language)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const name = interaction.options.getString("name", true);

		// Dummy context
		const context = {};

		const embed = await EmbedService.render(name, context);
		if (!embed) {
			await interaction.reply({
				content: t("modules.configuration.commands.embed.not_found", {
					name,
				}),
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		await interaction.reply({
			content: t("modules.configuration.commands.embed.preview", {
				name,
			}),
			embeds: [embed],
			flags: MessageFlags.Ephemeral,
		});
	}
}
