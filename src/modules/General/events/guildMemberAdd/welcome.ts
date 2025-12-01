import {
	GuildMember,
	AttachmentBuilder,
	TextChannel,
	EmbedBuilder,
	Colors,
} from "discord.js";
import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { LeBotClient } from "@class/LeBotClient";
import { ConfigService } from "@services/ConfigService";
import { Logger } from "@utils/Logger";
import { Canvas, loadImage, Image, GlobalFonts } from "@napi-rs/canvas";
import GIFEncoder from "gifencoder";
import gifFrames from "gif-frames";
import { Stream } from "stream";
import path from "path";
import { MessageTemplate } from "@class/MessageTemplate";
import { GeneralConfigKeys } from "../../GeneralConfig";
import { EmbedService } from "@modules/Configuration/services/EmbedService";
import { InvitationService } from "@modules/Invitation/services/InvitationService";
import { Invite } from "discord.js";
import { BotEvents } from "@enums/BotEvents";

@Event({
	name: BotEvents.MemberJoinProcessed,
})
export default class WelcomeEvent extends BaseEvent<typeof BotEvents.MemberJoinProcessed> {
	private logger = new Logger("WelcomeEvent");

	async run(client: LeBotClient<true>, member: GuildMember, invite: Invite | null) {
		try {
			const welcomeChannelId = await ConfigService.getChannel(
				GeneralConfigKeys.welcomeChannelId,
			);
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

            const inviteContext = invite ? {
                code: invite.code,
                uses: invite.uses,
                inviter: invite.inviter,
                url: invite.url
            } : null;

			// Check for custom embed
			const welcomeEmbedName = await ConfigService.get(
				GeneralConfigKeys.welcomeEmbedName,
			);

			// Use local file for background
			const backgroundPath = path.join(
				process.cwd(),
				"data",
				"welcome_banner.png",
			);

			const dynamicAvatarUrl = member.user.displayAvatarURL({
				forceStatic: false,
				size: 256,
			});
			const isAnimated = dynamicAvatarUrl.includes(".gif");

			const welcomeMessageImageConfig = await ConfigService.get(
				GeneralConfigKeys.welcomeMessageImage,
			);

			const welcomeMessageImageTemplate = new MessageTemplate(
				welcomeMessageImageConfig || "Welcome!",
			);
			welcomeMessageImageTemplate.addContext("user", member.user);
			welcomeMessageImageTemplate.addContext("guild", member.guild);
			welcomeMessageImageTemplate.addContext("member", member);
            if (inviteContext) {
                welcomeMessageImageTemplate.addContext("invite", inviteContext);
                welcomeMessageImageTemplate.addContext("inviter", inviteContext.inviter);
            }

			const welcomeMessageImage = welcomeMessageImageTemplate.resolve();

			// Canvas dimensions
			const width = 700;
			const height = 250;

			const encoder = new GIFEncoder(width, height);
			const stream = encoder.createReadStream();

			const chunks: any[] = [];
			stream.on("data", (chunk: any) => chunks.push(chunk));

			const finishPromise = new Promise<Buffer>((resolve, reject) => {
				stream.on("end", () => resolve(Buffer.concat(chunks)));
				stream.on("error", reject);
			});

			encoder.start();
			encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
			encoder.setQuality(10); // image quality. 10 is default.

			const canvas = new Canvas(width, height);
			const ctx = canvas.getContext("2d");

			// Load background
			let background: Image | null = null;
			try {
				background = await loadImage(backgroundPath);
			} catch (e) {
				this.logger.error(
					"Failed to load background image from " + backgroundPath,
					(e as Error)?.stack || String(e),
				);
			}

			const drawBackground = () => {
				if (background) {
					ctx.drawImage(background, 0, 0, width, height);
				} else {
					ctx.fillStyle = "#2C2F33";
					ctx.fillRect(0, 0, width, height);
				}
			};

			const drawText = () => {
				ctx.font = "bold 30px sans-serif";
				ctx.fillStyle = "#ffffff";
				ctx.textAlign = "center";
				ctx.strokeStyle = "black";
				ctx.lineWidth = 3;
				ctx.strokeText(welcomeMessageImage, width / 2, height - 20);
				ctx.fillText(welcomeMessageImage, width / 2, height - 20);
			};

			if (isAnimated) {
				// Handle animated avatar
				// We need to use the GIF url
				const frames = await gifFrames({
					url: dynamicAvatarUrl,
					frames: "all",
					outputType: "png",
					cumulative: true,
				});

				for (const frame of frames) {
					drawBackground();

					// Get frame image
					const frameStream = frame.getImage();
					const frameBuffer = await this.streamToBuffer(frameStream);
					const avatarImage = await loadImage(frameBuffer);

					// Draw avatar in circle
					this.drawAvatar(ctx, avatarImage, width / 2, 100, 80);

					drawText();

					// Set delay for this frame
					if (frame.frameInfo && frame.frameInfo.delay) {
						encoder.setDelay(frame.frameInfo.delay * 10);
					} else {
						encoder.setDelay(100);
					}

					encoder.addFrame(
						ctx.getImageData(0, 0, width, height).data as any,
					);
				}
			} else {
				// Static avatar
				encoder.setDelay(500); // Just a dummy delay for single frame? Or no delay needed if 1 frame?
				// If 1 frame, it's a static image. But we want a GIF output.

				drawBackground();
				const avatarImage = await loadImage(
					dynamicAvatarUrl.replace(".webp", ".png"),
				); // Ensure we load a supported format if skia-canvas doesn't like webp (it usually does though)
				this.drawAvatar(ctx, avatarImage, width / 2, 100, 80);
				drawText();
				encoder.addFrame(
					ctx.getImageData(0, 0, width, height).data as any,
				);
			}

			const welcomeMessageConfig = await ConfigService.get(
				GeneralConfigKeys.welcomeMessage,
			);

			const welcomeMessageTemplate = new MessageTemplate(
				welcomeMessageConfig || "Welcome {user} to {guild}!",
			);
			welcomeMessageTemplate.addContext("user", member.user);
			welcomeMessageTemplate.addContext("guild", member.guild);
			welcomeMessageTemplate.addContext("member", member);
            if (inviteContext) {
                welcomeMessageTemplate.addContext("invite", inviteContext);
                welcomeMessageTemplate.addContext("inviter", inviteContext.inviter);
            }

			const welcomeMessage = welcomeMessageTemplate.resolve();

			encoder.finish();
			const buffer = await finishPromise;
			const attachment = new AttachmentBuilder(buffer, {
				name: "welcome.gif",
			});

			if (welcomeEmbedName) {
				const context = {
					user: member.user,
					guild: member.guild,
					member: member,
                    invite: inviteContext,
                    inviter: inviteContext?.inviter
				};

				const customEmbed = await EmbedService.render(
					welcomeEmbedName,
					context,
				);

				if (customEmbed) {
					await channel.send({
						embeds: [customEmbed],
						files: [attachment],
					});
					return;
				}
			}

			await channel.send({
				content: welcomeMessage,
				files: [attachment],
			});
		} catch (error) {
			this.logger.error(
				"Error sending welcome message",
				(error as Error)?.stack || String(error),
			);
		}
	}

	private drawAvatar(
		ctx: any,
		image: Image,
		x: number,
		y: number,
		radius: number,
	) {
		ctx.save();
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.clip();
		ctx.drawImage(image, x - radius, y - radius, radius * 2, radius * 2);
		ctx.restore();
	}

	private streamToBuffer(stream: Stream): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			const chunks: any[] = [];
			stream.on("data", (chunk: any) => chunks.push(chunk));
			stream.on("end", () => resolve(Buffer.concat(chunks)));
			stream.on("error", reject);
		});
	}
}
