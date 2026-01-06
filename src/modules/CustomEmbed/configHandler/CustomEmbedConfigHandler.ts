import { BaseSelectConfigHandler } from "@class/BaseSelectConfigHandler";
import { ConfigType } from "@decorators/ConfigType";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { CustomEmbedRepository } from "@src/repositories";
import { ConfigUIBuilderService } from "@utils/ConfigUIBuilderService";
import { ConfigValueResolverService } from "@utils/ConfigValueResolverService";
import { ConfigValueService } from "@utils/ConfigValueService";
import { type Guild } from "discord.js";
import { CUSTOM_EMBED_CONFIG_KEY } from "../CustomEmbedConfigKey";

@ConfigType({
	id: CUSTOM_EMBED_CONFIG_KEY,
	name: "Custom Embed",
})
export class CustomEmbedConfigHandler extends BaseSelectConfigHandler {
	constructor(
		valueService: ConfigValueService,
		uiBuilder: ConfigUIBuilderService,
		resolverService: ConfigValueResolverService,
		configService: ConfigService,
		private readonly customEmbedRepository: CustomEmbedRepository,
	) {
		super(valueService, uiBuilder, resolverService, configService);
	}

	get customIdPrefix() {
		return "module_config_custom_embed";
	}

	async getOptions(guild: Guild) {
		const names = await this.customEmbedRepository.listNames(guild);
		return names.map((name) => ({ label: name, value: name }));
	}
}
