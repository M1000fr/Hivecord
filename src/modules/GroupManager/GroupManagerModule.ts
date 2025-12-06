import { Module } from "@decorators/Module";
import GroupCommand from "./commands/group/index";
import { GroupPermissionInteractions } from "./interactions/GroupPermissionInteractions";

@Module({
	name: "GroupManager",
	commands: [GroupCommand],
	events: [],
	interactions: [GroupPermissionInteractions],
})
export class GroupManagerModule {}
