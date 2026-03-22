import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import prettier from "eslint-config-prettier";

export default [
    {
        ignores: ["wwwroot/**", "node_modules/**", "dist/**"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettier,
    {
        files: ["src/web/**/*.{ts,tsx}"],
        plugins: {
            react,
        },
        settings: {
            react: { version: "detect" },
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/no-require-imports": "off",
            "@typescript-eslint/no-empty-object-type": "warn",
            "@typescript-eslint/no-wrapper-object-types": "warn",
            "react/prop-types": "off",
            "react/no-deprecated": "off",
            "no-undef": "off",
            "prefer-const": "warn",
            "no-var": "warn",
            "no-prototype-builtins": "warn",
            "no-dupe-else-if": "warn",
        },
    },
];
