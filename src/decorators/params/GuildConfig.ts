import {
	CommandParamType,
	registerCommandParameter,
} from "@decorators/params/index";
import { DependencyContainer } from "@di/DependencyContainer";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { Guild } from "discord.js";
import "reflect-metadata";

const GUILD_CONFIG_METADATA_KEY = "lebot:param:guild-config";

/**
 * Extract guild from context (supports various context types)
 */
export function extractGuildFromContext(context: unknown): Guild | null {
	if (!context) return null;

	// Helper to check if an object is a Guild
	const isGuild = (obj: unknown): obj is Guild =>
		obj !== null && typeof obj === "object" && "id" in obj && !("guild" in obj);

	// Direct Guild object
	if (isGuild(context)) return context;

	// If context is an object with a guild property (Interaction, etc)
	if (typeof context === "object") {
		const obj = context as any;
		if (isGuild(obj.guild)) return obj.guild;
	}

	// Handle array context (event context)
	if (Array.isArray(context)) {
		const first = context[0];
		if (!first) return null;

		// The first argument is a Guild
		if (isGuild(first)) return first;

		// Check common patterns
		if (typeof first === "object" && first !== null) {
			const obj = first as any;

			// Direct guild property (Member, Channel, Message, Interaction)
			if (isGuild(obj.guild)) return obj.guild;

			// member.guild pattern (some specific events)
			if (obj.member && isGuild(obj.member.guild)) {
				return obj.member.guild;
			}
		}
	}

	return null;
}

/**
 * Decorator to inject a guild configuration value.
 * Automatically resolves the config from ConfigService based on guild ID from context.
 *
 * @param configKey - The configuration key (e.g., GeneralConfig.WelcomeChannelId)
 *
 * @example
 * ```typescript
 * @On(BotEvents.GuildMemberAdd)
 * async run(
 *   @Context() [member]: ContextOf<typeof BotEvents.GuildMemberAdd>,
 *   @GuildConfig(GeneralConfig.WelcomeChannelId) welcomeChannelId: string | undefined,
 * ) {
 * }
 * ```
 */
export function GuildConfig(configKey: unknown): ParameterDecorator {
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

		// Store the configKey object itself for resolution
		Reflect.defineMetadata(
			GUILD_CONFIG_METADATA_KEY,
			configKey,
			target,
			`${String(methodKey)}_${parameterIndex}`,
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
	const configKey = Reflect.getMetadata(
		GUILD_CONFIG_METADATA_KEY,
		target,
		`${String(methodKey)}_${parameterIndex}`,
	);

	if (!configKey || !configKey.__isConfigKey) {
		console.warn(
			`Invalid GuildConfig metadata for parameter ${parameterIndex} of ${String(methodKey)}. Make sure to use a property initialized with configKey().`,
		);
		return undefined;
	}

	const guild = extractGuildFromContext(context);
	if (!guild) {
		console.warn(
			`Could not extract guild from context for @GuildConfig in ${String(methodKey)}`,
		);
		return undefined;
	}

	const container = DependencyContainer.getInstance();
	const configService = container.resolve(ConfigService);

	const config = configService.of(guild, configKey.configClass);
	const value = await (config as Record<string, unknown>)[
		configKey.propertyKey
	];

	// If value is null/undefined, use the default from configKey
	if (value === null || value === undefined) {
		return configKey.defaultValue;
	}

	return value;
}
