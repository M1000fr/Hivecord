import { Client, IntentsBitField } from "discord.js";
import path from "path";
import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { EventBuilder } from "./EventBuilder";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class LeBotClient<ready = false> extends Client {
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
		return this.login(token);
	}

	private async loadEvents() {
		const eventsPath = path.join(__dirname, "../events");
		if (!fs.existsSync(eventsPath)) return;

		const files = this.getFiles(eventsPath);

		for (const file of files) {
			const event = (await import(pathToFileURL(file).toString()))
				.default;
			if (event instanceof EventBuilder) {
				const { name, handler, once } = event.build();
				if (once) {
					this.once(name, (...args) => handler(this, ...args));
				} else {
					this.on(name, (...args) => handler(this, ...args));
				}
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
