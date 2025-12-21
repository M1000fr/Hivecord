import { Module } from "@decorators/Module";
import { ModerationConfig } from "./ModerationConfig";
import BanCommand from "./commands/ban/index";
import ClearCommand from "./commands/clear/index";
import LockCommand from "./commands/lock/index";
import PurgeCommand from "./commands/purge/index";
import SanctionsCommand from "./commands/sanctions/index";
import TempmuteCommand from "./commands/tempmute/index";
import UnbanCommand from "./commands/unban/index";
import UnlockCommand from "./commands/unlock/index";
import UnmuteCommand from "./commands/unmute/index";
import UnwarnCommand from "./commands/unwarn/index";
import WarnCommand from "./commands/warn/index";
import { GuildMemberAddEvent } from "./events/GuildMemberAddEvent";
import { SanctionReasonService } from "./services/SanctionReasonService";
import { SanctionService } from "./services/SanctionService";

@Module({
	name: "Moderation",
	commands: [
		BanCommand,
		UnbanCommand,
		TempmuteCommand,
		UnmuteCommand,
		SanctionsCommand,
		PurgeCommand,
		ClearCommand,
		WarnCommand,
		UnwarnCommand,
		LockCommand,
		UnlockCommand,
	],
	events: [GuildMemberAddEvent],
	config: ModerationConfig,
	providers: [SanctionService, SanctionReasonService],
	exports: [SanctionService, SanctionReasonService],
})
export class ModerationModule {}
