import { GeneralConfigKeys } from "@modules/General/GeneralConfig";
import { LogConfigKeys } from "@modules/Log/LogConfig";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import {
	type ColorResolvable,
	Colors,
	EmbedBuilder,
	Guild,
	GuildMember,
	Message,
	type PartialGuildMember,
	type PartialMessage,
	Role,
	TextChannel,
	User,
	VoiceState,
} from "discord.js";

export class LogService {
	private static async getLogChannel(
		guild: Guild,
	): Promise<TextChannel | null> {
		const channelId = await ConfigService.getChannel(
			guild.id,
			LogConfigKeys.logChannelId,
		);
		if (!channelId) return null;
		const channel = guild.channels.cache.get(channelId);
		if (!channel || !channel.isTextBased()) return null;
		return channel as TextChannel;
	}

	private static async isEnabled(
		guildId: string,
		key: string,
	): Promise<boolean> {
		const value = await ConfigService.get(guildId, key);
		return value === "true";
	}

	private static async getLanguage(guildId: string): Promise<string> {
		return (
			(await ConfigService.get(guildId, GeneralConfigKeys.language)) ??
			"en"
		);
	}

	static async logSanction(
		guild: Guild,
		target: User,
		moderator: User,
		type: string,
		reason: string,
		duration?: string,
	) {
		if (!(await this.isEnabled(guild.id, LogConfigKeys.enableSanctionLogs)))
			return;
		const channel = await this.getLogChannel(guild);
		if (!channel) return;

		const lng = await this.getLanguage(guild.id);

		const embed = new EmbedBuilder()
			.setTitle(
				I18nService.t("modules.log.sanction.title", { lng, type }),
			)
			.setColor(Colors.Red)
			.addFields(
				{
					name: I18nService.t("modules.log.sanction.user", { lng }),
					value: `${target.tag} (${target.id})`,
					inline: true,
				},
				{
					name: I18nService.t("modules.log.sanction.moderator", {
						lng,
					}),
					value: `${moderator.tag} (${moderator.id})`,
					inline: true,
				},
				{
					name: I18nService.t("modules.log.sanction.reason", { lng }),
					value: reason,
				},
			)
			.setTimestamp();

		if (duration) {
			embed.addFields({
				name: I18nService.t("modules.log.sanction.duration", { lng }),
				value: duration,
				inline: true,
			});
		}

		await channel.send({ embeds: [embed] });
	}

	static async logTempVoice(
		guild: Guild,
		user: User,
		action: string,
		details: string,
	) {
		if (!(await this.isEnabled(guild.id, LogConfigKeys.enableVoiceLogs)))
			return;
		const channel = await this.getLogChannel(guild);
		if (!channel) return;

		const lng = await this.getLanguage(guild.id);

		const embed = new EmbedBuilder()
			.setTitle(
				I18nService.t("modules.log.temp_voice.title", { lng, action }),
			)
			.setColor(Colors.Blue)
			.setDescription(details)
			.setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
			.setTimestamp();

		await channel.send({ embeds: [embed] });
	}

	static async logMemberJoin(member: GuildMember) {
		if (
			!(await this.isEnabled(
				member.guild.id,
				LogConfigKeys.enableMemberLogs,
			))
		)
			return;
		const channel = await this.getLogChannel(member.guild);
		if (!channel) return;

		const lng = await this.getLanguage(member.guild.id);

		const embed = new EmbedBuilder()
			.setTitle(I18nService.t("modules.log.member.join.title", { lng }))
			.setColor(Colors.Green)
			.setThumbnail(member.user.displayAvatarURL())
			.addFields(
				{
					name: I18nService.t("modules.log.member.join.user", {
						lng,
					}),
					value: `${member.user.tag} (${member.id})`,
				},
				{
					name: I18nService.t("modules.log.member.join.created_at", {
						lng,
					}),
					value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
				},
			)
			.setTimestamp();

		await channel.send({ embeds: [embed] });
	}

