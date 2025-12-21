import { ConfigService } from "@services/ConfigService";
import { Injectable } from "@src/decorators/Injectable";
import { Logger } from "@utils/Logger";
import { DiscordAPIError, type GuildMember } from "discord.js";
import { GeneralConfig } from "../GeneralConfig";

@Injectable()
export class WelcomeRoleService {
	private readonly logger = new Logger("WelcomeRoleService");
	private queue: GuildMember[] = [];
	private isProcessing = false;
	private readonly BATCH_SIZE = 5;
	private readonly DELAY_BETWEEN_BATCHES = 1000;

	constructor(private readonly configService: ConfigService) {}

	async queueWelcomeRoleAdd(member: GuildMember) {
		this.queue.push(member);
		if (!this.isProcessing) {
			this.processQueue();
		}
	}

	private async processQueue() {
		if (this.isProcessing) return;
		this.isProcessing = true;

		while (this.queue.length > 0) {
			const batch = this.queue.splice(0, this.BATCH_SIZE);
			await Promise.all(
				batch.map((member) => this.addWelcomeRoles(member)),
			);
			await new Promise((resolve) =>
				setTimeout(resolve, this.DELAY_BETWEEN_BATCHES),
			);
		}

		this.isProcessing = false;
	}

	async addWelcomeRoles(member: GuildMember) {
		try {
			const roleIds = await this.configService.of(
				member.guild.id,
				GeneralConfig,
			).generalWelcomeRoles;
			if (!roleIds || roleIds.length === 0) return;

			const rolesToAdd = roleIds.filter(
				(roleId: string) => !member.roles.cache.has(roleId),
			);
			if (rolesToAdd.length === 0) return;

			await member.roles.add(rolesToAdd, "Welcome roles");
			this.logger.log(
				`Added welcome roles to ${member.user.tag} in ${member.guild.name}: ${rolesToAdd.join(", ")}`,
			);
		} catch (error) {
			// Ignore if member left or other common errors to avoid spamming logs
			if (
				error instanceof DiscordAPIError &&
				(error.code === 10007 || error.code === 50013)
			)
				return;

			this.logger.error(
				`Failed to add welcome roles to ${member.user.tag}:`,
				error instanceof Error ? error.message : String(error),
			);
		}
	}
}
