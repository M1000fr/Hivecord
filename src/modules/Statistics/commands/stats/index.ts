import {
	ChatInputCommandInteraction,
	Client,
	AttachmentBuilder,
	EmbedBuilder,
} from "discord.js";
import { BaseCommand } from "@class/BaseCommand";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { Subcommand } from "@decorators/Subcommand";
import { EPermission } from "@enums/EPermission";
import { statsOptions } from "./statsOptions";
import { StatsService } from "@services/StatsService";
import type { TimeRange } from "@services/StatsService";
import { ChartGenerator } from "@utils/ChartGenerator";

@Command(statsOptions)
export default class StatsCommand extends BaseCommand {
	@DefaultCommand(EPermission.Stats)
	async run(client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
		await interaction.reply({ content: "Utilise une sous-commande: /stats server | /stats me | /stats user", ephemeral: true });
	}

	@Subcommand({ name: "server", permission: EPermission.Stats })
	async server(client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
		await interaction.deferReply();
		if (!interaction.guild) {
			await interaction.editReply("Cette sous-commande n'est disponible que dans un serveur.");
			return;
		}
		const period = interaction.options.getString("period") || "24h";
		const timeRange = this.getTimeRange(period);
		try {
			await this.handleServerStats(interaction, timeRange, period);
		} catch (error) {
			console.error("Error fetching server stats:", error);
			await interaction.editReply("Erreur lors de la récupération des statistiques serveur.");
		}
	}

	@Subcommand({ name: "me", permission: EPermission.Stats })
	async me(client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
		await interaction.deferReply();
		if (!interaction.guild) {
			await interaction.editReply("Cette sous-commande n'est disponible que dans un serveur.");
			return;
		}
		const period = interaction.options.getString("period") || "24h";
		const timeRange = this.getTimeRange(period);
		try {
			await this.handleUserStats(interaction, interaction.user.id, timeRange, interaction.user.username, period);
		} catch (error) {
			console.error("Error fetching personal stats:", error);
			await interaction.editReply("Erreur lors de la récupération de vos statistiques.");
		}
	}

