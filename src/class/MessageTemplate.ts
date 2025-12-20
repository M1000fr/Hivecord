import { I18nService } from "@services/I18nService";

export class MessageTemplate {
	private template: string;
	private context: Record<string, unknown> = {};
	private locale: string = "en";

	constructor(template: string, locale: string = "en") {
		this.template = template;
		this.locale = locale;
	}

	/**
	 * Add a context variable to the template
	 * @param key The key to access the variable (e.g. 'user')
	 * @param value The value or object
	 */
	public addContext(key: string, value: unknown): this {
		this.context[key] = value;
		return this;
	}

	/**
	 * Resolve the template with the current context
	 * Replaces {key.path} with the value from context
	 */
	public resolve(): string {
		return this.replace(this.template);
	}

	/**
	 * Resolve an object or array recursively
	 */
	public resolveObject<T>(obj: T): T {
		if (typeof obj === "string") {
			return this.replace(obj) as unknown as T;
		}
		if (Array.isArray(obj)) {
			return obj.map((item) => this.resolveObject(item)) as unknown as T;
		}
		if (obj !== null && typeof obj === "object") {
			const result: Record<string, unknown> = {};
			for (const key in obj) {
				result[key] = this.resolveObject(
					(obj as Record<string, unknown>)[key],
				);
			}
			return result as unknown as T;
		}
		return obj;
	}

	private replace(text: string): string {
		return text.replace(/\{([a-zA-Z0-9_.]+)\}/g, (match, path) => {
			const value = this.getValue(this.context, path);
			if (value === undefined || value === null)
				return I18nService.t("common.unknown", { lng: this.locale });

			if (typeof value === "object") {
				// Check if it has a custom toString method
				if (
					value.toString &&
					value.toString !== Object.prototype.toString
				) {
					return value.toString();
				}
				// Check for common properties
				if ("mention" in value) return String(value.mention);
				if ("content" in value) return String(value.content);
				if ("name" in value) return String(value.name);
			}

			return String(value);
		});
	}

	private getValue(obj: unknown, path: string): unknown {
		// Security: Forbidden keys to prevent access to sensitive data or internal structures
		const forbiddenKeys = [
			"client",
			"token",
			"constructor",
			"prototype",
			"__proto__",
		];

		return path.split(".").reduce((acc, part) => {
			if (acc === undefined || acc === null) return undefined;

			// Security check
			if (forbiddenKeys.includes(part.toLowerCase())) {
				return undefined;
			}

			const accRecord = acc as Record<string, unknown>;

			// Try exact match first
			if (accRecord[part] !== undefined) {
				return accRecord[part];
			}

			// Try case-insensitive match
			const allKeys = this.getAllPropertyNames(acc);
			const key = allKeys.find(
				(k) => k.toLowerCase() === part.toLowerCase(),
			);

			// Double check resolved key
			if (key && forbiddenKeys.includes(key.toLowerCase())) {
				return undefined;
			}

			return key ? accRecord[key] : undefined;
		}, obj);
	}

	private getAllPropertyNames(obj: unknown): string[] {
		const props = new Set<string>();
		let currentObj = obj;

		// Traverse prototype chain
		while (currentObj && currentObj !== Object.prototype) {
			Object.getOwnPropertyNames(currentObj).forEach((name) =>
				props.add(name),
			);
			currentObj = Object.getPrototypeOf(currentObj);
		}
		return Array.from(props);
	}
}
