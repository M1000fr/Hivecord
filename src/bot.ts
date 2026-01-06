import "reflect-metadata";

import { env } from "@utils/Env";
import { Logger } from "@utils/Logger";
import { Bootstrap } from "./Bootstrap";

const logger = new Logger("Bootstrap");

let leBotInstance;
try {
	leBotInstance = await Bootstrap.create();
} catch (error) {
	logger.error(
		"Failed to initialize LeBot:",
		error instanceof Error ? error.stack : String(error),
	);
	process.exit(1);
}

try {
	await leBotInstance.start(env.DISCORD_TOKEN);
} catch (error) {
	logger.error(
		"Failed to start LeBot:",
		error instanceof Error ? error.stack : String(error),
	);
	process.exit(1);
}

export default leBotInstance;
