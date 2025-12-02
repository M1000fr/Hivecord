import { Collection } from "discord.js";

export class InteractionRegistry {
	static buttons = new Collection<string, Function>();
	static selectMenus = new Collection<string, Function>();
	static modals = new Collection<string, Function>();
	static buttonPatterns = new Collection<string, Function>();
	static selectMenuPatterns = new Collection<string, Function>();
	static modalPatterns = new Collection<string, Function>();

	static registerButton(customId: string, handler: Function) {
		this.buttons.set(customId, handler);
	}

	static registerSelectMenu(customId: string, handler: Function) {
		this.selectMenus.set(customId, handler);
	}

	static registerModal(customId: string, handler: Function) {
		this.modals.set(customId, handler);
	}

	static registerButtonPattern(pattern: string, handler: Function) {
		this.buttonPatterns.set(pattern, handler);
	}

	static registerSelectMenuPattern(pattern: string, handler: Function) {
		this.selectMenuPatterns.set(pattern, handler);
	}

	static registerModalPattern(pattern: string, handler: Function) {
		this.modalPatterns.set(pattern, handler);
	}

	static getButtonHandler(customId: string): Function | null {
		// Try exact match first
		const exactHandler = this.buttons.get(customId);
		if (exactHandler) return exactHandler;

		// Try pattern matching
		for (const [pattern, handler] of this.buttonPatterns) {
			if (this.matchesPattern(customId, pattern)) {
				return handler;
			}
		}
		return null;
	}

	static getSelectMenuHandler(customId: string): Function | null {
		// Try exact match first
		const exactHandler = this.selectMenus.get(customId);
		if (exactHandler) return exactHandler;

		// Try pattern matching
		for (const [pattern, handler] of this.selectMenuPatterns) {
			if (this.matchesPattern(customId, pattern)) {
				return handler;
			}
		}
		return null;
	}

	static getModalHandler(customId: string): Function | null {
		// Try exact match first
		const exactHandler = this.modals.get(customId);
		if (exactHandler) return exactHandler;

		// Try pattern matching
		for (const [pattern, handler] of this.modalPatterns) {
			if (this.matchesPattern(customId, pattern)) {
				return handler;
			}
		}
		return null;
	}

	private static matchesPattern(customId: string, pattern: string): boolean {
		// Convert pattern with wildcards (*) to regex
		const regexPattern = pattern
			.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape special regex chars
			.replace(/\\\*/g, ".*"); // Replace escaped * with .*
		return new RegExp(`^${regexPattern}$`).test(customId);
	}
}
