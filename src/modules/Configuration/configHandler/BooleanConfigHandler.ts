import { BaseToggleConfigHandler } from "@class/BaseToggleConfigHandler";
import { ConfigType } from "@decorators/ConfigType";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { ConfigHelper } from "@utils/ConfigHelper";

@ConfigType({
	id: "test_toggle",
	name: "Test Toggle",
})
export class BooleanConfigHandler extends BaseToggleConfigHandler {
	constructor(configHelper: ConfigHelper, configService: ConfigService) {
		super(configHelper, configService);
	}

	get customIdPrefix(): string {
		return "test_toggle";
	}
}
