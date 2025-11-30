import { StatsService } from "@services/StatsService";
import { InfluxService } from "@services/InfluxService";
import { Logger } from "@utils/Logger";

const logger = new Logger("StatsCleanupJob");

// Run cleanup every 6 hours
const CLEANUP_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

async function runCleanup() {
	try {
		logger.log("Running stats cleanup job...");
		
		// Clean up abandoned voice sessions
		await StatsService.cleanupAbandonedSessions();
		
		// Flush any pending writes to InfluxDB
		await InfluxService.flush();
		
		logger.log("Stats cleanup job completed successfully");
	} catch (error) {
		logger.error("Error during stats cleanup", error instanceof Error ? error.stack : String(error));
	}
}

// Start the cleanup job
export function startStatsCleanupJob() {
	logger.log(`Starting stats cleanup job (interval: ${CLEANUP_INTERVAL / 1000 / 60} minutes)`);
	
	// Run immediately on start
	runCleanup();
	
	// Schedule recurring cleanup
	setInterval(runCleanup, CLEANUP_INTERVAL);
}
