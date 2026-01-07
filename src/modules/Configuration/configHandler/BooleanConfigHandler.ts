import { BaseToggleConfigHandler } from "@class/BaseToggleConfigHandler";
import { ConfigType } from "@decorators/ConfigType";

@ConfigType({
	id: "test_toggle",
	name: "Test Toggle",
})
export class BooleanConfigHandler extends BaseToggleConfigHandler {
	get customIdPrefix(): string {
		return "test_toggle";
	}
}
