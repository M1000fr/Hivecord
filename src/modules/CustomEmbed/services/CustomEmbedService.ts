import { MessageTemplate } from "@class/MessageTemplate";
import { EntityService } from "@modules/Core/services/EntityService";
import { RedisService } from "@modules/Core/services/RedisService";
import { Injectable } from "@src/decorators/Injectable";
import { CustomEmbedRepository } from "@src/repositories";
import { EmbedBuilder, Guild, User, type APIEmbed } from "discord.js";

const EDITOR_TTL = 3600; // 1 hour

@Injectable()
export class CustomEmbedService {
	constructor(
		private readonly entityService: EntityService,
		private readonly customEmbedRepository: CustomEmbedRepository,
		private readonly redis: RedisService,
	) {}

	/**
	 * Get a raw embed JSON by name
	 */
	async get(guild: Guild, name: string): Promise<APIEmbed | null> {
		const embed = await this.customEmbedRepository.findByName(guild, name);
		if (!embed) return null;
		return JSON.parse(embed.data);
	}

	/**
	 * Save an embed
	 */
	async save(guild: Guild, name: string, data: APIEmbed): Promise<void> {
		await this.entityService.ensureGuild(guild);
		await this.customEmbedRepository.upsert(guild, name, data);
	}

	/**
	 * Delete an embed
	 */
	async delete(guild: Guild, name: string): Promise<void> {
		await this.customEmbedRepository.delete(guild, name);
	}

	/**
	 * List all embeds
	 */
	async list(guild: Guild): Promise<string[]> {
		return this.customEmbedRepository.listNames(guild);
	}

	/**
	 * Render an embed with context
	 */
	async render(
		guild: Guild,
		name: string,
		context: Record<string, unknown>,
	): Promise<EmbedBuilder | null> {
		const data = await this.get(guild, name);
		if (!data) return null;

		const template = new MessageTemplate("");
		// Inject context
		for (const [key, value] of Object.entries(context)) {
			template.addContext(key, value);
		}

		// Resolve all strings in the object
		const resolvedData = template.resolveObject(data);

		return new EmbedBuilder(resolvedData);
	}

	// --- Editor Session Management (Redis) ---

	async getEditorSession(sessionId: string): Promise<{
		guildId: string;
		name: string;
		data: APIEmbed;
		userId?: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		meta?: Record<string, any>;
	} | null> {
		const redis = this.redis.client;
		const key = `embed:editor:${sessionId}`;
		const data = await redis.get(key);
		return data ? JSON.parse(data) : null;
	}

	async setEditorSession(
		sessionId: string,
		guild: Guild,
		name: string,
		data: APIEmbed,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		meta?: Record<string, any>,
		user?: User,
	): Promise<void> {
		const redis = this.redis.client;
		const key = `embed:editor:${sessionId}`;
		await redis.set(
			key,
			JSON.stringify({
				guildId: guild.id,
				name,
				data,
				meta,
				userId: user?.id,
			}),
			"EX",
			EDITOR_TTL,
		);
	}

	async clearEditorSession(sessionId: string): Promise<void> {
		const redis = this.redis.client;
		const key = `embed:editor:${sessionId}`;
		await redis.del(key);
	}
}
