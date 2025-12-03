import { createCanvas } from "@napi-rs/canvas";

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
	// Generate a line chart for time-series data
	static generateChart(
		voiceData: { timestamp: number; value: number }[],
		messageData: { timestamp: number; value: number }[],
		timeRange: { start: Date; end: Date },
		width = 800,
		height = 400,
	): Buffer {
		const canvas = createCanvas(width, height);
		const ctx = canvas.getContext("2d");

		// Background
		ctx.fillStyle = "#2C2F33";
		ctx.fillRect(0, 0, width, height);

		const padding = 50;
		const chartWidth = width - padding * 2;
		const chartHeight = height - padding * 2;

		const startTime = timeRange.start.getTime();
		const endTime = timeRange.end.getTime();
		const totalDuration = endTime - startTime;

		// Helper to map timestamp to X coordinate
		const getX = (timestamp: number) => {
			const progress = (timestamp - startTime) / totalDuration;
			return padding + progress * chartWidth;
		};

		// Calculate max values
		const maxVoice = Math.max(...voiceData.map((d) => d.value / 60), 1); // minutes
		const maxMessage = Math.max(...messageData.map((d) => d.value), 1);

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
		if (voiceData.length > 0) {
			// Sort data by timestamp just in case
			voiceData.sort((a, b) => a.timestamp - b.timestamp);

			voiceData.forEach((point, index) => {
				const x = getX(point.timestamp);
				const y =
					padding +
					chartHeight -
					(point.value / 60 / maxVoice) * chartHeight;
				if (index === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			});
		}
		ctx.stroke();

		// Draw voice points
		ctx.fillStyle = "#5865F2";
		voiceData.forEach((point) => {
			const x = getX(point.timestamp);
			const y =
				padding +
				chartHeight -
				(point.value / 60 / maxVoice) * chartHeight;
			ctx.beginPath();
			ctx.arc(x, y, 6, 0, Math.PI * 2);
			ctx.fill();
		});

		// Draw message line (green)
		ctx.strokeStyle = "#57F287";
		ctx.lineWidth = 3;
		ctx.beginPath();
		if (messageData.length > 0) {
			messageData.sort((a, b) => a.timestamp - b.timestamp);

			messageData.forEach((point, index) => {
				const x = getX(point.timestamp);
				const y =
					padding +
					chartHeight -
					(point.value / maxMessage) * chartHeight;
				if (index === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			});
		}
		ctx.stroke();

		// Draw message points
		ctx.fillStyle = "#57F287";
		messageData.forEach((point) => {
			const x = getX(point.timestamp);
			const y =
				padding +
				chartHeight -
				(point.value / maxMessage) * chartHeight;
			ctx.beginPath();
			ctx.arc(x, y, 3, 0, Math.PI * 2);
			ctx.fill();
		});

		// Draw X-axis labels
		ctx.fillStyle = "#FFFFFF";
		ctx.font = "12px Arial";
		ctx.textAlign = "center";

		// Determine label format and interval based on duration
		const isDayRange = totalDuration <= 24 * 60 * 60 * 1000;
		const isWeekRange = totalDuration <= 7 * 24 * 60 * 60 * 1000;

		let labelCount = 6;
		if (isDayRange)
			labelCount = 6; // Every 4 hours
		else if (isWeekRange)
			labelCount = 7; // Every day
		else labelCount = 5; // Every ~6 days

		for (let i = 0; i <= labelCount; i++) {
			const progress = i / labelCount;
			const timestamp = startTime + progress * totalDuration;
			const date = new Date(timestamp);
			const x = padding + progress * chartWidth;

			let label = "";
			if (isDayRange) {
				label = `${date.getHours()}h`;
			} else {
				label = `${date.getDate()}/${date.getMonth() + 1}`;
			}

			ctx.fillText(label, x, height - padding + 20);
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
