import { BaseCommand } from "@class/BaseCommand";
import { Pager } from "@class/Pager";
import { Command } from "@decorators/Command";
import { Subcommand } from "@decorators/Subcommand";
import { EPermission } from "@enums/EPermission";
import { SanctionReasonService } from "@modules/Moderation/services/SanctionReasonService";
import { SanctionType } from "@prisma/client/client";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { prismaClient } from "@services/prismaService";
import { GeneralConfig } from "@src/modules/General/GeneralConfig";
import {
	ChatInputCommandInteraction,
	Client,
	Colors,
	EmbedBuilder,
} from "discord.js";
import { sanctionsOptions } from "./sanctionsOptions";

@Command(sanctionsOptions)
export default class SanctionsCommand extends BaseCommand {
	@Subcommand({ name: "list", permission: EPermission.SanctionsList })
	async listSanctions(
		client: Client,
		interaction: ChatInputCommandInteraction,
	) {
		await interaction.deferReply();
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		const targetUser = interaction.options.getUser("user", true);

		const sanctions = await prismaClient.sanction.findMany({
			where: { userId: targetUser.id, guildId: interaction.guildId! },
			orderBy: { createdAt: "desc" },
			include: { Moderator: true },
		});

		if (sanctions.length === 0) {
			await interaction.editReply({
				content: t(
					"modules.moderation.commands.sanctions.no_sanctions",
					{
						userTag: targetUser.tag,
					},
				),
			});
			return;
		}

		const pager = new Pager({
			items: sanctions,
			itemsPerPage: 10,
			userId: interaction.user.id,
			renderPage: async (items, pageIndex, totalPages) => {
				const embed = new EmbedBuilder()
					.setTitle(
						t("modules.moderation.commands.sanctions.title", {
							userTag: targetUser.tag,
						}),
					)
					.setColor("Red")
					.setTimestamp()
					.setFooter({
						text: t("common.pagination.page_info", {
							current: pageIndex + 1,
							total: totalPages,
							count: sanctions.length,
						}),
					});

				items.forEach((sanction) => {
					const moderator = sanction.Moderator
						? `<@${sanction.moderatorId}>`
						: t("modules.moderation.commands.sanctions.unknown");
					const date = new Date(
						sanction.createdAt,
					).toLocaleDateString();

					let emoji = "";
					switch (sanction.type) {
						case "WARN":
							emoji = "`⚠️`";
							break;
						case "MUTE":
							emoji = "`🔇`";
							break;
						case "KICK":
							emoji = "`👢`";
							break;
						case "BAN":
							emoji = "`🔨`";
							break;
					}

					let statusInfo = "";
					if (sanction.type === "MUTE" || sanction.type === "BAN") {
						if (sanction.active) {
							statusInfo = `\n**${t("modules.moderation.commands.sanctions.status")}:** \`✅\``;
							if (sanction.expiresAt) {
								const expires = Math.floor(
									new Date(sanction.expiresAt).getTime() /
										1000,
								);
								statusInfo += ` (${t("modules.moderation.commands.sanctions.expires", { time: `<t:${expires}:f>` })})`;
							} else {
								statusInfo += ` (${t("modules.moderation.commands.sanctions.permanent")})`;
							}
						} else {
							statusInfo = `\n**${t("modules.moderation.commands.sanctions.status")}:** \`❌\``;
						}
					}

					embed.addFields({
						name: `${emoji} ${sanction.type} #${sanction.id} - ${date}`,
						value: `**${t("modules.moderation.commands.sanctions.reason")}:** ${sanction.reason}\n**${t("modules.moderation.commands.sanctions.moderator")}:** ${moderator}${statusInfo}`,
						inline: false,
					});
				});

				return { embeds: [embed], components: [] };
			},
		});

		await pager.start(interaction);
	}

