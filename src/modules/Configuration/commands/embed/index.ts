import { BaseCommand } from "@class/BaseCommand";
import { Autocomplete } from "@decorators/Autocomplete";
import { Command } from "@decorators/Command";
import { Subcommand } from "@decorators/Subcommand";
import { EPermission } from "@enums/EPermission";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { CustomEmbedService } from "@src/modules/Configuration/services/CustomEmbedService";
import { GeneralConfig } from "@src/modules/General/GeneralConfig";
import { InteractionHelper } from "@src/utils/InteractionHelper";
import {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	EmbedBuilder,
} from "discord.js";
import { embedOptions } from "./embedOptions";
import { EmbedEditorMenus } from "./utils/EmbedEditorMenus";

@Command(embedOptions)
export default class EmbedCommand extends BaseCommand {
	@Autocomplete({ optionName: "name" })
	async autocompleteName(
		client: Client,
		interaction: AutocompleteInteraction,
	) {
		const focusedValue = interaction.options.getFocused();
		const embeds = await CustomEmbedService.list(interaction.guildId!);
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
		await InteractionHelper.defer(interaction);
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		const name = interaction.options.getString("name", true);
		let data = await CustomEmbedService.get(interaction.guildId!, name);

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
		await InteractionHelper.respond(interaction, {
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
		await CustomEmbedService.setEditorSession(
			response.id,
			interaction.guildId!,
			name,
			data,
			undefined,
			interaction.user.id,
		);
	}

	@Subcommand({ name: "edit", permission: EPermission.ConfigureModules })
	async edit(client: Client, interaction: ChatInputCommandInteraction) {
		await InteractionHelper.defer(interaction);
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		const name = interaction.options.getString("name", true);
		const data = await CustomEmbedService.get(interaction.guildId!, name);

		if (!data) {
			await InteractionHelper.respond(interaction, {
				content: t("modules.configuration.commands.embed.not_found", {
					name,
				}),
			});
			return;
		}

		const embed = new EmbedBuilder(data);
		await InteractionHelper.respond(interaction, {
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
		await CustomEmbedService.setEditorSession(
			response.id,
			interaction.guildId!,
			name,
			data,
			undefined,
			interaction.user.id,
		);
	}

	@Subcommand({ name: "delete", permission: EPermission.ConfigureModules })
	async delete(client: Client, interaction: ChatInputCommandInteraction) {
		await InteractionHelper.defer(interaction);
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		const name = interaction.options.getString("name", true);
		await CustomEmbedService.delete(interaction.guildId!, name);
		await InteractionHelper.respond(interaction, {
			content: t("modules.configuration.commands.embed.deleted", {
				name,
			}),
		});
	}

	@Subcommand({ name: "list", permission: EPermission.ConfigureModules })
	async list(client: Client, interaction: ChatInputCommandInteraction) {
		await InteractionHelper.defer(interaction);
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		const embeds = await CustomEmbedService.list(interaction.guildId!);

		await InteractionHelper.respond(interaction, {
			content: t("modules.configuration.commands.embed.list", {
				embeds: embeds.map((e) => `- \`${e}\``).join("\n") || "None",
			}),
		});
	}

	@Subcommand({ name: "preview", permission: EPermission.ConfigureModules })
	async preview(client: Client, interaction: ChatInputCommandInteraction) {
		await InteractionHelper.defer(interaction);
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		const name = interaction.options.getString("name", true);

		// Dummy context
		const context = {};

		const embed = await CustomEmbedService.render(
			interaction.guildId!,
			name,
			context,
		);
		if (!embed) {
			await InteractionHelper.respond(interaction, {
				content: t("modules.configuration.commands.embed.not_found", {
					name,
				}),
			});
			return;
		}

		await InteractionHelper.respond(interaction, {
			content: t("modules.configuration.commands.embed.preview", {
				name,
			}),
			embeds: [embed],
		});
	}
}
