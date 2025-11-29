import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	Colors,
	Client,
	MessageFlags,
} from "discord.js";
import { BaseCommand } from "@class/BaseCommand";
import { Command } from "@decorators/Command";
import { Subcommand } from "@decorators/Subcommand";
import { EPermission } from "@enums/EPermission";
import { reasonOptions } from "./options";
import { SanctionReasonService } from "@services/SanctionReasonService";
import { SanctionType } from "@prisma/client/client";

@Command(reasonOptions)
export default class ReasonCommand extends BaseCommand {
	@Subcommand({ name: "add", permission: EPermission.ReasonManage })
	async handleAdd(client: Client, interaction: ChatInputCommandInteraction) {
		const text = interaction.options.getString("text", true);
		const typeStr = interaction.options.getString("type", true);
		const duration = interaction.options.getString("duration");

		const type = typeStr as SanctionType;

		try {
			const reason = await SanctionReasonService.create({
				text,
				type,
				duration: duration || undefined,
			});

			const embed = new EmbedBuilder()
				.setTitle("Reason Added")
				.setColor(Colors.Green)
				.setDescription(`Added reason for **${type}**:\n${text}`)
				.addFields({
					name: "ID",
					value: reason.id.toString(),
					inline: true,
				});

			if (duration) {
				embed.addFields({
					name: "Duration",
					value: duration,
					inline: true,
				});
			}

			await interaction.reply({ embeds: [embed] });
		} catch (error) {
			await interaction.reply({
				content: "Failed to add reason. It might already exist.",
				flags: [MessageFlags.Ephemeral],
			});
		}
	}

	@Subcommand({ name: "edit", permission: EPermission.ReasonManage })
	async handleEdit(client: Client, interaction: ChatInputCommandInteraction) {
		const id = interaction.options.getInteger("id", true);
		const text = interaction.options.getString("text");
		const duration = interaction.options.getString("duration");

		if (!text && !duration) {
			await interaction.reply({
				content: "You must provide at least one field to update.",
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		try {
			const reason = await SanctionReasonService.getById(id);
			if (!reason) {
				await interaction.reply({
					content: `Reason with ID ${id} not found.`,
					flags: [MessageFlags.Ephemeral],
				});
				return;
			}

			if (reason.isSystem) {
				await interaction.reply({
					content: "Cannot edit system reasons.",
					flags: [MessageFlags.Ephemeral],
				});
				return;
			}

			await SanctionReasonService.update(id, {
				text: text || undefined,
				duration: duration || undefined,
			});

			await interaction.reply({
				content: `Reason with ID ${id} updated.`,
				flags: [MessageFlags.Ephemeral],
			});
		} catch (error) {
			await interaction.reply({
				content: `Failed to update reason with ID ${id}.`,
				flags: [MessageFlags.Ephemeral],
			});
		}
	}

	@Subcommand({ name: "remove", permission: EPermission.ReasonManage })
	async handleRemove(
		client: Client,
		interaction: ChatInputCommandInteraction,
	) {
		const id = interaction.options.getInteger("id", true);

		try {
			await SanctionReasonService.delete(id);
			await interaction.reply({
				content: `Reason with ID ${id} removed.`,
				flags: [MessageFlags.Ephemeral],
			});
		} catch (error) {
			await interaction.reply({
				content: `Failed to remove reason with ID ${id}.`,
				flags: [MessageFlags.Ephemeral],
			});
		}
	}

	@Subcommand({ name: "list", permission: EPermission.ReasonManage })
	async handleList(client: Client, interaction: ChatInputCommandInteraction) {
		const typeStr = interaction.options.getString("type");
		const type = typeStr ? (typeStr as SanctionType) : undefined;

		const reasons = type
			? await SanctionReasonService.getByType(type, true)
			: await SanctionReasonService.getAll();

		if (reasons.length === 0) {
			await interaction.reply({
				content: "No reasons found.",
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		const embed = new EmbedBuilder()
			.setTitle("Sanction Reasons")
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

		await interaction.reply({ embeds: [embed] });
	}
}
