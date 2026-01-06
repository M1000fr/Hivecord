import { Injectable } from "@decorators/Injectable";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client/client";
import { env } from "@utils/Env";
import { Logger } from "@utils/Logger";

@Injectable({ scope: "global" })
export class PrismaService extends PrismaClient {
	private readonly logger = new Logger("PrismaService");

	constructor() {
		const dbConfig = PrismaService.extractDatabaseLoginFromEnv();
		const adapter = new PrismaMariaDb({
			connectionLimit: 5,
			host: dbConfig.host,
			port: dbConfig.port,
			user: dbConfig.username,
			password: dbConfig.password,
			database: dbConfig.database,
		});
		super({ adapter });
	}

	private static extractDatabaseLoginFromEnv(): {
		username: string;
		password: string;
		host: string;
		port: number;
		database: string;
	} {
		const url = new URL(env.DATABASE_URL);
		return {
			username: url.username,
			password: url.password,
			host: url.hostname,
			port: Number(url.port),
			database: url.pathname.slice(1), // Remove leading '/'
		};
	}

	async checkDatabaseConnection() {
		try {
			await this.$connect();
			await this.$queryRaw`SELECT 1`;
			this.logger.log("Database connection established successfully.");
		} catch (error: unknown) {
			this.logger.error(
				"Database connection failed:",
				error instanceof Error ? error.stack : String(error),
			);
			process.exit(1);
		}
	}
}
