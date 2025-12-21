import { MessageTemplate } from "@class/MessageTemplate";
import { EntityService } from "@services/EntityService";
import { prismaClient } from "@services/prismaService";
import { RedisService } from "@services/RedisService";
import { Injectable } from "@src/decorators/Injectable";
import { EmbedBuilder, type APIEmbed } from "discord.js";

const EDITOR_TTL = 3600; // 1 hour

@Injectable()
export class CustomEmbedService {
	constructor(private readonly entityService: EntityService) {}

	/**
	 * Get a raw embed JSON by name
	 */
	async get(guildId: string, name: string): Promise<APIEmbed | null> {
		const embed = await prismaClient.customEmbed.findUnique({
			where: { guildId_name: { guildId, name } },
		});
		if (!embed) return null;
		return JSON.parse(embed.data);
	}

	/**
	 * Save an embed
	 */
	async save(guildId: string, name: string, data: APIEmbed): Promise<void> {
		await this.entityService.ensureGuildById(guildId);
		await prismaClient.customEmbed.upsert({
			where: { guildId_name: { guildId, name } },
			update: { data: JSON.stringify(data) },
			create: { guildId, name, data: JSON.stringify(data) },
		});
	}

	/**
	 * Delete an embed
	 */
	async delete(guildId: string, name: string): Promise<void> {
		await prismaClient.customEmbed.delete({
			where: { guildId_name: { guildId, name } },
		});
	}

	/**
	 * List all embeds
	 */
	async list(guildId: string): Promise<string[]> {
		const embeds = await prismaClient.customEmbed.findMany({
			where: { guildId },
			select: { name: true },
		});
		return embeds.map((e) => e.name);
	}

	/**
	 * Render an embed with context
	 */
	async render(
		guildId: string,
		name: string,
		context: Record<string, unknown>,
	): Promise<EmbedBuilder | null> {
		const data = await this.get(guildId, name);
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
		const redis = RedisService.getInstance();
		const key = `embed:editor:${sessionId}`;
		const data = await redis.get(key);
		return data ? JSON.parse(data) : null;
	}

	async setEditorSession(
		sessionId: string,
		guildId: string,
		name: string,
		data: APIEmbed,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		meta?: Record<string, any>,
		userId?: string,
	): Promise<void> {
		const redis = RedisService.getInstance();
		const key = `embed:editor:${sessionId}`;
		await redis.set(
			key,
			JSON.stringify({ guildId, name, data, meta, userId }),
			"EX",
			EDITOR_TTL,
		);
	}

	async clearEditorSession(sessionId: string): Promise<void> {
		const redis = RedisService.getInstance();
		const key = `embed:editor:${sessionId}`;
		await redis.del(key);
	}
}
