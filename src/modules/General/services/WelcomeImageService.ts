import { Service } from "@decorators/Service";
import { Canvas, Image, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import { Logger } from "@utils/Logger";
import gifFrames from "gif-frames";
import GIFEncoder from "gifencoder";
import { Stream } from "stream";

@Service()
export class WelcomeImageService {
	private static logger = new Logger("WelcomeImageService");

	static async generateWelcomeImage(
		avatarUrl: string,
		backgroundPath: string | null,
		text: string,
	): Promise<Buffer> {
		const width = 700;
		const height = 250;
		const isAnimated = avatarUrl.includes(".gif");

		const encoder = new GIFEncoder(width, height);
		const stream = encoder.createReadStream();

		const chunks: Buffer[] = [];
		stream.on("data", (chunk: Buffer) => chunks.push(chunk));

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
		if (backgroundPath) {
			try {
				background = await loadImage(backgroundPath);
			} catch (e) {
				this.logger.error(
					"Failed to load background image from " + backgroundPath,
					(e as Error)?.stack || String(e),
				);
			}
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
			ctx.font = "30px Arial";
			ctx.fillStyle = "#ffffff";
			ctx.textAlign = "center";
			ctx.strokeStyle = "black";
			ctx.lineWidth = 3;
			ctx.strokeText(text, width / 2, height - 20);
			ctx.fillText(text, width / 2, height - 20);
		};

		if (isAnimated) {
			// Handle animated avatar
			const frames = await gifFrames({
				url: avatarUrl,
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

				encoder.addFrame(ctx.getImageData(0, 0, width, height).data);
			}
		} else {
			// Static avatar
			encoder.setDelay(500);

			drawBackground();
			// Ensure we load a supported format if skia-canvas doesn't like webp
			const avatarImage = await loadImage(
				avatarUrl.replace(".webp", ".png"),
			);
			this.drawAvatar(ctx, avatarImage, width / 2, 100, 80);
			drawText();
			encoder.addFrame(ctx.getImageData(0, 0, width, height).data);
		}

		encoder.finish();
		return finishPromise;
	}

	private static drawAvatar(
		ctx: SKRSContext2D,
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

	private static streamToBuffer(stream: Stream): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			const chunks: Buffer[] = [];
			stream.on("data", (chunk: Buffer) => chunks.push(chunk));
			stream.on("end", () => resolve(Buffer.concat(chunks)));
			stream.on("error", reject);
		});
	}
}
