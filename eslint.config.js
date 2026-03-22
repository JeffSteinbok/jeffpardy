import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
    {
        ignores: ["wwwroot/**", "node_modules/**", "dist/**", "bin/**"],
    },
    {
        files: ["src/web/**/*.{ts,tsx}"],
        extends: [
            js.configs.recommended,
            ...tseslint.configs.recommended,
            prettierConfig,
        ],
        plugins: {
            react,
        },
        settings: {
            react: { version: "19" },
        },
        rules: {
            ...react.configs.recommended.rules,

            // TypeScript strictness
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],

            // Disable React rules that don't apply with TypeScript
            "react/prop-types": "off",
            "react/react-in-jsx-scope": "off",

            // Disable base rules that are handled by TypeScript
            "no-unused-vars": "off", // handled by @typescript-eslint/no-unused-vars
            "no-undef": "off", // TypeScript handles this
        },
    }
);
