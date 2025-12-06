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

// Health check server
if (isShardZero) {
	Bun.serve({
		port: 3000,
		fetch(req) {
			const url = new URL(req.url);
			if (url.pathname === "/health") {
				if (leBotInstance.isReady()) {
					return new Response("OK");
				}
				return new Response("Not Ready", { status: 503 });
			}
			return new Response("Not Found", { status: 404 });
		},
	});
}

leBotInstance.start(process.env.DISCORD_TOKEN as string);

export default leBotInstance;
