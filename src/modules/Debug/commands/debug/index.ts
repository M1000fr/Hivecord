import { BaseCommand } from "@class/BaseCommand";
import { LeBotClient } from "@class/LeBotClient";
import { Autocomplete } from "@decorators/Autocomplete";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { OptionRoute } from "@decorators/OptionRoute";
import { EPermission } from "@enums/EPermission";
import { GeneralConfigKeys } from "@modules/General/GeneralConfig";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { BotEvents } from "@src/enums/BotEvents";
import {
	ApplicationCommandOptionType,
	AutocompleteInteraction,
	CommandInteraction,
	GuildMember,
	InteractionContextType,
	MessageFlags,
	VoiceState,
} from "discord.js";

const DEBUG_ACTIONS = [
	{ name: "Guild Member Add: Message", value: "guild_member_add_message" },
	{ name: "Voice State Update: Join", value: "voice_state_update_join" },
	{ name: "Voice State Update: Leave", value: "voice_state_update_leave" },
	{ name: "Voice State Update: Move", value: "voice_state_update_move" },
	{ name: "Voice State Update: Stream", value: "voice_state_update_stream" },
];

@Command({
	name: "debug",
	description: "Debug commands",
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "action",
			description: "The debug action to perform",
			type: ApplicationCommandOptionType.String,
			required: true,
			autocomplete: true,
		},
	],
	defaultMemberPermissions: "Administrator",
})
export default class DebugCommand extends BaseCommand {
	@Autocomplete({ optionName: "action" })
	async autocomplete(
		client: LeBotClient<true>,
		interaction: AutocompleteInteraction,
	) {
		const focusedValue = interaction.options.getFocused();
		const filtered = DEBUG_ACTIONS.filter((choice) =>
			choice.name.toLowerCase().includes(focusedValue.toLowerCase()),
		);
		await interaction.respond(filtered);
	}

	@DefaultCommand(EPermission.Debug)
	async run(client: LeBotClient<true>, interaction: CommandInteraction) {
		const lng =
			(await ConfigService.get(
				interaction.guildId!,
				GeneralConfigKeys.language,
			)) ?? "en";
		const t = I18nService.getFixedT(lng);
		if (!interaction.isChatInputCommand()) return;

		await interaction.reply({
			content: t("modules.debug.commands.debug.unknown_action"),
			flags: [MessageFlags.Ephemeral],
		});
	}

