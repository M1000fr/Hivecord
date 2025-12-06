import { BaseCommand } from "@class/BaseCommand";
import { SanctionScheduler } from "@class/SanctionScheduler";
import { EPermission } from "@enums/EPermission";
import type { CommandOptions } from "@interfaces/CommandOptions";
import type { EventOptions } from "@interfaces/EventOptions";
import type { ModuleOptions } from "@interfaces/ModuleOptions";
import { PermissionService } from "@services/PermissionService";
import { prismaClient } from "@services/prismaService";
import { Logger } from "@utils/Logger";
import { createHash } from "crypto";
import {
	type ApplicationCommandDataResolvable,
	Client,
	Collection,
	IntentsBitField,
	PermissionsBitField,
} from "discord.js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class LeBotClient<ready = false> extends Client {
	public commands = new Collection<
		string,
		{ instance: BaseCommand; options: CommandOptions }
	>();
	public modules = new Collection<
		string,
		{ instance: any; options: ModuleOptions }
	>();
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
		this.scheduler = new SanctionScheduler(this);
		this.handleProcessEvents();
	}

	private handleProcessEvents() {
		process.on("uncaughtException", (error) => {
			this.logger.error(error.message, error.stack, "UncaughtException");
		});

		process.on("unhandledRejection", (reason) => {
			this.logger.error(reason, undefined, "UnhandledRejection");
		});
	}

	public async start(token: string): Promise<string> {
		await this.loadModules();
		this.scheduler.start();
		try {
			return await this.login(token);
		} catch (error: any) {
			if (error.code === "DisallowedIntents") {
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
			const options = { ...c.options };
			if (options.defaultMemberPermissions) {
				(options as any).defaultMemberPermissions =
					PermissionsBitField.resolve(
						options.defaultMemberPermissions,
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
					commandsData as ApplicationCommandDataResolvable[],
				);
			} else {
				this.logger.log(
					`Started refreshing ${commandsData.length} application (/) commands GLOBALLY.`,
				);
				await this.application?.commands.set(
					commandsData as ApplicationCommandDataResolvable[],
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

		for (const CommandClass of options.commands) {
			const cmdOptions = (CommandClass as any)
				.commandOptions as CommandOptions;
			if (!cmdOptions) continue;

			const instance = new CommandClass();
			this.commands.set(cmdOptions.name, {
				instance,
				options: cmdOptions,
			});
		}
	}

	private loadEvents(options: ModuleOptions): void {
		if (!options.events) return;

		for (const EventClass of options.events) {
			const evtOptions = (EventClass as any)
				.eventOptions as EventOptions<any>;
			if (!evtOptions) continue;

			const instance = new EventClass();
			const handler = async (...args: any[]) => {
				try {
					await instance.run(this, ...args);
				} catch (error: any) {
					this.logger.error(
						`Error in event ${evtOptions.name}:`,
						error.stack,
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

						try {
							const instance = new ExportedClass();
							if ("moduleOptions" in instance) {
								const options = (instance as any)
									.moduleOptions as ModuleOptions;

								this.modules.set(options.name.toLowerCase(), {
									instance,
									options,
								});
								this.logger.log(
									`Loading module: ${options.name}`,
								);

								this.loadCommands(options);
								this.loadEvents(options);
								moduleLoaded = true;
								break;
							}
						} catch (e) {
							// Ignore instantiation errors
						}
					}
				} catch (e) {
					// Ignore import errors
				}
			}
		}

		for (const [_, module] of this.modules) {
			if (typeof module.instance.setup === "function") {
				await module.instance.setup(this);
			}
		}
	}
}
