import "reflect-metadata";

import { LeBotClient } from "@class/LeBotClient";
import { I18nService } from "@services/I18nService";
import { InfluxService } from "@services/InfluxService";
import { checkDatabaseConnection } from "@services/prismaService";
import { RedisService } from "@services/RedisService";
import { Logger } from "@utils/Logger";
import { startStatsCleanupJob } from "./jobs/statsCleanup";
import { startVoiceSessionTickJob } from "./jobs/voiceSessionTick";

const logger = new Logger("Bootstrap");
logger.log("Starting LeBot...");

// Check connections before starting
await checkDatabaseConnection();
await RedisService.checkConnection();
await InfluxService.checkConnection();

// Initialize I18n
await I18nService.init();

const leBotInstance = new LeBotClient();

// Determine if we are on shard 0 (or not sharded)
// SHARD_IDS is passed by ShardingManager
const shardId = process.env.SHARD_IDS
	? parseInt((process.env.SHARD_IDS as string).split(",")[0] || "0")
	: 0;
const isShardZero = shardId === 0;

// Start background jobs
if (isShardZero) {
	startStatsCleanupJob();
}
startVoiceSessionTickJob(leBotInstance);

try {
	await leBotInstance.start(process.env.DISCORD_TOKEN as string);
} catch (error) {
	logger.error(
		"Failed to start LeBot:",
		error instanceof Error ? error.stack : String(error),
	);
	process.exit(1);
}

export default leBotInstance;
