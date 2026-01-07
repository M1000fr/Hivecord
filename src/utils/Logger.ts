export class Logger {
	private context?: string;

	constructor(context?: string) {
		this.context = context;
	}

	public log(message: unknown, context?: string) {
		this.printMessage("log", message, context);
	}

	public error(message: unknown, trace?: string, context?: string) {
		this.printMessage("error", message, context, trace);
	}

	public warn(message: unknown, context?: string) {
		this.printMessage("warn", message, context);
	}

	public debug(message: unknown, context?: string) {
		this.printMessage("debug", message, context);
	}

	public verbose(message: unknown, context?: string) {
		this.printMessage("verbose", message, context);
	}

	private printMessage(
		level: "log" | "error" | "warn" | "debug" | "verbose",
		message: unknown,
		context?: string,
		trace?: string,
	) {
		if (level === "debug" || level === "verbose") {
			const isDebugEnabled =
				process.env.DEBUG === "true" ||
				process.env.NODE_ENV === "development";
			if (!isDebugEnabled) return;
		}

		const timestamp = new Date().toLocaleString();
		const ctx = context || this.context || "Application";
		const pid = process.pid;

		const color = this.getColor(level);
		const reset = "\x1b[0m";
		const green = "\x1b[32m";
		const yellow = "\x1b[33m";

		let formattedMessage: string;
		if (message instanceof Error) {
			formattedMessage = `${message.message}\n${message.stack}`;
		} else if (typeof message === "object" && message !== null) {
			formattedMessage = JSON.stringify(message, null, 2);
		} else {
			formattedMessage = String(message);
		}

		const output = `${green}[Hivecord] ${pid}  -${reset} ${timestamp}   ${color}${level.toUpperCase()}${reset} ${yellow}[${ctx}]${reset} ${color}${formattedMessage}${reset}`;

		console.log(output);
		if (trace) {
			console.error(trace);
		}
	}

	private getColor(level: string): string {
		switch (level) {
			case "log":
				return "\x1b[32m"; // Green
			case "error":
				return "\x1b[31m"; // Red
			case "warn":
				return "\x1b[33m"; // Yellow
			case "debug":
				return "\x1b[35m"; // Magenta
			case "verbose":
				return "\x1b[36m"; // Cyan
			default:
				return "\x1b[32m";
		}
	}
}
