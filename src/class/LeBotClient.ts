import { BaseCommand } from "@class/BaseCommand";
import { BaseEvent } from "@class/BaseEvent";
import { SanctionScheduler } from "@class/SanctionScheduler";
import { DependencyContainer } from "@di/DependencyContainer";
import type { Constructor } from "@di/types";
import { EPermission } from "@enums/EPermission";
import type { CommandOptions } from "@interfaces/CommandOptions";
import type { ICommandClass } from "@interfaces/ICommandClass";
import type { IEventClass } from "@interfaces/IEventClass";
import type { IModuleInstance } from "@interfaces/IModuleInstance";
import type { ModuleOptions } from "@interfaces/ModuleOptions";
import { PermissionService } from "@services/PermissionService";
import { prismaClient } from "@services/prismaService";
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
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class LeBotClient<
	Ready extends boolean = boolean,
> extends Client<Ready> {
	public commands = new Collection<
		string,
		{ instance: BaseCommand; options: CommandOptions }
	>();
	public modules = new Collection<
		string,
		{ instance: IModuleInstance; options: ModuleOptions }
	>();
	private container = DependencyContainer.getInstance();
	private static instance: LeBotClient;
	private logger = new Logger("LeBotClient");
	private scheduler: SanctionScheduler;

	constructor() {
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
		this.scheduler = new SanctionScheduler(this);
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
		this.scheduler.start();
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
			await PermissionService.registerPermissions(permissions);

			// Calculate hash of commands
			const hash = createHash("md5")
				.update(JSON.stringify(commandsData))
				.digest("hex");
			const dbKey = `lebot:commands_hash:${debugGuildId || "global"}`;
			const storedState = await prismaClient.botState.findUnique({
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
			await prismaClient.botState.upsert({
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
				CommandClass as unknown as Constructor<BaseCommand>,
				moduleName,
			) as BaseCommand;
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
				EventClass as unknown as Constructor<BaseEvent<string>>,
				moduleName,
			);
			const handler = async (...args: unknown[]) => {
				try {
					await instance.run(this, ...args);
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
		const modulesPath = path.join(__dirname, "../modules");
		const folders = await fs.readdir(modulesPath);
		const discoveredModules: Array<{
			ModuleClass: Constructor<IModuleInstance>;
			options: ModuleOptions;
			instance?: IModuleInstance;
		}> = [];

		for (const folder of folders) {
			const folderPath = path.join(modulesPath, folder);
			const stat = await fs.stat(folderPath);
			if (!stat.isDirectory()) continue;

			const filesInFolder = await fs.readdir(folderPath);
			const candidateFiles = filesInFolder.filter(
				(f) =>
					f.startsWith(folder) &&
					(f.endsWith(".ts") || f.endsWith(".js")),
			);

			let moduleLoaded = false;

			for (const moduleFile of candidateFiles) {
				if (moduleLoaded) break;

				const moduleFilePath = path.join(folderPath, moduleFile);
				try {
					const imported = await import(
						pathToFileURL(moduleFilePath).href
					);

					for (const exportedKey in imported) {
						const ExportedClass = imported[exportedKey];

						if (typeof ExportedClass !== "function") continue;

						const moduleMetadata =
							this.container.getModuleOptionsFromConstructor(
								ExportedClass as Constructor,
							);
						const extracted =
							moduleMetadata !== undefined
								? undefined
								: this.extractModuleOptionsFromInstance(
										ExportedClass,
									);
						const moduleOptions =
							moduleMetadata ?? extracted?.options;

						if (!moduleOptions) continue;

						discoveredModules.push({
							ModuleClass:
								ExportedClass as Constructor<IModuleInstance>,
							options: moduleOptions,
							instance: extracted?.instance,
						});
						moduleLoaded = true;
						break;
					}
				} catch (error) {
					this.logger.error(
						`Failed to load module from ${moduleFile}:`,
						error instanceof Error ? error.stack : String(error),
					);
					throw error;
				}
			}
		}

		for (const { options, ModuleClass } of discoveredModules) {
			this.container.registerModule(options, ModuleClass);
		}

		for (const module of discoveredModules) {
			const moduleInstance =
				module.instance ??
				(this.container.resolve(
					module.ModuleClass,
					module.options.name,
				) as IModuleInstance);

			this.modules.set(module.options.name.toLowerCase(), {
				instance: moduleInstance,
				options: module.options,
			});
			this.logger.log(`Loading module: ${module.options.name}`);

			this.loadCommands(module.options);
			this.loadEvents(module.options);
		}

		for (const module of this.modules.values()) {
			if (typeof module.instance.setup === "function") {
				await module.instance.setup(this);
			}
		}
	}

	private extractModuleOptionsFromInstance(
		ExportedClass: Constructor,
	): { options: ModuleOptions; instance: IModuleInstance } | undefined {
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const instance = new (ExportedClass as any)();
			if ("moduleOptions" in instance) {
				return {
					options: (instance as unknown as IModuleInstance)
						.moduleOptions,
					instance: instance as unknown as IModuleInstance,
				};
			}
		} catch {
			this.logger.warn(
				`Failed to instantiate exported class ${ExportedClass.name}.`,
			);
		}

		return undefined;
	}
}
