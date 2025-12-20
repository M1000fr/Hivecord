import { BaseCommand } from "@class/BaseCommand";
import { Command } from "@decorators/Command";
import { Subcommand } from "@decorators/Subcommand";
import { EPermission } from "@enums/EPermission";
import { StatsReader } from "@modules/Statistics/services/StatsReader";
import type { TimeRange } from "@modules/Statistics/types";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { GeneralConfig } from "@src/modules/General/GeneralConfig";
import { InteractionHelper } from "@src/utils/InteractionHelper";
import { ChartGenerator } from "@utils/ChartGenerator";
import {
	ActionRowBuilder,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Client,
	EmbedBuilder,
} from "discord.js";
import { statsOptions } from "./statsOptions";

@Command(statsOptions)
export default class StatsCommand extends BaseCommand {
	@Subcommand({ name: "server", permission: EPermission.StatsServer })
	async server(
		client: Client,
		interaction: ChatInputCommandInteraction,
	): Promise<void> {
		await InteractionHelper.defer(interaction);
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);

		if (!interaction.guild) {
			await InteractionHelper.respond(interaction, {
				content: t("modules.statistics.commands.stats.server_only"),
			});
			return;
		}
		const period = "24h"; // default initial period handled via buttons
		const timeRange = this.getTimeRange(period);
		try {
			await this.handleServerStats(interaction, timeRange, period);
		} catch (error) {
			console.error("Error fetching server stats:", error);
			await InteractionHelper.respond(interaction, {
				content: t("modules.statistics.commands.stats.server_error"),
			});
		}
	}

	@Subcommand({ name: "me", permission: EPermission.StatsUser })
	async me(
		client: Client,
		interaction: ChatInputCommandInteraction,
	): Promise<void> {
		await InteractionHelper.defer(interaction);
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		if (!interaction.guild) {
			await InteractionHelper.respond(interaction, {
				content: t("modules.statistics.commands.stats.server_only"),
			});
			return;
		}
		const period = "24h"; // default period
		const timeRange = this.getTimeRange(period);
		try {
			await this.handleUserStats(
				interaction,
				interaction.user.id,
				timeRange,
				interaction.user.username,
				period,
			);
		} catch (error) {
			console.error("Error fetching personal stats:", error);
			await InteractionHelper.respond(interaction, {
				content: t("modules.statistics.commands.stats.user_error"),
			});
		}
	}

	@Subcommand({ name: "user", permission: EPermission.StatsUser })
	async user(
		client: Client,
		interaction: ChatInputCommandInteraction,
	): Promise<void> {
		await InteractionHelper.defer(interaction);
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		if (!interaction.guild) {
			await InteractionHelper.respond(interaction, {
				content: t("modules.statistics.commands.stats.server_only"),
			});
			return;
		}
		const target = interaction.options.getUser("target");
		if (!target) {
			await InteractionHelper.respond(interaction, {
				content: t("modules.statistics.commands.stats.user_required"),
			});
			return;
		}
		const period = "24h"; // default period
		const timeRange = this.getTimeRange(period);
		try {
			await this.handleUserStats(
				interaction,
				target.id,
				timeRange,
				target.username,
				period,
			);
		} catch (error) {
			console.error("Error fetching user stats:", error);
			await InteractionHelper.respond(interaction, {
				content: t("modules.statistics.commands.stats.user_error"),
			});
		}
	}

	private getTimeRange(period: string): TimeRange {
		const end = new Date();
		const start = new Date();

		switch (period) {
			case "24h":
				start.setHours(start.getHours() - 24);
				break;
			case "7d":
				start.setDate(start.getDate() - 7);
				break;
			case "30d":
				start.setDate(start.getDate() - 30);
				break;
		}

		return { start, end };
	}

	private getPeriodLabel(period: string, locale: string): string {
		const t = I18nService.getFixedT(locale);
		switch (period) {
			case "24h":
				return t("modules.statistics.common.periods.24h");
			case "7d":
				return t("modules.statistics.common.periods.7d");
			case "30d":
				return t("modules.statistics.common.periods.30d");
			default:
				return period;
		}
	}

	private async handleUserStats(
		interaction: ChatInputCommandInteraction,
		userId: string,
		timeRange: TimeRange,
		username: string,
		period: string,
	): Promise<void> {
		await InteractionHelper.defer(interaction);
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		const guildId = interaction.guild!.id;

		const [voiceStats, messageStats] = await Promise.all([
			StatsReader.getUserVoiceStats(userId, guildId, timeRange),
			StatsReader.getUserMessageStats(userId, guildId, timeRange),
		]);

		// Generate chart
		const chartBuffer = ChartGenerator.generateChart(
			voiceStats.timeSeries,
			messageStats.timeSeries,
			timeRange,
			800,
			400,
			{
				voice: t("modules.statistics.common.voice_time_min"),
				messages: t("modules.statistics.common.messages"),
			},
		);

		const chartAttachment = new AttachmentBuilder(chartBuffer, {
			name: "stats.png",
		});

		// Create embed
		const embed = new EmbedBuilder()
			.setTitle(
				t("modules.statistics.commands.stats.user_stats_title", {
					username,
				}),
			)
			.setDescription(
				`${t("modules.statistics.common.period")}: ${this.getPeriodLabel(period, lng)}`,
			)
			.setColor("#5865F2")
			.addFields(
				{
					name: t("modules.statistics.common.voice_time"),
					value: ChartGenerator.formatDuration(
						voiceStats.totalDuration,
					),
					inline: true,
				},
				{
					name: t("modules.statistics.common.messages"),
					value: ChartGenerator.formatNumber(
						messageStats.totalMessages,
						lng,
					),
					inline: true,
				},
				{
					name: "\u200B",
					value: "\u200B",
					inline: true,
				},
			)
			.setImage("attachment://stats.png")
			.setTimestamp();

		// Top channels
		if (messageStats.channelBreakdown.length > 0) {
			const topChannels = messageStats.channelBreakdown
				.sort(
					(a: { count: number }, b: { count: number }) =>
						b.count - a.count,
				)
				.slice(0, 3)
				.map(
					(c: { channelId: string; count: number }) =>
						`<#${c.channelId}>: ${c.count} messages`,
				)
				.join("\n");
			embed.addFields({
				name: t("modules.statistics.commands.stats.top_channels_msg"),
				value: topChannels || t("common.none"),
			});
		}

		if (voiceStats.channelBreakdown.length > 0) {
			const topVoiceChannels = voiceStats.channelBreakdown
				.sort(
					(a: { duration: number }, b: { duration: number }) =>
						b.duration - a.duration,
				)
				.slice(0, 3)
				.map(
					(c: { channelId: string; duration: number }) =>
						`<#${c.channelId}>: ${ChartGenerator.formatDuration(c.duration)}`,
				)
				.join("\n");
			embed.addFields({
				name: t("modules.statistics.commands.stats.top_channels_voice"),
				value: topVoiceChannels || t("common.none"),
			});
		}

		await InteractionHelper.respond(interaction, {
			embeds: [embed],
			files: [chartAttachment],
			components: [
				this.buildPeriodButtons(
					"user",
					userId,
					interaction.user.id,
					period,
				),
			],
		});
	}

	private async handleServerStats(
		interaction: ChatInputCommandInteraction,
		timeRange: TimeRange,
		period: string,
	): Promise<void> {
		await InteractionHelper.defer(interaction);
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		const guildId = interaction.guild!.id;

		const [serverStats, topVoiceUsers, topMessageUsers, topChannels] =
			await Promise.all([
				StatsReader.getServerStats(guildId, timeRange),
				StatsReader.getMostActiveVoiceUsers(guildId, timeRange, 5),
				StatsReader.getMostActiveMessageUsers(guildId, timeRange, 5),
				StatsReader.getMostActiveChannels(guildId, timeRange, 5),
			]);

		// Generate stats card
		const statsCardBuffer = ChartGenerator.generateStatsCard(
			[
				{
					label: t("modules.statistics.common.total_messages"),
					value: ChartGenerator.formatNumber(
						serverStats.totalMessages,
					),
					color: "#57F287",
				},
				{
					label: t("modules.statistics.common.total_voice_time"),
					value: ChartGenerator.formatDuration(
						serverStats.totalVoiceDuration,
					),
					color: "#5865F2",
				},
				{
					label: t("modules.statistics.common.active_users"),
					value: serverStats.activeUsers.toString(),
					color: "#FEE75C",
				},
				{
					label: t("modules.statistics.common.members_joined"),
					value: serverStats.joinCount.toString(),
					color: "#57F287",
				},
				{
					label: t("modules.statistics.common.members_left"),
					value: serverStats.leaveCount.toString(),
					color: "#ED4245",
				},
			],
			t("modules.statistics.commands.stats.server_stats_title"),
			500,
			350,
		);

		const statsAttachment = new AttachmentBuilder(statsCardBuffer, {
			name: "server_stats.png",
		});

		const embed = new EmbedBuilder()
			.setTitle(
				t(
					"modules.statistics.commands.stats.server_stats_embed_title",
					{
						guild: interaction.guild!.name,
					},
				),
			)
			.setDescription(
				`${t("modules.statistics.common.period")}: ${this.getPeriodLabel(period, lng)}`,
			)
			.setColor("#5865F2")
			.setImage("attachment://server_stats.png")
			.setTimestamp();

		// Top voice users
		if (topVoiceUsers.length > 0) {
			const voiceLeaderboard = topVoiceUsers
				.map(
					(u: { userId: string; totalDuration: number }, i: number) =>
						`${i + 1}. <@${u.userId}>: ${ChartGenerator.formatDuration(u.totalDuration)}`,
				)
				.join("\n");
			embed.addFields({
				name: t("modules.statistics.commands.stats.top_users_voice"),
				value: voiceLeaderboard,
				inline: true,
			});
		}

		// Top message users
		if (topMessageUsers.length > 0) {
			const messageLeaderboard = topMessageUsers
				.map(
					(u: { userId: string; totalMessages: number }, i: number) =>
						`${i + 1}. <@${u.userId}>: ${ChartGenerator.formatNumber(u.totalMessages)} msg`,
				)
				.join("\n");
			embed.addFields({
				name: t("modules.statistics.commands.stats.top_users_msg"),
				value: messageLeaderboard,
				inline: true,
			});
		}

		// Top channels
		if (topChannels.length > 0) {
			const channelLeaderboard = topChannels
				.map(
					(
						c: {
							channelId: string;
							messageCount: number;
							voiceDuration: number;
						},
						i: number,
					) => {
						const msgs = ChartGenerator.formatNumber(
							c.messageCount,
						);
						const voice = ChartGenerator.formatDuration(
							c.voiceDuration,
						);
						return `${i + 1}. <#${c.channelId}>: ${msgs} msg, ${voice}`;
					},
				)
				.join("\n");
			embed.addFields({
				name: t("modules.statistics.commands.stats.top_channels"),
				value: channelLeaderboard,
			});
		}

		await InteractionHelper.respond(interaction, {
			embeds: [embed],
			files: [statsAttachment],
			components: [
				this.buildPeriodButtons(
					"server",
					guildId,
					interaction.user.id,
					period,
				),
			],
		});
	}

	// Build the action row with period selection buttons
	private buildPeriodButtons(
		scope: "server" | "user",
		targetId: string,
		invokerId: string,
		activePeriod: string,
	) {
		const periods: { value: string; label: string }[] = [
			{ value: "24h", label: "24h" },
			{ value: "7d", label: "7j" },
			{ value: "30d", label: "30j" },
		];
		const row = new ActionRowBuilder<ButtonBuilder>();
		for (const p of periods) {
			row.addComponents(
				new ButtonBuilder()
					.setCustomId(
						`stats:period:${p.value}:${scope}:${targetId}:${invokerId}`,
					)
					.setLabel(p.label)
					.setStyle(
						p.value === activePeriod
							? ButtonStyle.Primary
							: ButtonStyle.Secondary,
					),
			);
		}
		return row;
	}

	// Expose a static method for the button handler to reuse logic without duplicating code
	static getTimeRange(period: string): TimeRange {
		const end = new Date();
		const start = new Date();
		switch (period) {
			case "24h":
				start.setHours(start.getHours() - 24);
				break;
			case "7d":
				start.setDate(start.getDate() - 7);
				break;
			case "30d":
				start.setDate(start.getDate() - 30);
				break;
		}
		return { start, end };
	}

	static getPeriodLabel(period: string, locale: string): string {
		const t = I18nService.getFixedT(locale);
		switch (period) {
			case "24h":
				return t("modules.statistics.common.periods.24h");
			case "7d":
				return t("modules.statistics.common.periods.7d");
			case "30d":
				return t("modules.statistics.common.periods.30d");
			default:
				return period;
		}
	}
}
