import { BaseCommand } from "@class/BaseCommand";
import { LeBotClient } from "@class/LeBotClient";
import { Command } from "@decorators/Command";
import { Subcommand } from "@decorators/Subcommand";
import { EPermission } from "@enums/EPermission";
import { StatsReader } from "@modules/Statistics/services/StatsReader";
import type { Achievement } from "@prisma/client/client";
import { AchievementCategory, AchievementType } from "@prisma/client/enums";
import { prismaClient } from "@services/prismaService";
import { InteractionHelper } from "@utils/InteractionHelper";
import {
	ApplicationCommandOptionType,
	ChatInputCommandInteraction,
	EmbedBuilder,
} from "discord.js";

@Command({
	name: "achievement",
	description: "Achievement system",
	options: [
		{
			name: "list",
			description: "List all achievements",
			type: ApplicationCommandOptionType.Subcommand,
		},
		{
			name: "stats",
			description: "View your achievement stats",
			type: ApplicationCommandOptionType.Subcommand,
		},
		{
			name: "seed",
			description: "Seed default achievements",
			type: ApplicationCommandOptionType.Subcommand,
		},
	],
})
export class AchievementCommand extends BaseCommand {
	@Subcommand({
		name: "list",
	})
	async list(client: LeBotClient, interaction: ChatInputCommandInteraction) {
		await InteractionHelper.defer(interaction);
		const userId = interaction.user.id;
		const guildId = interaction.guildId!;

		const achievements = await prismaClient.achievement.findMany({
			where: { guildId },
		});
		const userAchievements = await prismaClient.userAchievement.findMany({
			where: { userId, guildId },
		});
		const unlockedIds = new Set(
			userAchievements.map((u) => u.achievementId),
		);

		const global = achievements.filter(
			(a) => a.category === AchievementCategory.GLOBAL,
		);
		const rotated = achievements.filter(
			(a) => a.category === AchievementCategory.ROTATED && a.isActive,
		);

		const formatAchievement = (a: Achievement) => {
			const unlocked = unlockedIds.has(a.id);
			return `${unlocked ? "✅" : "🔒"} **${a.name}**\n*${a.description}*`;
		};

		const embed = new EmbedBuilder()
			.setTitle("🏆 Achievements")
			.setColor("Gold")
			.setThumbnail(interaction.user.displayAvatarURL());

		if (global.length > 0) {
			// Split into chunks if too long, but for now simple join
			const desc = global.map(formatAchievement).join("\n");
			embed.addFields({
				name: "🌍 Global Achievements",
				value:
					desc.length > 1024 ? desc.substring(0, 1021) + "..." : desc,
			});
		}

		if (rotated.length > 0) {
			const desc = rotated.map(formatAchievement).join("\n");
			embed.addFields({
				name: "🔄 Seasonal Achievements",
				value:
					desc.length > 1024 ? desc.substring(0, 1021) + "..." : desc,
			});
		}

		await interaction.editReply({ embeds: [embed] });
	}

	@Subcommand({
		name: "stats",
	})
	async stats(client: LeBotClient, interaction: ChatInputCommandInteraction) {
		await InteractionHelper.defer(interaction);
		const userId = interaction.user.id;
		const guildId = interaction.guildId!;

		const stats = await StatsReader.getUserStats(userId, guildId);
		const msgRate = await StatsReader.getMessageCountInLastHour(
			userId,
			guildId,
		);

		const embed = new EmbedBuilder()
			.setTitle("📊 Your Stats")
			.setColor("Blue")
			.addFields(
				{
					name: "Messages (Total)",
					value: stats?.messageCount.toString() || "0",
					inline: true,
				},
				{
					name: "Messages (Last Hour)",
					value: msgRate.toString(),
					inline: true,
				},
				{
					name: "Voice Time",
					value: `${Math.floor((stats?.voiceDuration || 0) / 60)} mins`,
					inline: true,
				},
				{
					name: "Invites",
					value: stats?.inviteCount.toString() || "0",
					inline: true,
				},
			);

		await interaction.editReply({ embeds: [embed] });
	}

