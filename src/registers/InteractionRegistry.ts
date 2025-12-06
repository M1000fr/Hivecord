import { Collection, type Interaction } from "discord.js";

type InteractionHandler = (interaction: Interaction) => Promise<void>;

export class InteractionRegistry {
	static buttons = new Collection<string, InteractionHandler>();
	static selectMenus = new Collection<string, InteractionHandler>();
	static modals = new Collection<string, InteractionHandler>();
	static buttonPatterns = new Collection<string, InteractionHandler>();
	static selectMenuPatterns = new Collection<string, InteractionHandler>();
	static modalPatterns = new Collection<string, InteractionHandler>();

	static registerButton(customId: string, handler: InteractionHandler) {
		this.buttons.set(customId, handler);
	}

	static registerSelectMenu(customId: string, handler: InteractionHandler) {
		this.selectMenus.set(customId, handler);
	}

	static registerModal(customId: string, handler: InteractionHandler) {
		this.modals.set(customId, handler);
	}

	static registerButtonPattern(pattern: string, handler: InteractionHandler) {
		this.buttonPatterns.set(pattern, handler);
	}

	static registerSelectMenuPattern(
		pattern: string,
		handler: InteractionHandler,
	) {
		this.selectMenuPatterns.set(pattern, handler);
	}

	static registerModalPattern(pattern: string, handler: InteractionHandler) {
		this.modalPatterns.set(pattern, handler);
	}

	static getButtonHandler(customId: string): InteractionHandler | null {
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

	static getSelectMenuHandler(customId: string): InteractionHandler | null {
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

	static getModalHandler(customId: string): InteractionHandler | null {
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
