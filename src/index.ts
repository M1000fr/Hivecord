import { LeBotClient } from "@class/LeBotClient";

const leBotInstance = new LeBotClient();

leBotInstance.start(process.env.BOT_TOKEN as string);

export default leBotInstance;
