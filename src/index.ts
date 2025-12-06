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
	logger.error("Failed to spawn shards:", error);
});
