import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, "../src");
const LOCALES_DIR = path.join(__dirname, "../src/locales");

// Matches single quotes, double quotes, or backticks
const KEY_REGEX =
	/\b(?:t|I18nService\.t|locale|i18n\.t)\s*\(\s*['"`](.*?)['"`]/g;

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dir: string, fileList: string[] = []): string[] {
	if (!fs.existsSync(dir)) return fileList;
	const files = fs.readdirSync(dir);
	for (const file of files) {
		const filePath = path.join(dir, file);
		if (fs.statSync(filePath).isDirectory()) {
			getAllFiles(filePath, fileList);
		} else {
			if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
				fileList.push(filePath);
			}
		}
	}
	return fileList;
}

/**
 * Extract all translation keys used in the source code
 */
function extractKeysFromCode(): Set<string> {
	const files = getAllFiles(SRC_DIR);
	const keys = new Set<string>();

	for (const file of files) {
		const content = fs.readFileSync(file, "utf-8");
		let match;
		const regex = new RegExp(KEY_REGEX);

		while ((match = regex.exec(content)) !== null) {
			if (match[1] && !match[1].includes("${")) {
				keys.add(match[1]);
			}
		}
	}

	return keys;
}

/**
 * Flatten a nested object into a set of dot-notation keys
 */
function flattenKeys(
	obj: Record<string, unknown>,
	prefix = "",
	result: Set<string> = new Set(),
): Set<string> {
	for (const key in obj) {
		const value = obj[key];
		if (
			typeof value === "object" &&
			value !== null &&
			!Array.isArray(value)
		) {
			flattenKeys(
				value as Record<string, unknown>,
				`${prefix}${key}.`,
				result,
			);
		} else {
			result.add(prefix + key);
		}
	}
	return result;
}

/**
 * Recursively remove keys from an object that are not in the usedKeys set
 */
function cleanObject(
	obj: Record<string, any>,
	usedKeys: Set<string>,
	prefix = "",
): { cleaned: Record<string, any>; removedCount: number } {
	const cleaned: Record<string, any> = {};
	let removedCount = 0;

	for (const key in obj) {
		const fullKey = prefix ? `${prefix}.${key}` : key;
		const value = obj[key];

		if (
			typeof value === "object" &&
			value !== null &&
			!Array.isArray(value)
		) {
			// Check if any sub-key of this object is used
			const hasUsedSubKey = Array.from(usedKeys).some(
				(uk) => uk === fullKey || uk.startsWith(`${fullKey}.`),
			);

			if (hasUsedSubKey) {
				const result = cleanObject(value, usedKeys, fullKey);
				if (Object.keys(result.cleaned).length > 0) {
					cleaned[key] = result.cleaned;
				}
				removedCount += result.removedCount;
			} else {
				removedCount++;
			}
		} else {
			if (usedKeys.has(fullKey)) {
				cleaned[key] = value;
			} else {
				removedCount++;
			}
		}
	}

	return { cleaned, removedCount };
}

function getLocaleKeys(localeFile: string): Set<string> {
	const filePath = path.join(LOCALES_DIR, localeFile);
	if (!fs.existsSync(filePath)) return new Set();

	try {
		const content = fs.readFileSync(filePath, "utf-8");
		const json = JSON.parse(content) as Record<string, unknown>;
		return flattenKeys(json);
	} catch {
		console.error(`\x1b[31mError parsing JSON in ${localeFile}\x1b[0m`);
		return new Set();
	}
}

function showHelp() {
	console.log("Usage: bun scripts/i18n.ts [options]");
	console.log("");
	console.log("Options:");
	console.log("  --info          Show audit of missing and unused keys");
	console.log("  --clean:unused  Remove unused keys from locale files");
	console.log("  --help          Show this help message");
}

async function main() {
	const args = process.argv.slice(2);
	const isInfo = args.includes("--info");
	const isClean = args.includes("--clean:unused");

	if (args.length === 0 || args.includes("--help")) {
		showHelp();
		return;
	}

	const usedKeysInCode = extractKeysFromCode();
	const localeFiles = fs
		.readdirSync(LOCALES_DIR)
		.filter((f) => f.endsWith(".json"));

	if (isInfo) {
		console.log("\x1b[36m=== i18n Translation Audit ===\x1b[0m");
		console.log(
			`Found \x1b[33m${usedKeysInCode.size}\x1b[0m unique translation keys in code.\n`,
		);

		let globalHasError = false;

		for (const file of localeFiles) {
			console.log(`\x1b[35m--- Checking ${file} ---\x1b[0m`);
			const keysInLocale = getLocaleKeys(file);

			const missingKeys: string[] = [];
			const unusedKeys: string[] = [];

			usedKeysInCode.forEach((key) => {
				if (!keysInLocale.has(key)) missingKeys.push(key);
			});

			keysInLocale.forEach((key) => {
				if (!usedKeysInCode.has(key)) unusedKeys.push(key);
			});

			if (missingKeys.length === 0 && unusedKeys.length === 0) {
				console.log("\x1b[32m✔ All keys are synchronized.\x1b[0m");
			}

			if (missingKeys.length > 0) {
				globalHasError = true;
				console.log(
					`\x1b[31m✖ Missing keys (${missingKeys.length}):\x1b[0m`,
				);
				missingKeys.sort().forEach((key) => console.log(`  - ${key}`));
			}

			if (unusedKeys.length > 0) {
				console.log(
					`\x1b[33m⚠ Unused keys (${unusedKeys.length}):\x1b[0m`,
				);
				unusedKeys.sort().forEach((key) => console.log(`  - ${key}`));
			}
			console.log("");
		}

		console.log("\x1b[36m=============================\x1b[0m");
		if (globalHasError) {
			console.log(
				"\x1b[31mAudit failed: Some keys are missing in locale files.\x1b[0m",
			);
			process.exit(1);
		} else {
			console.log("\x1b[32mAudit passed: No missing keys found.\x1b[0m");
		}
	} else if (isClean) {
		console.log("\x1b[36m=== i18n Translation Cleaner ===\x1b[0m");
		console.log(
			`Found \x1b[33m${usedKeysInCode.size}\x1b[0m unique translation keys in code.\n`,
		);

		for (const file of localeFiles) {
			const filePath = path.join(LOCALES_DIR, file);
			console.log(`\x1b[35m--- Cleaning ${file} ---\x1b[0m`);

			try {
				const content = fs.readFileSync(filePath, "utf-8");
				const json = JSON.parse(content);

				const { cleaned, removedCount } = cleanObject(
					json,
					usedKeysInCode,
				);

				if (removedCount > 0) {
					fs.writeFileSync(
						filePath,
						`${JSON.stringify(cleaned, null, "\t")}\n`,
						"utf-8",
					);
					console.log(
						`\x1b[32m✔ Removed ${removedCount} unused keys.\x1b[0m`,
					);
				} else {
					console.log("\x1b[32m✔ No unused keys found.\x1b[0m");
				}
			} catch (error) {
				console.error(
					`\x1b[31mError processing ${file}: ${error}\x1b[0m`,
				);
			}
			console.log("");
		}
		console.log("\x1b[36m==============================\x1b[0m");
		console.log("\x1b[32mDone cleaning locale files.\x1b[0m");
	}
}

main().catch(console.error);
