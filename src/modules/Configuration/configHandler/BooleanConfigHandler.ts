import { BaseToggleConfigHandler } from "@class/BaseToggleConfigHandler";
import { ConfigType } from "@decorators/ConfigType";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { ConfigUIBuilderService } from "@utils/ConfigUIBuilderService";
import { ConfigValueResolverService } from "@utils/ConfigValueResolverService";
import { ConfigValueService } from "@utils/ConfigValueService";

@ConfigType({
	id: "test_toggle",
	name: "Test Toggle",
})
export class BooleanConfigHandler extends BaseToggleConfigHandler {
	constructor(
		valueService: ConfigValueService,
		uiBuilder: ConfigUIBuilderService,
		resolverService: ConfigValueResolverService,
		configService: ConfigService,
	) {
		super(valueService, uiBuilder, resolverService, configService);
	}

	get customIdPrefix(): string {
		return "test_toggle";
	}
}
