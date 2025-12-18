import { BaseCommand } from "@class/BaseCommand";
import { LeBotClient } from "@class/LeBotClient";
import { Autocomplete } from "@decorators/Autocomplete";
import { Command } from "@decorators/Command";
import { Subcommand } from "@decorators/Subcommand";
import { EPermission } from "@enums/EPermission";
import { AchievementService } from "@modules/Achievement/services/AchievementService";
import { GeneralConfig } from "@modules/General/GeneralConfig";
import { StatsReader } from "@modules/Statistics/services/StatsReader";
import type { Achievement } from "@prisma/client/client";
import { AchievementCategory, AchievementType } from "@prisma/client/enums";
import { ConfigService } from "@services/ConfigService";
import { prismaClient } from "@services/prismaService";
import { InteractionHelper } from "@utils/InteractionHelper";
import {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	EmbedBuilder,
} from "discord.js";
import i18next from "i18next";
import { achievementOptions } from "./achievementOptions";

@Command(achievementOptions)
export class AchievementCommand extends BaseCommand {
	@Subcommand({
		name: "list",
	})
	async list(client: LeBotClient, interaction: ChatInputCommandInteraction) {
		await InteractionHelper.defer(interaction);
		const userId = interaction.user.id;
		const guildId = interaction.guildId!;
		const lng = await ConfigService.of(guildId, GeneralConfig)
			.generalLanguage;

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
			.setTitle(
				i18next.t(
					"modules.achievement.commands.achievement.list.title",
					{
						lng,
					},
				),
			)
			.setColor("Gold")
			.setThumbnail(interaction.user.displayAvatarURL());

		if (global.length > 0) {
			// Split into chunks if too long, but for now simple join
			const desc = global.map(formatAchievement).join("\n");
			embed.addFields({
				name: i18next.t("modules.achievement.global_title", {
					lng,
				}),
				value:
					desc.length > 1024 ? desc.substring(0, 1021) + "..." : desc,
			});
		}

		if (rotated.length > 0) {
			const desc = rotated.map(formatAchievement).join("\n");
			embed.addFields({
				name: i18next.t("modules.achievement.rotated_title", {
					lng,
				}),
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
		const lng = await ConfigService.of(guildId, GeneralConfig)
			.generalLanguage;

		const stats = await StatsReader.getUserStats(userId, guildId);
		const msgRate = await StatsReader.getMessageCountInLastHour(
			userId,
			guildId,
		);

		const embed = new EmbedBuilder()
			.setTitle(
				i18next.t("modules.achievement.stats_title", {
					lng,
				}),
			)
			.setColor("Blue")
			.addFields(
				{
					name: i18next.t(
						"modules.achievement.commands.achievement.stats.messages_total",
						{ lng },
					),
					value: stats?.messageCount.toString() || "0",
					inline: true,
				},
				{
					name: i18next.t(
						"modules.achievement.commands.achievement.stats.messages_last_hour",
						{ lng },
					),
					value: msgRate.toString(),
					inline: true,
				},
				{
					name: i18next.t(
						"modules.achievement.commands.achievement.stats.voice_time",
						{ lng },
					),
					value: `${Math.floor((stats?.voiceDuration || 0) / 60)} mins`,
					inline: true,
				},
				{
					name: i18next.t(
						"modules.achievement.commands.achievement.stats.invites",
						{ lng },
					),
					value: stats?.inviteCount.toString() || "0",
					inline: true,
				},
			);

		await interaction.editReply({ embeds: [embed] });
	}

	@Autocomplete({ optionName: "id" })
	async autocompleteAchievement(
		client: LeBotClient,
		interaction: AutocompleteInteraction,
	) {
		const focusedValue = interaction.options.getFocused().toLowerCase();
		const achievements =
			await AchievementService.getInstance().getAchievements(
				interaction.guildId!,
			);
		const filtered = achievements
			.filter(
				(a) =>
					a.name.toLowerCase().includes(focusedValue) ||
					a.id.toLowerCase().includes(focusedValue),
			)
			.map((a) => ({
				name: `${a.id} - ${a.name}`,
				value: a.id,
			}))
			.slice(0, 25);
		await interaction.respond(filtered);
	}

	@Subcommand({
		name: "add",
		permission: EPermission.AchievementCreate,
	})
	async add(client: LeBotClient, interaction: ChatInputCommandInteraction) {
		await InteractionHelper.defer(interaction);
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;

		const id = interaction.options.getString("id", true);
		const name = interaction.options.getString("name", true);
		const description = interaction.options.getString("description", true);
		const category = interaction.options.getString(
			"category",
			true,
		) as AchievementCategory;
		const type = interaction.options.getString(
			"type",
			true,
		) as AchievementType;
		const threshold = interaction.options.getInteger("threshold", true);

		try {
			await AchievementService.getInstance().createAchievement(
				interaction.guildId!,
				{ id, name, description, category, type, threshold },
			);
			await InteractionHelper.respondSuccess(
				interaction,
				i18next.t(
					"modules.achievement.commands.achievement.add.success",
					{
						lng,
						name,
						id,
					},
				),
			);
		} catch (error) {
			await InteractionHelper.respondError(
				interaction,
				i18next.t(
					"modules.achievement.commands.achievement.add.failed",
					{
						lng,
						error:
							error instanceof Error
								? error.message
								: String(error),
					},
				),
			);
		}
	}

	@Subcommand({
		name: "delete",
		permission: EPermission.AchievementDelete,
	})
	async delete(
		client: LeBotClient,
		interaction: ChatInputCommandInteraction,
	) {
		await InteractionHelper.defer(interaction);
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const id = interaction.options.getString("id", true);

		try {
			await AchievementService.getInstance().deleteAchievement(
				interaction.guildId!,
				id,
			);
			await InteractionHelper.respondSuccess(
				interaction,
				i18next.t(
					"modules.achievement.commands.achievement.delete.success",
					{
						lng,
						id,
					},
				),
			);
		} catch (error) {
			await InteractionHelper.respondError(
				interaction,
				i18next.t(
					"modules.achievement.commands.achievement.delete.failed",
					{
						lng,
						error:
							error instanceof Error
								? error.message
								: String(error),
					},
				),
			);
		}
	}

	@Subcommand({
		name: "edit",
		permission: EPermission.AchievementEdit,
	})
	async edit(client: LeBotClient, interaction: ChatInputCommandInteraction) {
		await InteractionHelper.defer(interaction);
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const id = interaction.options.getString("id", true);
		const name = interaction.options.getString("name");
		const description = interaction.options.getString("description");
		const threshold = interaction.options.getInteger("threshold");
		const active = interaction.options.getBoolean("active");

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const data: any = {};
		if (name) data.name = name;
		if (description) data.description = description;
		if (threshold) data.threshold = threshold;
		if (active !== null) data.isActive = active;

		if (Object.keys(data).length === 0) {
			await InteractionHelper.respondError(
				interaction,
				i18next.t(
					"modules.achievement.commands.achievement.edit.no_changes",
					{ lng },
				),
			);
			return;
		}

		try {
			await AchievementService.getInstance().updateAchievement(
				interaction.guildId!,
				id,
				data,
			);
			await InteractionHelper.respondSuccess(
				interaction,
				i18next.t(
					"modules.achievement.commands.achievement.edit.success",
					{
						lng,
						id,
					},
				),
			);
		} catch (error) {
			await InteractionHelper.respondError(
				interaction,
				i18next.t(
					"modules.achievement.commands.achievement.edit.failed",
					{
						lng,
						error:
							error instanceof Error
								? error.message
								: String(error),
					},
				),
			);
		}
	}
}
