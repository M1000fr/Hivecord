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
		labels: { voice: string; messages: string } = {
			voice: "Voice Time (min)",
			messages: "Messages",
		},
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

		// Prepare data for lines (fill gaps with 0s)
		const prepareLineData = (
			data: { timestamp: number; value: number }[],
		) => {
			const granularity = 3600 * 1000; // 1 hour
			const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);
			const result: { timestamp: number; value: number }[] = [];

			// Start point
			if (
				sorted.length === 0 ||
				(sorted[0] && sorted[0].timestamp > startTime)
			) {
				result.push({ timestamp: startTime, value: 0 });
			}

			for (let i = 0; i < sorted.length; i++) {
				const current = sorted[i];
				if (!current) continue;

				const prev =
					result.length > 0 ? result[result.length - 1] : null;

				if (prev) {
					const diff = current.timestamp - prev.timestamp;
					// If gap is significant (> 1.5h), fill with 0s
					if (diff > granularity * 1.5) {
						// Drop to 0 after prev
						if (prev.value > 0) {
							result.push({
								timestamp: prev.timestamp + granularity,
								value: 0,
							});
						}

						// Stay at 0 until current
						const nextZero = current.timestamp - granularity;
						const lastAdded = result[result.length - 1];

						if (lastAdded && nextZero > lastAdded.timestamp) {
							result.push({ timestamp: nextZero, value: 0 });
						}
					}
				}
				result.push(current);
			}

			// End point
			const last = result[result.length - 1];
			if (last && last.timestamp < endTime) {
				if (last.value > 0 && last.timestamp + granularity < endTime) {
					result.push({
						timestamp: last.timestamp + granularity,
						value: 0,
					});
				}
				result.push({ timestamp: endTime, value: 0 });
			}

			return result;
		};

		const voiceLineData = prepareLineData(voiceData);
		const messageLineData = prepareLineData(messageData);

		// Draw voice line (blue)
		ctx.strokeStyle = "#5865F2";
		ctx.lineWidth = 3;
		ctx.beginPath();
		voiceLineData.forEach((point, index) => {
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
		ctx.stroke();

		// Draw voice points (only actual data)
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
		messageLineData.forEach((point, index) => {
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
		ctx.fillText(labels.voice, padding + 20, 32);

		ctx.fillStyle = "#57F287";
		ctx.fillRect(padding + 180, 20, 15, 15);
		ctx.fillStyle = "#FFFFFF";
		ctx.fillText(labels.messages, padding + 200, 32);

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
	static formatNumber(num: number, locale = "en-US"): string {
		return num.toLocaleString(locale);
	}
}
