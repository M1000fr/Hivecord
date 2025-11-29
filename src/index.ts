import { LeBotClient } from "@class/LeBotClient";
import { checkDatabaseConnection } from "@services/prismaService";
import { RedisService } from "@services/RedisService";

// Check connections before starting
await checkDatabaseConnection();
await RedisService.checkConnection();

const leBotInstance = new LeBotClient();

leBotInstance.start(process.env.BOT_TOKEN as string);

export default leBotInstance;
