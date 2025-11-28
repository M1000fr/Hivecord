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
import { Button, Modal } from "../decorators/Interaction";
import { EChannelConfigKey } from "../enums/EConfigKey";
import { ConfigService } from "./ConfigService";
import { prismaClient } from "./prismaService";

export class TempVoiceService {
	static async handleJoin(oldState: VoiceState, newState: VoiceState) {
		if (!newState.channelId || !newState.guild || !newState.member) return;

		const generatorId = await ConfigService.getChannel(
			EChannelConfigKey.TempVoiceGeneratorChannelId,
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
		const channel = interaction.channel as VoiceChannel;

		await interaction.reply({
			content:
				"Please mention one or more users (@user1 @user2) in this channel to add/remove them from the whitelist. (Expires in 15s)",
			flags: MessageFlags.Ephemeral,
		});

		const filter = (m: Message) => m.author.id === interaction.user.id;
		const collector = channel.createMessageCollector({
			filter,
			time: 15000,
			max: 1,
		});

		collector.on("collect", async (message: Message) => {
			const targetUsers = message.mentions.users;

			// Delete user message to keep chat clean
			try {
				await message.delete();
			} catch {}

			if (targetUsers.size === 0) {
				await interaction.followUp({
					content:
						"No users mentioned. Please use @mention to mention users.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			const results: string[] = [];

			for (const targetUser of targetUsers.values()) {
				const targetUserId = targetUser.id;

				let targetMember;
				try {
					targetMember =
						await interaction.guild!.members.fetch(targetUserId);
				} catch {
					results.push(
						`❌ ${targetUser.username} - User not found`,
					);
					continue;
				}

				// Check if already whitelisted
				const existingAllowed =
					await prismaClient.tempVoiceAllowedUser.findFirst({
						where: {
							tempVoiceId: channel.id,
							userId: targetUserId,
						},
					});

				if (existingAllowed) {
					// Toggle OFF
					await prismaClient.tempVoiceAllowedUser.delete({
						where: { id: existingAllowed.id },
					});
					await channel.permissionOverwrites.delete(targetUserId);

					results.push(
						`➖ ${targetMember.displayName} has been removed from the whitelist`,
					);
				} else {
					// Toggle ON

					// Remove from blacklist if present
					const blockedEntry =
						await prismaClient.tempVoiceBlockedUser.findFirst({
							where: {
								tempVoiceId: channel.id,
								userId: targetUserId,
							},
						});

					if (blockedEntry) {
						await prismaClient.tempVoiceBlockedUser.delete({
							where: { id: blockedEntry.id },
						});
					}

					await prismaClient.tempVoiceAllowedUser.create({
						data: {
							tempVoiceId: channel.id,
							userId: targetUserId,
						},
					});

					await channel.permissionOverwrites.edit(targetUserId, {
						Connect: true,
						MoveMembers: true, // Allows bypassing user limit
					});

					results.push(
						`✅ ${targetMember.displayName} has been added to the whitelist`,
					);
				}
			}

			await interaction.followUp({
				content: results.join("\n"),
				flags: MessageFlags.Ephemeral,
			});

			await this.updateControlPanel(channel);
			collector.stop();
		});
	}

	@Button("temp_voice_blacklist")
	static async handleBlacklistButton(interaction: ButtonInteraction) {
		if (!(await this.validateOwner(interaction))) return;
		const channel = interaction.channel as VoiceChannel;

		await interaction.reply({
			content:
				"Please mention one or more users (@user1 @user2) in this channel to add/remove them from the blacklist. (Expires in 15s)",
			flags: MessageFlags.Ephemeral,
		});

		const filter = (m: Message) => m.author.id === interaction.user.id;
		const collector = channel.createMessageCollector({
			filter,
			time: 15000,
			max: 1,
		});

		collector.on("collect", async (message: Message) => {
			const targetUsers = message.mentions.users;

			// Delete user message to keep chat clean
			try {
				await message.delete();
			} catch {}

			if (targetUsers.size === 0) {
				await interaction.followUp({
					content:
						"No users mentioned. Please use @mention to mention users.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			const results: string[] = [];

			for (const targetUser of targetUsers.values()) {
				const targetUserId = targetUser.id;

				let targetMember;
				try {
					targetMember =
						await interaction.guild!.members.fetch(targetUserId);
				} catch {
					results.push(
						`❌ ${targetUser.username} - User not found`,
					);
					continue;
				}

				// Check if already blacklisted
				const existingBlocked =
					await prismaClient.tempVoiceBlockedUser.findFirst({
						where: {
							tempVoiceId: channel.id,
							userId: targetUserId,
						},
					});

				if (existingBlocked) {
					// Toggle OFF
					await prismaClient.tempVoiceBlockedUser.delete({
						where: { id: existingBlocked.id },
					});
					await channel.permissionOverwrites.delete(targetUserId);

					results.push(
						`➖ ${targetMember.displayName} has been removed from the blacklist`,
					);
				} else {
					// Toggle ON

					// Remove from whitelist if present
					const allowedEntry =
						await prismaClient.tempVoiceAllowedUser.findFirst({
							where: {
								tempVoiceId: channel.id,
								userId: targetUserId,
							},
						});

					if (allowedEntry) {
						await prismaClient.tempVoiceAllowedUser.delete({
							where: { id: allowedEntry.id },
						});
					}

					await prismaClient.tempVoiceBlockedUser.create({
						data: {
							tempVoiceId: channel.id,
							userId: targetUserId,
						},
					});

					await channel.permissionOverwrites.edit(targetUserId, {
						Connect: false,
					});

					if (targetMember.voice.channelId === channel.id) {
						await targetMember.voice.disconnect(
							"Blacklisted from temp channel",
						);
					}
					results.push(
						`🔒 ${targetMember.displayName} has been banned from the channel`,
					);
				}
			}

			await interaction.followUp({
				content: results.join("\n"),
				flags: MessageFlags.Ephemeral,
			});

			await this.updateControlPanel(channel);
			collector.stop();
		});
	}

	@Modal("temp_voice_rename_modal")
	static async handleRenameModal(interaction: ModalSubmitInteraction) {
		if (!(await this.validateOwner(interaction))) return;
		const channel = interaction.channel as VoiceChannel;

		const newName = interaction.fields.getTextInputValue("new_name");
		await channel.setName(newName);
		await interaction.reply({
			content: `Channel renamed to ${newName}`,
			flags: MessageFlags.Ephemeral,
		});
		await this.updateControlPanel(channel);
	}
}
