export class ConfigRegistry {
	private static defaultValues = new Map<string, unknown>();

	static register(key: string, defaultValue: unknown) {
		if (defaultValue !== undefined) {
			this.defaultValues.set(key, defaultValue);
		}
	}

	static getDefault(key: string): unknown {
		return this.defaultValues.get(key);
	}
}
