import { Module } from "@decorators/Module";
import GroupCommand from "./commands/group/index";
import { GroupPermissionInteractions } from "./interactions/GroupPermissionInteractions";
import { GroupService } from "./services/GroupService";

@Module({
	name: "GroupManager",
	commands: [GroupCommand],
	events: [],
	interactions: [GroupPermissionInteractions],
	providers: [GroupService],
	exports: [GroupService],
})
export class GroupManagerModule {}
