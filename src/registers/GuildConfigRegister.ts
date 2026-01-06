import { DependencyContainer } from "@di/DependencyContainer";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { I18nService } from "@modules/Core/services/I18nService";
import { Guild } from "discord.js";

/**
 * Register the 'config' property and 'i18n' method on the Discord.js Guild prototype.
 * This allows accessing guild-specific configuration and translations directly from a Guild object.
 */
export class GuildConfigRegister {
	static init() {
		const container = DependencyContainer.getInstance();

		Object.defineProperty(Guild.prototype, "config", {
			get() {
				const configService = container.resolve(ConfigService);
				const modules = container.getRegisteredModules();

				return new Proxy(
					{},
					{
						get: (_, moduleName: string) => {
							const moduleEntry = modules.get(
								moduleName.toLowerCase(),
							);

							if (moduleEntry?.options.config) {
								return configService.of(
									this as unknown as Guild,
									moduleEntry.options.config,
								);
							}
							return undefined;
						},
					},
				);
			},
			configurable: true,
			enumerable: false,
		});

		Guild.prototype.i18n = async function () {
			const configService = container.resolve(ConfigService);
			const locale = await configService.getLanguage(this);
			return {
				locale,
				t: I18nService.getFixedT(locale),
			};
		};
	}
}
