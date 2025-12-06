export class ConfigRegistry {
	private static defaultValues = new Map<string, any>();

	static register(key: string, defaultValue: any) {
		if (defaultValue !== undefined) {
			this.defaultValues.set(key, defaultValue);
		}
	}

	static getDefault(key: string): any {
		return this.defaultValues.get(key);
	}
}
