import { Injectable } from "@decorators/Injectable";
import { EVENT_METADATA_KEY } from "@decorators/On";
import {
	COMMAND_PARAMS_METADATA_KEY,
	CommandParamType,
	type CommandParameter,
} from "@decorators/params";
import { resolveGuildConfig } from "@decorators/params/GuildConfig";
import { DependencyContainer } from "@di/DependencyContainer";
import { INJECTABLE_METADATA_KEY, type Constructor } from "@di/types";
import { EPermission } from "@enums/EPermission";
import type { CommandOptions } from "@interfaces/CommandOptions.ts";
import type { ICommandClass } from "@interfaces/ICommandClass.ts";
import type { IContextMenuCommandClass } from "@interfaces/IContextMenuCommandClass.ts";
import type { IModuleInstance } from "@interfaces/IModuleInstance.ts";
import type { ModuleOptions } from "@interfaces/ModuleOptions.ts";
import { PermissionService } from "@modules/Core/services/PermissionService";
import { PrismaService } from "@modules/Core/services/PrismaService";
import { getProvidersByType } from "@utils/getProvidersByType";
import { Logger } from "@utils/Logger";
import { createHash } from "crypto";
import {
	ApplicationCommandType,
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
			const dbKey = `commands_hash:${debugGuildId || "global"}`;
			const storedState = await this.prismaService.botState.findUnique({
				where: { key: dbKey },
			});
			const storedHash = storedState?.value;

			if (hash === storedHash) {
				this.logger.log("Commands are up to date (hash match).");
				if (debugGuildId) {
					const currentGlobalCommands =
						await this.application?.commands.fetch();
					if (
						currentGlobalCommands &&
						currentGlobalCommands.size > 0
					) {
						this.logger.log(
							"Clearing global commands (DEBUG mode)...",
						);
						await this.application?.commands.set([]);
					}
				}
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
		const moduleName = options.name;

		if (!options.providers) return;

		// Extract commands from providers
		const commandClasses = getProvidersByType(options.providers, "command");

		for (const CommandClass of commandClasses) {
			// Check if it's a context menu command
			const contextMenuOptions = (
				CommandClass as unknown as IContextMenuCommandClass
			).contextMenuOptions;

			if (contextMenuOptions) {
				const instance = this.container.resolve(
					CommandClass as unknown as Constructor<object>,
					moduleName,
				);

				// Convert context menu options to Discord command format
				const commandData: CommandOptions = {
					name: contextMenuOptions.name,
					description: "",
					type:
						contextMenuOptions.type === "user"
							? ApplicationCommandType.User
							: ApplicationCommandType.Message,
					defaultMemberPermissions:
						contextMenuOptions.defaultMemberPermissions,
				} as CommandOptions & { type: ApplicationCommandType };

				this.commands.set(contextMenuOptions.name, {
					instance,
					options: commandData,
				});
				continue;
			}

			// Regular slash command
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
		const moduleName = options.name;

		if (!options.providers) return;

		// Extract events from providers
		const eventClasses = getProvidersByType(options.providers, "event");

		for (const EventClass of eventClasses) {
			const instance = this.container.resolve(
				EventClass as unknown as Constructor<object>,
				moduleName,
			);

			const prototype = Object.getPrototypeOf(instance);
			const methods = Object.getOwnPropertyNames(prototype);

			for (const methodName of methods) {
				const evtOptions = Reflect.getMetadata(
					EVENT_METADATA_KEY,
					prototype,
					methodName,
				);

				if (!evtOptions) continue;

				const handler = async (...args: unknown[]) => {
					try {
						const params: CommandParameter[] =
							Reflect.getMetadata(
								COMMAND_PARAMS_METADATA_KEY,
								prototype,
								methodName,
							) || [];

						// Sort params by index to ensure correct order
						params.sort((a, b) => a.index - b.index);

						const finalArgs: unknown[] = [];

						for (const param of params) {
							if (param.type === CommandParamType.Client) {
								finalArgs[param.index] = this;
							} else if (
								param.type === CommandParamType.Context
							) {
								finalArgs[param.index] = args;
							} else if (
								param.type === CommandParamType.GuildConfig
							) {
								finalArgs[param.index] =
									await resolveGuildConfig(
										prototype,
										methodName,
										param.index,
										args,
									);
							}
						}

						const method = (instance as Record<string, unknown>)[
							methodName
						];
						if (typeof method === "function") {
							await method.apply(instance, finalArgs);
						}
					} catch (error: unknown) {
						this.logger.error(
							`Error in event ${evtOptions.name} (method: ${methodName}):`,
							error instanceof Error
								? error.stack
								: String(error),
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
	}

	private validateInjectableClasses(
		classes: Constructor[],
		context: string,
	): string[] {
		const errors: string[] = [];

		for (const ClassConstructor of classes) {
			const isInjectable = Reflect.hasMetadata(
				INJECTABLE_METADATA_KEY,
				ClassConstructor,
			);
			if (!isInjectable) {
				errors.push(
					`Class "${ClassConstructor.name}" in ${context} is missing @Injectable() decorator.`,
				);
			}
		}

		return errors;
	}

	private async loadModules() {
		const registeredModules = this.container.getRegisteredModules();
		const allErrors: string[] = [];

		for (const [, { options }] of registeredModules) {
			this.logger.log(`Loading module: ${options.name}`);

			// Validate all providers
			if (options.providers) {
				const providerClasses = options.providers.filter(
					(p): p is Constructor =>
						typeof p === "function" && "prototype" in p,
				);

				if (providerClasses.length > 0) {
					const errors = this.validateInjectableClasses(
						providerClasses,
						`module "${options.name}"`,
					);
					allErrors.push(...errors);
				}
			}
		}

		// If there are validation errors, display them all and stop
		if (allErrors.length > 0) {
			this.logger.error(
				`\n${"=".repeat(80)}\n` +
					`Found ${allErrors.length} missing @Injectable() decorator${allErrors.length > 1 ? "s" : ""}:\n` +
					`${"=".repeat(80)}\n`,
			);

			allErrors.forEach((error, index) => {
				this.logger.error(`${index + 1}. ${error}`);
			});

			this.logger.error(
				`\n${"=".repeat(80)}\n` +
					`All providers, commands, and event controllers must be decorated with @Injectable().\n` +
					`Please add the @Injectable() decorator to the classes listed above.\n` +
					`${"=".repeat(80)}\n`,
			);

			throw new Error(
				`Found ${allErrors.length} class${allErrors.length > 1 ? "es" : ""} missing @Injectable() decorator`,
			);
		}

		// Continue with module loading
		for (const [name, { options, moduleClass }] of registeredModules) {
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
