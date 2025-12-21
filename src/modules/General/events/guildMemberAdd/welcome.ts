import { LeBotClient } from "@class/LeBotClient";
import { MessageTemplate } from "@class/MessageTemplate";
import { Client } from "@decorators/Client";
import { Context } from "@decorators/Context";
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { BotEvents } from "@enums/BotEvents";
import { WelcomeImageService } from "@modules/General/services/WelcomeImageService";
import { ConfigService } from "@services/ConfigService";
import { CustomEmbedService } from "@src/modules/Configuration/services/CustomEmbedService";
import type { ContextOf } from "@src/types/ContextOf";
import { Logger } from "@utils/Logger";
import {
	AttachmentBuilder,
	type MessageCreateOptions,
	TextChannel,
} from "discord.js";
import path from "path";
import { GeneralConfig } from "../../GeneralConfig";

@EventController()
export default class WelcomeEvent {
	private logger = new Logger("WelcomeEvent");

	constructor(
		private readonly customEmbedService: CustomEmbedService,
		private readonly configService: ConfigService,
	) {}

	@On(BotEvents.MemberJoinProcessed)
	async run(
		@Client() client: LeBotClient<true>,
		@Context()
		[member, invite]: ContextOf<typeof BotEvents.MemberJoinProcessed>,
	) {
		try {
			const welcomeChannelId = await this.configService.of(
				member.guild.id,
				GeneralConfig,
			).generalWelcomeChannelId;

			const language = await this.configService.of(
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

			// Check for custom embed
			const welcomeEmbedName = await this.configService.of(
				member.guild.id,
				GeneralConfig,
			).generalWelcomeEmbedName;

			// Get configured background
			const configuredBackground = await this.configService.of(
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

			const welcomeMessageImageConfig = await this.configService.of(
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

			const welcomeMessageConfig = await this.configService.of(
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
				const customEmbed = await this.customEmbedService.render(
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
