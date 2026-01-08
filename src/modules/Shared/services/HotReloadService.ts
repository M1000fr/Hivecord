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
	 * without restarting the entire application.
	 */
	public init(client: HivecordClient) {
		// Check for --watch flag in process arguments.
		// Note: If 'bun --watch' is used, Bun will restart the process by default.
		// This service is designed to handle reloads programmatically if the process persists.
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

			// If the module file itself changed, we do a full module reload
			if (filename.endsWith(`${moduleName}Module.ts`)) {
				changedFiles.set(absolutePath, `MODULE:${moduleName}`);
			} else {
				changedFiles.set(absolutePath, moduleName);
			}

			if (timeout) clearTimeout(timeout);
			timeout = setTimeout(async () => {
				for (const [filePath, modName] of changedFiles.entries()) {
					if (modName.startsWith("MODULE:")) {
						const name = modName.split(":")[1];
						if (name) await this.reloadModule(client, name);
					} else {
						await this.moduleLoader.reloadProvider(
							client,
							modName,
							filePath,
						);
					}
				}
				changedFiles.clear();
			}, 100);
		});
	}

	/**
	 * Reloads a specific module by re-importing its main class and updating the container.
	 */
	private async reloadModule(client: HivecordClient, moduleName: string) {
		this.logger.log(
			`Change detected in module configuration: ${moduleName}. Reloading entire module...`,
		);

		try {
			const modulesPath = path.join(process.cwd(), "src", "modules");
			const moduleFilePath = path.join(
				modulesPath,
				moduleName,
				`${moduleName}Module.ts`,
			);

			// Use a cache buster (timestamp) to bypass Bun's module cache.
			// This ensures the new code and its decorators are re-evaluated.
			const moduleUrl = `file://${moduleFilePath.replace(/\\/g, "/")}?update=${Date.now()}`;
			const imported = await import(moduleUrl);

			// The module class is expected to be exported as [ModuleName]Module (e.g., GeneralModule)
			const ModuleClass = imported[`${moduleName}Module`];

			if (!ModuleClass) {
				this.logger.error(
					`Could not find class "${moduleName}Module" in ${moduleFilePath}`,
				);
				return;
			}

			// Perform the actual swap of events and commands
			await this.moduleLoader.reloadModule(client, ModuleClass);
			this.logger.log(`Module ${moduleName} reloaded successfully.`);
		} catch (error) {
			this.logger.error(
				`Failed to hot-reload module ${moduleName}:`,
				error instanceof Error ? error.message : String(error),
			);
		}
	}
}
