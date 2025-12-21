export function EventController() {
	return function (_target: unknown) {
		// This decorator is currently a marker for event controller classes.
		// It can be extended in the future to handle registration or dependency injection.
	};
}
