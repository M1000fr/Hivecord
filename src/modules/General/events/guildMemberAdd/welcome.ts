import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { MessageTemplate } from "@class/MessageTemplate";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { WelcomeImageService } from "@modules/General/services/WelcomeImageService";
import { InvitationService } from "@modules/Invitation/services/InvitationService";
import { ConfigService } from "@services/ConfigService";
import { CustomEmbedService } from "@src/modules/Configuration/services/CustomEmbedService";
import { Logger } from "@utils/Logger";
import {
	AttachmentBuilder,
	GuildMember,
	Invite,
	type MessageCreateOptions,
	TextChannel,
} from "discord.js";
import path from "path";
import { GeneralConfig } from "../../GeneralConfig";

@Event({
	name: BotEvents.MemberJoinProcessed,
})
export default class WelcomeEvent extends BaseEvent<
	typeof BotEvents.MemberJoinProcessed
> {
	private logger = new Logger("WelcomeEvent");

	async run(
		client: LeBotClient<true>,
		member: GuildMember,
		invite: Invite | null,
	) {
		try {
			const welcomeChannelId = await ConfigService.of(
				member.guild.id,
				GeneralConfig,
			).generalWelcomeChannelId;

			const language = await ConfigService.of(
				member.guild.id,
				GeneralConfig,
			).generalLanguage;

			if (!welcomeChannelId) {
				this.logger.warn(
					`No welcome channel configured for guild ${member.guild.id}.`,
				);
				return;
			}

			const channel = member.guild.channels.cache.get(
				welcomeChannelId,
			) as TextChannel;
			if (!channel) {
				this.logger.error(
					`Welcome channel ${welcomeChannelId} not found.`,
				);
				return;
			}

			const commonContext = {
				user: member.user,
				guild: member.guild,
				member: member,
				invite: invite,
				// inviterTotalInvites: inviterTotalInvitesCount,
			};

			if (invite) {
				const inviterTotalInvitesCount = invite
					? await InvitationService.getInviteCounts(
							member.guild.id,
							invite.inviter?.id || "",
						)
					: {
							active: 0,
							fake: 0,
							total: 0,
						};

				Object.assign(commonContext, {
					inviterTotalInvites: inviterTotalInvitesCount,
				});
			}

			// Check for custom embed
			const welcomeEmbedName = await ConfigService.of(
				member.guild.id,
				GeneralConfig,
			).generalWelcomeEmbedName;

			// Get configured background
			const configuredBackground = await ConfigService.of(
				member.guild.id,
				GeneralConfig,
			).generalWelcomeBackground;

			const backgroundPath = configuredBackground
				? path.join(process.cwd(), configuredBackground)
				: null;

			const dynamicAvatarUrl = member.user.displayAvatarURL({
				forceStatic: false,
				size: 256,
			});

			const welcomeMessageImageConfig = await ConfigService.of(
				member.guild.id,
				GeneralConfig,
			).generalWelcomeMessageImage;

			const welcomeMessageImageTemplate = new MessageTemplate(
				welcomeMessageImageConfig || "Welcome!",
				language,
			);
			Object.entries(commonContext).forEach(([key, value]) => {
				if (value !== null && value !== undefined) {
					welcomeMessageImageTemplate.addContext(key, value);
				}
			});

			const welcomeMessageImage = welcomeMessageImageTemplate.resolve();

			const buffer = await WelcomeImageService.generateWelcomeImage(
				dynamicAvatarUrl,
				backgroundPath,
				welcomeMessageImage,
			);

			const welcomeMessageConfig = await ConfigService.of(
				member.guild.id,
				GeneralConfig,
			).generalWelcomeMessage;

			const attachment = new AttachmentBuilder(buffer, {
				name: "welcome.gif",
			});

			const messagePayload: MessageCreateOptions = {
				files: [attachment],
			};

			if (welcomeEmbedName) {
				const customEmbed = await CustomEmbedService.render(
					member.guild.id,
					welcomeEmbedName,
					commonContext,
				);

				if (customEmbed) {
					messagePayload.embeds = [customEmbed];
				}
			}

			let messageTemplateStr = welcomeMessageConfig;

			// If no embed and no config, use default
			if (!messagePayload.embeds && !messageTemplateStr) {
				messageTemplateStr = "Welcome {user} to {guild}!";
			}

			if (messageTemplateStr) {
				const welcomeMessageTemplate = new MessageTemplate(
					messageTemplateStr,
					language,
				);
				Object.entries(commonContext).forEach(([key, value]) => {
					if (value !== null && value !== undefined) {
						welcomeMessageTemplate.addContext(key, value);
					}
				});
				messagePayload.content = welcomeMessageTemplate.resolve();
			}

			await channel.send(messagePayload);
		} catch (error) {
			this.logger.error(
				"Error sending welcome message",
				(error as Error)?.stack || String(error),
			);
		}
	}
}
