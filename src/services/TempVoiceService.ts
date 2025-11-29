import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	EmbedBuilder,
	GuildMember,
	MessageFlags,
	ModalBuilder,
	PermissionFlagsBits,
	TextInputBuilder,
	TextInputStyle,
	VoiceChannel,
	VoiceState,
	type ButtonInteraction,
	type Interaction,
	type Message,
	type ModalSubmitInteraction,
} from "discord.js";
import { Button, Modal } from '@decorators/Interaction';
import { VoiceConfigKeys } from '@modules/Voice/VoiceConfig';
import { ConfigService } from "@services/ConfigService";
import { prismaClient } from "@services/prismaService";
import { LogService } from "@services/LogService";

type ListType = "whitelist" | "blacklist";

interface UserToggleResult {
	member: GuildMember;
	action: "added" | "removed";
	type: ListType;
}

export class TempVoiceService {
	private static async fetchGuildMember(guild: any, userId: string): Promise<GuildMember | null> {
		try {
			return await guild.members.fetch(userId);
		} catch {
			return null;
		}
	}

	private static async collectUserMentions(
		interaction: ButtonInteraction,
		channel: VoiceChannel,
		listType: ListType,
	): Promise<void> {
		await interaction.reply({
			content: `Please mention one or more users (@user1 @user2) in this channel to add/remove them from the ${listType}. (Expires in 15s)`,
			flags: MessageFlags.Ephemeral,
		});

		const filter = (m: Message) => m.author.id === interaction.user.id;
		const collector = channel.createMessageCollector({ filter, time: 15000, max: 1 });

		collector.on("collect", async (message: Message) => {
			try { await message.delete(); } catch {}

			if (message.mentions.users.size === 0) {
				await interaction.followUp({
					content: "No users mentioned. Please use @mention to mention users.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			const results: string[] = [];
			for (const targetUser of message.mentions.users.values()) {
				const member = await this.fetchGuildMember(interaction.guild!, targetUser.id);
				if (!member) {
					results.push(`❌ ${targetUser.username} - User not found`);
					continue;
				}

				const result = await this.toggleUserInList(channel, member, listType);
				results.push(this.formatToggleResult(result));

				const actionDesc = result.type === "whitelist" 
                    ? (result.action === "added" ? "Added to whitelist" : "Removed from whitelist")
                    : (result.action === "added" ? "Added to blacklist" : "Removed from blacklist");
                
                await LogService.logTempVoice(
                    interaction.guild!, 
                    interaction.user, 
                    "Permission Change", 
                    `${actionDesc}: <@${member.id}> in <#${channel.id}>`
                );
			}

			await interaction.followUp({ content: results.join("\n"), flags: MessageFlags.Ephemeral });
			await this.updateControlPanel(channel);
			collector.stop();
		});
	}

	private static async toggleUserInList(
		channel: VoiceChannel,
		member: GuildMember,
		listType: ListType,
	): Promise<UserToggleResult> {
		if (listType === "whitelist") {
			return await this.toggleWhitelist(channel, member);
		}
		return await this.toggleBlacklist(channel, member);
	}

	private static async toggleWhitelist(channel: VoiceChannel, member: GuildMember): Promise<UserToggleResult> {
		const existing = await prismaClient.tempVoiceAllowedUser.findFirst({
			where: { tempVoiceId: channel.id, userId: member.id },
		});

		if (existing) {
			await prismaClient.tempVoiceAllowedUser.delete({ where: { id: existing.id } });
			await channel.permissionOverwrites.delete(member.id);
			return { member, action: "removed", type: "whitelist" };
		}

		const blocked = await prismaClient.tempVoiceBlockedUser.findFirst({
			where: { tempVoiceId: channel.id, userId: member.id },
		});
		if (blocked) {
			await prismaClient.tempVoiceBlockedUser.delete({ where: { id: blocked.id } });
		}

		await prismaClient.tempVoiceAllowedUser.create({
			data: { tempVoiceId: channel.id, userId: member.id },
		});
		await channel.permissionOverwrites.edit(member.id, { Connect: true, MoveMembers: true });
		return { member, action: "added", type: "whitelist" };
	}

	private static async toggleBlacklist(channel: VoiceChannel, member: GuildMember): Promise<UserToggleResult> {
		const existing = await prismaClient.tempVoiceBlockedUser.findFirst({
			where: { tempVoiceId: channel.id, userId: member.id },
		});

		if (existing) {
			await prismaClient.tempVoiceBlockedUser.delete({ where: { id: existing.id } });
			await channel.permissionOverwrites.delete(member.id);
			return { member, action: "removed", type: "blacklist" };
		}

		const allowed = await prismaClient.tempVoiceAllowedUser.findFirst({
			where: { tempVoiceId: channel.id, userId: member.id },
		});
		if (allowed) {
			await prismaClient.tempVoiceAllowedUser.delete({ where: { id: allowed.id } });
		}

		await prismaClient.tempVoiceBlockedUser.create({
			data: { tempVoiceId: channel.id, userId: member.id },
		});
		await channel.permissionOverwrites.edit(member.id, { Connect: false });

		if (member.voice.channelId === channel.id) {
			await member.voice.disconnect("Blacklisted from temp channel");
		}

		return { member, action: "added", type: "blacklist" };
	}

	private static formatToggleResult(result: UserToggleResult): string {
		const emoji = result.type === "whitelist" 
			? (result.action === "added" ? "✅" : "➖")
			: (result.action === "added" ? "🔒" : "➖");
		
		const actionText = result.type === "whitelist"
			? (result.action === "added" ? "added to the whitelist" : "removed from the whitelist")
			: (result.action === "added" ? "banned from the channel" : "removed from the blacklist");

		return `${emoji} ${result.member.displayName} has been ${actionText}`;
	}

	static async handleJoin(oldState: VoiceState, newState: VoiceState) {
		if (!newState.channelId || !newState.guild || !newState.member) return;

		const generatorId = await ConfigService.getChannel(
			VoiceConfigKeys.tempVoiceGeneratorChannelId,
		);

		if (newState.channelId !== generatorId) return;

		await this.createTempChannel(
			newState.member,
			newState.channel as VoiceChannel,
		);
	}

	static async handleLeave(oldState: VoiceState, newState: VoiceState) {
		if (!oldState.channel || oldState.channelId === newState.channelId)
			return;

		const channel = oldState.channel;
		if (channel.members.size > 0) return;

		// Check if it's a temp channel in DB
		const tempChannel = await prismaClient.tempVoiceChannel.findUnique({
			where: { id: channel.id },
		});

		if (tempChannel) {
			try {
				await channel.delete();
			} catch (e: any) {
				if (e.code !== 10003) {
					console.error("Failed to delete temp channel", e);
				}
			}

			try {
				await prismaClient.tempVoiceChannel.delete({
					where: { id: channel.id },
				});
			} catch (e) {
				console.error("Failed to delete temp channel from DB", e);
			}
		}
	}

	private static async createTempChannel(
		member: GuildMember,
		generator: VoiceChannel,
	) {
		const guild = member.guild;
		const parent = generator.parent;

		const channelName = `${member.displayName}'s Channel`;

		try {
			const voiceChannel = await guild.channels.create({
				name: channelName,
				type: ChannelType.GuildVoice,
				parent: parent?.id,
                userLimit: 1,
				permissionOverwrites: [
					// Copy permissions from category (Discord does this by default if parent is set, but we want to be explicit about the owner)
					...(parent?.permissionOverwrites.cache.values() || []),
					{
						id: member.id,
						allow: [
							PermissionFlagsBits.Connect,
							PermissionFlagsBits.Speak,
							PermissionFlagsBits.Stream,
							PermissionFlagsBits.MuteMembers,
							PermissionFlagsBits.DeafenMembers,
							PermissionFlagsBits.MoveMembers,
							PermissionFlagsBits.ManageChannels, // Allow them to edit name/limit directly too? Maybe too much.
						],
					},
				],
			});

			await member.voice.setChannel(voiceChannel);

			await prismaClient.tempVoiceChannel.create({
				data: {
					id: voiceChannel.id,
					ownerId: member.id,
				},
			});

			await this.sendControlPanel(voiceChannel, member);
			await LogService.logTempVoice(guild, member.user, "Created", `Created temp voice channel <#${voiceChannel.id}>`);
		} catch (error) {
			console.error("Error creating temp voice channel:", error);
		}
	}

	private static async getControlPanelEmbed(channel: VoiceChannel) {
		const tempChannel = await prismaClient.tempVoiceChannel.findUnique({
			where: { id: channel.id },
			include: {
				AllowedUsers: true,
				BlockedUsers: true,
				Owner: true,
			},
		});

		if (!tempChannel) return null;

		const allowedUsers =
			tempChannel.AllowedUsers.length > 0
				? tempChannel.AllowedUsers.map((u) => `<@${u.userId}>`).join(
						", ",
					)
				: "None";

		const blockedUsers =
			tempChannel.BlockedUsers.length > 0
				? tempChannel.BlockedUsers.map((u) => `<@${u.userId}>`).join(
						", ",
					)
				: "None";

		return new EmbedBuilder()
			.setTitle("Channel Management Interface")
			.setDescription(
				`Welcome to your temporary channel <@${tempChannel.ownerId}>.\nUse the buttons below to configure your channel.`,
			)
			.setColor("#0099ff")
			.addFields(
				{
					name: "Information",
					value: `📝 Name : ${channel.name}\n👥 Limit : ${
						channel.userLimit === 0 ? "Unlimited" : channel.userLimit
					}`,
					inline: false,
				},
				{
					name: "Whitelist",
					value: allowedUsers,
					inline: true,
				},
				{
					name: "Blacklist",
					value: blockedUsers,
					inline: true,
				},
			);
	}

	private static async updateControlPanel(channel: VoiceChannel) {
		// Find the last message from the bot in the channel which has components
		// This is a bit hacky, ideally we should store the message ID in the DB.
		// But for now, let's search for it.
		const messages = await channel.messages.fetch({ limit: 10 });
		const botMessage = messages.find(
			(m) =>
				m.author.id === channel.client.user?.id &&
				m.embeds.length > 0 &&
				m.components.length > 0,
		);

		if (botMessage) {
			const embed = await this.getControlPanelEmbed(channel);
			if (embed) {
				await botMessage.edit({ embeds: [embed] });
			}
		}
	}

	private static async sendControlPanel(
		channel: VoiceChannel,
		owner: GuildMember,
	) {
		const embed = await this.getControlPanelEmbed(channel);
		if (!embed) return;

		const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId("temp_voice_rename")
				.setLabel("Rename")
				.setEmoji("📝")
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId("temp_voice_limit_up")
				.setLabel("+1")
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId("temp_voice_limit_down")
				.setLabel("-1")
				.setStyle(ButtonStyle.Secondary),
		);

		const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId("temp_voice_whitelist")
				.setLabel("Whitelist")
				.setEmoji("🔓")
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId("temp_voice_blacklist")
				.setLabel("Blacklist")
				.setEmoji("🔒")
				.setStyle(ButtonStyle.Danger),
		);

		await channel.send({ embeds: [embed], components: [row1, row2] });
	}

	private static async validateOwner(
		interaction: Interaction,
	): Promise<boolean> {
		if (
			!interaction.guild ||
			!interaction.member ||
			!(interaction.channel instanceof VoiceChannel)
		)
			return false;

		const tempChannel = await prismaClient.tempVoiceChannel.findUnique({
			where: { id: interaction.channel.id },
		});

		if (!tempChannel) return false;

		if (tempChannel.ownerId !== interaction.user.id) {
			if (interaction.isRepliable()) {
				await interaction.reply({
					content: "You do not have permission to manage this channel.",
					flags: MessageFlags.Ephemeral,
				});
			}
			return false;
		}
		return true;
	}

	@Button("temp_voice_rename")
	static async handleRename(interaction: ButtonInteraction) {
		if (!(await this.validateOwner(interaction))) return;

		const nameInput = new TextInputBuilder({
			customId: "new_name",
			label: "New name",
			style: TextInputStyle.Short,
			required: true,
			maxLength: 100,
		});

		const modal = new ModalBuilder({
			customId: "temp_voice_rename_modal",
			title: "Rename channel",
			components: [
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					nameInput,
				),
			],
		});

		await interaction.showModal(modal);
	}

