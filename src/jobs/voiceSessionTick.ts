import { StatsService } from "@services/StatsService";
import { Logger } from "@utils/Logger";

const logger = new Logger("VoiceSessionTickJob");

export function startVoiceSessionTickJob(): void {
	const intervalMinutes = 1;
	logger.log(`Starting voice session tick job (interval: ${intervalMinutes} minute)`);
	setInterval(async () => {
		try {
			await StatsService.tickActiveVoiceSessions();
		} catch (err) {
			logger.error("Voice session tick job error", err instanceof Error ? err.stack : String(err));
		}
	}, intervalMinutes * 60 * 1000);
}
