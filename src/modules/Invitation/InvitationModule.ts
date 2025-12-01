import { Module } from "@decorators/Module";
import { Ready } from "./events/Ready";
import { InviteCreate } from "./events/InviteCreate";
import { InviteDelete } from "./events/InviteDelete";
import { GuildMemberAdd } from "./events/GuildMemberAdd";
import { GuildMemberRemove } from "./events/GuildMemberRemove";
import InvitesCommand from "./commands/InvitesCommand";

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
