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

            // Relax TypeScript rules for existing codebase
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/no-require-imports": "warn",
            "@typescript-eslint/no-empty-object-type": "warn",
            "@typescript-eslint/no-wrapper-object-types": "warn",

            // Disable React rules that don't apply
            "react/prop-types": "off",
            "react/no-deprecated": "off",
            "react/react-in-jsx-scope": "off",

            // Relax other common rules for existing codebase
            "no-unused-vars": "off", // handled by @typescript-eslint/no-unused-vars
            "no-undef": "off", // TypeScript handles this
            "prefer-const": "warn",
            "no-var": "warn",
            "no-prototype-builtins": "warn",
            "no-dupe-else-if": "warn",
            "react/no-unescaped-entities": "warn",
        },
    }
);
