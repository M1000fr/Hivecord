import { Injectable } from "@decorators/Injectable";
import { DependencyContainer } from "@di/DependencyContainer";
import type { CommandOptions } from "@interfaces/CommandOptions.ts";
import type { IModuleInstance } from "@interfaces/IModuleInstance.ts";
import type { ModuleOptions } from "@interfaces/ModuleOptions.ts";
import { PrismaService } from "@modules/Database/services/PrismaService";
import { RedisService } from "@modules/Database/services/RedisService";
import { CommandDeploymentService } from "@modules/Shared/services/CommandDeploymentService";
import { ModuleLoader } from "@modules/Shared/services/ModuleLoader";
import { BotStateRepository } from "@src/repositories";
import { Logger } from "@utils/Logger";
import {
  Client,
  Collection,
  DiscordAPIError,
  IntentsBitField,
} from "discord.js";

@Injectable({ scope: "global" })
export class HivecordClient<
  Ready extends boolean = boolean,
> extends Client<Ready> {
  public commands = new Collection<
    string,
    { instance: object; options: CommandOptions }
  >();
  public modules = new Collection<
    string,
    { instance: IModuleInstance; options: ModuleOptions }
  >();
  private container = DependencyContainer.getInstance();
  private static instance: HivecordClient;
  private logger = new Logger("HivecordClient");

  constructor(
    public readonly botStateRepository: BotStateRepository,
    private readonly moduleLoader: ModuleLoader,
    private readonly commandDeploymentService: CommandDeploymentService,
  ) {
    super({
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildInvites,
      ],
    });
    HivecordClient.instance = this;
    this.handleProcessEvents();
  }

  static getInstance(): HivecordClient {
    return HivecordClient.instance;
  }

  private handleProcessEvents() {
    process.on("uncaughtException", (error) => {
      this.logger.error(error.message, error.stack, "UncaughtException");
    });

    process.on("unhandledRejection", (reason) => {
      this.logger.error(
        reason instanceof Error ? reason.message : String(reason),
        reason instanceof Error ? reason.stack : undefined,
        "UnhandledRejection",
      );
    });

    const shutdown = async (signal: string) => {
      this.logger.log(`Received ${signal}. Shutting down shard...`);
      try {
        this.destroy();
        this.logger.log("Discord client destroyed.");

        const redisService = this.container.resolve(RedisService);
        await redisService.client.quit();
        this.logger.log("Redis connection closed.");

        const prismaService = this.container.resolve(PrismaService);
        await prismaService.$disconnect();
        this.logger.log("Prisma connection closed.");

        process.exit(0);
      } catch (error) {
        this.logger.error(
          "Error during shard shutdown:",
          error instanceof Error ? error.stack : String(error),
        );
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  }

  public async start(token: string): Promise<string> {
    await this.moduleLoader.loadModules(this);
    try {
      return await this.login(token);
    } catch (error: unknown) {
      if (
        error instanceof DiscordAPIError &&
        error.code === "DisallowedIntents"
      ) {
        this.logger.error(
          "Privileged intent provided is not enabled or whitelisted in the Discord Developer Portal.",
        );
      }
      throw error;
    }
  }

  public async deployCommands() {
    await this.commandDeploymentService.deploy(this as HivecordClient<true>);
  }
}
