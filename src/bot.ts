import "reflect-metadata";

import { env } from "@utils/Env";
import { Logger } from "@utils/Logger";
import { Bootstrap } from "./Bootstrap";

const logger = new Logger("Bootstrap");

let hivecordInstance;
try {
	hivecordInstance = await Bootstrap.create();
} catch (error) {
	logger.error(
		"Failed to initialize Hivecord:",
		error instanceof Error ? error.stack : String(error),
	);
	process.exit(1);
}

try {
	await hivecordInstance.start(env.DISCORD_TOKEN);
} catch (error) {
	logger.error(
		"Failed to start Hivecord:",
		error instanceof Error ? error.stack : String(error),
	);
	process.exit(1);
}

export default hivecordInstance;
