import { BaseModalConfigHandler } from "@class/BaseModalConfigHandler";
import { ConfigType } from "@decorators/ConfigType";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { ConfigHelper } from "@utils/ConfigHelper";
import { TextInputStyle } from "discord.js";

@ConfigType({
	id: "test_string",
	name: "Test String",
})
export class StringConfigHandler extends BaseModalConfigHandler {
	constructor(configHelper: ConfigHelper, configService: ConfigService) {
		super(configHelper, configService);
	}

	get customIdPrefix(): string {
		return "test_string";
	}

	protected override getTextInputStyle(): TextInputStyle {
		return TextInputStyle.Short;
	}
}
