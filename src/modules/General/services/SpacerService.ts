import { Canvas } from "@napi-rs/canvas";
import { Injectable } from "@src/decorators/Injectable";
import { Colors } from "discord.js";

@Injectable()
export class SpacerService {
	/**
	 * Generates a spacer bar image with a gradient
	 * @param color The base color (number or Colors key)
	 * @param width Image width (default: 500)
	 * @param height Image height (default: 10)
	 * @returns PNG image buffer
	 */
	static async generateSpacer(
		color: number | keyof typeof Colors = Colors.Blurple,
		width: number = 500,
		height: number = 10,
	): Promise<Buffer> {
		const canvas = new Canvas(width, height);
		const ctx = canvas.getContext("2d");

		// Color resolution
		let colorValue: number;
		if (typeof color === "string") {
			if (color in Colors) {
				colorValue = Colors[color as keyof typeof Colors];
			} else {
				colorValue = Colors.Blurple;
			}
		} else {
			colorValue = color;
		}

		const hexColor = "#" + colorValue.toString(16).padStart(6, "0");

		// Gradient creation (Dark -> Light)
		const gradient = ctx.createLinearGradient(0, 0, width, 0);
		gradient.addColorStop(0, this.adjustBrightness(hexColor, -40)); // Darker at the beginning
		gradient.addColorStop(1, this.adjustBrightness(hexColor, 20)); // Lighter at the end

		ctx.fillStyle = gradient;

		// Drawing the rounded rectangle
		const radius = height / 2;
		ctx.beginPath();
		ctx.moveTo(radius, 0);
		ctx.lineTo(width - radius, 0);
		ctx.quadraticCurveTo(width, 0, width, radius);
		ctx.quadraticCurveTo(width, height, width - radius, height);
		ctx.lineTo(radius, height);
		ctx.quadraticCurveTo(0, height, 0, radius);
		ctx.quadraticCurveTo(0, 0, radius, 0);
		ctx.closePath();
		ctx.fill();

		return canvas.toBuffer("image/png");
	}

	private static adjustBrightness(hex: string, amount: number): string {
		hex = hex.replace("#", "");
		const num = parseInt(hex, 16);
		let r = (num >> 16) + amount;
		let g = ((num >> 8) & 0x00ff) + amount;
		let b = (num & 0x00ff) + amount;

		if (r > 255) r = 255;
		else if (r < 0) r = 0;

		if (g > 255) g = 255;
		else if (g < 0) g = 0;

		if (b > 255) b = 255;
		else if (b < 0) b = 0;

		return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
	}
}
