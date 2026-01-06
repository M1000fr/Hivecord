import { Injectable } from "@decorators/Injectable";
import { Client } from "@decorators/params/index.ts";
import { EPermission } from "@enums/EPermission";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import type { LeBotClient } from "@src/class/LeBotClient";
import { Autocomplete } from "@src/decorators/commands/Autocomplete";
import { SlashCommandController } from "@src/decorators/commands/SlashCommand";
import { Subcommand } from "@src/decorators/commands/Subcommand";
import {
	AutocompleteInteraction,
	CommandInteraction,
} from "@src/decorators/Interaction";
import type { CommandAutocompleteContext } from "@src/types/CommandAutocompleteContext";

import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { CustomEmbedService } from "../../services/CustomEmbedService";
import { embedOptions } from "./embedOptions";
import { EmbedEditorMenus } from "./utils/EmbedEditorMenus";

@Injectable()
@SlashCommandController(embedOptions)
export default class EmbedCommand {
	constructor(
		private readonly configService: ConfigService,
		private readonly customEmbedService: CustomEmbedService,
	) {}

	@Autocomplete({ optionName: "name" })
	async autocompleteName(
		@Client() client: LeBotClient<true>,
		@AutocompleteInteraction() [interaction]: CommandAutocompleteContext,
	) {
		const focusedValue = interaction.options.getFocused();
		const embeds = await this.customEmbedService.list(interaction.guild!);
		const filtered = embeds.filter((choice) =>
			choice.toLowerCase().includes(focusedValue.toLowerCase()),
		);
		await interaction.respond(
			filtered
				.slice(0, 25)
				.map((choice) => ({ name: choice, value: choice })),
		);
	}

	@Subcommand({ permission: EPermission.ConfigureModules })
	async builder(
		@Client() client: LeBotClient<true>,
		@CommandInteraction() interaction: ChatInputCommandInteraction,
	) {
		await interaction.deferReply();
		const lang = await interaction.guild!.i18n();
		const name = interaction.options.getString("name", true);
		let data = await this.customEmbedService.get(interaction.guild!, name);

		if (!data) {
			// Default template for new embed
			data = {
				title: lang.t(
					"modules.configuration.commands.embed.new_embed_title",
				),
				description: lang.t(
					"modules.configuration.commands.embed.new_embed_desc",
				),
				color: 0x0099ff,
			};
		}

		const embed = new EmbedBuilder(data);
		await interaction.editReply({
			content: lang.t(
				"modules.configuration.commands.embed.editor_intro",
				{
					name,
				},
			),
			embeds: [embed],
			components: [
				EmbedEditorMenus.getMainMenu(lang.t),
				EmbedEditorMenus.getControlButtons(lang.t),
			],
		});
		const response = await interaction.fetchReply();

		// Save to session
		await this.customEmbedService.setEditorSession(
			response.id,
			interaction.guild!,
			name,
			data,
			undefined,
			interaction.user,
		);
	}

	@Subcommand({ permission: EPermission.ConfigureModules })
	async edit(
		@Client() client: LeBotClient<true>,
		@CommandInteraction() interaction: ChatInputCommandInteraction,
	) {
		await interaction.deferReply();
		const lang = await interaction.guild!.i18n();
		const name = interaction.options.getString("name", true);
		const data = await this.customEmbedService.get(
			interaction.guild!,
			name,
		);

		if (!data) {
			await interaction.editReply({
				content: lang.t(
					"modules.configuration.commands.embed.not_found",
					{
						name,
					},
				),
			});
			return;
		}

		const embed = new EmbedBuilder(data);
		await interaction.editReply({
			content: lang.t(
				"modules.configuration.commands.embed.editor_intro",
				{
					name,
				},
			),
			embeds: [embed],
			components: [
				EmbedEditorMenus.getMainMenu(lang.t),
				EmbedEditorMenus.getControlButtons(lang.t),
			],
		});
		const response = await interaction.fetchReply();

		// Save to session
		await this.customEmbedService.setEditorSession(
			response.id,
			interaction.guild!,
			name,
			data,
			undefined,
			interaction.user,
		);
	}

	@Subcommand({ permission: EPermission.ConfigureModules })
	async delete(
		@Client() client: LeBotClient<true>,
		@CommandInteraction() interaction: ChatInputCommandInteraction,
	) {
		await interaction.deferReply();
		const lang = await interaction.guild!.i18n();
		const name = interaction.options.getString("name", true);
		await this.customEmbedService.delete(interaction.guild!, name);
		await interaction.editReply({
			content: lang.t("modules.configuration.commands.embed.deleted", {
				name,
			}),
		});
	}

	@Subcommand({ permission: EPermission.ConfigureModules })
	async list(
		@Client() client: LeBotClient<true>,
		@CommandInteraction() interaction: ChatInputCommandInteraction,
	) {
		await interaction.deferReply();
		const lang = await interaction.guild!.i18n();
		const embeds = await this.customEmbedService.list(interaction.guild!);

		await interaction.editReply({
			content: lang.t("modules.configuration.commands.embed.list", {
				embeds: embeds.map((e) => `- \`${e}\``).join("\n") || "None",
			}),
		});
	}

	@Subcommand({ permission: EPermission.ConfigureModules })
	async preview(
		@Client() client: LeBotClient<true>,
		@CommandInteraction() interaction: ChatInputCommandInteraction,
	) {
		await interaction.deferReply();
		const lang = await interaction.guild!.i18n();
		const name = interaction.options.getString("name", true);

		// Dummy context
		const context = {};

		const embed = await this.customEmbedService.render(
			interaction.guild!,
			name,
			context,
		);
		if (!embed) {
			await interaction.editReply({
				content: lang.t(
					"modules.configuration.commands.embed.not_found",
					{
						name,
					},
				),
			});
			return;
		}

		await interaction.editReply({
			content: lang.t("common.preview", {
				name,
			}),
			embeds: [embed],
		});
	}
}
