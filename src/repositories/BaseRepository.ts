import { Injectable } from "@decorators/Injectable";
import { PrismaService } from "@services/PrismaService";

@Injectable()
export class BaseRepository {
	constructor(protected readonly prisma: PrismaService) {}
}
