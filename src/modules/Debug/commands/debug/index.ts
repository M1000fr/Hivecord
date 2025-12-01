import {
	ApplicationCommandOptionType,
	AutocompleteInteraction,
	CommandInteraction,
	Events,
	GuildMember,
	MessageFlags,
	VoiceState,
} from "discord.js";
import { BaseCommand } from "@class/BaseCommand";
import { Command } from "@decorators/Command";
import { LeBotClient } from "@class/LeBotClient";
import { EPermission } from "@enums/EPermission";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { Autocomplete } from "@decorators/Autocomplete";

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
	async autocomplete(client: LeBotClient<true>, interaction: AutocompleteInteraction) {
		const focusedValue = interaction.options.getFocused();
		const filtered = DEBUG_ACTIONS.filter((choice) =>
			choice.name.toLowerCase().includes(focusedValue.toLowerCase()),
		);
		await interaction.respond(filtered);
	}

	@DefaultCommand(EPermission.Debug)
	async run(client: LeBotClient<true>, interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;

		const action = interaction.options.getString("action", true);

		switch (action) {
			case "guild_member_add_message":
				await this.debugGuildMemberAddMessage(client, interaction);
				break;
			case "voice_state_update_join":
				await this.debugVoiceStateUpdateJoin(client, interaction);
				break;
			case "voice_state_update_leave":
				await this.debugVoiceStateUpdateLeave(client, interaction);
				break;
			case "voice_state_update_move":
				await this.debugVoiceStateUpdateMove(client, interaction);
				break;
			case "voice_state_update_stream":
				await this.debugVoiceStateUpdateStream(client, interaction);
				break;
			default:
				await interaction.reply({
					content: "Unknown debug action.",
					flags: [MessageFlags.Ephemeral],
				});
		}
	}

	private async debugGuildMemberAddMessage(
		client: LeBotClient<true>,
		interaction: CommandInteraction,
	) {
		const member = interaction.member as GuildMember;
		if (!member) {
			await interaction.reply({
				content: "Could not find member.",
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		await interaction.reply({
			content: "Simulating GuildMemberAdd event...",
			flags: [MessageFlags.Ephemeral],
		});

		client.emit(Events.GuildMemberAdd, member);
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

	private async debugVoiceStateUpdateJoin(
		client: LeBotClient<true>,
		interaction: CommandInteraction,
	) {
		const member = interaction.member as GuildMember;
		if (!member) {
			await interaction.reply({
				content: "Could not find member.",
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		const guild = member.guild;
		const channel = guild.channels.cache.find((c) => c.isVoiceBased());

		if (!channel) {
			await interaction.reply({
				content: "No voice channel found to simulate join.",
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		await interaction.reply({
			content: "Simulating VoiceStateUpdate event (Join)...",
			flags: [MessageFlags.Ephemeral],
		});

		client.emit(
			Events.VoiceStateUpdate,
			this.getMockVoiceState(guild, member, null),
			this.getMockVoiceState(guild, member, channel.id),
		);
	}

	private async debugVoiceStateUpdateLeave(
		client: LeBotClient<true>,
		interaction: CommandInteraction,
	) {
		const member = interaction.member as GuildMember;
		if (!member) {
			await interaction.reply({
				content: "Could not find member.",
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		const guild = member.guild;
		const channel = guild.channels.cache.find((c) => c.isVoiceBased());

		if (!channel) {
			await interaction.reply({
				content: "No voice channel found to simulate leave.",
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		await interaction.reply({
			content: "Simulating VoiceStateUpdate event (Leave)...",
			flags: [MessageFlags.Ephemeral],
		});

		client.emit(
			Events.VoiceStateUpdate,
			this.getMockVoiceState(guild, member, channel.id),
			this.getMockVoiceState(guild, member, null),
		);
	}

	private async debugVoiceStateUpdateMove(
		client: LeBotClient<true>,
		interaction: CommandInteraction,
	) {
		const member = interaction.member as GuildMember;
		if (!member) {
			await interaction.reply({
				content: "Could not find member.",
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
				content: "Need at least 2 voice channels to simulate move.",
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		await interaction.reply({
			content: "Simulating VoiceStateUpdate event (Move)...",
			flags: [MessageFlags.Ephemeral],
		});

		client.emit(
			Events.VoiceStateUpdate,
			this.getMockVoiceState(guild, member, channel1.id),
			this.getMockVoiceState(guild, member, channel2.id),
		);
	}

	private async debugVoiceStateUpdateStream(
		client: LeBotClient<true>,
		interaction: CommandInteraction,
	) {
		const member = interaction.member as GuildMember;
		if (!member) {
			await interaction.reply({
				content: "Could not find member.",
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		const guild = member.guild;
		const channel = guild.channels.cache.find((c) => c.isVoiceBased());

		if (!channel) {
			await interaction.reply({
				content: "No voice channel found to simulate stream.",
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		await interaction.reply({
			content: "Simulating VoiceStateUpdate event (Stream Start)...",
			flags: [MessageFlags.Ephemeral],
		});

		client.emit(
			Events.VoiceStateUpdate,
			this.getMockVoiceState(guild, member, channel.id, false),
			this.getMockVoiceState(guild, member, channel.id, true),
		);
	}
}
