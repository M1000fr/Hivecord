import { LogConfigKeys } from "@modules/Log/LogConfig";
import { ConfigService } from "@services/ConfigService";
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
			LogConfigKeys.logChannelId,
		);
		if (!channelId) return null;
		const channel = guild.channels.cache.get(channelId);
		if (!channel || !channel.isTextBased()) return null;
		return channel as TextChannel;
	}

	private static async isEnabled(key: string): Promise<boolean> {
		const value = await ConfigService.get(key);
		return value === "true";
	}

	static async logSanction(
		guild: Guild,
		target: User,
		moderator: User,
		type: string,
		reason: string,
		duration?: string,
	) {
		if (!(await this.isEnabled(LogConfigKeys.enableSanctionLogs))) return;
		const channel = await this.getLogChannel(guild);
		if (!channel) return;

		const embed = new EmbedBuilder()
			.setTitle(`Sanction: ${type}`)
			.setColor(Colors.Red)
			.addFields(
				{
					name: "User",
					value: `${target.tag} (${target.id})`,
					inline: true,
				},
				{
					name: "Moderator",
					value: `${moderator.tag} (${moderator.id})`,
					inline: true,
				},
				{ name: "Reason", value: reason },
			)
			.setTimestamp();

		if (duration) {
			embed.addFields({
				name: "Duration",
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
		if (!(await this.isEnabled(LogConfigKeys.enableVoiceLogs))) return;
		const channel = await this.getLogChannel(guild);
		if (!channel) return;

		const embed = new EmbedBuilder()
			.setTitle(`Temp Voice: ${action}`)
			.setColor(Colors.Blue)
			.setDescription(details)
			.setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
			.setTimestamp();

		await channel.send({ embeds: [embed] });
	}

	static async logMemberJoin(member: GuildMember) {
		if (!(await this.isEnabled(LogConfigKeys.enableMemberLogs))) return;
		const channel = await this.getLogChannel(member.guild);
		if (!channel) return;

		const embed = new EmbedBuilder()
			.setTitle("Member Joined")
			.setColor(Colors.Green)
			.setThumbnail(member.user.displayAvatarURL())
			.addFields(
				{ name: "User", value: `${member.user.tag} (${member.id})` },
				{
					name: "Created At",
					value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
				},
			)
			.setTimestamp();

		await channel.send({ embeds: [embed] });
	}

	static async logMemberLeave(member: GuildMember | PartialGuildMember) {
		if (!(await this.isEnabled(LogConfigKeys.enableMemberLogs))) return;
		const channel = await this.getLogChannel(member.guild);
		if (!channel) return;

		const embed = new EmbedBuilder()
			.setTitle("Member Left")
			.setColor(Colors.Orange)
			.setThumbnail(member.user?.displayAvatarURL() ?? "")
			.addFields(
				{
					name: "User",
					value: `${member.user?.tag ?? "Unknown"} (${member.id})`,
				},
				{
					name: "Joined At",
					value: member.joinedTimestamp
						? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
						: "Unknown",
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
		if (!(await this.isEnabled(LogConfigKeys.enableMessageLogs))) return;
		const channel = await this.getLogChannel(guild);
		if (!channel) return;

		const embed = new EmbedBuilder()
			.setTitle("Message Edited")
			.setColor(Colors.Yellow)
			.setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
			.addFields(
				{ name: "Before", value: before || "*Empty Message*" },
				{ name: "After", value: after || "*Empty Message*" },
			)
			.setTimestamp();

		await channel.send({ embeds: [embed] });
	}

	static async logRoleCreate(guild: Guild, role: Role) {
		if (!(await this.isEnabled(LogConfigKeys.enableRoleUpdateLogs))) return;
		const channel = await this.getLogChannel(guild);
		if (!channel) return;

		const embed = new EmbedBuilder()
			.setTitle("Role Created")
			.setColor(Colors.Green)
			.addFields(
				{ name: "Role", value: `<@&${role.id}>` },
				{
					name: "Color",
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
		if (!(await this.isEnabled(LogConfigKeys.enableRoleUpdateLogs))) return;
		const channel = await this.getLogChannel(guild);
		if (!channel) return;
		const changes: string[] = [];

		const checkChange = (field: string, before: any, after: any) => {
			if (before !== after) {
				changes.push(`**${field}**: \`${before}\` ➔ \`${after}\``);
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

		checkChange("Name", roleBefore.name, roleAfter.name);
		checkChange(
			"Color",
			`#${roleBefore.colors.primaryColor.toString(16).padStart(6, "0")}`,
			`#${roleAfter.colors.primaryColor.toString(16).padStart(6, "0")}`,
		);
		checkChange("Hoist", roleBefore.hoist, roleAfter.hoist);
		checkChange("Position", roleBefore.position, roleAfter.position);
		checkChange(
			"Mentionable",
			roleBefore.mentionable,
			roleAfter.mentionable,
		);

		if (addedPermissions.length > 0) {
			changes.push(
				`**Added Permissions**: \`${addedPermissions.join(", ")}\``,
			);
		}

		if (removedPermissions.length > 0) {
			changes.push(
				`**Removed Permissions**: \`${removedPermissions.join(", ")}\``,
			);
		}

		if (changes.length === 0) return; // No changes detected

		const embed = new EmbedBuilder()
			.setTitle("Role Updated")
			.setColor(Colors.Yellow)
			.addFields(
				{ name: "Role", value: `<@&${roleAfter.id}>` },
				{ name: "Changes", value: changes.join("\n") },
			)
			.setTimestamp();

		await channel.send({ embeds: [embed] });
	}

	static async logRoleDelete(guild: Guild, role: Role) {
		if (!(await this.isEnabled(LogConfigKeys.enableRoleUpdateLogs))) return;
		const channel = await this.getLogChannel(guild);
		if (!channel) return;

		const embed = new EmbedBuilder()
			.setTitle("Role Created")
			.setColor(Colors.Green)
			.addFields(
				{ name: "Role", value: `<@&${role.id}>` },
				{
					name: "Color",
					value: `#${role.colors.primaryColor.toString(16).padStart(6, "0")}`,
				},
			)
			.setTimestamp();

		await channel.send({ embeds: [embed] });
	}

	static async logVoiceState(oldState: VoiceState, newState: VoiceState) {
		if (!(await this.isEnabled(LogConfigKeys.enableVoiceConnectionLogs)))
			return;
		const channel = await this.getLogChannel(newState.guild);
		if (!channel) return;

		const member = newState.member;
		if (!member) return;

		let action = "";
		let color: ColorResolvable = Colors.Grey;
		let details = "";

		if (!oldState.channelId && newState.channelId) {
			action = "Connected";
			color = Colors.Green;
			details = `Connected to <#${newState.channelId}>`;
		} else if (oldState.channelId && !newState.channelId) {
			action = "Disconnected";
			color = Colors.Red;
			details = `Disconnected from <#${oldState.channelId}>`;
		} else if (oldState.channelId !== newState.channelId) {
			action = "Moved";
			color = Colors.Yellow;
			details = `Moved from <#${oldState.channelId}> to <#${newState.channelId}>`;
		} else if (!oldState.streaming && newState.streaming) {
			action = "Started Streaming";
			color = Colors.Purple;
			details = `Started streaming in <#${newState.channelId}>`;
		} else if (oldState.streaming && !newState.streaming) {
			action = "Stopped Streaming";
			color = Colors.Grey;
			details = `Stopped streaming in <#${newState.channelId}>`;
		} else {
			return; // Ignore other updates (mute/deafen)
		}

		const embed = new EmbedBuilder()
			.setTitle(`Voice: ${action}`)
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
		if (!(await this.isEnabled(LogConfigKeys.enableMessageLogs))) return;
		if (newMessage.author?.bot) return;
		if (oldMessage.content === newMessage.content) return;

		const channel = await this.getLogChannel(newMessage.guild!);
		if (!channel) return;

		const embed = new EmbedBuilder()
			.setTitle("Message Edited")
			.setColor(Colors.Yellow)
			.setAuthor({
				name: newMessage.author?.tag ?? "Unknown User",
				iconURL: newMessage.author?.displayAvatarURL(),
			})
			.setDescription(
				`Message edited in <#${newMessage.channelId}> [Jump to message](${newMessage.url})`,
			)
			.addFields(
				{
					name: "Before",
					value:
						oldMessage.content?.substring(0, 1024) ||
						"*No content*",
					inline: true,
				},
				{
					name: "After",
					value:
						newMessage.content?.substring(0, 1024) ||
						"*No content*",
					inline: true,
				},
			)
			.setTimestamp();

		await channel.send({ embeds: [embed] });
	}

	static async logMessageDelete(message: Message | PartialMessage) {
		if (!(await this.isEnabled(LogConfigKeys.enableMessageLogs))) return;
		if (message.author?.bot) return;

		const channel = await this.getLogChannel(message.guild!);
		if (!channel) return;

		const embed = new EmbedBuilder()
			.setTitle("Message Deleted")
			.setColor(Colors.Red)
			.setAuthor({
				name: message.author?.tag ?? "Unknown User",
				iconURL: message.author?.displayAvatarURL(),
			})
			.setDescription(`Message deleted in <#${message.channelId}>`)
			.addFields({
				name: "Content",
				value: message.content?.substring(0, 1024) || "*No content*",
			})
			.setTimestamp();

		if (message.attachments.size > 0) {
			embed.addFields({
				name: "Attachments",
				value: `${message.attachments.size} attachment(s)`,
			});
		}

		await channel.send({ embeds: [embed] });
	}
}
