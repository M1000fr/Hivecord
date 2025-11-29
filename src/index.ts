import { LeBotClient } from "@class/LeBotClient";
import { checkDatabaseConnection } from "@services/prismaService";
import { RedisService } from "@services/RedisService";

// Check connections before starting
await checkDatabaseConnection();
await RedisService.checkConnection();

// Health check server
Bun.serve({
	port: 3000,
	fetch(req) {
		const url = new URL(req.url);
		if (url.pathname === "/health") {
			return new Response("OK");
		}
		return new Response("Not Found", { status: 404 });
	},
});

const leBotInstance = new LeBotClient();

leBotInstance.start(process.env.BOT_TOKEN as string);

export default leBotInstance;
