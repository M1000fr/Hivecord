async function healthCheck() {
	try {
		const response = await fetch("http://localhost:3000/health");
		if (response.status === 200) {
			process.exit(0);
		} else {
			process.exit(1);
		}
	} catch (error) {
		process.exit(1);
	}
}

healthCheck();