	@Button("temp_voice_limit_up")
	static async handleLimitUp(interaction: ButtonInteraction) {
		if (!(await this.validateOwner(interaction))) return;
		const channel = interaction.channel as VoiceChannel;

		const currentLimitUp = channel.userLimit;
		await channel.setUserLimit(currentLimitUp + 1);
		await interaction.deferUpdate();
		await this.updateControlPanel(channel);
	}

	@Button("temp_voice_limit_down")
	static async handleLimitDown(interaction: ButtonInteraction) {
		if (!(await this.validateOwner(interaction))) return;
		const channel = interaction.channel as VoiceChannel;

		const currentLimitDown = channel.userLimit;
		if (currentLimitDown > 0) {
			await channel.setUserLimit(currentLimitDown - 1);
			await interaction.deferUpdate();
			await this.updateControlPanel(channel);
		} else {
			await interaction.deferUpdate();
		}
	}

	@Button("temp_voice_whitelist")
	static async handleWhitelistButton(interaction: ButtonInteraction) {
		if (!(await this.validateOwner(interaction))) return;
		await this.collectUserMentions(interaction, interaction.channel as VoiceChannel, "whitelist");
	}

	@Button("temp_voice_blacklist")
	static async handleBlacklistButton(interaction: ButtonInteraction) {
		if (!(await this.validateOwner(interaction))) return;
		await this.collectUserMentions(interaction, interaction.channel as VoiceChannel, "blacklist");
	}

	@Modal("temp_voice_rename_modal")
	static async handleRenameModal(interaction: ModalSubmitInteraction) {
		if (!(await this.validateOwner(interaction))) return;
		const channel = interaction.channel as VoiceChannel;

		const newName = interaction.fields.getTextInputValue("new_name");
		await channel.setName(newName);
		await LogService.logTempVoice(channel.guild, interaction.user, "Rename", `Renamed <#${channel.id}> to ${newName}`);
		await interaction.reply({
			content: `Channel renamed to ${newName}`,
			flags: MessageFlags.Ephemeral,
		});
		await this.updateControlPanel(channel);
	}
}