	static async logMemberLeave(member: GuildMember | PartialGuildMember) {
		if (
			!(await this.isEnabled(
				member.guild.id,
				LogConfigKeys.enableMemberLogs,
			))
		)
			return;
		const channel = await this.getLogChannel(member.guild);
		if (!channel) return;

		const lng = await this.getLanguage(member.guild.id);

		const embed = new EmbedBuilder()
			.setTitle(I18nService.t("modules.log.member.leave.title", { lng }))
			.setColor(Colors.Orange)
			.setThumbnail(member.user?.displayAvatarURL() ?? "")
			.addFields(
				{
					name: I18nService.t("modules.log.member.leave.user", {
						lng,
					}),
					value: `${member.user?.tag ?? I18nService.t("modules.log.member.leave.unknown", { lng })} (${member.id})`,
				},
				{
					name: I18nService.t("modules.log.member.leave.joined_at", {
						lng,
					}),
					value: member.joinedTimestamp
						? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
						: I18nService.t("modules.log.member.leave.unknown", {
								lng,
							}),
				},
			)
			.setTimestamp();

		await channel.send({ embeds: [embed] });
	}

	static async logMessageEdit(
		guild: Guild,
		user: User,
		before: string,
		after: string,
	) {
		if (!(await this.isEnabled(guild.id, LogConfigKeys.enableMessageLogs)))
			return;
		const channel = await this.getLogChannel(guild);
		if (!channel) return;

		const lng = await this.getLanguage(guild.id);

		const embed = new EmbedBuilder()
			.setTitle(I18nService.t("modules.log.message.edit.title", { lng }))
			.setColor(Colors.Yellow)
			.setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
			.addFields(
				{
					name: I18nService.t("modules.log.message.edit.before", {
						lng,
					}),
					value:
						before ||
						I18nService.t("modules.log.message.edit.empty", {
							lng,
						}),
				},
				{
					name: I18nService.t("modules.log.message.edit.after", {
						lng,
					}),
					value:
						after ||
						I18nService.t("modules.log.message.edit.empty", {
							lng,
						}),
				},
			)
			.setTimestamp();

		await channel.send({ embeds: [embed] });
	}

	static async logRoleCreate(guild: Guild, role: Role) {
		if (
			!(await this.isEnabled(
				guild.id,
				LogConfigKeys.enableRoleUpdateLogs,
			))
		)
			return;
		const channel = await this.getLogChannel(guild);
		if (!channel) return;

		const lng = await this.getLanguage(guild.id);

		const embed = new EmbedBuilder()
			.setTitle(I18nService.t("modules.log.role.create.title", { lng }))
			.setColor(Colors.Green)
			.addFields(
				{
					name: I18nService.t("modules.log.role.create.role", {
						lng,
					}),
					value: `<@&${role.id}>`,
				},
				{
					name: I18nService.t("modules.log.role.create.color", {
						lng,
					}),
					value: `#${role.colors.primaryColor.toString(16).padStart(6, "0")}`,
				},
			)
			.setTimestamp();

		await channel.send({ embeds: [embed] });
	}

