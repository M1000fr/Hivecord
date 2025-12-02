import {
	AttachmentBuilder,
	EmbedBuilder,
	MessageFlags,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ButtonInteraction,
} from "discord.js";
import { ButtonPattern } from "@decorators/Interaction";
import { StatsService } from "@modules/Statistics/services/StatsService";
import { ChartGenerator } from "@utils/ChartGenerator";
import StatsCommand from "../commands/stats/index";

export class StatsPeriodInteractions {
	@ButtonPattern("stats:period:*")
	async handleStatsPeriodButton(
		interaction: ButtonInteraction,
	): Promise<void> {
		const customId = interaction.customId;

		// stats:period:<range>:<scope>:<targetId>:<invokerId>
		const parts = customId.split(":");
		const period = parts[2];
		const scope = parts[3] as "server" | "user";
		const targetId = parts[4];
		const invokerId = parts[5];

		if (!period || !scope || !targetId || !invokerId) return;

		// Restrict interaction to original invoker
		if (interaction.user.id !== invokerId) {
			await interaction.reply({
				content: "❌ Tu ne peux pas utiliser ces boutons.",
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		if (!interaction.guild) {
			await interaction.reply({
				content: "❌ Contexte serveur requis.",
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		const timeRange = StatsCommand.getTimeRange(period);
		try {
			if (scope === "server") {
				// Recompute server stats
				const guildId = targetId;
				if (guildId !== interaction.guild.id) {
					await interaction.reply({
						content: "❌ Serveur invalide.",
						flags: [MessageFlags.Ephemeral],
					});
					return;
				}

				const [
					serverStats,
					topVoiceUsers,
					topMessageUsers,
					topChannels,
				] = await Promise.all([
					StatsService.getServerStats(guildId, timeRange),
					StatsService.getMostActiveVoiceUsers(guildId, timeRange, 5),
					StatsService.getMostActiveMessageUsers(
						guildId,
						timeRange,
						5,
					),
					StatsService.getMostActiveChannels(guildId, timeRange, 5),
				]);

				const statsCardBuffer = ChartGenerator.generateStatsCard(
					[
						{
							label: "Messages totaux",
							value: ChartGenerator.formatNumber(
								serverStats.totalMessages,
							),
							color: "#57F287",
						},
						{
							label: "Temps vocal total",
							value: ChartGenerator.formatDuration(
								serverStats.totalVoiceDuration,
							),
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
					.setTitle(`📊 Statistiques de ${interaction.guild.name}`)
					.setDescription(
						`Période: ${StatsCommand.getPeriodLabel(period)}`,
					)
					.setColor("#5865F2")
					.setImage("attachment://server_stats.png")
					.setTimestamp();

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
				if (topChannels.length > 0) {
					const channelLeaderboard = topChannels
						.map((c, i) => {
							const msgs = ChartGenerator.formatNumber(
								c.messageCount,
							);
							const voice = ChartGenerator.formatDuration(
								c.voiceDuration,
							);
							return `${i + 1}. <#${c.channelId}>: ${msgs} msg, ${voice}`;
						})
						.join("\n");
					embed.addFields({
						name: "📍 Salons les plus actifs",
						value: channelLeaderboard,
					});
				}

				await interaction.update({
					embeds: [embed],
					files: [statsAttachment],
					components: [
						this.buildPeriodButtons(
							scope,
							targetId,
							invokerId,
							period,
						),
					],
				});
			} else if (scope === "user") {
				const userId = targetId;
				const [voiceStats, messageStats] = await Promise.all([
					StatsService.getUserVoiceStats(
						userId,
						interaction.guild.id,
						timeRange,
					),
					StatsService.getUserMessageStats(
						userId,
						interaction.guild.id,
						timeRange,
					),
				]);

				const chartBuffer = ChartGenerator.generateHourlyChart(
					voiceStats.hourlyBreakdown,
					messageStats.hourlyBreakdown,
					800,
					400,
				);

				const chartAttachment = new AttachmentBuilder(chartBuffer, {
					name: "stats.png",
				});
				const userName =
					(
						await interaction.guild.members
							.fetch(userId)
							.catch(() => null)
					)?.user.username || "Utilisateur";
				const embed = new EmbedBuilder()
					.setTitle(`📊 Statistiques de ${userName}`)
					.setDescription(
						`Période: ${StatsCommand.getPeriodLabel(period)}`,
					)
					.setColor("#5865F2")
					.addFields(
						{
							name: "🎤 Temps vocal",
							value: ChartGenerator.formatDuration(
								voiceStats.totalDuration,
							),
							inline: true,
						},
						{
							name: "💬 Messages",
							value: ChartGenerator.formatNumber(
								messageStats.totalMessages,
							),
							inline: true,
						},
						{ name: "\u200B", value: "\u200B", inline: true },
					)
					.setImage("attachment://stats.png")
					.setTimestamp();

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

				await interaction.update({
					embeds: [embed],
					files: [chartAttachment],
					components: [
						this.buildPeriodButtons(
							scope,
							userId,
							invokerId,
							period,
						),
					],
				});
			}
		} catch (error) {
			console.error("Error updating stats period:", error);
			if (interaction.deferred || interaction.replied) {
				await interaction.followUp({
					content: "Erreur lors de la mise à jour des statistiques.",
					flags: [MessageFlags.Ephemeral],
				});
			} else {
				await interaction.reply({
					content: "Erreur lors de la mise à jour des statistiques.",
					flags: [MessageFlags.Ephemeral],
				});
			}
		}
	}

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
}
