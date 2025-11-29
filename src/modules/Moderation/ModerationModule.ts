import { Module } from '@decorators/Module';
import { ModerationConfig } from "./ModerationConfig";
import BanCommand from "./commands/ban/index";
import UnbanCommand from "./commands/unban/index";
import TempmuteCommand from "./commands/tempmute/index";
import UnmuteCommand from "./commands/unmute/index";
import SanctionsCommand from "./commands/sanctions/index";
import PurgeCommand from "./commands/purge/index";
import ClearCommand from "./commands/clear/index";
import WarnCommand from "./commands/warn/index";
import UnwarnCommand from "./commands/unwarn/index";
import LockCommand from "./commands/lock/index";
import UnlockCommand from "./commands/unlock/index";

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
        UnlockCommand
    ],
    events: [],
    config: ModerationConfig
})
export class ModerationModule {}