	static async logRoleUpdate(
		guild: Guild,
		roleBefore: Role,
		roleAfter: Role,
	) {
		if (
			!(await this.isEnabled(
				guild.id,
				LogConfigKeys.enableRoleUpdateLogs,
			))
		)
			return;
		const channel = await this.getLogChannel(guild);
		if (!channel) return;
		const changes: string[] = [];
		const lng = await this.getLanguage(guild.id);

		const checkChange = (fieldKey: string, before: any, after: any) => {
			if (before !== after) {
				const field = I18nService.t(fieldKey, { lng });
				changes.push(
					I18nService.t("modules.log.role.update.field_change", {
						lng,
						field,
						before,
						after,
					}),
				);
			}
		};

		const permissions = roleBefore.permissions.toArray();
		const newPermissions = roleAfter.permissions.toArray();

		const addedPermissions = newPermissions.filter(
			(perm) => !permissions.includes(perm),
		);
		const removedPermissions = permissions.filter(
			(perm) => !newPermissions.includes(perm),
		);

		checkChange(
			"modules.log.role.update.fields.name",
			roleBefore.name,
			roleAfter.name,
		);
		checkChange(
			"modules.log.role.update.fields.color",
			`#${roleBefore.colors.primaryColor.toString(16).padStart(6, "0")}`,
			`#${roleAfter.colors.primaryColor.toString(16).padStart(6, "0")}`,
		);
		checkChange(
			"modules.log.role.update.fields.hoist",
			roleBefore.hoist,
			roleAfter.hoist,
		);
		checkChange(
			"modules.log.role.update.fields.position",
			roleBefore.position,
			roleAfter.position,
		);
		checkChange(
			"modules.log.role.update.fields.mentionable",
			roleBefore.mentionable,
			roleAfter.mentionable,
		);

		if (addedPermissions.length > 0) {
			changes.push(
				I18nService.t("modules.log.role.update.added_perms", {
					lng,
					perms: addedPermissions.join(", "),
				}),
			);
		}

		if (removedPermissions.length > 0) {
			changes.push(
				I18nService.t("modules.log.role.update.removed_perms", {
					lng,
					perms: removedPermissions.join(", "),
				}),
			);
		}

		if (changes.length === 0) return; // No changes detected

		const embed = new EmbedBuilder()
			.setTitle(I18nService.t("modules.log.role.update.title", { lng }))
			.setColor(Colors.Yellow)
			.addFields(
				{
					name: I18nService.t("modules.log.role.update.role", {
						lng,
					}),
					value: `<@&${roleAfter.id}>`,
				},
				{
					name: I18nService.t("modules.log.role.update.changes", {
						lng,
					}),
					value: changes.join("\n"),
				},
			)
			.setTimestamp();

		await channel.send({ embeds: [embed] });
	}

	static async logRoleDelete(guild: Guild, role: Role) {
		if (
			!(await this.isEnabled(
				guild.id,
				LogConfigKeys.enableRoleUpdateLogs,
			))
		)
			return;
		const channel = await this.getLogChannel(guild);
		if (!channel) return;

		const lng = await this.getLanguage(guild.id);

		const embed = new EmbedBuilder()
			.setTitle(I18nService.t("modules.log.role.delete.title", { lng }))
			.setColor(Colors.Green)
			.addFields(
				{
					name: I18nService.t("modules.log.role.delete.role", {
						lng,
					}),
					value: `<@&${role.id}>`,
				},
				{
					name: I18nService.t("modules.log.role.delete.color", {
						lng,
					}),
					value: `#${role.colors.primaryColor.toString(16).padStart(6, "0")}`,
				},
			)
			.setTimestamp();

		await channel.send({ embeds: [embed] });
	}

	static async logVoiceState(oldState: VoiceState, newState: VoiceState) {
		if (
			!(await this.isEnabled(
				newState.guild.id,
				LogConfigKeys.enableVoiceConnectionLogs,
			))
		)
			return;
		const channel = await this.getLogChannel(newState.guild);
		if (!channel) return;

		const member = newState.member;
		if (!member) return;

		const lng = await this.getLanguage(newState.guild.id);

		let action = "";
		let color: ColorResolvable = Colors.Grey;
		let details = "";

		if (!oldState.channelId && newState.channelId) {
			action = I18nService.t("modules.log.voice.connected", { lng });
			color = Colors.Green;
			details = I18nService.t("modules.log.voice.details.connected", {
				lng,
				channel: `<#${newState.channelId}>`,
			});
		} else if (oldState.channelId && !newState.channelId) {
			action = I18nService.t("modules.log.voice.disconnected", { lng });
			color = Colors.Red;
			details = I18nService.t("modules.log.voice.details.disconnected", {
				lng,
				channel: `<#${oldState.channelId}>`,
			});
		} else if (oldState.channelId !== newState.channelId) {
			action = I18nService.t("modules.log.voice.moved", { lng });
			color = Colors.Yellow;
			details = I18nService.t("modules.log.voice.details.moved", {
				lng,
				old: `<#${oldState.channelId}>`,
				new: `<#${newState.channelId}>`,
			});
		} else if (!oldState.streaming && newState.streaming) {
			action = I18nService.t("modules.log.voice.started_streaming", {
				lng,
			});
			color = Colors.Purple;
			details = I18nService.t(
				"modules.log.voice.details.started_streaming",
				{
					lng,
					channel: `<#${newState.channelId}>`,
				},
			);
		} else if (oldState.streaming && !newState.streaming) {
			action = I18nService.t("modules.log.voice.stopped_streaming", {
				lng,
			});
			color = Colors.Grey;
			details = I18nService.t(
				"modules.log.voice.details.stopped_streaming",
				{
					lng,
					channel: `<#${newState.channelId}>`,
				},
			);
		} else {
			return; // Ignore other updates (mute/deafen)
		}

		const embed = new EmbedBuilder()
			.setTitle(I18nService.t("modules.log.voice.title", { lng, action }))
			.setColor(color)
			.setDescription(details)
			.setAuthor({
				name: member.user.tag,
				iconURL: member.user.displayAvatarURL(),
			})
			.setTimestamp();

		await channel.send({ embeds: [embed] });
	}

