import { BaseCommand } from "@class/BaseCommand";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { prismaClient } from "@services/prismaService";
import { GeneralConfig } from "@src/modules/General/GeneralConfig";
import { InteractionHelper } from "@src/utils/InteractionHelper";
import { ChatInputCommandInteraction, Client, TextChannel } from "discord.js";
import { purgeOptions } from "./purgeOptions";

@Command(purgeOptions)
export default class PurgeCommand extends BaseCommand {
	@DefaultCommand(EPermission.ChannelPurge)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		await InteractionHelper.defer(interaction);
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		const channel = interaction.channel;

		if (!channel || !(channel instanceof TextChannel)) {
			await InteractionHelper.respond(interaction, {
				content: t(
					"modules.moderation.commands.purge.text_channel_only",
				),
			});
			return;
		}

		await InteractionHelper.respond(interaction, {
			content: t("modules.moderation.commands.purge.purging"),
		});

		const oldId = channel.id;
		const position = channel.position;

		try {
			// Clone the channel
			const newChannel = await channel.clone({
				position: position,
			});

			// Update DB references
			await prismaClient.$transaction(async (tx) => {
				const oldChannelRecord = await tx.channel.findUnique({
					where: { id: oldId },
				});

				if (oldChannelRecord) {
					// Create new channel record (upsert to avoid race conditions with SyncService)
					await tx.channel.upsert({
						where: { id: newChannel.id },
						create: {
							id: newChannel.id,
							type: oldChannelRecord.type,
							guildId: interaction.guildId!,
						},
						update: {
							type: oldChannelRecord.type,
						},
					});

					// Move configurations
					await tx.channelConfiguration.updateMany({
						where: { channelId: oldId },
						data: { channelId: newChannel.id },
					});

					// Soft delete old channel record
					await tx.channel.update({
						where: { id: oldId },
						data: { deletedAt: new Date() },
					});
				}
			});

			// Delete old channel
			await channel.delete("Channel purged by " + interaction.user.tag);

			// Send message in new channel
			await newChannel.send(
				t("modules.moderation.commands.purge.renewed"),
			);
		} catch (error) {
			console.error(error);
		}
	}
}
