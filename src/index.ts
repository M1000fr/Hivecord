import { Logger } from "@utils/Logger";
import { ShardingManager } from "discord.js";
import path from "path";

const logger = new Logger("ShardingManager");

const manager = new ShardingManager(path.join(__dirname, "bot.ts"), {
	token: process.env.DISCORD_TOKEN,
	totalShards: "auto",
});

manager.on("shardCreate", (shard) => {
	logger.log(`Launched shard ${shard.id}`);
});

manager.spawn().catch((error) => {
	// If the error is just that the shard died (likely due to a startup error we already logged),
	// don't print the huge stack trace.
	if (error.code === "ShardingReadyDied") {
		logger.error(
			"Shard died during startup. Check previous logs for errors.",
		);
	} else {
		logger.error("Failed to spawn shards:", error);
	}
});

// Health check server
Bun.serve({
	port: 3000,
	async fetch(req) {
		const url = new URL(req.url);
		if (url.pathname === "/health") {
			try {
				// Check if all shards are ready
				const results = await manager.broadcastEval((client) =>
					client.isReady(),
				);
				const allReady = results.every((ready) => ready === true);

				if (allReady && results.length > 0) {
					return new Response("OK");
				}
				return new Response("Not Ready", { status: 503 });
			} catch {
				// If shards are not ready or communication fails
				return new Response("Not Ready", { status: 503 });
			}
		}
		return new Response("Not Found", { status: 404 });
	},
});
