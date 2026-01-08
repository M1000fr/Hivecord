import type { ConfigPropertyOptions } from "@decorators/ConfigProperty";
import { HivecordClient } from "@src/class/HivecordClient";
import {
	ButtonInteraction,
	ChatInputCommandInteraction,
	type RepliableInteraction,
	StringSelectMenuInteraction,
} from "discord.js";

/**
 * Handler for custom configuration type interactions
 */
export interface ConfigTypeHandler {
	/**
	 * Display the configuration UI for this type
	 * @param interaction The interaction that triggered the display
	 * @param propertyOptions The configuration property options
	 * @param selectedProperty The property key being configured
	 * @param moduleName The module name
	 */
	show(
		interaction: RepliableInteraction,
		propertyOptions: ConfigPropertyOptions,
		selectedProperty: string,
		moduleName: string,
	): Promise<void>;

	/**
	 * Handle value selection/update for this type
	 * @param interaction The interaction containing the new value
	 * @param client The bot client
	 * @param moduleName The module name
	 * @param propertyKey The property key
	 * @param value The new value
	 */
	handleUpdate?(
		interaction:
			| StringSelectMenuInteraction
			| ButtonInteraction
			| ChatInputCommandInteraction,
		client: HivecordClient,
		moduleName: string,
		propertyKey: string,
		value: unknown,
	): Promise<void>;

	/**
	 * Format the current value for display
	 * @param guildId The guild ID
	 * @param value The raw value from database
	 * @returns Formatted string for display
	 */
	formatValue?(guildId: string, value: unknown): Promise<string>;
}

/**
 * Configuration type definition
 */
export interface ConfigTypeDefinition {
	/** Unique identifier for this type */
	id: string;
	/** Display name for this type */
	name: string;
	/** Handler for this configuration type */
	handler: ConfigTypeHandler;
}

/**
 * Registry for custom configuration types
 */
export class ConfigTypeRegistry {
	private static types: Map<string, ConfigTypeDefinition> = new Map();

	/**
	 * Register a new configuration type
	 * @param definition The type definition
	 */
	static register(definition: ConfigTypeDefinition): void {
		ConfigTypeRegistry.types.set(definition.id, definition);
	}

	/**
	 * Get a registered configuration type
	 * @param id The type identifier
	 * @returns The type definition or undefined
	 */
	static get(id: string): ConfigTypeDefinition | undefined {
		return ConfigTypeRegistry.types.get(id);
	}

	/**
	 * Check if a type is registered
	 * @param id The type identifier
	 * @returns True if registered
	 */
	static has(id: string): boolean {
		return ConfigTypeRegistry.types.has(id);
	}

	/**
	 * Get all registered types
	 * @returns Array of all type definitions
	 */
	static getAll(): ConfigTypeDefinition[] {
		return Array.from(ConfigTypeRegistry.types.values());
	}

	/**
	 * Unregister a configuration type
	 * @param id The type identifier
	 */
	static unregister(id: string): void {
		ConfigTypeRegistry.types.delete(id);
	}

	/**
	 * Clear all registered types
	 */
	static clear(): void {
		ConfigTypeRegistry.types.clear();
	}
}
