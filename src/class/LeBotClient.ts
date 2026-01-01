import { Injectable } from "@decorators/Injectable";
import { DependencyContainer } from "@di/DependencyContainer";
import type { CommandOptions } from "@interfaces/CommandOptions.ts";
import type { IModuleInstance } from "@interfaces/IModuleInstance.ts";
import type { ModuleOptions } from "@interfaces/ModuleOptions.ts";
import { CommandDeploymentService } from "@modules/Core/services/CommandDeploymentService";
import { ModuleLoader } from "@modules/Core/services/ModuleLoader";
import { BotStateRepository } from "@src/repositories";
import { Logger } from "@utils/Logger";
import {
	Client,
	Collection,
	DiscordAPIError,
	IntentsBitField,
} from "discord.js";

@Injectable()
export class LeBotClient<
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
	private static instance: LeBotClient;
	private logger = new Logger("LeBotClient");

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
		LeBotClient.instance = this;
		this.handleProcessEvents();
	}

	static getInstance(): LeBotClient {
		return this.instance;
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
		await this.commandDeploymentService.deploy(this as LeBotClient<true>);
	}
}
