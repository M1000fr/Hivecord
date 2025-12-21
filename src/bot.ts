import "reflect-metadata";

import { LeBotClient } from "@class/LeBotClient";
import { I18nService } from "@services/I18nService";
import { InfluxService } from "@services/InfluxService";
import { checkDatabaseConnection } from "@services/prismaService";
import { RedisService } from "@services/RedisService";
import { Logger } from "@utils/Logger";

const logger = new Logger("Bootstrap");
logger.log("Starting LeBot...");

// Check connections before starting
await checkDatabaseConnection();
await RedisService.checkConnection();
await InfluxService.checkConnection();

// Initialize I18n
await I18nService.init();

const leBotInstance = new LeBotClient();

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
