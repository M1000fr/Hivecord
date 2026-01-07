import { BaseModalConfigHandler } from "@class/BaseModalConfigHandler";
import { ConfigType } from "@decorators/ConfigType";
import { TextInputStyle } from "discord.js";

@ConfigType({
	id: "test_string",
	name: "Test String",
})
export class StringConfigHandler extends BaseModalConfigHandler {
	get customIdPrefix(): string {
		return "test_string";
	}

	protected override getTextInputStyle(): TextInputStyle {
		return TextInputStyle.Short;
	}
}
