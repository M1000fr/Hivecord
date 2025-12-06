import { Button, Modal } from "@decorators/Interaction";
import { GeneralConfigKeys } from "@modules/General/GeneralConfig";
import { LogService } from "@modules/Log/services/LogService";
import { TempVoiceService } from "@modules/Voice/services/TempVoiceService";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import {
	ActionRowBuilder,
	MessageFlags,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	VoiceChannel,
	type ButtonInteraction,
	type ModalSubmitInteraction,
} from "discord.js";

export class TempVoiceInteractions {
	@Button("temp_voice_rename")
	async handleRename(interaction: ButtonInteraction) {
		const lng =
			(await ConfigService.get(
				interaction.guildId!,
				GeneralConfigKeys.language,
			)) ?? "en";
		const t = I18nService.getFixedT(lng);
		if (!(await TempVoiceService.validateOwner(interaction))) return;

		const nameInput = new TextInputBuilder({
			customId: "new_name",
			label: t("modules.voice.interactions.rename.label"),
			style: TextInputStyle.Short,
			required: true,
			maxLength: 100,
		});

		const modal = new ModalBuilder({
			customId: "temp_voice_rename_modal",
			title: t("modules.voice.interactions.rename.title"),
			components: [
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					nameInput,
				),
			],
		});

		await interaction.showModal(modal);
	}

	@Button("temp_voice_limit_up")
	async handleLimitUp(interaction: ButtonInteraction) {
		if (!(await TempVoiceService.validateOwner(interaction))) return;
		const channel = interaction.channel as VoiceChannel;

		const currentLimitUp = channel.userLimit;
		await channel.setUserLimit(currentLimitUp + 1);
		await interaction.deferUpdate();
		await TempVoiceService.updateControlPanel(channel);
	}

	@Button("temp_voice_limit_down")
	async handleLimitDown(interaction: ButtonInteraction) {
		if (!(await TempVoiceService.validateOwner(interaction))) return;
		const channel = interaction.channel as VoiceChannel;

		const currentLimitDown = channel.userLimit;
		if (currentLimitDown > 0) {
			await channel.setUserLimit(currentLimitDown - 1);
			await interaction.deferUpdate();
			await TempVoiceService.updateControlPanel(channel);
		} else {
			await interaction.deferUpdate();
		}
	}

	@Button("temp_voice_whitelist")
	async handleWhitelistButton(interaction: ButtonInteraction) {
		if (!(await TempVoiceService.validateOwner(interaction))) return;
		await TempVoiceService.collectUserMentions(
			interaction,
			interaction.channel as VoiceChannel,
			"whitelist",
		);
	}

	@Button("temp_voice_blacklist")
	async handleBlacklistButton(interaction: ButtonInteraction) {
		if (!(await TempVoiceService.validateOwner(interaction))) return;
		await TempVoiceService.collectUserMentions(
			interaction,
			interaction.channel as VoiceChannel,
			"blacklist",
		);
	}

	@Modal("temp_voice_rename_modal")
	async handleRenameModal(interaction: ModalSubmitInteraction) {
		const lng =
			(await ConfigService.get(
				interaction.guildId!,
				GeneralConfigKeys.language,
			)) ?? "en";
		const t = I18nService.getFixedT(lng);
		if (!(await TempVoiceService.validateOwner(interaction))) return;
		const channel = interaction.channel as VoiceChannel;

		const newName = interaction.fields.getTextInputValue("new_name");
		await channel.setName(newName);
		await LogService.logTempVoice(
			channel.guild,
			interaction.user,
			"Rename",
			`Renamed <#${channel.id}> to ${newName}`,
		);
		await interaction.reply({
			content: t("modules.voice.interactions.rename.success", {
				name: newName,
			}),
			flags: MessageFlags.Ephemeral,
		});
		await TempVoiceService.updateControlPanel(channel);
	}
}
