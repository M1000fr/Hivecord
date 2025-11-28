import { Collection } from "discord.js";

export class InteractionRegistry {
	static buttons = new Collection<string, Function>();
	static selectMenus = new Collection<string, Function>();
	static modals = new Collection<string, Function>();

	static registerButton(customId: string, handler: Function) {
		this.buttons.set(customId, handler);
	}

	static registerSelectMenu(customId: string, handler: Function) {
		this.selectMenus.set(customId, handler);
	}

	static registerModal(customId: string, handler: Function) {
		this.modals.set(customId, handler);
	}
}
