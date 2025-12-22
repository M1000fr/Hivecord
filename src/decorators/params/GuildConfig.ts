import { DependencyContainer } from "@di/DependencyContainer";
import type { ConfigService } from "@modules/Configuration/services/ConfigService";
import type { Constructor } from "@di/types";
import {
	registerCommandParameter,
	CommandParamType,
} from "@decorators/params/index";
import "reflect-metadata";

const GUILD_CONFIG_METADATA_KEY = "lebot:param:guild-config";

export interface ConfigKeyDefinition<T = unknown> {
	key: string;
	hasDefault: boolean;
	__type?: T;
}

interface GuildConfigMetadata {
	configClass: Constructor;
	propertyKey: string;
	hasDefault: boolean;
}

/**
 * Store metadata about the config to retrieve
 */
function setGuildConfigMetadata(
	target: object,
	methodKey: string | symbol | undefined,
	parameterIndex: number,
	configClass: Constructor,
	propertyKey: string,
	hasDefault: boolean,
): void {
	const metadata: GuildConfigMetadata = {
		configClass,
		propertyKey,
		hasDefault,
	};
	Reflect.defineMetadata(
		GUILD_CONFIG_METADATA_KEY,
		metadata,
		target,
		`${String(methodKey)}_${parameterIndex}`,
	);
}

/**
 * Get metadata about the config to retrieve
 */
export function getGuildConfigMetadata(
	target: object,
	methodKey: string | symbol,
	parameterIndex: number,
): GuildConfigMetadata | undefined {
	return Reflect.getMetadata(
		GUILD_CONFIG_METADATA_KEY,
		target,
		`${String(methodKey)}_${parameterIndex}`,
	);
}

/**
 * Extract guild ID from context (supports various context types)
 */
export function extractGuildIdFromContext(context: unknown): string | null {
	if (!context) return null;

	// Handle array context (event context)
	if (Array.isArray(context)) {
		const first = context[0];
		if (!first) return null;

		// Check common patterns
		if (typeof first === "object" && first !== null) {
			const obj = first as Record<string, unknown>;
			
			// Direct guildId property (interactions)
			if (typeof obj.guildId === "string") return obj.guildId;
			
			// member.guild.id pattern
			if (
				obj.member &&
				typeof obj.member === "object" &&
				"guild" in obj.member
			) {
				const member = obj.member as Record<string, unknown>;
				if (
					member.guild &&
					typeof member.guild === "object" &&
					"id" in member.guild
				) {
					const guild = member.guild as Record<string, unknown>;
					if (typeof guild.id === "string") return guild.id;
				}
			}
			
			// guild.id pattern
			if (obj.guild && typeof obj.guild === "object" && "id" in obj.guild) {
				const guild = obj.guild as Record<string, unknown>;
				if (typeof guild.id === "string") return guild.id;
			}
		}
	}

	return null;
}

/**
 * Decorator to inject a guild configuration value.
 * Automatically resolves the config from ConfigService based on guild ID from context.
 *
 * @param configClass - The configuration class (e.g., GeneralConfig)
 * @param configKeyDef - The configuration key definition from the config's key file
 *
 * @example
 * ```typescript
 * import { GeneralConfigKey } from "@modules/General/GeneralConfigKey";
 *
 * @On(BotEvents.GuildMemberAdd)
 * async run(
 *   @Context() [member]: ContextOf<typeof BotEvents.GuildMemberAdd>,
 *   @GuildConfig(GeneralConfig, GeneralConfigKey.WelcomeChannelId) welcomeChannelId: string | undefined,
 *   @GuildConfig(GeneralConfig, GeneralConfigKey.Language) language: string, // No `?` because hasDefault = true
 * ) {
 *   // welcomeChannelId is string | undefined (no default)
 *   // language is string (has default value)
 * }
 * ```
 */
export function GuildConfig<T extends object, K extends ConfigKeyDefinition>(
	configClass: Constructor<T>,
	configKeyDef: K,
): ParameterDecorator {
	return (
		target: object,
		methodKey: string | symbol | undefined,
		parameterIndex: number,
	) => {
		// Register as a custom parameter type
		registerCommandParameter(
			target,
			methodKey,
			parameterIndex,
			CommandParamType.GuildConfig,
		);

		// Store additional metadata for resolution
		setGuildConfigMetadata(
			target,
			methodKey,
			parameterIndex,
			configClass,
			configKeyDef.key,
			configKeyDef.hasDefault,
		);
	};
}

/**
 * Resolve the guild config value for a parameter.
 * Called by the parameter resolution system.
 */
export async function resolveGuildConfig(
	target: object,
	methodKey: string | symbol,
	parameterIndex: number,
	context: unknown,
): Promise<unknown> {
	const metadata = getGuildConfigMetadata(target, methodKey, parameterIndex);
	if (!metadata) {
		throw new Error(
			`No GuildConfig metadata found for parameter ${parameterIndex} of ${String(methodKey)}`,
		);
	}

	const guildId = extractGuildIdFromContext(context);
	if (!guildId) {
		console.warn(
			`Could not extract guild ID from context for @GuildConfig in ${String(methodKey)}`,
		);
		return undefined;
	}

	const container = DependencyContainer.getInstance();
	const configService = container.resolve("ConfigService") as ConfigService;

	const config = configService.of(guildId, metadata.configClass);
	// @ts-expect-error - Dynamic property access
	return await config[metadata.propertyKey];
}
