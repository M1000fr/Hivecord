import type {
	AnySelectMenuInteraction,
	ButtonInteraction,
	ModalSubmitInteraction,
} from "discord.js";

/**
 * Context for button interactions
 */
export type ButtonContext = [interaction: ButtonInteraction];

/**
 * Context for select menu interactions (String, User, Role, Mentionable, Channel)
 */
export type SelectMenuContext = [interaction: AnySelectMenuInteraction];

/**
 * Context for modal submit interactions
 */
export type ModalContext = [interaction: ModalSubmitInteraction];
