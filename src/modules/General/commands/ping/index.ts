import { Inject } from "@decorators/Inject";
import { Client } from "@decorators/params/index.ts";
import { UseInterceptors } from "@decorators/UseInterceptors";
import { EPermission } from "@enums/EPermission";
import { CommandPermissionInterceptor } from "@interceptors/CommandPermissionInterceptor";
import { PagerService } from "@modules/Core/services/PagerService";
import type { LeBotClient } from "@src/class/LeBotClient";
import { CommandPermission } from "@src/decorators/commands/CommandPermission";
import {
	SlashCommand,
	SlashCommandController,
} from "@src/decorators/commands/SlashCommand";
import { CommandInteraction } from "@src/decorators/Interaction";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	EmbedBuilder,
} from "discord.js";
import { pingOptions } from "./pingOptions";

@SlashCommandController(pingOptions)
export default class PingCommand {
	constructor(@Inject(PagerService) private pagerService: PagerService) {}

	@UseInterceptors(CommandPermissionInterceptor)
	@CommandPermission(EPermission.Ping)
	@SlashCommand()
	async default(
		@Client() client: LeBotClient,
		@CommandInteraction() interaction: ChatInputCommandInteraction,
	) {
		const lang = await interaction.guild!.i18n();
		// Demo data for pager
		const demoItems = Array.from({ length: 50 }, (_, i) => ({
			id: i + 1,
			name: `Item ${i + 1}`,
			description: `This is demo item number ${i + 1}`,
		}));

		// Exemple d'utilisation d'un bouton avec interaction handler
		// Le bouton "ping_button" est géré par PingCommandInteractions.handlePingButton()
		const demoButton = new ButtonBuilder()
			.setCustomId("ping_button")
			.setLabel("Click me!")
			.setStyle(ButtonStyle.Primary)
			.setEmoji("🏓");

		const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
			demoButton,
		);

		// Create a pager with the demo data
		const pager = this.pagerService.create({
			items: demoItems,
			itemsPerPage: 5,
			languageContext: lang,
			renderPage: async (items, pageIndex, totalPages) => {
				const embed = new EmbedBuilder()
					.setTitle(
						`🏓 Ping Command - Page ${pageIndex + 1}/${totalPages}`,
					)
					.setDescription(
						items
							.map(
								(item) =>
									`**${item.name}**\n${item.description}`,
							)
							.join("\n\n"),
					)
					.setColor("Blue")
					.setFooter({
						text: `Showing ${items.length} items | Page ${pageIndex + 1} of ${totalPages}`,
					});

				return {
					embeds: [embed],
					components: [buttonRow],
				};
			},
		});

		await interaction.deferReply();
		await pager.start(interaction);
	}
}
