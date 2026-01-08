import { watch } from "node:fs";
import path from "node:path";
import { HivecordClient } from "@class/HivecordClient";
import { Injectable } from "@decorators/Injectable";
import { Logger } from "@utils/Logger";
import { ModuleLoader } from "./ModuleLoader";

@Injectable({ scope: "global" })
export class HotReloadService {
	private logger = new Logger("HotReload");
	private isWatching = false;

	constructor(private readonly moduleLoader: ModuleLoader) {}

	/**
	 * Initializes the hot-reload service.
	 * It watches for changes in the src/modules directory and reloads the corresponding module
	 * or provider without restarting the entire application.
	 */
	public init(client: HivecordClient) {
		// Check for --watch flag in process arguments.
		const isWatchMode = process.argv.includes("--watch");

		if (!isWatchMode) return;
		if (this.isWatching) return;

		this.isWatching = true;
		this.logger.log(
			"Hot-reload service active. Monitoring modules for changes...",
		);

		const modulesPath = path.join(process.cwd(), "src", "modules");

		// Debounce mechanism to avoid multiple reloads for a single file save
		let timeout: Timer | null = null;
		const changedFiles = new Map<string, string>(); // filePath -> moduleName

		watch(modulesPath, { recursive: true }, (event, filename) => {
			if (!filename || !filename.endsWith(".ts")) return;

			const absolutePath = path.join(modulesPath, filename);
			const relativePath = filename.replace(/\\/g, "/");
			const parts = relativePath.split("/");
			const moduleName = parts[0];

			// Skip core modules and non-module files to prevent unstable states
			if (
				!moduleName ||
				moduleName === "Shared" ||
				moduleName === "Database" ||
				moduleName === "Configuration" ||
				moduleName.endsWith(".ts") // Skip files directly in src/modules
			) {
				return;
			}

			changedFiles.set(absolutePath, moduleName);

			if (timeout) clearTimeout(timeout);
			timeout = setTimeout(async () => {
				for (const [filePath, modName] of changedFiles.entries()) {
					await this.moduleLoader.reloadProvider(
						client,
						modName,
						filePath,
					);
				}
				changedFiles.clear();
			}, 100);
		});
	}
}
