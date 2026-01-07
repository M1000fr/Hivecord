import { HivecordClient } from "@class/HivecordClient";
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { Client } from "@decorators/params/Client";
import { BotEvents } from "@enums/BotEvents";
import { Logger } from "@utils/Logger";

@EventController()
export default class ReadyEvent {
  private logger = new Logger("ReadyEvent");

  @On({ name: BotEvents.ClientReady, once: true })
  async run(@Client() client: HivecordClient<true>) {
    if (client.user) {
      this.logger.log(`Logged in as ${client.user.tag}!`);
    }
    await client.deployCommands();
  }
}
