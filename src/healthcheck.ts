try {
	const response = await fetch("http://localhost:3000/health");
	const text = await response.text();

	if (response.status === 200 && text === "OK") {
		process.exit(0);
	} else {
		console.error(`Healthcheck failed with status ${response.status}: ${text}`);
		process.exit(1);
	}
} catch (error) {
	console.error("Healthcheck failed to connect to the bot server:", error);
	process.exit(1);
}
