import { Module } from "@decorators/Module";
import GroupCommand from "./commands/group/index";

@Module({
	name: "GroupManager",
	commands: [GroupCommand],
	events: [],
	interactions: [],
})
export class GroupManagerModule {}
