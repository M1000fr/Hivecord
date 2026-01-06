import { Guild } from "discord.js";
import { ConfigCacheService } from "./ConfigCacheService";

/**
 * Generic interface for configuration list items
 */
interface ConfigListItem {
	[key: string]: unknown;
}

/**
 * Generic configuration service for handling single-value and list-based configs.
 * Provides caching and standardized CRUD operations for config entities.
 *
 * @template T The type of entity being configured (Role, Channel, etc.)
 */
export abstract class GenericConfigService<T> {
	protected abstract entityType: "role" | "channel"; // e.g., "role", "channel"
	protected abstract listType: "roles" | "channels"; // e.g., "roles", "channels"

	constructor(protected readonly cache: ConfigCacheService) {}

	/**
	 * Get a single configuration value
	 */
	async get(guild: Guild, key: string): Promise<string | null> {
		return this.cache.get(
			guild.id,
			this.entityType,
			key,
			async () => {
				const config = await this.getConfigValue(key);
				return config ?? null;
			},
		);
	}

	/**
	 * Set a single configuration value
	 */
	async set(guild: Guild, key: string, entity: T): Promise<void> {
		await this.persistEntity(entity);
		await this.setConfigValue(key, this.extractId(entity));
		await this.cache.invalidate(guild.id, key);
	}

	/**
	 * Get a list of configuration values
	 */
	async getList(guild: Guild, key: string): Promise<string[]> {
		return this.cache.get(
			guild.id,
			this.listType,
			key,
			async () => {
				const configs = await this.getConfigListValues(guild.id, key);
				return configs.map((c) => this.extractListItemId(c));
			},
		);
	}

	/**
	 * Set a list of configuration values
	 */
	async setList(guild: Guild, key: string, entities: T[]): Promise<void> {
		for (const entity of entities) {
			await this.persistEntity(entity);
		}
		await this.setConfigListValues(
			guild.id,
			key,
			entities.map((e) => this.extractId(e)),
		);
		await this.cache.invalidate(guild.id, key);
	}

	/**
	 * Add an item to a list configuration
	 */
	async addToList(guild: Guild, key: string, entity: T): Promise<void> {
		await this.persistEntity(entity);
		await this.addConfigListItem(key, this.extractId(entity));
		await this.cache.invalidate(guild.id, key);
	}

	/**
	 * Remove an item from a list configuration
	 */
	async removeFromList(guild: Guild, key: string, id: string): Promise<void> {
		try {
			await this.removeConfigListItem(key, id);
			await this.cache.invalidate(guild.id, key);
		} catch {
			// Ignore if not found
		}
	}

	/**
	 * Delete a single configuration value
	 */
	async delete(guild: Guild, key: string): Promise<void> {
		try {
			await this.deleteConfigValue(key);
			await this.cache.invalidate(guild.id, key);
		} catch {
			// Ignore if not found
		}
	}

	/**
	 * Clear all items from a list configuration
	 */
	async clearList(guild: Guild, key: string): Promise<void> {
		await this.clearConfigList(guild.id, key);
		await this.cache.invalidate(guild.id, key);
	}

	// Abstract methods to be implemented by subclasses
	protected abstract persistEntity(entity: T): Promise<void>;
	protected abstract extractId(entity: T): string;
	protected abstract extractListItemId(item: ConfigListItem): string;
	protected abstract getConfigValue(key: string): Promise<string | null>;
	protected abstract setConfigValue(key: string, value: string): Promise<void>;
	protected abstract getConfigListValues(
		guildId: string,
		key: string,
	): Promise<ConfigListItem[]>;
	protected abstract setConfigListValues(
		guildId: string,
		key: string,
		values: string[],
	): Promise<void>;
	protected abstract addConfigListItem(key: string, value: string): Promise<void>;
	protected abstract removeConfigListItem(key: string, value: string): Promise<void>;
	protected abstract deleteConfigValue(key: string): Promise<void>;
	protected abstract clearConfigList(guildId: string, key: string): Promise<void>;
}
