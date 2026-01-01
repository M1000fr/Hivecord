export class CustomIdHelper {
	static build(parts: string[]): string {
		return parts.join(":");
	}

	static parse(customId: string): string[] {
		return customId.split(":");
	}
}
