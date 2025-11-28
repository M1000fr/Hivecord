import {
	ChatInputCommandInteraction,
	Client,
	EmbedBuilder,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	ApplicationCommandOptionType,
	MessageFlags,
} from "discord.js";
import { BaseCommand } from "../../../../class/BaseCommand";
import { Command } from "../../../../decorators/Command";
import { DefaultCommand } from "../../../../decorators/DefaultCommand";
import { EPermission } from "../../../../enums/EPermission";
import { modulesOptions } from "./modulesOptions";
import { LeBotClient } from "../../../../class/LeBotClient";
import { ConfigService } from "../../../../services/ConfigService";
import { EConfigKey, EChannelConfigKey, ERoleConfigKey } from "../../../../enums/EConfigKey";

@Command(modulesOptions)
export default class ModulesCommand extends BaseCommand {
	@DefaultCommand(EPermission.ConfigureModules)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		const lebot = client as LeBotClient;
		const moduleName = interaction.options.getString("module", true);

		const module = lebot.modules.get(moduleName.toLowerCase());

		if (!module) {
			await interaction.reply({
				content: `Module **${moduleName}** not found.`,
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		if (!module.options.config) {
			await interaction.reply({
				content: `Module **${module.options.name}** has no configuration options.`,
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		const configClass = module.options.config;
		const configProperties = (configClass as any).configProperties || {};

		if (Object.keys(configProperties).length === 0) {
			await interaction.reply({
				content: `Module **${module.options.name}** has no configuration properties.`,
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		const embed = new EmbedBuilder()
			.setTitle(`⚙️ Configuration: ${module.options.name}`)
			.setDescription(
				`Select a property to configure for the **${module.options.name}** module.`,
			)
			.setColor("#5865F2")
			.setTimestamp();

		// Add fields for each config property with current values
		for (const [key, options] of Object.entries(configProperties)) {
			const opt = options as any;
			const typeNames: { [key: number]: string } = {
				[ApplicationCommandOptionType.String]: "Text",
				[ApplicationCommandOptionType.Role]: "Role",
				[ApplicationCommandOptionType.Channel]: "Channel",
				[ApplicationCommandOptionType.User]: "User",
				[ApplicationCommandOptionType.Integer]: "Number",
				[ApplicationCommandOptionType.Boolean]: "Boolean",
			};
			const typeName = typeNames[opt.type] || "Unknown";
			
			// Get current value
			let currentValue = "*Not set*";
			try {
				const snakeCaseKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
				
				if (opt.type === ApplicationCommandOptionType.Role) {
					const enumKey = Object.keys(ERoleConfigKey).find(
						k => ERoleConfigKey[k as keyof typeof ERoleConfigKey] === snakeCaseKey
					);
					if (enumKey) {
						const roleId = await ConfigService.getRole(ERoleConfigKey[enumKey as keyof typeof ERoleConfigKey]);
						if (roleId) currentValue = `<@&${roleId}>`;
					}
				} else if (opt.type === ApplicationCommandOptionType.Channel) {
					const enumKey = Object.keys(EChannelConfigKey).find(
						k => EChannelConfigKey[k as keyof typeof EChannelConfigKey] === snakeCaseKey
					);
					if (enumKey) {
						const channelId = await ConfigService.getChannel(EChannelConfigKey[enumKey as keyof typeof EChannelConfigKey]);
						if (channelId) currentValue = `<#${channelId}>`;
					}
				} else {
					const enumKey = Object.keys(EConfigKey).find(
						k => EConfigKey[k as keyof typeof EConfigKey] === snakeCaseKey
					);
					if (enumKey) {
						const value = await ConfigService.get(EConfigKey[enumKey as keyof typeof EConfigKey]);
						if (value) currentValue = value.length > 100 ? value.substring(0, 97) + "..." : value;
					}
				}
			} catch (error) {
				// Ignore errors, keep "Not set"
			}
			
			embed.addFields({
				name: key,
				value: `${opt.description}\nType: \`${typeName}\`\nCurrent: ${currentValue}`,
				inline: false,
			});
		}

		// Create select menu
		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId(`module_config:${moduleName.toLowerCase()}`)
			.setPlaceholder("Select a property to configure")
			.addOptions(
				Object.entries(configProperties).map(([key, options]) => {
					const opt = options as any;
					return new StringSelectMenuOptionBuilder()
						.setLabel(key)
						.setDescription(
							opt.description.substring(0, 100),
						)
						.setValue(key);
				}),
			);

		const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
			selectMenu,
		);

		await interaction.reply({
			embeds: [embed],
			components: [row],
		});
	}
}
