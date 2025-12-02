import type { LeBotClient } from "@class/LeBotClient";
import { StatsService } from "@modules/Statistics/services/StatsService";
import { Logger } from "@utils/Logger";

const logger = new Logger("VoiceSessionTickJob");

export function startVoiceSessionTickJob(client: LeBotClient<boolean>): void {
	const intervalMinutes = 1;
	logger.log(
		`Starting voice session tick job (interval: ${intervalMinutes} minute)`,
	);
	setInterval(
		async () => {
			if (!client.isReady()) return;
			try {
				await StatsService.tickActiveVoiceSessions(client);
			} catch (err) {
				logger.error(
					"Voice session tick job error",
					err instanceof Error ? err.stack : String(err),
				);
			}
		},
		intervalMinutes * 60 * 1000,
	);
}
