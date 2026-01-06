import { Logger } from "./Logger";

const logger = new Logger("Env");

export interface IEnv {
	DISCORD_TOKEN: string;
	DATABASE_URL: string;
	REDIS_URL: string;
	DEBUG_DISCORD_GUILD_ID: string | undefined;
	BACKUP_SECRET: string | undefined;
	NODE_ENV: string;
}

function validateEnv(): IEnv {
	const required: (keyof IEnv)[] = ["DISCORD_TOKEN", "DATABASE_URL"];

	const missing = required.filter((key) => !process.env[key]);

	if (missing.length > 0) {
		logger.error(
			`\nFATAL: Missing required environment variables:\n${missing.map((m) => ` - ${m}`).join("\n")}\n`,
		);
		process.exit(1);
	}

	return {
		DISCORD_TOKEN: process.env.DISCORD_TOKEN as string,
		DATABASE_URL: process.env.DATABASE_URL as string,
		REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
		DEBUG_DISCORD_GUILD_ID: process.env.DEBUG_DISCORD_GUILD_ID,
		BACKUP_SECRET: process.env.BACKUP_SECRET,
		NODE_ENV: process.env.NODE_ENV || "development",
	};
}

export const env = validateEnv();
