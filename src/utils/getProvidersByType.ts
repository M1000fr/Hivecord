import type { Constructor, Provider, ProviderType } from "@di/types";
import { PROVIDER_TYPE_METADATA_KEY } from "@di/types";
import "reflect-metadata";

/**
 * Filter providers by their type metadata.
 * Returns only Constructor providers that match the specified type.
 */
export function getProvidersByType(
	providers: Provider[],
	type: ProviderType,
): Constructor[] {
	return providers.filter((provider): provider is Constructor => {
		if (typeof provider !== "function" || !("prototype" in provider)) {
			return false;
		}

		const providerType = Reflect.getMetadata(
			PROVIDER_TYPE_METADATA_KEY,
			provider,
		);
		return providerType === type;
	});
}

/**
 * Get all providers that don't have a specific type (regular services).
 */
export function getServiceProviders(providers: Provider[]): Provider[] {
	return providers.filter((provider) => {
		if (typeof provider !== "function" || !("prototype" in provider)) {
			// Keep non-constructor providers (ValueProvider, FactoryProvider, etc.)
			return true;
		}

		const providerType = Reflect.getMetadata(
			PROVIDER_TYPE_METADATA_KEY,
			provider,
		);
		// Keep providers without type metadata or with 'service' type
		return !providerType || providerType === "service";
	});
}
