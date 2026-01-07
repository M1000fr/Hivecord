import { BaseModalConfigHandler } from "@class/BaseModalConfigHandler";
import { ConfigType } from "@decorators/ConfigType";
import type { ConfigService } from "@modules/Configuration/services/ConfigService";
import type { ConfigUIBuilderService } from "@utils/ConfigUIBuilderService";
import type { ConfigValueResolverService } from "@utils/ConfigValueResolverService";
import type { ConfigValueService } from "@utils/ConfigValueService";
import { TextInputStyle } from "discord.js";

@ConfigType({
	id: "test_string",
	name: "Test String",
})
export class StringConfigHandler extends BaseModalConfigHandler {
	constructor(
		valueService: ConfigValueService,
		uiBuilder: ConfigUIBuilderService,
		resolverService: ConfigValueResolverService,
		configService: ConfigService,
	) {
		super(valueService, uiBuilder, resolverService, configService);
	}

	get customIdPrefix(): string {
		return "test_string";
	}

	protected override getTextInputStyle(): TextInputStyle {
		return TextInputStyle.Short;
	}
}