	static async logMessageUpdate(
		oldMessage: Message | PartialMessage,
		newMessage: Message | PartialMessage,
	) {
		if (
			!(await this.isEnabled(
				newMessage.guild!.id,
				LogConfigKeys.enableMessageLogs,
			))
		)
			return;
		if (newMessage.author?.bot) return;
		if (oldMessage.content === newMessage.content) return;

		const channel = await this.getLogChannel(newMessage.guild!);
		if (!channel) return;

		const lng = await this.getLanguage(newMessage.guild!.id);

		const embed = new EmbedBuilder()
			.setTitle(I18nService.t("modules.log.message.edit.title", { lng }))
			.setColor(Colors.Yellow)
			.setAuthor({
				name: newMessage.author?.tag ?? "Unknown User",
				iconURL: newMessage.author?.displayAvatarURL(),
			})
			.setDescription(
				I18nService.t("modules.log.message.edit.description", {
					lng,
					channel: `<#${newMessage.channelId}>`,
					url: newMessage.url,
				}),
			)
			.addFields(
				{
					name: I18nService.t("modules.log.message.edit.before", {
						lng,
					}),
					value:
						oldMessage.content?.substring(0, 1024) ||
						I18nService.t("modules.log.message.edit.no_content", {
							lng,
						}),
					inline: true,
				},
				{
					name: I18nService.t("modules.log.message.edit.after", {
						lng,
					}),
					value:
						newMessage.content?.substring(0, 1024) ||
						I18nService.t("modules.log.message.edit.no_content", {
							lng,
						}),
					inline: true,
				},
			)
			.setTimestamp();

		await channel.send({ embeds: [embed] });
	}

	static async logMessageDelete(message: Message | PartialMessage) {
		if (
			!(await this.isEnabled(
				message.guild!.id,
				LogConfigKeys.enableMessageLogs,
			))
		)
			return;
		if (message.author?.bot) return;

		const channel = await this.getLogChannel(message.guild!);
		if (!channel) return;

		const lng = await this.getLanguage(message.guild!.id);

		const embed = new EmbedBuilder()
			.setTitle(
				I18nService.t("modules.log.message.delete.title", { lng }),
			)
			.setColor(Colors.Red)
			.setAuthor({
				name: message.author?.tag ?? "Unknown User",
				iconURL: message.author?.displayAvatarURL(),
			})
			.setDescription(
				I18nService.t("modules.log.message.delete.description", {
					lng,
					channel: `<#${message.channelId}>`,
				}),
			)
			.addFields({
				name: I18nService.t("modules.log.message.delete.content", {
					lng,
				}),
				value:
					message.content?.substring(0, 1024) ||
					I18nService.t("modules.log.message.edit.no_content", {
						lng,
					}),
			})
			.setTimestamp();

		if (message.attachments.size > 0) {
			embed.addFields({
				name: I18nService.t("modules.log.message.delete.attachments", {
					lng,
				}),
				value: `${message.attachments.size} attachment(s)`,
			});
		}

		await channel.send({ embeds: [embed] });
	}
}
