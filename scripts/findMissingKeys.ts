import fs from "fs";
import path from "path";

const SRC_DIR = path.join(__dirname, "../src");
const LOCALES_DIR = path.join(__dirname, "../src/locales");

// Matches single quotes, double quotes, or backticks
const KEY_REGEX = /\b(?:t|I18nService\.t)\s*\(\s*['"`](.*?)['"`]/g;

function getAllFiles(dir: string, fileList: string[] = []): string[] {
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
		// Reset regex state just in case, though creating new regex or not using global state across files is safer.
		// Since KEY_REGEX is global, we need to be careful or just re-instantiate it.
		// Actually, exec() on a global regex updates lastIndex.
		// It's safer to create a local regex or reset lastIndex.
		const regex = new RegExp(KEY_REGEX);

		while ((match = regex.exec(content)) !== null) {
			if (match[1]) {
				keys.add(match[1]);
			}
		}
	});

	return keys;
}

function flattenKeys(
	obj: Record<string, unknown>,
	prefix = "",
	result: Set<string> = new Set(),
): Set<string> {
	for (const key in obj) {
		if (typeof obj[key] === "object" && obj[key] !== null) {
			flattenKeys(
				obj[key] as Record<string, unknown>,
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
		console.warn(`Locale file not found: ${filePath}`);
		return new Set();
	}
	const content = fs.readFileSync(filePath, "utf-8");
	try {
		const json = JSON.parse(content);
		return flattenKeys(json);
	} catch (e) {
		console.error(`Error parsing JSON in ${localeFile}:`, e);
		return new Set();
	}
}

function main() {
	console.log("Scanning codebase for translation keys...");
	const usedKeys = extractKeysFromCode();
	console.log(`Found ${usedKeys.size} unique keys in code.`);

	const locales = ["en.json", "fr.json"];
	let hasError = false;

	locales.forEach((locale) => {
		console.log(`\nChecking ${locale}...`);
		const existingKeys = getLocaleKeys(locale);
		const missingKeys: string[] = [];

		usedKeys.forEach((key) => {
			// Skip dynamic keys (containing ${}) as we can't verify them easily
			if (key.includes("${")) return;

			if (!existingKeys.has(key)) {
				missingKeys.push(key);
			}
		});

		if (missingKeys.length > 0) {
			hasError = true;
			console.log(
				`\x1b[31mFound ${missingKeys.length} missing keys in ${locale}:\x1b[0m`,
			);
			missingKeys.sort().forEach((key) => console.log(`  - ${key}`));
		} else {
			console.log(`\x1b[32mNo missing keys found in ${locale}.\x1b[0m`);
		}
	});

	if (hasError) {
		process.exit(1);
	}
}

main();
