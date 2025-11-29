import {
	ApplicationCommandOptionType,
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

@Command({
	name: "debug",
	description: "Debug commands",
	options: [
		{
			name: "guild_member_add",
			description: "Debug GuildMemberAdd event",
			type: ApplicationCommandOptionType.SubcommandGroup,
			options: [
				{
					name: "message",
					description: "Test welcome message",
					type: ApplicationCommandOptionType.Subcommand,
				},
			],
		},
		{
			name: "voice_state_update",
			description: "Debug VoiceStateUpdate event",
			type: ApplicationCommandOptionType.SubcommandGroup,
			options: [
				{
					name: "join",
					description: "Test voice join",
					type: ApplicationCommandOptionType.Subcommand,
				},
				{
					name: "leave",
					description: "Test voice leave",
					type: ApplicationCommandOptionType.Subcommand,
				},
				{
					name: "move",
					description: "Test voice move",
					type: ApplicationCommandOptionType.Subcommand,
				},
				{
					name: "stream",
					description: "Test voice stream",
					type: ApplicationCommandOptionType.Subcommand,
				},
			],
		},
	],
	defaultMemberPermissions: "Administrator",
})
export default class DebugCommand extends BaseCommand {
	@DefaultCommand(EPermission.Debug)
	async run(client: LeBotClient<true>, interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;

		const subcommandGroup = interaction.options.getSubcommandGroup();
		const subcommand = interaction.options.getSubcommand();

		if (subcommandGroup === "guild_member_add") {
			if (subcommand === "message") {
				await this.debugGuildMemberAddMessage(client, interaction);
			}
		} else if (subcommandGroup === "voice_state_update") {
			if (subcommand === "join") {
				await this.debugVoiceStateUpdateJoin(client, interaction);
			} else if (subcommand === "leave") {
				await this.debugVoiceStateUpdateLeave(client, interaction);
			} else if (subcommand === "move") {
				await this.debugVoiceStateUpdateMove(client, interaction);
			} else if (subcommand === "stream") {
				await this.debugVoiceStateUpdateStream(client, interaction);
			}
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
