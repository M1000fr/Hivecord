import { LeBotClient } from "@class/LeBotClient";
import { checkDatabaseConnection } from "@services/prismaService";
import { RedisService } from "@services/RedisService";
import { InfluxService } from "@services/InfluxService";
import { startStatsCleanupJob } from "./jobs/statsCleanup";
import { startVoiceSessionTickJob } from "./jobs/voiceSessionTick";

// Check connections before starting
await checkDatabaseConnection();
await RedisService.checkConnection();
await InfluxService.checkConnection();

const leBotInstance = new LeBotClient();

// Start background jobs
startStatsCleanupJob();
startVoiceSessionTickJob();

// Health check server
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

leBotInstance.start(process.env.BOT_TOKEN as string);

export default leBotInstance;
