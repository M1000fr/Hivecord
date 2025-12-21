import { Injectable } from "@decorators/Injectable";
import {
	COMMAND_PARAMS_METADATA_KEY,
	CommandParamType,
	type CommandParameter,
} from "@decorators/params";
import { DependencyContainer } from "@di/DependencyContainer";
import type { Constructor } from "@di/types";
import { EPermission } from "@enums/EPermission";
import type { CommandOptions } from "@interfaces/CommandOptions";
import type { ICommandClass } from "@interfaces/ICommandClass";
import type { IEventClass } from "@interfaces/IEventClass";
import type { IEventInstance } from "@interfaces/IEventInstance";
import type { IModuleInstance } from "@interfaces/IModuleInstance";
import type { ModuleOptions } from "@interfaces/ModuleOptions";
import { PermissionService } from "@services/PermissionService";
import { PrismaService } from "@services/prismaService";
import { Logger } from "@utils/Logger";
import { createHash } from "crypto";
import {
	Client,
	Collection,
	DiscordAPIError,
	IntentsBitField,
	PermissionsBitField,
	type ApplicationCommandDataResolvable,
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
		public readonly prismaService: PrismaService,
		private readonly permissionService: PermissionService,
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
		await this.loadModules();
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
		if (!this.token || !this.user) {
			this.logger.error("Client not logged in or token missing.");
			return;
		}

		const debugGuildId = process.env.DEBUG_DISCORD_GUILD_ID;

		const commandsData = this.commands.map((c) => {
			const options = { ...c.options } as Record<string, unknown>;
			if (options.defaultMemberPermissions) {
				options.defaultMemberPermissions = PermissionsBitField.resolve(
					options.defaultMemberPermissions as import("discord.js").PermissionResolvable,
				).toString();
			}
			return options;
		});
		const permissions = Object.values(EPermission);

		try {
			await this.permissionService.registerPermissions(permissions);

			// Calculate hash of commands
			const hash = createHash("md5")
				.update(JSON.stringify(commandsData))
				.digest("hex");
			const dbKey = `lebot:commands_hash:${debugGuildId || "global"}`;
			const storedState = await this.prismaService.botState.findUnique({
				where: { key: dbKey },
			});
			const storedHash = storedState?.value;

			if (hash === storedHash) {
				this.logger.log("Commands are up to date (hash match).");
				return;
			}

			if (debugGuildId) {
				this.logger.log(
					`Started refreshing ${commandsData.length} application (/) commands for DEBUG guild ${debugGuildId}.`,
				);
				const guild = await this.guilds.fetch(debugGuildId);
				await guild.commands.set(
					commandsData as unknown as ApplicationCommandDataResolvable[],
				);

				const currentGlobalCommands =
					await this.application?.commands.fetch();
				console.log(currentGlobalCommands);
				if (currentGlobalCommands && currentGlobalCommands.size > 0) {
					this.logger.log("Clearing global commands (DEBUG mode)...");
					await this.application?.commands.set([]);
				}
			} else {
				this.logger.log(
					`Started refreshing ${commandsData.length} application (/) commands GLOBALLY.`,
				);
				await this.application?.commands.set(
					commandsData as unknown as ApplicationCommandDataResolvable[],
				);

				// Clear guild-specific commands to avoid duplicates
				this.logger.log("Clearing guild-specific commands...");
				for (const guild of this.guilds.cache.values()) {
					try {
						const currentCommands = await guild.commands.fetch();

						if (currentCommands.size > 0) {
							this.logger.log(
								`Clearing commands for guild ${guild.name} (${guild.id})`,
							);
							await guild.commands.set([]);
						}
					} catch (error) {
						this.logger.error(
							`Failed to clear commands for guild ${guild.name} (${guild.id})`,
							(error as Error).stack,
						);
					}
				}
			}

			// Update hash in DB
			await this.prismaService.botState.upsert({
				where: { key: dbKey },
				update: { value: hash },
				create: { key: dbKey, value: hash },
			});

			this.logger.log(
				`Successfully reloaded ${commandsData.length} application (/) commands.`,
			);
		} catch (error) {
			this.logger.error(error);
		}
	}

	private loadCommands(options: ModuleOptions): void {
		if (!options.commands) return;

		const moduleName = options.name;

		for (const CommandClass of options.commands) {
			const cmdOptions = (CommandClass as unknown as ICommandClass)
				.commandOptions;
			if (!cmdOptions) continue;

			const instance = this.container.resolve(
				CommandClass as unknown as Constructor<object>,
				moduleName,
			);
			this.commands.set(cmdOptions.name, {
				instance,
				options: cmdOptions,
			});
		}
	}

	private loadEvents(options: ModuleOptions): void {
		if (!options.events) return;

		const moduleName = options.name;

		for (const EventClass of options.events) {
			const evtOptions = (EventClass as unknown as IEventClass)
				.eventOptions;
			if (!evtOptions) continue;

			const instance = this.container.resolve(
				EventClass as unknown as Constructor<IEventInstance>,
				moduleName,
			);
			const handler = async (...args: unknown[]) => {
				try {
					const params: CommandParameter[] =
						Reflect.getMetadata(
							COMMAND_PARAMS_METADATA_KEY,
							instance,
							"run",
						) || [];

					// Sort params by index to ensure correct order
					params.sort((a, b) => a.index - b.index);

					const finalArgs: unknown[] = [];
					let eventArgIndex = 0;

					for (const param of params) {
						if (param.type === CommandParamType.Client) {
							finalArgs[param.index] = this;
						} else if (param.type === CommandParamType.EventParam) {
							finalArgs[param.index] = args[eventArgIndex++];
						}
					}

					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					await instance.run(...(finalArgs as any));
				} catch (error: unknown) {
					this.logger.error(
						`Error in event ${evtOptions.name}:`,
						error instanceof Error ? error.stack : String(error),
					);
				}
			};

			if (evtOptions.once) {
				this.once(evtOptions.name, handler);
			} else {
				this.on(evtOptions.name, handler);
			}
		}
	}

	private async loadModules() {
		const registeredModules = this.container.getRegisteredModules();

		for (const [name, { options, moduleClass }] of registeredModules) {
			if (options.type !== "bot") continue;

			this.logger.log(`Loading module: ${options.name}`);

			let moduleInstance: IModuleInstance | undefined;

			if (moduleClass) {
				moduleInstance = this.container.resolve(
					moduleClass as Constructor<IModuleInstance>,
					options.name,
				);
			}

			if (moduleInstance) {
				this.modules.set(name, {
					instance: moduleInstance,
					options: options,
				});
			}

			this.loadCommands(options);
			this.loadEvents(options);
		}

		for (const module of this.modules.values()) {
			if (typeof module.instance.setup === "function") {
				await module.instance.setup(this);
			}
		}
	}
}
