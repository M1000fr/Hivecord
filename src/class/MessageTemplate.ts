export class MessageTemplate {
	private template: string;
	private context: Record<string, any> = {};

	constructor(template: string) {
		this.template = template;
	}

	/**
	 * Add a context variable to the template
	 * @param key The key to access the variable (e.g. 'user')
	 * @param value The value or object
	 */
	public addContext(key: string, value: any): this {
		this.context[key] = value;
		return this;
	}

	/**
	 * Resolve the template with the current context
	 * Replaces {key.path} with the value from context
	 */
	public resolve(): string {
		return this.template.replace(/\{([a-zA-Z0-9_.]+)\}/g, (match, path) => {
			const value = this.getValue(this.context, path);
			return value !== undefined && value !== null
				? String(value)
				: match;
		});
	}

	private getValue(obj: any, path: string): any {
		return path.split(".").reduce((acc, part) => {
			if (acc === undefined || acc === null) return undefined;

			// Try exact match first
			if (acc[part] !== undefined) {
				return acc[part];
			}

			// Try case-insensitive match
			const allKeys = this.getAllPropertyNames(acc);
			const key = allKeys.find(
				(k) => k.toLowerCase() === part.toLowerCase(),
			);

			return key ? acc[key] : undefined;
		}, obj);
	}

	private getAllPropertyNames(obj: any): string[] {
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
