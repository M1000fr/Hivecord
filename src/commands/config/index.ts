import {
	ActionRowBuilder,
	ButtonInteraction,
	ChannelSelectMenuBuilder,
	ChatInputCommandInteraction,
	Client,
	ComponentType,
	ChannelType as DiscordChannelType,
	EmbedBuilder,
	InteractionCollector,
	MessageFlags,
	ModalBuilder,
	RoleSelectMenuBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
	StringSelectMenuOptionBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import { BaseCommand } from "../../class/BaseCommand";
import { Pager } from "../../class/Pager";
import { Command } from "../../decorators/Command";
import { DefaultCommand } from "../../decorators/DefaultCommand";
import {
	EChannelConfigKey,
	EConfigKey,
	ERoleConfigKey,
} from "../../enums/EConfigKey";
import { EPermission } from "../../enums/EPermission";
import { ConfigService } from "../../services/ConfigService";
import { configOptions } from "./configOptions";
import { ChannelType as PrismaChannelType } from "../../prisma/client/enums";

type ConfigType = "string" | "channel" | "role" | "roles";

interface ConfigDefinition {
	key: string;
	type: ConfigType;
	label: string;
	description: string;
	enumType: any;
	channelTypes?: DiscordChannelType[];
}

const CONFIG_DEFINITIONS: ConfigDefinition[] = [
	{
		key: EConfigKey.WelcomeMessage,
		type: "string",
		label: "Welcome Message",
		description: "Message sent when a user joins",
		enumType: EConfigKey,
	},
	{
		key: EConfigKey.WelcomeMessageImage,
		type: "string",
		label: "Welcome Image",
		description: "Image URL for welcome message",
		enumType: EConfigKey,
	},
	{
		key: EChannelConfigKey.WelcomeChannelId,
		type: "channel",
		label: "Welcome Channel",
		description: "Channel for welcome messages",
		enumType: EChannelConfigKey,
		channelTypes: [
			DiscordChannelType.GuildText,
			DiscordChannelType.GuildAnnouncement,
		],
	},
	{
		key: ERoleConfigKey.MuteRoleId,
		type: "role",
		label: "Mute Role",
		description: "Role given to muted users",
		enumType: ERoleConfigKey,
	},
	{
		key: ERoleConfigKey.NewMemberRoles,
		type: "roles",
		label: "New Member Roles",
		description: "Roles given to new members",
		enumType: ERoleConfigKey,
	},
	{
		key: EChannelConfigKey.TempVoiceGenerator,
		type: "channel",
		label: "Temp Voice Generator",
		description: "Channel that creates temp voice channels",
		enumType: EChannelConfigKey,
		channelTypes: [DiscordChannelType.GuildVoice],
	},
];

@Command(configOptions)
export default class ConfigCommand extends BaseCommand {
	@DefaultCommand(EPermission.Config)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		const pager = new Pager<ConfigDefinition>({
			items: CONFIG_DEFINITIONS,
			itemsPerPage: 5,
			renderPage: this.renderPage.bind(this),
			onComponent: this.handleComponent.bind(this),
			filter: (i) => i.user.id === interaction.user.id,
		});

		await pager.start(interaction);
	}

	async renderPage(
		items: ConfigDefinition[],
		pageIndex: number,
		totalPages: number,
	) {
		const embed = new EmbedBuilder()
			.setTitle(`Configuration - Page ${pageIndex + 1}/${totalPages}`)
			.setColor("#0099ff");

		const options: StringSelectMenuOptionBuilder[] = [];

		for (const item of items) {
			let value = "Not Set";
			if (item.enumType === EConfigKey) {
				value =
					(await ConfigService.get(item.key as EConfigKey)) ||
					"Not Set";
				if (value.length > 50) value = value.substring(0, 47) + "...";
			} else if (item.enumType === EChannelConfigKey) {
				const channelId = await ConfigService.getChannel(
					item.key as EChannelConfigKey,
				);
				value = channelId ? `<#${channelId}>` : "Not Set";
			} else if (item.enumType === ERoleConfigKey) {
				if (item.type === "roles") {
					const roleIds = await ConfigService.getRoles(
						item.key as ERoleConfigKey,
					);
					value =
						roleIds.length > 0
							? roleIds.map((id) => `<@&${id}>`).join(", ")
							: "Not Set";
				} else {
					const roleId = await ConfigService.getRole(
						item.key as ERoleConfigKey,
					);
					value = roleId ? `<@&${roleId}>` : "Not Set";
				}
			}

			embed.addFields({ name: item.label, value: value, inline: false });

			options.push(
				new StringSelectMenuOptionBuilder()
					.setLabel(item.label)
					.setDescription(item.description.substring(0, 100))
					.setValue(item.key),
			);
		}

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId("config_select")
			.setPlaceholder("Select a setting to edit")
			.addOptions(options);

		const row =
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				selectMenu,
			);

		return { embeds: [embed], components: [row] };
	}

	async handleComponent(
		interaction: StringSelectMenuInteraction | ButtonInteraction,
		collector: InteractionCollector<any>,
	) {
		if (!interaction.isStringSelectMenu()) return;
		if (interaction.customId !== "config_select") return;

		const selectedKey = interaction.values[0];
		const configDef = CONFIG_DEFINITIONS.find((c) => c.key === selectedKey);

		if (!configDef) {
			await interaction.reply({
				content: "Configuration not found.",
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		if (configDef.type === "string") {
			const modal = new ModalBuilder()
				.setCustomId(`config_modal_${selectedKey}`)
				.setTitle(`Edit ${configDef.label}`);

			const currentValue =
				(await ConfigService.get(configDef.key as EConfigKey)) || "";

			const input = new TextInputBuilder()
				.setCustomId("value")
				.setLabel("Value")
				.setStyle(TextInputStyle.Paragraph)
				.setValue(currentValue)
				.setRequired(false);

			const row = new ActionRowBuilder<TextInputBuilder>().addComponents(
				input,
			);
			modal.addComponents(row);

			await interaction.showModal(modal);

			try {
				const submitted = await interaction.awaitModalSubmit({
					time: 60000,
					filter: (i) =>
						i.customId === `config_modal_${selectedKey}` &&
						i.user.id === interaction.user.id,
				});

				const newValue = submitted.fields.getTextInputValue("value");
				if (newValue) {
					await ConfigService.set(
						configDef.key as EConfigKey,
						newValue,
					);
					await submitted.reply({
						content: `Updated ${configDef.label}.`,
						flags: [MessageFlags.Ephemeral],
					});
				} else {
					await ConfigService.delete(configDef.key as EConfigKey);
					await submitted.reply({
						content: `Cleared ${configDef.label}.`,
						flags: [MessageFlags.Ephemeral],
					});
				}
			} catch (e) {
				// Timeout or error
			}
		} else if (configDef.type === "channel") {
			const select = new ChannelSelectMenuBuilder()
				.setCustomId(`config_channel_${selectedKey}`)
				.setPlaceholder(`Select ${configDef.label}`)
				.setChannelTypes(
					configDef.channelTypes || [
						DiscordChannelType.GuildText,
						DiscordChannelType.GuildAnnouncement,
					],
				);

			const row =
				new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
					select,
				);

			await interaction.reply({
				content: `Select channel for ${configDef.label}`,
				components: [row],
				flags: [MessageFlags.Ephemeral],
			});
			const msg = await interaction.fetchReply();

			try {
				const selection = await msg.awaitMessageComponent({
					componentType: ComponentType.ChannelSelect,
					time: 60000,
					filter: (i) => i.user.id === interaction.user.id,
				});

				const channelId = selection.values[0];

				if (channelId) {
					const selectedChannel = selection.channels.get(channelId);
					let prismaType: PrismaChannelType = PrismaChannelType.TEXT;

					if (selectedChannel) {
						if (
							selectedChannel.type ===
							DiscordChannelType.GuildVoice
						) {
							prismaType = PrismaChannelType.VOICE;
						} else if (
							selectedChannel.type ===
							DiscordChannelType.GuildCategory
						) {
							prismaType = PrismaChannelType.CATEGORY;
						}
					}

					await ConfigService.setChannel(
						configDef.key as EChannelConfigKey,
						channelId,
						prismaType,
					);
					await selection.update({
						content: `Updated ${configDef.label} to <#${channelId}>.`,
						components: [],
					});
				} else {
					await selection.update({
						content: `No channel selected.`,
						components: [],
					});
				}
			} catch (e) {
				await interaction.editReply({
					content: "Selection timed out.",
					components: [],
				});
			}
		} else if (configDef.type === "role" || configDef.type === "roles") {
			const select = new RoleSelectMenuBuilder()
				.setCustomId(`config_role_${selectedKey}`)
				.setPlaceholder(`Select ${configDef.label}`)
				.setMinValues(0)
				.setMaxValues(configDef.type === "roles" ? 25 : 1);

			const row =
				new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
					select,
				);

			await interaction.reply({
				content: `Select role(s) for ${configDef.label}`,
				components: [row],
				flags: [MessageFlags.Ephemeral],
			});
			const msg = await interaction.fetchReply();

			try {
				const selection = await msg.awaitMessageComponent({
					componentType: ComponentType.RoleSelect,
					time: 60000,
					filter: (i) => i.user.id === interaction.user.id,
				});

				const roleIds = selection.values;
				if (configDef.type === "roles") {
					await ConfigService.setRoles(
						configDef.key as ERoleConfigKey,
						roleIds,
					);
					await selection.update({
						content: `Updated ${configDef.label} with ${roleIds.length} roles.`,
						components: [],
					});
				} else {
					if (roleIds.length > 0 && roleIds[0]) {
						await ConfigService.setRole(
							configDef.key as ERoleConfigKey,
							roleIds[0],
						);
						await selection.update({
							content: `Updated ${configDef.label} to <@&${roleIds[0]}>.`,
							components: [],
						});
					} else {
						await selection.update({
							content: `No role selected.`,
							components: [],
						});
					}
				}
			} catch (e) {
				await interaction.editReply({
					content: "Selection timed out.",
					components: [],
				});
			}
		}
	}
}
