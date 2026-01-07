import { Collection, type Interaction } from "discord.js";

type InteractionHandler = (interaction: Interaction) => Promise<void>;

/**
 * Centralized registry for interaction handlers (buttons, select menus, modals).
 * Supports both exact match and pattern matching with wildcard support.
 */
export class InteractionRegistry {
	static buttons = new Collection<string, InteractionHandler>();
	static selectMenus = new Collection<string, InteractionHandler>();
	static modals = new Collection<string, InteractionHandler>();
	static buttonPatterns = new Collection<string, InteractionHandler>();
	static selectMenuPatterns = new Collection<string, InteractionHandler>();
	static modalPatterns = new Collection<string, InteractionHandler>();

	static registerButton(customId: string, handler: InteractionHandler) {
		InteractionRegistry.buttons.set(customId, handler);
	}

	static registerSelectMenu(customId: string, handler: InteractionHandler) {
		InteractionRegistry.selectMenus.set(customId, handler);
	}

	static registerModal(customId: string, handler: InteractionHandler) {
		InteractionRegistry.modals.set(customId, handler);
	}

	static registerButtonPattern(pattern: string, handler: InteractionHandler) {
		InteractionRegistry.buttonPatterns.set(pattern, handler);
	}

	static registerSelectMenuPattern(
		pattern: string,
		handler: InteractionHandler,
	) {
		InteractionRegistry.selectMenuPatterns.set(pattern, handler);
	}

	static registerModalPattern(pattern: string, handler: InteractionHandler) {
		InteractionRegistry.modalPatterns.set(pattern, handler);
	}

	/**
	 * Generic handler lookup with exact and pattern matching
	 * @param exact Collection with exact match handlers
	 * @param pattern Collection with pattern-based handlers
	 * @param customId The custom ID to match
	 */
	private static getHandler(
		exact: Collection<string, InteractionHandler>,
		pattern: Collection<string, InteractionHandler>,
		customId: string,
	): InteractionHandler | null {
		// Try exact match first
		const exactHandler = exact.get(customId);
		if (exactHandler) return exactHandler;

		// Try pattern matching
		for (const [patternStr, handler] of pattern) {
			if (InteractionRegistry.matchesPattern(customId, patternStr)) {
				return handler;
			}
		}
		return null;
	}

	static getButtonHandler(customId: string): InteractionHandler | null {
		return InteractionRegistry.getHandler(
			InteractionRegistry.buttons,
			InteractionRegistry.buttonPatterns,
			customId,
		);
	}

	static getSelectMenuHandler(customId: string): InteractionHandler | null {
		return InteractionRegistry.getHandler(
			InteractionRegistry.selectMenus,
			InteractionRegistry.selectMenuPatterns,
			customId,
		);
	}

	static getModalHandler(customId: string): InteractionHandler | null {
		return InteractionRegistry.getHandler(
			InteractionRegistry.modals,
			InteractionRegistry.modalPatterns,
			customId,
		);
	}

	private static matchesPattern(customId: string, pattern: string): boolean {
		// Convert pattern with wildcards (*) to regex
		const regexPattern = pattern
			.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape special regex chars
			.replace(/\\\*/g, ".*"); // Replace escaped * with .*
		return new RegExp(`^${regexPattern}$`).test(customId);
	}
}