	@Subcommand({ name: "user", permission: EPermission.Stats })
	async user(client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
		await interaction.deferReply();
		if (!interaction.guild) {
			await interaction.editReply("Cette sous-commande n'est disponible que dans un serveur.");
			return;
		}
		const target = interaction.options.getUser("target");
		if (!target) {
			await interaction.editReply("Utilisateur requis.");
			return;
		}
		const period = interaction.options.getString("period") || "24h";
		const timeRange = this.getTimeRange(period);
		try {
			await this.handleUserStats(interaction, target.id, timeRange, target.username, period);
		} catch (error) {
			console.error("Error fetching user stats:", error);
			await interaction.editReply("Erreur lors de la récupération des statistiques utilisateur.");
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

	private getPeriodLabel(period: string): string {
		switch (period) {
			case "24h":
				return "dernières 24 heures";
			case "7d":
				return "7 derniers jours";
			case "30d":
				return "30 derniers jours";
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
		const guildId = interaction.guild!.id;

		const [voiceStats, messageStats] = await Promise.all([
			StatsService.getUserVoiceStats(userId, guildId, timeRange),
			StatsService.getUserMessageStats(userId, guildId, timeRange),
		]);

		// Generate chart
		const chartBuffer = ChartGenerator.generateHourlyChart(
			voiceStats.hourlyBreakdown,
			messageStats.hourlyBreakdown,
			800,
			400,
		);

		const chartAttachment = new AttachmentBuilder(chartBuffer, {
			name: "stats.png",
		});

		// Create embed
		const embed = new EmbedBuilder()
			.setTitle(`📊 Statistiques de ${username}`)
			.setDescription(`Période: ${this.getPeriodLabel(period)}`)
			.setColor("#5865F2")
			.addFields(
				{
					name: "🎤 Temps vocal",
					value: ChartGenerator.formatDuration(voiceStats.totalDuration),
					inline: true,
				},
				{
					name: "💬 Messages",
					value: ChartGenerator.formatNumber(messageStats.totalMessages),
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
				.sort((a, b) => b.count - a.count)
				.slice(0, 3)
				.map((c) => `<#${c.channelId}>: ${c.count} messages`)
				.join("\n");
			embed.addFields({
				name: "📝 Salons les plus actifs (messages)",
				value: topChannels || "Aucun",
			});
		}

		if (voiceStats.channelBreakdown.length > 0) {
			const topVoiceChannels = voiceStats.channelBreakdown
				.sort((a, b) => b.duration - a.duration)
				.slice(0, 3)
				.map(
					(c) =>
						`<#${c.channelId}>: ${ChartGenerator.formatDuration(c.duration)}`,
				)
				.join("\n");
			embed.addFields({
				name: "🎙️ Salons vocaux les plus utilisés",
				value: topVoiceChannels || "Aucun",
			});
		}

		await interaction.editReply({
			embeds: [embed],
			files: [chartAttachment],
		});
	}

	private async handleServerStats(
		interaction: ChatInputCommandInteraction,
		timeRange: TimeRange,
		period: string,
	): Promise<void> {
		const guildId = interaction.guild!.id;

		const [serverStats, topVoiceUsers, topMessageUsers, topChannels] =
			await Promise.all([
				StatsService.getServerStats(guildId, timeRange),
				StatsService.getMostActiveVoiceUsers(guildId, timeRange, 5),
				StatsService.getMostActiveMessageUsers(guildId, timeRange, 5),
				StatsService.getMostActiveChannels(guildId, timeRange, 5),
			]);

		// Generate stats card
		const statsCardBuffer = ChartGenerator.generateStatsCard(
			[
				{
					label: "Messages totaux",
					value: ChartGenerator.formatNumber(serverStats.totalMessages),
					color: "#57F287",
				},
				{
					label: "Temps vocal total",
					value: ChartGenerator.formatDuration(serverStats.totalVoiceDuration),
					color: "#5865F2",
				},
				{
					label: "Utilisateurs actifs",
					value: serverStats.activeUsers.toString(),
					color: "#FEE75C",
				},
				{
					label: "Membres rejoints",
					value: serverStats.joinCount.toString(),
					color: "#57F287",
				},
				{
					label: "Membres partis",
					value: serverStats.leaveCount.toString(),
					color: "#ED4245",
				},
			],
			"Statistiques du serveur",
			500,
			350,
		);

		const statsAttachment = new AttachmentBuilder(statsCardBuffer, {
			name: "server_stats.png",
		});

		const embed = new EmbedBuilder()
			.setTitle(`📊 Statistiques de ${interaction.guild!.name}`)
			.setDescription(`Période: ${this.getPeriodLabel(period)}`)
			.setColor("#5865F2")
			.setImage("attachment://server_stats.png")
			.setTimestamp();

		// Top voice users
		if (topVoiceUsers.length > 0) {
			const voiceLeaderboard = topVoiceUsers
				.map(
					(u, i) =>
						`${i + 1}. <@${u.userId}>: ${ChartGenerator.formatDuration(u.totalDuration)}`,
				)
				.join("\n");
			embed.addFields({
				name: "🎤 Top utilisateurs (vocal)",
				value: voiceLeaderboard,
				inline: true,
			});
		}

		// Top message users
		if (topMessageUsers.length > 0) {
			const messageLeaderboard = topMessageUsers
				.map(
					(u, i) =>
						`${i + 1}. <@${u.userId}>: ${ChartGenerator.formatNumber(u.totalMessages)} msg`,
				)
				.join("\n");
			embed.addFields({
				name: "💬 Top utilisateurs (messages)",
				value: messageLeaderboard,
				inline: true,
			});
		}

		// Top channels
		if (topChannels.length > 0) {
			const channelLeaderboard = topChannels
				.map((c, i) => {
					const msgs = ChartGenerator.formatNumber(c.messageCount);
					const voice = ChartGenerator.formatDuration(c.voiceDuration);
					return `${i + 1}. <#${c.channelId}>: ${msgs} msg, ${voice}`;
				})
				.join("\n");
			embed.addFields({
				name: "📍 Salons les plus actifs",
				value: channelLeaderboard,
			});
		}

		await interaction.editReply({
			embeds: [embed],
			files: [statsAttachment],
		});
	}
}
