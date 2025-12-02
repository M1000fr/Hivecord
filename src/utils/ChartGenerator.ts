import { createCanvas } from "canvas";
import type {
	UserVoiceStats,
	UserMessageStats,
} from "@modules/Statistics/services/StatsService";

export interface ChartData {
	labels: string[];
	datasets: {
		label: string;
		data: number[];
		borderColor: string;
		backgroundColor: string;
		fill?: boolean;
	}[];
}

export class ChartGenerator {
	// Generate a line chart for hourly data
	static generateHourlyChart(
		voiceData: { hour: number; duration: number }[],
		messageData: { hour: number; count: number }[],
		width = 800,
		height = 400,
	): Buffer {
		const canvas = createCanvas(width, height);
		const ctx = canvas.getContext("2d");

		// Background
		ctx.fillStyle = "#2C2F33";
		ctx.fillRect(0, 0, width, height);

		// Prepare data (0-23 hours)
		const hours = Array.from({ length: 24 }, (_, i) => i);
		const voiceValues = hours.map((hour) => {
			const data = voiceData.find((d) => d.hour === hour);
			return data ? data.duration / 60 : 0; // Convert to minutes
		});
		const messageValues = hours.map((hour) => {
			const data = messageData.find((d) => d.hour === hour);
			return data ? data.count : 0;
		});

		const padding = 50;
		const chartWidth = width - padding * 2;
		const chartHeight = height - padding * 2;

		// Calculate max values
		const maxVoice = Math.max(...voiceValues, 1);
		const maxMessage = Math.max(...messageValues, 1);

		// Draw grid
		ctx.strokeStyle = "#40444B";
		ctx.lineWidth = 1;
		for (let i = 0; i <= 5; i++) {
			const y = padding + (chartHeight / 5) * i;
			ctx.beginPath();
			ctx.moveTo(padding, y);
			ctx.lineTo(width - padding, y);
			ctx.stroke();
		}

		// Draw voice line (blue)
		ctx.strokeStyle = "#5865F2";
		ctx.lineWidth = 3;
		ctx.beginPath();
		voiceValues.forEach((value, index) => {
			const x = padding + (chartWidth / 23) * index;
			const y = padding + chartHeight - (value / maxVoice) * chartHeight;
			if (index === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		});
		ctx.stroke();

		// Draw message line (green)
		ctx.strokeStyle = "#57F287";
		ctx.lineWidth = 3;
		ctx.beginPath();
		messageValues.forEach((value, index) => {
			const x = padding + (chartWidth / 23) * index;
			const y =
				padding + chartHeight - (value / maxMessage) * chartHeight;
			if (index === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		});
		ctx.stroke();

		// Draw X-axis labels (every 4 hours)
		ctx.fillStyle = "#FFFFFF";
		ctx.font = "12px Arial";
		ctx.textAlign = "center";
		for (let i = 0; i < 24; i += 4) {
			const x = padding + (chartWidth / 23) * i;
			ctx.fillText(`${i}h`, x, height - padding + 20);
		}

		// Draw Y-axis labels (voice)
		ctx.textAlign = "right";
		ctx.fillStyle = "#5865F2";
		for (let i = 0; i <= 5; i++) {
			const value = Math.round((maxVoice / 5) * (5 - i));
			const y = padding + (chartHeight / 5) * i + 5;
			ctx.fillText(`${value}m`, padding - 10, y);
		}

		// Draw Y-axis labels (messages)
		ctx.textAlign = "left";
		ctx.fillStyle = "#57F287";
		for (let i = 0; i <= 5; i++) {
			const value = Math.round((maxMessage / 5) * (5 - i));
			const y = padding + (chartHeight / 5) * i + 5;
			ctx.fillText(`${value} msg`, width - padding + 10, y);
		}

		// Legend
		ctx.fillStyle = "#5865F2";
		ctx.fillRect(padding, 20, 15, 15);
		ctx.fillStyle = "#FFFFFF";
		ctx.font = "14px Arial";
		ctx.textAlign = "left";
		ctx.fillText("Temps vocal (min)", padding + 20, 32);

		ctx.fillStyle = "#57F287";
		ctx.fillRect(padding + 180, 20, 15, 15);
		ctx.fillStyle = "#FFFFFF";
		ctx.fillText("Messages", padding + 200, 32);

		return canvas.toBuffer("image/png");
	}

	// Generate a bar chart for top channels/users
	static generateBarChart(
		labels: string[],
		values: number[],
		title: string,
		color = "#5865F2",
		width = 600,
		height = 400,
	): Buffer {
		const canvas = createCanvas(width, height);
		const ctx = canvas.getContext("2d");

		// Background
		ctx.fillStyle = "#2C2F33";
		ctx.fillRect(0, 0, width, height);

		// Title
		ctx.fillStyle = "#FFFFFF";
		ctx.font = "bold 18px Arial";
		ctx.textAlign = "center";
		ctx.fillText(title, width / 2, 30);

		const padding = 60;
		const chartWidth = width - padding * 2;
		const chartHeight = height - padding * 2 - 40;
		const barWidth = chartWidth / labels.length - 10;
		const maxValue = Math.max(...values, 1);

		// Draw bars
		ctx.fillStyle = color;
		labels.forEach((label, index) => {
			const value = values[index] || 0;
			const barHeight = (value / maxValue) * chartHeight;
			const x = padding + (chartWidth / labels.length) * index;
			const y = padding + 40 + chartHeight - barHeight;

			ctx.fillRect(x, y, barWidth, barHeight);

			// Value on top
			ctx.fillStyle = "#FFFFFF";
			ctx.font = "12px Arial";
			ctx.textAlign = "center";
			ctx.fillText(value.toString(), x + barWidth / 2, y - 5);

			// Label at bottom
			ctx.save();
			ctx.translate(x + barWidth / 2, padding + 40 + chartHeight + 15);
			ctx.rotate(-Math.PI / 4);
			ctx.textAlign = "right";
			ctx.fillText(label, 0, 0);
			ctx.restore();

			ctx.fillStyle = color;
		});

		return canvas.toBuffer("image/png");
	}

	// Generate a simple stat card
	static generateStatsCard(
		stats: {
			label: string;
			value: string;
			color: string;
		}[],
		title: string,
		width = 400,
		height = 300,
	): Buffer {
		const canvas = createCanvas(width, height);
		const ctx = canvas.getContext("2d");

		// Background
		ctx.fillStyle = "#2C2F33";
		ctx.fillRect(0, 0, width, height);

		// Title
		ctx.fillStyle = "#FFFFFF";
		ctx.font = "bold 24px Arial";
		ctx.textAlign = "center";
		ctx.fillText(title, width / 2, 40);

		// Stats
		const startY = 80;
		const spacing = (height - startY - 20) / stats.length;

		stats.forEach((stat, index) => {
			const y = startY + spacing * index;

			// Label
			ctx.fillStyle = "#B9BBBE";
			ctx.font = "16px Arial";
			ctx.textAlign = "left";
			ctx.fillText(stat.label, 40, y);

			// Value
			ctx.fillStyle = stat.color;
			ctx.font = "bold 20px Arial";
			ctx.textAlign = "right";
			ctx.fillText(stat.value, width - 40, y);
		});

		return canvas.toBuffer("image/png");
	}

	// Format duration helper
	static formatDuration(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		return `${minutes}m`;
	}

	// Format number with thousands separator
	static formatNumber(num: number): string {
		return num.toLocaleString("fr-FR");
	}
}
