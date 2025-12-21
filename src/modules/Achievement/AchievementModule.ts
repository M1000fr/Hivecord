import { LeBotClient } from "@class/LeBotClient";
import { Module } from "@decorators/Module";
import type { IModuleInstance } from "@interfaces/IModuleInstance";
import type { ModuleOptions } from "@interfaces/ModuleOptions";
import { AchievementConfig } from "./AchievementConfig";
import { AchievementCommand } from "./commands/AchievementCommand";
import { StatsUpdatedEvent } from "./events/StatsUpdatedEvent";
import { AchievementService } from "./services/AchievementService";

@Module({
	name: "Achievement",
	config: AchievementConfig,
	events: [StatsUpdatedEvent],
	commands: [AchievementCommand],
	providers: [AchievementService],
	exports: [AchievementService],
})
export class AchievementModule implements IModuleInstance {
	moduleOptions!: ModuleOptions;
	private achievementService = AchievementService.getInstance();

	async setup(client: LeBotClient) {
		// Check rotation every hour
		setInterval(() => this.checkRotation(client), 60 * 60 * 1000);
		// Also check immediately on startup
		this.checkRotation(client);
	}

	async checkRotation(client: LeBotClient) {
		const guilds = client.guilds.cache;
		for (const [guildId] of guilds) {
			await this.achievementService.checkAndRotate(guildId);
		}
	}
}
