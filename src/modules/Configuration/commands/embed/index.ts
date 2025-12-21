import { Autocomplete } from "@decorators/Autocomplete";
import { CommandController } from "@decorators/Command";
import { Injectable } from "@decorators/Injectable";
import { Client } from "@decorators/params/index.ts";
import { Subcommand } from "@decorators/Subcommand";
import { EPermission } from "@enums/EPermission";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import type { LeBotClient } from "@src/class/LeBotClient";
import {
	AutocompleteInteraction,
	CommandInteraction,
} from "@src/decorators/Interaction";
import { CustomEmbedService } from "@src/modules/Configuration/services/CustomEmbedService";
import { GeneralConfig } from "@src/modules/General/GeneralConfig";
import {
	ChatInputCommandInteraction,
	AutocompleteInteraction as DiscordAutocompleteInteraction,
	EmbedBuilder,
} from "discord.js";
import { embedOptions } from "./embedOptions";
import { EmbedEditorMenus } from "./utils/EmbedEditorMenus";

@Injectable()
@CommandController(embedOptions)
export default class EmbedCommand {
	constructor(
		private readonly configService: ConfigService,
		private readonly customEmbedService: CustomEmbedService,
	) {}

	@Autocomplete({ optionName: "name" })
	async autocompleteName(
		@Client() client: LeBotClient<true>,
		@AutocompleteInteraction() interaction: DiscordAutocompleteInteraction,
	) {
		const focusedValue = interaction.options.getFocused();
		const embeds = await this.customEmbedService.list(interaction.guildId!);
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
	async builder(
		@Client() client: LeBotClient<true>,
		@CommandInteraction() interaction: ChatInputCommandInteraction,
	) {
		await interaction.deferReply();
		const lng = await this.configService.of(
			interaction.guildId!,
			GeneralConfig,
		).generalLanguage;
		const t = I18nService.getFixedT(lng);
		const name = interaction.options.getString("name", true);
		let data = await this.customEmbedService.get(
			interaction.guildId!,
			name,
		);

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
		await interaction.editReply({
			content: t("modules.configuration.commands.embed.editor_intro", {
				name,
			}),
			embeds: [embed],
			components: [
				EmbedEditorMenus.getMainMenu(lng),
				EmbedEditorMenus.getControlButtons(lng),
			],
		});
		const response = await interaction.fetchReply();

		// Save to session
		await this.customEmbedService.setEditorSession(
			response.id,
			interaction.guildId!,
			name,
			data,
			undefined,
			interaction.user.id,
		);
	}

	@Subcommand({ name: "edit", permission: EPermission.ConfigureModules })
	async edit(
		@Client() client: LeBotClient<true>,
		@CommandInteraction() interaction: ChatInputCommandInteraction,
	) {
		await interaction.deferReply();
		const lng = await this.configService.of(
			interaction.guildId!,
			GeneralConfig,
		).generalLanguage;
		const t = I18nService.getFixedT(lng);
		const name = interaction.options.getString("name", true);
		const data = await this.customEmbedService.get(
			interaction.guildId!,
			name,
		);

		if (!data) {
			await interaction.editReply({
				content: t("modules.configuration.commands.embed.not_found", {
					name,
				}),
			});
			return;
		}

		const embed = new EmbedBuilder(data);
		await interaction.editReply({
			content: t("modules.configuration.commands.embed.editor_intro", {
				name,
			}),
			embeds: [embed],
			components: [
				EmbedEditorMenus.getMainMenu(lng),
				EmbedEditorMenus.getControlButtons(lng),
			],
		});
		const response = await interaction.fetchReply();

		// Save to session
		await this.customEmbedService.setEditorSession(
			response.id,
			interaction.guildId!,
			name,
			data,
			undefined,
			interaction.user.id,
		);
	}

	@Subcommand({ name: "delete", permission: EPermission.ConfigureModules })
	async delete(
		@Client() client: LeBotClient<true>,
		@CommandInteraction() interaction: ChatInputCommandInteraction,
	) {
		await interaction.deferReply();
		const lng = await this.configService.of(
			interaction.guildId!,
			GeneralConfig,
		).generalLanguage;
		const t = I18nService.getFixedT(lng);
		const name = interaction.options.getString("name", true);
		await this.customEmbedService.delete(interaction.guildId!, name);
		await interaction.editReply({
			content: t("modules.configuration.commands.embed.deleted", {
				name,
			}),
		});
	}

	@Subcommand({ name: "list", permission: EPermission.ConfigureModules })
	async list(
		@Client() client: LeBotClient<true>,
		@CommandInteraction() interaction: ChatInputCommandInteraction,
	) {
		await interaction.deferReply();
		const lng = await this.configService.of(
			interaction.guildId!,
			GeneralConfig,
		).generalLanguage;
		const t = I18nService.getFixedT(lng);
		const embeds = await this.customEmbedService.list(interaction.guildId!);

		await interaction.editReply({
			content: t("modules.configuration.commands.embed.list", {
				embeds: embeds.map((e) => `- \`${e}\``).join("\n") || "None",
			}),
		});
	}

	@Subcommand({ name: "preview", permission: EPermission.ConfigureModules })
	async preview(
		@Client() client: LeBotClient<true>,
		@CommandInteraction() interaction: ChatInputCommandInteraction,
	) {
		await interaction.deferReply();
		const lng = await this.configService.of(
			interaction.guildId!,
			GeneralConfig,
		).generalLanguage;
		const t = I18nService.getFixedT(lng);
		const name = interaction.options.getString("name", true);

		// Dummy context
		const context = {};

		const embed = await this.customEmbedService.render(
			interaction.guildId!,
			name,
			context,
		);
		if (!embed) {
			await interaction.editReply({
				content: t("modules.configuration.commands.embed.not_found", {
					name,
				}),
			});
			return;
		}

		await interaction.editReply({
			content: t("modules.configuration.commands.embed.preview", {
				name,
			}),
			embeds: [embed],
		});
	}
}