	@Subcommand({
		name: "seed",
		permission: EPermission.AchievementSeed,
	})
	async seed(client: LeBotClient, interaction: ChatInputCommandInteraction) {
		await InteractionHelper.defer(interaction);
		const guildId = interaction.guildId!;

		const defaults = [
			{
				id: "MSG_100",
				name: "Chatterbox",
				description: "Send 100 messages",
				category: AchievementCategory.GLOBAL,
				type: AchievementType.MESSAGE_COUNT,
				threshold: 100,
			},
			{
				id: "MSG_1000",
				name: "Legendary Chatter",
				description: "Send 1000 messages",
				category: AchievementCategory.GLOBAL,
				type: AchievementType.MESSAGE_COUNT,
				threshold: 1000,
			},
			{
				id: "VOICE_1H",
				name: "Listener",
				description: "Spend 1 hour in voice",
				category: AchievementCategory.GLOBAL,
				type: AchievementType.VOICE_DURATION,
				threshold: 3600,
			},
			{
				id: "VOICE_10H",
				name: "Talkative",
				description: "Spend 10 hours in voice",
				category: AchievementCategory.GLOBAL,
				type: AchievementType.VOICE_DURATION,
				threshold: 36000,
			},
			{
				id: "INVITE_5",
				name: "Recruiter",
				description: "Invite 5 people",
				category: AchievementCategory.GLOBAL,
				type: AchievementType.INVITE_COUNT,
				threshold: 5,
			},
			{
				id: "STREAK_7",
				name: "Dedicated",
				description: "Be active for 7 consecutive days",
				category: AchievementCategory.GLOBAL,
				type: AchievementType.STREAK_DAYS,
				threshold: 7,
			},
			{
				id: "DIVERSITY_5",
				name: "Explorer",
				description: "Post in 5 different channels",
				category: AchievementCategory.GLOBAL,
				type: AchievementType.CHANNEL_DIVERSITY,
				threshold: 5,
			},
			{
				id: "REACTION_100",
				name: "Reactor",
				description: "Add or receive 100 reactions",
				category: AchievementCategory.GLOBAL,
				type: AchievementType.REACTION_COUNT,
				threshold: 100,
			},
			{
				id: "STREAM_1H",
				name: "Streamer",
				description: "Stream for 1 hour",
				category: AchievementCategory.GLOBAL,
				type: AchievementType.STREAM_DURATION,
				threshold: 3600,
			},
			{
				id: "WORDY",
				name: "Novelist",
				description: "Average 50 words per message",
				category: AchievementCategory.GLOBAL,
				type: AchievementType.WORD_COUNT_AVG,
				threshold: 50,
			},
			{
				id: "MEDIA_50",
				name: "Content Creator",
				description: "Share 50 images or videos",
				category: AchievementCategory.GLOBAL,
				type: AchievementType.MEDIA_COUNT,
				threshold: 50,
			},
			{
				id: "REACH_10",
				name: "Influencer",
				description: "Interact with 10 unique users",
				category: AchievementCategory.GLOBAL,
				type: AchievementType.MENTION_REACH,
				threshold: 10,
			},
			{
				id: "COMMANDER",
				name: "Power User",
				description: "Use 100 slash commands",
				category: AchievementCategory.GLOBAL,
				type: AchievementType.COMMAND_USAGE,
				threshold: 100,
			},
			{
				id: "NIGHT_OWL",
				name: "Night Owl",
				description: "Be in voice between 2AM and 5AM",
				category: AchievementCategory.GLOBAL,
				type: AchievementType.VOICE_PEAK_TIME,
				threshold: 1,
			},

			{
				id: "SPEED_TYPER",
				name: "Speed Typer",
				description: "Send 100 messages in 1 hour",
				category: AchievementCategory.ROTATED,
				type: AchievementType.MESSAGE_RATE,
				threshold: 100,
			},
			{
				id: "CASUAL_TYPER",
				name: "Casual Typer",
				description: "Send 20 messages in 1 hour",
				category: AchievementCategory.ROTATED,
				type: AchievementType.MESSAGE_RATE,
				threshold: 20,
			},
		];

		let count = 0;
		for (const def of defaults) {
			await prismaClient.achievement.upsert({
				where: { guildId_id: { guildId, id: def.id } },
				update: {},
				create: {
					id: def.id,
					guildId,
					name: def.name,
					description: def.description,
					category: def.category,
					type: def.type,
					threshold: def.threshold,
					isActive: def.category === AchievementCategory.GLOBAL, // Global always active, Rotated starts inactive
				},
			});
			count++;
		}

		await InteractionHelper.respondSuccess(
			interaction,
			`Seeded ${count} achievements!`,
		);
	}
}
