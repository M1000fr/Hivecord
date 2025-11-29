import { Module } from "@decorators/Module";
import DebugCommand from "./commands/debug/index";

@Module({
	name: "Debug",
	commands: [DebugCommand],
	events: [],
})
export class DebugModule {}
