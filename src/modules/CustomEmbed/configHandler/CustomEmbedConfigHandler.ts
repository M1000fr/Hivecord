import { BaseSelectConfigHandler } from "@class/BaseSelectConfigHandler";
import { ConfigType } from "@decorators/ConfigType";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { CustomEmbedRepository } from "@src/repositories";
import { ConfigHelper } from "@utils/ConfigHelper";
import { type Guild } from "discord.js";
import { CUSTOM_EMBED_CONFIG_KEY } from "../CustomEmbedConfigKey";

@ConfigType({
	id: CUSTOM_EMBED_CONFIG_KEY,
	name: "Custom Embed",
})
export class CustomEmbedConfigHandler extends BaseSelectConfigHandler {
	constructor(
		configHelper: ConfigHelper,
		configService: ConfigService,
		private readonly customEmbedRepository: CustomEmbedRepository,
	) {
		super(configHelper, configService);
	}

	get customIdPrefix() {
		return "module_config_custom_embed";
	}

	async getOptions(guild: Guild) {
		const names = await this.customEmbedRepository.listNames(guild);
		return names.map((name) => ({ label: name, value: name }));
	}
}
