import type { LeBotClient } from "@class/LeBotClient";
import { EConfigType } from "@decorators/ConfigProperty";
import { OnConfigUpdate } from "@decorators/OnConfigUpdate";
import { EmbedService } from "@modules/Configuration/services/EmbedService";
import { ChannelType as PrismaChannelType } from "@prisma/client/enums";
import { ConfigService } from "@services/ConfigService";
import { EntityService } from "@services/EntityService";
import { prismaClient } from "@services/prismaService";
import { Client } from "@src/decorators/Client";
import { ConfigHelper } from "@utils/ConfigHelper";
import { Logger } from "@utils/Logger";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	Guild,
	PermissionFlagsBits,
} from "discord.js";

export class TicketService {
	private static logger = new Logger("TicketService");

	@Client
	private static client: LeBotClient;

	@OnConfigUpdate("createMessageChannel")
	@OnConfigUpdate("creationMessageContent")
	@OnConfigUpdate("creationMessageEmbed")
	@OnConfigUpdate("ticketTypeCategory")
	static async onConfigUpdate(guildId: string) {
		await this.updateCreationMessage(guildId);
	}

	static async updateCreationMessage(guildId: string) {
		const guild = await this.client.guilds.fetch(guildId);
		if (!guild) return;

		const channelId = (await ConfigHelper.fetchValue(
			guildId,
			"createMessageChannel",
			EConfigType.Channel,
		)) as string | null;
		if (!channelId) return;

		const channel = await guild.channels.fetch(channelId);
		if (!channel || !channel.isTextBased()) return;

		const content = (await ConfigHelper.fetchValue(
			guildId,
			"creationMessageContent",
			EConfigType.String,
		)) as string | null;
		const embedName = (await ConfigHelper.fetchValue(
			guildId,
			"creationMessageEmbed",
			EConfigType.CustomEmbed,
		)) as string | null;
		const categories = (await ConfigHelper.fetchValue(
			guildId,
			"ticketTypeCategory",
			EConfigType.StringArray,
			["Support"],
		)) as string[];

		let embed = null;
		if (embedName) {
			try {
				embed = await EmbedService.render(guildId, embedName, {});
			} catch (e) {
				this.logger.error(
					`Failed to render embed ${embedName}`,
					e instanceof Error ? e.message : String(e),
				);
			}
		}

		const finalCategories =
			Array.isArray(categories) && categories.length > 0
				? categories
				: ["Support"];

		const rows: ActionRowBuilder<ButtonBuilder>[] = [];
		let currentRow = new ActionRowBuilder<ButtonBuilder>();

		finalCategories.forEach((cat, index) => {
			if (index > 0 && index % 5 === 0) {
				rows.push(currentRow);
				currentRow = new ActionRowBuilder<ButtonBuilder>();
			}
			currentRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`ticket_create_btn:${cat}`)
					.setLabel(cat)
					.setStyle(ButtonStyle.Primary),
			);
		});
		if (currentRow.components.length > 0) {
			rows.push(currentRow);
		}

		const messages = await channel.messages.fetch({ limit: 10 });
		const lastBotMessage = messages.find(
			(m) => m.author.id === this.client.user?.id,
		);

		// Check if content or embed exist to avoid sending empty message
		if (
			(!content || content.length === 0) &&
			(!embed || (Array.isArray(embed) && embed.length === 0))
		) {
			this.logger.warn(
				`Ticket creation message in guild ${guildId} has no content or embed. Skipping message update.`,
			);
			return;
		}

		const payload = {
			content: content?.length ? content : "",
			embeds: embed ? [embed] : [],
			components: rows,
		};

		try {
			if (lastBotMessage) {
				await lastBotMessage.edit(payload);
			} else {
				await channel.send(payload);
			}
		} catch (error) {
			this.logger.error(
				"Failed to send/edit ticket creation message",
				error instanceof Error ? error.message : String(error),
			);
		}
	}

	static async createTicket(
		guild: Guild,
		userId: string,
		category: string,
		reason: string,
	) {
		let categoryId = await ConfigService.getChannel(
			guild.id,
			"ticketCreationCategory",
		);

		if (!categoryId) {
			// Create category if not exists
			const newCategory = await guild.channels.create({
				name: "Tickets",
				type: ChannelType.GuildCategory,
			});
			categoryId = newCategory.id;
			await ConfigService.setChannel(
				guild.id,
				"ticketCreationCategory",
				categoryId,
				PrismaChannelType.CATEGORY,
			);
		}

		// Check if category exists in discord
		let categoryChannel = await guild.channels.fetch(categoryId);
		if (!categoryChannel) {
			// Re-create if deleted
			const newCategory = await guild.channels.create({
				name: "Tickets",
				type: ChannelType.GuildCategory,
			});
			categoryId = newCategory.id;
			await ConfigService.setChannel(
				guild.id,
				"ticketCreationCategory",
				categoryId,
				PrismaChannelType.CATEGORY,
			);
			categoryChannel = newCategory;
		}

		const member = await guild.members.fetch(userId);
		const ticketName = `ticket-${member.user.username}`;

		const ticketChannel = await guild.channels.create({
			name: ticketName,
			type: ChannelType.GuildText,
			parent: categoryId,
			permissionOverwrites: [
				{
					id: guild.id,
					deny: [PermissionFlagsBits.ViewChannel],
				},
				{
					id: userId,
					allow: [
						PermissionFlagsBits.ViewChannel,
						PermissionFlagsBits.SendMessages,
						PermissionFlagsBits.AttachFiles,
					],
				},
			],
		});

		await EntityService.ensureGuild(guild);
		await EntityService.ensureUserById(userId);
		await EntityService.ensureChannel(ticketChannel);

		await prismaClient.ticket.create({
			data: {
				guildId: guild.id,
				channelId: ticketChannel.id,
				creatorId: userId,
				category: category,
			},
		});

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId("ticket_close")
				.setLabel("Close Ticket")
				.setStyle(ButtonStyle.Danger)
				.setEmoji("🔒"),
		);

		await ticketChannel.send({
			content: `Ticket created by ${member} for category: **${category}**\nReason: ${reason}`,
			components: [row],
		});

		return ticketChannel;
	}
}
