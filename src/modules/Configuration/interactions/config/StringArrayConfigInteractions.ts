import { LeBotClient } from "@class/LeBotClient";
import { ConfigInteraction } from "@decorators/ConfigInteraction";
import {
	EConfigType,
	type ConfigPropertyOptions,
} from "@decorators/ConfigProperty";
import {
	ButtonPattern,
	ModalPattern,
	SelectMenuPattern,
} from "@decorators/Interaction";
import { GeneralConfig } from "@modules/General/GeneralConfig";
import { ConfigHelper } from "@utils/ConfigHelper";

import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ModalBuilder,
	ModalSubmitInteraction,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
	StringSelectMenuOptionBuilder,
	TextInputBuilder,
	TextInputStyle,
	type RepliableInteraction,
} from "discord.js";
import i18next from "i18next";
import { BaseConfigInteractions } from "./BaseConfigInteractions";

@ConfigInteraction()
export class StringArrayConfigInteractions extends BaseConfigInteractions {
	async show(
		interaction: RepliableInteraction,
		propertyOptions: ConfigPropertyOptions,
		propertyKey: string,
		moduleName: string,
	) {
		const view = await this.buildView(
			interaction.guildId!,
			interaction.user.id,
			propertyOptions,
			propertyKey,
			moduleName,
		);

		await interaction.reply({
			...view,
		});
	}

	private async buildView(
		guildId: string,
		userId: string,
		propertyOptions: ConfigPropertyOptions,
		propertyKey: string,
		moduleName: string,
	) {
		const currentValues = (await this.configHelper.fetchValue(
			guildId,
			propertyKey,
			EConfigType.StringArray,
		)) as string[];

		const lng =
			(await this.configService.of(guildId, GeneralConfig)
				.generalLanguage) ?? "en";
		const t = i18next.getFixedT(lng);

		const displayValue =
			currentValues.length > 0
				? currentValues.map((v) => `\n- ${v}`).join()
				: t("common.none", "None");

		const embed = this.buildPropertyEmbed(
			propertyOptions,
			propertyKey,
			displayValue,
			{ locale: lng, t },
		);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId(
					ConfigHelper.buildCustomId([
						"module_config_array_add",
						moduleName,
						propertyKey,
						userId,
					]),
				)
				.setLabel("Add")
				.setStyle(ButtonStyle.Success),
		);

		if (currentValues.length > 0) {
			row.addComponents(
				new ButtonBuilder()
					.setCustomId(
						ConfigHelper.buildCustomId([
							"module_config_array_remove",
							moduleName,
							propertyKey,
							userId,
						]),
					)
					.setLabel("Remove")
					.setStyle(ButtonStyle.Danger),
				new ButtonBuilder()
					.setCustomId(
						ConfigHelper.buildCustomId([
							"module_config_array_edit",
							moduleName,
							propertyKey,
							userId,
						]),
					)
					.setLabel("Edit")
					.setStyle(ButtonStyle.Primary),
			);
		}

		row.addComponents(
			this.createConfigButton(
				"module_config_cancel",
				moduleName,
				propertyKey,
				userId,
				"Cancel",
				ButtonStyle.Secondary,
			),
		);

