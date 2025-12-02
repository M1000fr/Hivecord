import { Module } from "@decorators/Module";
import InvitesCommand from "./commands/InvitesCommand";
import { GuildMemberAdd } from "./events/GuildMemberAdd";
import { GuildMemberRemove } from "./events/GuildMemberRemove";
import { InviteCreate } from "./events/InviteCreate";
import { InviteDelete } from "./events/InviteDelete";
import { Ready } from "./events/Ready";

@Module({
	name: "Invitation",
	events: [
		Ready,
		InviteCreate,
		InviteDelete,
		GuildMemberAdd,
		GuildMemberRemove,
	],
	commands: [InvitesCommand],
})
export class InvitationModule {}
