import { BaseRepository, type GuildRelation } from "./BaseRepository";

/**
 * Base repository for entities that support soft-delete.
 * Implements common soft-delete patterns (upsert, delete, etc).
 *
 * @template T The entity type
 */
interface PrismaUpsertDelegate {
	upsert(options: {
		where: Record<string, unknown>;
		update: Record<string, unknown>;
		create: Record<string, unknown>;
	}): Promise<unknown>;
}

export abstract class SoftDeletableRepository<
	T extends { id: string; guild?: GuildRelation; Guild?: GuildRelation },
> extends BaseRepository {
	protected abstract prismaModel: PrismaUpsertDelegate;
	protected abstract entityType: string; // e.g., "role", "channel"

	/**
	 * Create or update entity with optional soft-delete flag
	 */
	protected async softUpsert(
		entity: T,
		additionalUpdateData: Record<string, unknown> = {},
		additionalCreateData: Record<string, unknown> = {},
		deletedAt: Date | null = null,
	) {
		return this.prismaModel.upsert({
			where: { id: entity.id },
			update: {
				...additionalUpdateData,
				deletedAt,
				Guild: this.buildGuildRelation(entity),
			},
			create: {
				id: entity.id,
				...additionalCreateData,
				Guild: this.buildGuildRelation(entity),
				deletedAt,
			},
		});
	}

	/**
	 * Soft-delete an entity (sets deletedAt timestamp)
	 */
	async delete(
		entity: T,
		additionalCreateData: Record<string, unknown> = {},
	) {
		return this.prismaModel.upsert({
			where: { id: entity.id },
			update: { deletedAt: new Date() },
			create: {
				id: entity.id,
				...additionalCreateData,
				Guild: this.buildGuildRelation(entity),
				deletedAt: new Date(),
			},
		});
	}
}
