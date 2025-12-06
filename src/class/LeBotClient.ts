import { BaseCommand } from "@class/BaseCommand";
import { SanctionScheduler } from "@class/SanctionScheduler";
import { EPermission } from "@enums/EPermission";
import type { CommandOptions } from "@interfaces/CommandOptions";
import type { EventOptions } from "@interfaces/EventOptions";
import type { ModuleOptions } from "@interfaces/ModuleOptions";
import { ConfigurationModule } from "@modules/Configuration/ConfigurationModule";
import { DebugModule } from "@modules/Debug/DebugModule";
import { GeneralModule } from "@modules/General/GeneralModule";
import { GroupManagerModule } from "@modules/GroupManager/GroupManagerModule";
import { InvitationModule } from "@modules/Invitation/InvitationModule";
import { LogModule } from "@modules/Log/LogModule";
import { ModerationModule } from "@modules/Moderation/ModerationModule";
import { SecurityModule } from "@modules/Security/SecurityModule";
import { StatisticsModule } from "@modules/Statistics/StatisticsModule";
import { VoiceModule } from "@modules/Voice/VoiceModule";
import { PermissionService } from "@services/PermissionService";
import { Logger } from "@utils/Logger";
import { Client, Collection, IntentsBitField, REST, Routes } from "discord.js";
import path from "path";
import { fileURLToPath } from "url";

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
		const rest = new REST().setToken(this.token);

		const commandsData = this.commands.map((c) => {
			const options = { ...c.options };
			if (typeof options.defaultMemberPermissions === "bigint") {
				// @ts-ignore - JSON.stringify cannot serialize BigInt
				options.defaultMemberPermissions =
					options.defaultMemberPermissions.toString();
			}
			return options;
		});
		const permissions = Object.values(EPermission);

		try {
			await PermissionService.registerPermissions(permissions);

			if (debugGuildId) {
				this.logger.log(
					`Started refreshing ${commandsData.length} application (/) commands for DEBUG guild ${debugGuildId}.`,
				);
				await rest.put(
					Routes.applicationGuildCommands(this.user.id, debugGuildId),
					{
						body: commandsData,
					},
				);
			} else {
				this.logger.log(
					`Started refreshing ${commandsData.length} application (/) commands GLOBALLY.`,
				);
				await rest.put(Routes.applicationCommands(this.user.id), {
					body: commandsData,
				});

				// Clear guild-specific commands to avoid duplicates
				this.logger.log("Clearing guild-specific commands...");
				for (const guild of this.guilds.cache.values()) {
					try {
						const currentCommands = (await rest.get(
							Routes.applicationGuildCommands(
								this.user.id,
								guild.id,
							),
						)) as unknown[];

						if (currentCommands.length > 0) {
							this.logger.log(
								`Clearing commands for guild ${guild.name} (${guild.id})`,
							);
							await rest.put(
								Routes.applicationGuildCommands(
									this.user.id,
									guild.id,
								),
								{ body: [] },
							);
						}
					} catch (error) {
						this.logger.error(
							`Failed to clear commands for guild ${guild.name} (${guild.id})`,
							(error as Error).stack,
						);
					}
				}
			}

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
		const modules = [
			ModerationModule,
			ConfigurationModule,
			GeneralModule,
			VoiceModule,
			LogModule,
			DebugModule,
			SecurityModule,
			StatisticsModule,
			InvitationModule,
			GroupManagerModule,
		];

		for (const ModuleClass of modules) {
			const moduleInstance = new ModuleClass();
			const options = (moduleInstance as any)
				.moduleOptions as ModuleOptions;

			this.modules.set(options.name.toLowerCase(), {
				instance: moduleInstance,
				options,
			});
			this.logger.log(`Loading module: ${options.name}`);

			this.loadCommands(options);
			this.loadEvents(options);
		}

		for (const [_, module] of this.modules) {
			if (typeof module.instance.setup === "function") {
				await module.instance.setup(this);
			}
		}
	}
}
