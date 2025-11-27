import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../prisma/client/client";

function extractDatabaseLoginFromEnv(): {
  username: string;
  password: string;
  host: string;
  port: number;
  database: string;
} {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined in environment variables.");
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

export { prismaClient };
