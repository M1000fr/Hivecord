import "reflect-metadata";

import { Logger } from "@utils/Logger";
import { Bootstrap } from "./Bootstrap";

const logger = new Logger("Bootstrap");

const leBotInstance = await Bootstrap.create();

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
