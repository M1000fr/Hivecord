import { Injectable } from "@decorators/Injectable";
import { EConfigType, type ConfigPropertyOptions } from "@decorators/ConfigProperty";
import { ConfigValueService } from "./ConfigValueService";
import { ConfigFormatterService } from "./ConfigFormatterService";
import { ConfigValueResolverService } from "./ConfigValueResolverService";
import { ConfigUIBuilderService } from "./ConfigUIBuilderService";
import { Guild, User } from "discord.js";
import type { TFunction } from "i18next";
import { CustomIdHelper } from "./CustomIdHelper";

/**
 * @deprecated Use ConfigValueService, ConfigFormatterService, ConfigValueResolverService,
 * or ConfigUIBuilderService instead. This class is being decomposed for better SoC.
 */
@Injectable()
export class ConfigHelper {
	constructor(
		private readonly valueService: ConfigValueService,
		private readonly formatterService: ConfigFormatterService,
		private readonly resolverService: ConfigValueResolverService,
		private readonly uiBuilder: ConfigUIBuilderService,
	) {}

	static toSnakeCase(str: string): string {
		return ConfigValueService.toSnakeCase(str);
	}

	static truncate(str: string, maxLength: number): string {
		return ConfigFormatterService.truncate(str, maxLength);
	}

	static getTypeName(type: EConfigType | string, t: TFunction): string {
		return ConfigFormatterService.getTypeName(type, t);
	}

	static async formatValue(
		value: string | string[],
		type: EConfigType | string,
		t: TFunction,
		options?: ConfigPropertyOptions,
		locale?: string,
		guildId?: string,
	): Promise<string> {
		return ConfigFormatterService.formatValue(
			value,
			type,
			t,
			options,
			locale,
			guildId,
		);
	}

	async fetchValue(
		guild: Guild,
		key: string,
		type: EConfigType | string,
	): Promise<string | string[] | null> {
		return this.valueService.fetchValue(guild, key, type);
	}

	async saveValue(
		guild: Guild,
		key: string,
		value: string | string[],
		type: EConfigType | string,
	): Promise<void> {
		return this.valueService.saveValue(guild, key, value, type);
	}

	async deleteValue(
		guild: Guild,
		key: string,
		type: EConfigType | string,
	): Promise<void> {
		return this.valueService.deleteValue(guild, key, type);
	}

	static buildCustomId(parts: string[]): string {
		return CustomIdHelper.build(parts);
	}

	static parseCustomId(customId: string): string[] {
		return CustomIdHelper.parse(customId);
	}

	async getCurrentValue(
		guild: Guild,
		key: string,
		type: EConfigType | string,
		t: TFunction,
		options?: ConfigPropertyOptions,
		locale?: string,
		defaultValue?: unknown,
	): Promise<string> {
		return this.resolverService.getCurrentValue(
			guild,
			key,
			type,
			t,
			options,
			locale,
			defaultValue,
		);
	}

	async buildModuleConfigEmbed(
		_client: unknown,
		guild: Guild,
		moduleName: string,
		user: User,
		t: TFunction,
		locale: string,
	) {
		return this.uiBuilder.buildModuleConfigEmbed(
			guild,
			moduleName,
			user,
			t,
			locale,
		);
	}
}
