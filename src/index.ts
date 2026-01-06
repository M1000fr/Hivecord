import { env } from "@utils/Env";
import { Logger } from "@utils/Logger";
import { ShardingManager } from "discord.js";
import path from "path";

const logger = new Logger("ShardingManager");

const manager = new ShardingManager(path.join(__dirname, "bot.ts"), {
	token: env.DISCORD_TOKEN,
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
	process.exit(1);
});

// Health check server
const server = Bun.serve({
	port: 3000,
	async fetch(req) {
		const url = new URL(req.url);
		if (url.pathname === "/health") {
			try {
				// Check if shards are initialized
				if (manager.shards.size === 0) {
					return new Response("No shards spawned", { status: 503 });
				}

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

const shutdown = async (signal: string) => {
	logger.log(`Received ${signal}. Shutting down gracefully...`);

	try {
		// Stop the health check server
		server.stop();
		logger.log("Health check server stopped.");

		// ShardingManager will automatically kill its children when the process exits,
		// but we can add additional cleanup here if necessary in the future.

		process.exit(0);
	} catch (error) {
		logger.error(
			"Error during shutdown:",
			error instanceof Error ? error.stack : String(error),
		);
		process.exit(1);
	}
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
