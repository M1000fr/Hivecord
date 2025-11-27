import { Client, IntentsBitField, Collection, REST, Routes } from "discord.js";
import path from "path";
import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { BaseCommand } from "./BaseCommand";
import type { CommandOptions } from "../interfaces/CommandOptions";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class LeBotClient<ready = false> extends Client {
	public commands = new Collection<string, { instance: BaseCommand; options: CommandOptions }>();

	constructor() {
		super({
			intents: [
				IntentsBitField.Flags.Guilds,
				IntentsBitField.Flags.GuildMembers,
				IntentsBitField.Flags.GuildMessageReactions,
			],
		});
	}

	public async start(token: string): Promise<string> {
		await this.loadEvents();
		await this.loadCommands();
		return this.login(token);
	}

	public async deployCommands() {
		if (!this.token || !this.user) {
			console.error("Client not logged in or token missing.");
			return;
		}

		const guildId = process.env.DISCORD_GUILD_ID;
		if (!guildId) {
			console.error("DISCORD_GUILD_ID is missing in environment variables.");
			return;
		}

		const rest = new REST().setToken(this.token);
		const commandsData = this.commands.map((c) => c.options);

		try {
			console.log(
				`Started refreshing ${commandsData.length} application (/) commands for guild ${guildId}.`
			);

			await rest.put(Routes.applicationGuildCommands(this.user.id, guildId), {
				body: commandsData,
			});

			console.log(
				`Successfully reloaded ${commandsData.length} application (/) commands.`
			);
		} catch (error) {
			console.error(error);
		}
	}

	private async loadEvents() {
		const eventsPath = path.join(__dirname, "../events");
		if (!fs.existsSync(eventsPath)) return;

		const files = this.getFiles(eventsPath);

		for (const file of files) {
			const eventModule = await import(pathToFileURL(file).toString());
			const EventClass = eventModule.default;

			if (EventClass && (EventClass as any).eventOptions) {
				const options = (EventClass as any).eventOptions;
				const instance = new EventClass();

				if (options.once) {
					this.once(options.name, (...args) => instance.run(this, ...args));
				} else {
					this.on(options.name, (...args) => instance.run(this, ...args));
				}
			}
		}
	}

	private async loadCommands() {
		const commandsPath = path.join(__dirname, "../commands");
		if (!fs.existsSync(commandsPath)) return;

		const files = this.getFiles(commandsPath);

		for (const file of files) {
			const commandModule = await import(pathToFileURL(file).toString());
			const CommandClass = commandModule.default;

			if (CommandClass && (CommandClass as any).commandOptions) {
				const options = (CommandClass as any).commandOptions as CommandOptions;
				const instance = new CommandClass() as BaseCommand;
				this.commands.set(options.name, { instance, options });
			}
		}
	}

	private getFiles(dir: string): string[] {
		const files: string[] = [];
		const items = fs.readdirSync(dir, { withFileTypes: true });

		for (const item of items) {
			if (item.isDirectory()) {
				files.push(...this.getFiles(path.join(dir, item.name)));
			} else if (
				item.isFile() &&
				(item.name.endsWith(".ts") || item.name.endsWith(".js"))
			) {
				files.push(path.join(dir, item.name));
			}
		}
		return files;
	}
}
