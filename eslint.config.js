import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{
		ignores: ["dist/**", "node_modules/**", "data/**", ".husky/**"],
	},
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "error",
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{ argsIgnorePattern: "^_" },
			],
			"@typescript-eslint/ban-types": "off",
		},
	},
);
