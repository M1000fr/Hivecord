import { Injectable } from "@decorators/Injectable";
import { PrismaService } from "@modules/Core/services/PrismaService";

@Injectable()
export class BaseRepository {
	constructor(protected readonly prisma: PrismaService) {}
}
