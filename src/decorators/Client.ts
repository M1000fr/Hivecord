import { LeBotClient } from "@class/LeBotClient";

export function Client(target: object, propertyKey: string) {
	Object.defineProperty(target, propertyKey, {
		get: () => {
			return LeBotClient.getInstance();
		},
		enumerable: true,
		configurable: true,
	});
}
