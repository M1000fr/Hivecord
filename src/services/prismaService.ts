import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client/client";
import { Logger } from "@src/utils/Logger";

const logger = new Logger("PrismaService");

function extractDatabaseLoginFromEnv(): {
	username: string;
	password: string;
	host: string;
	port: number;
	database: string;
} {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error(
			"DATABASE_URL is not defined in environment variables.",
		);
	}
	const url = new URL(databaseUrl);
	return {
		username: url.username,
		password: url.password,
		host: url.hostname,
		port: Number(url.port),
		database: url.pathname.slice(1), // Remove leading '/'
	};
}

const adapter = new PrismaMariaDb({
	connectionLimit: 5,
	host: extractDatabaseLoginFromEnv().host,
	port: extractDatabaseLoginFromEnv().port,
	user: extractDatabaseLoginFromEnv().username,
	password: extractDatabaseLoginFromEnv().password,
	database: extractDatabaseLoginFromEnv().database,
});

const prismaClient = new PrismaClient({ adapter });

async function checkDatabaseConnection() {
	try {
		await prismaClient.$connect();
		await prismaClient.$queryRaw`SELECT 1`;
		logger.log("✅ Database connection established successfully.");
	} catch (error: unknown) {
		logger.error(
			"❌ Database connection failed:",
			error instanceof Error ? error.stack : String(error),
		);
		process.exit(1);
	}
}

export { checkDatabaseConnection, prismaClient };