		return { embeds: [embed], components: [row] };
	}

	private async refreshView(
		interaction:
			| ModalSubmitInteraction
			| StringSelectMenuInteraction
			| ButtonInteraction,
		moduleName: string,
		propertyKey: string,
	) {
		const client = interaction.client as LeBotClient<true>;
		const module = client.modules.get(moduleName);
		if (!module || !module.options.config) return;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const configProperties = (module.options.config as any)
			.configProperties;
		const propertyOptions = configProperties?.[propertyKey];

		if (!propertyOptions) return;

		const view = await this.buildView(
			interaction.guildId!,
			interaction.user.id,
			propertyOptions,
			propertyKey,
			moduleName,
		);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await (interaction as any).update(view);
	}

	@ButtonPattern("module_config_array_add:*:*:*")
	async handleAddButton(interaction: ButtonInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;
		const { parts, userId } = ctx;
		const moduleName = parts[1]!;
		const propertyKey = parts[2]!;

		const input = new TextInputBuilder({
			customId: "value",
			label: "Value",
			style: TextInputStyle.Short,
			required: true,
		});

		const modal = new ModalBuilder({
			customId: ConfigHelper.buildCustomId([
				"module_config_array_add_sub",
				moduleName,
				propertyKey,
				userId,
			]),
			title: "Add Value",
			components: [
				new ActionRowBuilder<TextInputBuilder>().addComponents(input),
			],
		});

		await interaction.showModal(modal);
	}

	@ModalPattern("module_config_array_add_sub:*:*:*")
	async handleAddModal(interaction: ModalSubmitInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;
		const { parts } = ctx;
		const moduleName = parts[1]!;
		const propertyKey = parts[2]!;
		const newValue = interaction.fields.getTextInputValue("value");

		const currentValues = (await this.configHelper.fetchValue(
			interaction.guildId!,
			propertyKey,
			EConfigType.StringArray,
			[],
		)) as string[];

		const newValues = [...currentValues, newValue];

		await this.configHelper.saveValue(
			interaction.guildId!,
			propertyKey,
			newValues,
			EConfigType.StringArray,
		);

		await this.refreshView(interaction, moduleName, propertyKey);
	}

	@ButtonPattern("module_config_array_remove:*:*:*")
	async handleRemoveButton(interaction: ButtonInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;
		const { parts, userId } = ctx;
		const moduleName = parts[1]!;
		const propertyKey = parts[2]!;

		const currentValues = (await this.configHelper.fetchValue(
			interaction.guildId!,
			propertyKey,
			EConfigType.StringArray,
			[],
		)) as string[];

		if (currentValues.length === 0) {
			await this.respondToInteraction(
				interaction,
				"No values to remove.",
			);
			return;
		}

		const select = new StringSelectMenuBuilder()
			.setCustomId(
				ConfigHelper.buildCustomId([
					"module_config_array_remove_sub",
					moduleName,
					propertyKey,
					userId,
				]),
			)
			.setPlaceholder("Select values to remove")
			.setMinValues(1)
			.setMaxValues(Math.min(currentValues.length, 25));

		currentValues.slice(0, 25).forEach((value, index) => {
			select.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(ConfigHelper.truncate(value, 100))
					.setValue(index.toString()),
			);
		});

		await interaction.update({
			content: "Select values to remove:",
			embeds: [],
			components: [
				new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
					select,
				),
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId(
							ConfigHelper.buildCustomId([
								"module_config_array_cancel",
								moduleName,
								propertyKey,
								userId,
							]),
						)
						.setLabel("Cancel")
						.setStyle(ButtonStyle.Secondary),
				),
			],
		});
	}

	@ButtonPattern("module_config_array_cancel:*:*:*")
	async handleCancelButton(interaction: ButtonInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;
		const { parts } = ctx;
		const moduleName = parts[1]!;
		const propertyKey = parts[2]!;

		await this.refreshView(interaction, moduleName, propertyKey);
	}

	@SelectMenuPattern("module_config_array_remove_sub:*:*:*")
	async handleRemoveSelect(interaction: StringSelectMenuInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;
		const { parts } = ctx;
		const moduleName = parts[1]!;
		const propertyKey = parts[2]!;
		const selectedIndices = interaction.values.map(Number);

		const currentValues = (await this.configHelper.fetchValue(
			interaction.guildId!,
			propertyKey,
			EConfigType.StringArray,
			[],
		)) as string[];

		const newValues = currentValues.filter(
			(_, index) => !selectedIndices.includes(index),
		);

		await this.configHelper.saveValue(
			interaction.guildId!,
			propertyKey,
			newValues,
			EConfigType.StringArray,
		);

		await this.refreshView(interaction, moduleName, propertyKey);
	}

	@ButtonPattern("module_config_array_edit:*:*:*")
	async handleEditButton(interaction: ButtonInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;
		const { parts, userId } = ctx;
		const moduleName = parts[1]!;
		const propertyKey = parts[2]!;

		const currentValues = (await this.configHelper.fetchValue(
			interaction.guildId!,
			propertyKey,
			EConfigType.StringArray,
			[],
		)) as string[];

		if (currentValues.length === 0) {
			await this.respondToInteraction(interaction, "No values to edit.");
			return;
		}

		const select = new StringSelectMenuBuilder()
			.setCustomId(
				ConfigHelper.buildCustomId([
					"module_config_array_edit_sel",
					moduleName,
					propertyKey,
					userId,
				]),
			)
			.setPlaceholder("Select value to edit")
			.setMinValues(1)
			.setMaxValues(1);

		currentValues.slice(0, 25).forEach((value, index) => {
			select.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(ConfigHelper.truncate(value, 100))
					.setValue(index.toString()),
			);
		});

		await interaction.update({
			content: "Select value to edit:",
			embeds: [],
			components: [
				new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
					select,
				),
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId(
							ConfigHelper.buildCustomId([
								"module_config_array_cancel",
								moduleName,
								propertyKey,
								userId,
							]),
						)
						.setLabel("Cancel")
						.setStyle(ButtonStyle.Secondary),
				),
			],
		});
	}

	@SelectMenuPattern("module_config_array_edit_sel:*:*:*")
	async handleEditSelect(interaction: StringSelectMenuInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;
		const { parts, userId } = ctx;
		const moduleName = parts[1]!;
		const propertyKey = parts[2]!;
		const index = interaction.values[0];
		if (!index) return;

		const currentValues = (await this.configHelper.fetchValue(
			interaction.guildId!,
			propertyKey,
			EConfigType.StringArray,
			[],
		)) as string[];

		const valueToEdit = currentValues[Number(index)] || "";

		const input = new TextInputBuilder({
			customId: "value",
			label: "Value",
			style: TextInputStyle.Short,
			value: valueToEdit,
			required: true,
		});

		const modal = new ModalBuilder({
			customId: ConfigHelper.buildCustomId([
				"module_config_array_edit_sub",
				moduleName,
				propertyKey,
				userId,
				index,
			]),
			title: "Edit Value",
			components: [
				new ActionRowBuilder<TextInputBuilder>().addComponents(input),
			],
		});

		await interaction.showModal(modal);
	}

	@ModalPattern("module_config_array_edit_sub:*:*:*:*")
	async handleEditModal(interaction: ModalSubmitInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;
		const { parts } = ctx;
		const moduleName = parts[1]!;
		const propertyKey = parts[2]!;
		const index = Number(parts[4]);
		const newValue = interaction.fields.getTextInputValue("value");

		const currentValues = (await this.configHelper.fetchValue(
			interaction.guildId!,
			propertyKey,
			EConfigType.StringArray,
			[],
		)) as string[];

		if (index >= 0 && index < currentValues.length) {
			currentValues[index] = newValue;
			await this.configHelper.saveValue(
				interaction.guildId!,
				propertyKey,
				currentValues,
				EConfigType.StringArray,
			);
			await this.refreshView(interaction, moduleName, propertyKey);
		} else {
			await this.respondToInteraction(interaction, "Invalid index.");
		}
	}
}