	@OptionRoute({
		option: "action",
		value: "guild_member_add_message",
		permission: EPermission.Debug,
	})
	private async debugGuildMemberAddMessage(
		client: LeBotClient<true>,
		interaction: CommandInteraction,
	) {
		const lng =
			(await ConfigService.get(
				interaction.guildId!,
				GeneralConfigKeys.language,
			)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const member = interaction.member as GuildMember;
		if (!member) {
			await interaction.reply({
				content: t("modules.debug.commands.debug.member_not_found"),
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		await interaction.reply({
			content: t("modules.debug.commands.debug.simulating_join"),
			flags: [MessageFlags.Ephemeral],
		});

		client.emit(BotEvents.MemberJoinProcessed, member, {
			code: "DEBUG",
			inviter: interaction.member?.user || null,
			inviterid: interaction.member?.user.id || null,
			guild: member.guild,
			uses: 1,
		});
	}

	private getMockVoiceState(
		guild: any,
		member: any,
		channelId: string | null,
		streaming = false,
	) {
		return {
			guild,
			member,
			channelId,
			sessionId: "mock-session",
			deaf: false,
			mute: false,
			selfDeaf: false,
			selfMute: false,
			streaming,
			serverDeaf: false,
			serverMute: false,
			suppress: false,
		} as unknown as VoiceState;
	}

	@OptionRoute({
		option: "action",
		value: "voice_state_update_join",
		permission: EPermission.Debug,
	})
	private async debugVoiceStateUpdateJoin(
		client: LeBotClient<true>,
		interaction: CommandInteraction,
	) {
		const lng =
			(await ConfigService.get(
				interaction.guildId!,
				GeneralConfigKeys.language,
			)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const member = interaction.member as GuildMember;
		if (!member) {
			await interaction.reply({
				content: t("modules.debug.commands.debug.member_not_found"),
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		const guild = member.guild;
		const channel = guild.channels.cache.find((c) => c.isVoiceBased());

		if (!channel) {
			await interaction.reply({
				content: t("modules.debug.commands.debug.no_voice_channel"),
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		await interaction.reply({
			content: t("modules.debug.commands.debug.simulating_voice_join"),
			flags: [MessageFlags.Ephemeral],
		});

		client.emit(
			BotEvents.VoiceStateUpdate,
			this.getMockVoiceState(guild, member, null),
			this.getMockVoiceState(guild, member, channel.id),
		);
	}

	@OptionRoute({
		option: "action",
		value: "voice_state_update_leave",
		permission: EPermission.Debug,
	})
	private async debugVoiceStateUpdateLeave(
		client: LeBotClient<true>,
		interaction: CommandInteraction,
	) {
		const lng =
			(await ConfigService.get(
				interaction.guildId!,
				GeneralConfigKeys.language,
			)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const member = interaction.member as GuildMember;
		if (!member) {
			await interaction.reply({
				content: t("modules.debug.commands.debug.member_not_found"),
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		const guild = member.guild;
		const channel = guild.channels.cache.find((c) => c.isVoiceBased());

		if (!channel) {
			await interaction.reply({
				content: t("modules.debug.commands.debug.no_voice_channel"),
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		await interaction.reply({
			content: t("modules.debug.commands.debug.simulating_voice_leave"),
			flags: [MessageFlags.Ephemeral],
		});

		client.emit(
			BotEvents.VoiceStateUpdate,
			this.getMockVoiceState(guild, member, channel.id),
			this.getMockVoiceState(guild, member, null),
		);
	}

	@OptionRoute({
		option: "action",
		value: "voice_state_update_move",
		permission: EPermission.Debug,
	})
	private async debugVoiceStateUpdateMove(
		client: LeBotClient<true>,
		interaction: CommandInteraction,
	) {
		const lng =
			(await ConfigService.get(
				interaction.guildId!,
				GeneralConfigKeys.language,
			)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const member = interaction.member as GuildMember;
		if (!member) {
			await interaction.reply({
				content: t("modules.debug.commands.debug.member_not_found"),
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		const guild = member.guild;
		const channels = guild.channels.cache.filter((c) => c.isVoiceBased());
		const channel1 = channels.first();
		const channel2 = channels.last();

		if (!channel1 || !channel2 || channel1.id === channel2.id) {
			await interaction.reply({
				content: t("modules.debug.commands.debug.need_two_channels"),
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		await interaction.reply({
			content: t("modules.debug.commands.debug.simulating_voice_move"),
			flags: [MessageFlags.Ephemeral],
		});

		client.emit(
			BotEvents.VoiceStateUpdate,
			this.getMockVoiceState(guild, member, channel1.id),
			this.getMockVoiceState(guild, member, channel2.id),
		);
	}

	@OptionRoute({
		option: "action",
		value: "voice_state_update_stream",
		permission: EPermission.Debug,
	})
	private async debugVoiceStateUpdateStream(
		client: LeBotClient<true>,
		interaction: CommandInteraction,
	) {
		const lng =
			(await ConfigService.get(
				interaction.guildId!,
				GeneralConfigKeys.language,
			)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const member = interaction.member as GuildMember;
		if (!member) {
			await interaction.reply({
				content: t("modules.debug.commands.debug.member_not_found"),
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		const guild = member.guild;
		const channel = guild.channels.cache.find((c) => c.isVoiceBased());

		if (!channel) {
			await interaction.reply({
				content: t("modules.debug.commands.debug.no_voice_channel"),
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		await interaction.reply({
			content: t("modules.debug.commands.debug.simulating_voice_stream"),
			flags: [MessageFlags.Ephemeral],
		});

		client.emit(
			BotEvents.VoiceStateUpdate,
			this.getMockVoiceState(guild, member, channel.id, false),
			this.getMockVoiceState(guild, member, channel.id, true),
		);
	}
}
