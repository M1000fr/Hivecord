import { Module } from "../../decorators/Module";
import { ModerationConfig } from "./ModerationConfig";
import BanCommand from "./commands/ban/index";
import UnbanCommand from "./commands/unban/index";
import TempmuteCommand from "./commands/tempmute/index";
import UnmuteCommand from "./commands/unmute/index";
import SanctionsCommand from "./commands/sanctions/index";
import PurgeCommand from "./commands/purge/index";
import ClearCommand from "./commands/clear/index";

@Module({
    name: "Moderation",
    commands: [
        BanCommand,
        UnbanCommand,
        TempmuteCommand,
        UnmuteCommand,
        SanctionsCommand,
        PurgeCommand,
        ClearCommand
    ],
    config: ModerationConfig
})
export class ModerationModule {}
