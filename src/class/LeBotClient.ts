import { Client, IntentsBitField, Collection, REST, Routes, ApplicationCommandOptionType } from "discord.js";
import path from "path";
import { fileURLToPath } from "url";
import { BaseCommand } from "@class/BaseCommand";
import type { CommandOptions } from "@interfaces/CommandOptions";
import { PermissionService } from "@services/PermissionService";
import { EPermission } from "@enums/EPermission";
import { Logger } from "@utils/Logger";
import { SanctionScheduler } from "@class/SanctionScheduler";
import { ModerationModule } from "@modules/Moderation/ModerationModule";
import { ConfigurationModule } from "@modules/Configuration/ConfigurationModule.js";
import { GeneralModule } from "@modules/General/GeneralModule";
import { VoiceModule } from "@modules/Voice/VoiceModule";
import type { ModuleOptions } from "@interfaces/ModuleOptions";
import type { EventOptions } from "@interfaces/EventOptions";

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

		const guildId = process.env.DISCORD_GUILD_ID;
		if (!guildId) {
			this.logger.error(
				"DISCORD_GUILD_ID is missing in environment variables.",
			);
			return;
		}

		const rest = new REST().setToken(this.token);
		
		const commandsData = this.commands.map((c) => c.options);
		const permissions = Object.values(EPermission);

		try {
			this.logger.log(
				`Started refreshing ${commandsData.length} application (/) commands for guild ${guildId}.`,
			);

			await PermissionService.registerPermissions(permissions);

			await rest.put(
				Routes.applicationGuildCommands(this.user.id, guildId),
				{
					body: commandsData,
				},
			);

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
			const cmdOptions = (CommandClass as any).commandOptions as CommandOptions;
			if (!cmdOptions) continue;

			const instance = new CommandClass();
			this.commands.set(cmdOptions.name, { instance, options: cmdOptions });
		}
	}

	private loadEvents(options: ModuleOptions): void {
		if (!options.events) return;

		for (const EventClass of options.events) {
			const evtOptions = (EventClass as any).eventOptions as EventOptions<any>;
			if (!evtOptions) continue;

			const instance = new EventClass();
			const handler = (...args: any[]) => instance.run(this, ...args);

			if (evtOptions.once) {
				this.once(evtOptions.name, handler);
			} else {
				this.on(evtOptions.name, handler);
			}
		}
	}

	private async loadModules() {
		const modules = [ModerationModule, ConfigurationModule, GeneralModule, VoiceModule];

		for (const ModuleClass of modules) {
			const moduleInstance = new ModuleClass();
			const options = (moduleInstance as any).moduleOptions as ModuleOptions;

			this.modules.set(options.name.toLowerCase(), { instance: moduleInstance, options });
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