	@Subcommand({
		name: "add",
		group: "reason",
		permission: EPermission.ReasonAdd,
	})
	async handleReasonAdd(
		client: Client,
		interaction: ChatInputCommandInteraction,
	) {
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		const text = interaction.options.getString("text", true);
		const typeStr = interaction.options.getString("type", true);
		const duration = interaction.options.getString("duration");

		const type = typeStr as SanctionType;

		try {
			const reason = await SanctionReasonService.create(
				interaction.guildId!,
				{
					text,
					type,
					duration: duration || undefined,
				},
			);

			const embed = new EmbedBuilder()
				.setTitle(
					t("modules.moderation.commands.sanctions.reason_added"),
				)
				.setColor(Colors.Green)
				.setDescription(
					t(
						"modules.moderation.commands.sanctions.reason_added_desc",
						{
							type,
							text,
						},
					),
				)
				.addFields({
					name: t("modules.moderation.commands.sanctions.id"),
					value: reason.id.toString(),
					inline: true,
				});

			if (duration) {
				embed.addFields({
					name: t("modules.moderation.commands.sanctions.duration"),
					value: duration,
					inline: true,
				});
			}

			await interaction.editReply({ embeds: [embed] });
		} catch {
			await interaction.editReply({
				content: t(
					"modules.moderation.commands.sanctions.reason_add_failed",
				),
			});
		}
	}

	@Subcommand({
		name: "edit",
		group: "reason",
		permission: EPermission.ReasonEdit,
	})
	async handleReasonEdit(
		client: Client,
		interaction: ChatInputCommandInteraction,
	) {
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		const id = interaction.options.getInteger("id", true);
		const text = interaction.options.getString("text");
		const duration = interaction.options.getString("duration");

		if (!text && !duration) {
			await interaction.editReply({
				content: t(
					"modules.moderation.commands.sanctions.edit_provide_field",
				),
			});
			return;
		}

		try {
			const reason = await SanctionReasonService.getById(id);
			if (!reason) {
				await interaction.editReply({
					content: t(
						"modules.moderation.commands.sanctions.reason_not_found",
						{ id },
					),
				});
				return;
			}

			if (reason.isSystem) {
				await interaction.editReply({
					content: t(
						"modules.moderation.commands.sanctions.cannot_edit_system",
					),
				});
				return;
			}

			await SanctionReasonService.update(id, {
				text: text || undefined,
				duration: duration || undefined,
			});

			await interaction.editReply({
				content: t(
					"modules.moderation.commands.sanctions.reason_updated",
					{ id },
				),
			});
		} catch {
			await interaction.editReply({
				content: t(
					"modules.moderation.commands.sanctions.reason_update_failed",
					{ id },
				),
			});
		}
	}

	@Subcommand({
		name: "remove",
		group: "reason",
		permission: EPermission.ReasonRemove,
	})
	async handleReasonRemove(
		client: Client,
		interaction: ChatInputCommandInteraction,
	) {
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		const id = interaction.options.getInteger("id", true);

		try {
			await SanctionReasonService.delete(id);
			await interaction.editReply({
				content: t(
					"modules.moderation.commands.sanctions.reason_removed",
					{ id },
				),
			});
		} catch {
			await interaction.editReply({
				content: t(
					"modules.moderation.commands.sanctions.reason_remove_failed",
					{ id },
				),
			});
		}
	}

	@Subcommand({
		name: "list",
		group: "reason",
		permission: EPermission.ReasonList,
	})
	async handleReasonList(
		client: Client,
		interaction: ChatInputCommandInteraction,
	) {
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		const typeStr = interaction.options.getString("type");
		const type = typeStr ? (typeStr as SanctionType) : undefined;

		const reasons = type
			? await SanctionReasonService.getByType(
					interaction.guildId!,
					type,
					true,
				)
			: await SanctionReasonService.getAll(interaction.guildId!);

		if (reasons.length === 0) {
			await interaction.editReply({
				content: t(
					"modules.moderation.commands.sanctions.no_reasons_found",
				),
			});
			return;
		}

		const embed = new EmbedBuilder()
			.setTitle(t("modules.moderation.commands.sanctions.reasons_title"))
			.setColor(Colors.Blue);

		const description = reasons
			.map((r) => {
				let line = `**${r.id}**. [${r.type}] ${r.text}`;
				if (r.duration) line += ` (${r.duration})`;
				if (r.isSystem) line += ` [SYSTEM]`;
				return line;
			})
			.join("\n");

		embed.setDescription(description.substring(0, 4096));

		await interaction.editReply({ embeds: [embed] });
	}
}
