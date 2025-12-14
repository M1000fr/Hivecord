import { Module } from "@decorators/Module";
import { TicketConfig } from "./TicketConfig";
import { TicketCommand } from "./commands/TicketCommand";
import { TicketInteractions } from "./interactions/TicketInteractions";
import "./services/TicketService";

@Module({
	name: "Ticket",
	config: TicketConfig,
	commands: [TicketCommand],
	interactions: [TicketInteractions],
})
export class TicketModule {}
