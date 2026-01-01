import { ConfigType } from "@decorators/ConfigType";
import { SelectMenu } from "@decorators/Interaction";
import { Interaction } from "@decorators/params";
import { BaseSelectConfigHandler } from "@class/BaseSelectConfigHandler";
import { ConfigHelper } from "@utils/ConfigHelper";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { CustomEmbedRepository } from "@src/repositories";
import { type Guild, StringSelectMenuInteraction } from "discord.js";

export const CUSTOM_EMBED_CONFIG_KEY = "CustomEmbed";

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

	@SelectMenu("module_config_custom_embed:*")
	async handleEmbedSelection(
		@Interaction() interaction: StringSelectMenuInteraction,
	) {
		await this.handleSelection(interaction);
	}
}

