import { Module } from "@decorators/Module";
import { TicketCommand } from "./commands/TicketCommand";
import { TicketInteractions } from "./interactions/TicketInteractions";
import "./services/TicketService";
import { TicketService } from "./services/TicketService";
import { TicketConfig } from "./TicketConfig";

@Module({
	name: "Ticket",
	config: TicketConfig,
	commands: [TicketCommand],
	interactions: [TicketInteractions],
	providers: [TicketService],
	exports: [TicketService],
})
export class TicketModule {}
