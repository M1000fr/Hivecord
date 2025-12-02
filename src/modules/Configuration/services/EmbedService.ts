import { prismaClient } from "@services/prismaService";
import { EmbedBuilder, type APIEmbed } from "discord.js";
import { MessageTemplate } from "@class/MessageTemplate";
import { RedisService } from "@services/RedisService";

const EDITOR_TTL = 3600; // 1 hour

export class EmbedService {
	/**
	 * Get a raw embed JSON by name
	 */
	static async get(name: string): Promise<APIEmbed | null> {
		const embed = await prismaClient.customEmbed.findUnique({
			where: { name },
		});
		if (!embed) return null;
		return JSON.parse(embed.data);
	}

	/**
	 * Save an embed
	 */
	static async save(name: string, data: APIEmbed): Promise<void> {
		await prismaClient.customEmbed.upsert({
			where: { name },
			update: { data: JSON.stringify(data) },
			create: { name, data: JSON.stringify(data) },
		});
	}

	/**
	 * Delete an embed
	 */
	static async delete(name: string): Promise<void> {
		await prismaClient.customEmbed.delete({
			where: { name },
		});
	}

	/**
	 * List all embeds
	 */
	static async list(): Promise<string[]> {
		const embeds = await prismaClient.customEmbed.findMany({
			select: { name: true },
		});
		return embeds.map((e) => e.name);
	}

	/**
	 * Render an embed with context
	 */
	static async render(
		name: string,
		context: Record<string, any>,
	): Promise<EmbedBuilder | null> {
		const data = await this.get(name);
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

	static async getEditorSession(
		sessionId: string,
	): Promise<{ name: string; data: APIEmbed; userId?: string; meta?: any } | null> {
		const redis = RedisService.getInstance();
		const key = `embed:editor:${sessionId}`;
		const data = await redis.get(key);
		return data ? JSON.parse(data) : null;
	}

	static async setEditorSession(
		sessionId: string,
		name: string,
		data: APIEmbed,
		meta?: any,
		userId?: string,
	): Promise<void> {
		const redis = RedisService.getInstance();
		const key = `embed:editor:${sessionId}`;
		await redis.set(
			key,
			JSON.stringify({ name, data, meta, userId }),
			"EX",
			EDITOR_TTL,
		);
	}

	static async clearEditorSession(sessionId: string): Promise<void> {
		const redis = RedisService.getInstance();
		const key = `embed:editor:${sessionId}`;
		await redis.del(key);
	}
}
