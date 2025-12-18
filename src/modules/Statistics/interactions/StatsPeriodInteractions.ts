import { ButtonPattern } from "@decorators/Interaction";
import { GeneralConfig } from "@modules/General/GeneralConfig";
import { StatsReader } from "@modules/Statistics/services/StatsReader";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { ChartGenerator } from "@utils/ChartGenerator";
import {
	ActionRowBuilder,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	MessageFlags,
	type ButtonInteraction,
} from "discord.js";
import StatsCommand from "../commands/stats/index";

export class StatsPeriodInteractions {
	@ButtonPattern("stats:period:*")
	async handleStatsPeriodButton(
		interaction: ButtonInteraction,
	): Promise<void> {
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
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
				content: t(
					"modules.statistics.interactions.period.not_allowed",
				),
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		if (!interaction.guild) {
			await interaction.reply({
				content: t(
					"modules.statistics.interactions.period.server_only",
				),
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
						content: t(
							"modules.statistics.interactions.period.invalid_server",
						),
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
					StatsReader.getServerStats(guildId, timeRange),
					StatsReader.getMostActiveVoiceUsers(guildId, timeRange, 5),
					StatsReader.getMostActiveMessageUsers(
						guildId,
						timeRange,
						5,
					),
					StatsReader.getMostActiveChannels(guildId, timeRange, 5),
				]);

				const statsCardBuffer = ChartGenerator.generateStatsCard(
					[
						{
							label: t(
								"modules.statistics.common.total_messages",
							),
							value: ChartGenerator.formatNumber(
								serverStats.totalMessages,
								lng,
							),
							color: "#57F287",
						},
						{
							label: t(
								"modules.statistics.common.total_voice_time",
							),
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
							label: t(
								"modules.statistics.common.members_joined",
							),
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
								guild: interaction.guild.name,
							},
						),
					)
					.setDescription(
						`${t("modules.statistics.common.period")}: ${StatsCommand.getPeriodLabel(period, lng)}`,
					)
					.setColor("#5865F2")
					.setImage("attachment://server_stats.png")
					.setTimestamp();

				if (topVoiceUsers.length > 0) {
					const voiceLeaderboard = topVoiceUsers
						.map(
							(
								u: { userId: string; totalDuration: number },
								i: number,
							) =>
								`${i + 1}. <@${u.userId}>: ${ChartGenerator.formatDuration(u.totalDuration)}`,
						)
						.join("\n");
					embed.addFields({
						name: t(
							"modules.statistics.commands.stats.top_users_voice",
						),
						value: voiceLeaderboard,
						inline: true,
					});
				}
				if (topMessageUsers.length > 0) {
					const messageLeaderboard = topMessageUsers
						.map(
							(
								u: { userId: string; totalMessages: number },
								i: number,
							) =>
								`${i + 1}. <@${u.userId}>: ${ChartGenerator.formatNumber(u.totalMessages, lng)} msg`,
						)
						.join("\n");
					embed.addFields({
						name: t(
							"modules.statistics.commands.stats.top_users_msg",
						),
						value: messageLeaderboard,
						inline: true,
					});
				}
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
									lng,
								);
								const voice = ChartGenerator.formatDuration(
									c.voiceDuration,
								);
								return `${i + 1}. <#${c.channelId}>: ${msgs} msg, ${voice}`;
							},
						)
						.join("\n");
					embed.addFields({
						name: t(
							"modules.statistics.commands.stats.top_channels",
						),
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
					StatsReader.getUserVoiceStats(
						userId,
						interaction.guild.id,
						timeRange,
					),
					StatsReader.getUserMessageStats(
						userId,
						interaction.guild.id,
						timeRange,
					),
				]);

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
				const userName =
					(
						await interaction.guild.members
							.fetch(userId)
							.catch(() => null)
					)?.user.username || t("common.user");
				const embed = new EmbedBuilder()
					.setTitle(
						t(
							"modules.statistics.commands.stats.user_stats_title",
							{
								username: userName,
							},
						),
					)
					.setDescription(
						`${t("modules.statistics.common.period")}: ${StatsCommand.getPeriodLabel(period, lng)}`,
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
						{ name: "\u200B", value: "\u200B", inline: true },
					)
					.setImage("attachment://stats.png")
					.setTimestamp();

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
						name: t(
							"modules.statistics.commands.stats.top_channels_msg",
						),
						value: topChannels || t("common.none"),
					});
				}

				if (voiceStats.channelBreakdown.length > 0) {
					const topVoiceChannels = voiceStats.channelBreakdown
						.sort(
							(
								a: { duration: number },
								b: { duration: number },
							) => b.duration - a.duration,
						)
						.slice(0, 3)
						.map(
							(c: { channelId: string; duration: number }) =>
								`<#${c.channelId}>: ${ChartGenerator.formatDuration(c.duration)}`,
						)
						.join("\n");
					embed.addFields({
						name: t(
							"modules.statistics.commands.stats.top_channels_voice",
						),
						value: topVoiceChannels || t("common.none"),
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
					content: t(
						"modules.statistics.interactions.period.update_error",
					),
					flags: [MessageFlags.Ephemeral],
				});
			} else {
				await interaction.reply({
					content: t(
						"modules.statistics.interactions.period.update_error",
					),
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
