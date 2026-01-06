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

function getAllFiles(dir: string, fileList: string[] = []): string[] {
	if (!fs.existsSync(dir)) return fileList;
	const files = fs.readdirSync(dir);
	files.forEach((file) => {
		const filePath = path.join(dir, file);
		if (fs.statSync(filePath).isDirectory()) {
			getAllFiles(filePath, fileList);
		} else {
			if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
				fileList.push(filePath);
			}
		}
	});
	return fileList;
}

function extractKeysFromCode(): Set<string> {
	const files = getAllFiles(SRC_DIR);
	const keys = new Set<string>();

	files.forEach((file) => {
		const content = fs.readFileSync(file, "utf-8");
		let match;
		const regex = new RegExp(KEY_REGEX);

		while ((match = regex.exec(content)) !== null) {
			if (match[1] && !match[1].includes("${")) {
				keys.add(match[1]);
			}
		}
	});

	return keys;
}

function flattenKeys(
	obj: Record<string, any>,
	prefix = "",
	result: Set<string> = new Set(),
): Set<string> {
	for (const key in obj) {
		if (
			typeof obj[key] === "object" &&
			obj[key] !== null &&
			!Array.isArray(obj[key])
		) {
			flattenKeys(
				obj[key] as Record<string, any>,
				prefix + key + ".",
				result,
			);
		} else {
			result.add(prefix + key);
		}
	}
	return result;
}

function getLocaleKeys(localeFile: string): Set<string> {
	const filePath = path.join(LOCALES_DIR, localeFile);
	if (!fs.existsSync(filePath)) {
		return new Set();
	}
	const content = fs.readFileSync(filePath, "utf-8");
	try {
		const json = JSON.parse(content);
		return flattenKeys(json);
	} catch (e) {
		console.error(`\x1b[31mError parsing JSON in ${localeFile}\x1b[0m`);
		return new Set();
	}
}

function main() {
	console.log("\x1b[36m=== i18n Translation Audit ===\x1b[0m");

	const usedKeysInCode = extractKeysFromCode();
	const localeFiles = fs
		.readdirSync(LOCALES_DIR)
		.filter((f) => f.endsWith(".json"));

	console.log(
		`Found \x1b[33m${usedKeysInCode.size}\x1b[0m unique translation keys in code.\n`,
	);

	let globalHasError = false;

	localeFiles.forEach((file) => {
		console.log(`\x1b[35m--- Checking ${file} ---\x1b[0m`);
		const keysInLocale = getLocaleKeys(file);

		const missingKeys: string[] = [];
		const unusedKeys: string[] = [];

		// Find missing keys (in code but not in JSON)
		usedKeysInCode.forEach((key) => {
			if (!keysInLocale.has(key)) {
				missingKeys.push(key);
			}
		});

		// Find unused keys (in JSON but not in code)
		keysInLocale.forEach((key) => {
			if (!usedKeysInCode.has(key)) {
				unusedKeys.push(key);
			}
		});

		if (missingKeys.length === 0 && unusedKeys.length === 0) {
			console.log(`\x1b[32m✔ All keys are synchronized.\x1b[0m`);
		}

		if (missingKeys.length > 0) {
			globalHasError = true;
			console.log(
				`\x1b[31m✖ Missing keys (${missingKeys.length}):\x1b[0m`,
			);
			missingKeys.sort().forEach((key) => console.log(`  - ${key}`));
		}

		if (unusedKeys.length > 0) {
			console.log(`\x1b[33m⚠ Unused keys (${unusedKeys.length}):\x1b[0m`);
			unusedKeys.sort().forEach((key) => console.log(`  - ${key}`));
		}
		console.log("");
	});

	console.log("\x1b[36m=============================\x1b[0m");
	if (globalHasError) {
		console.log(
			"\x1b[31mAudit failed: Some keys are missing in locale files.\x1b[0m",
		);
		process.exit(1);
	} else {
		console.log("\x1b[32mAudit passed: No missing keys found.\x1b[0m");
	}
}

main();
