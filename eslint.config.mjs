import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // Global rule adjustments
  {
    rules: {
      // Allow underscore-prefixed names as intentionally unused
      "@typescript-eslint/no-unused-vars": [
        "error",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      // Content pages have natural English text with apostrophes — overly strict
      "react/no-unescaped-entities": "off",
    },
  },

  // Block component files are boilerplate delivered to customers.
  // They use @ts-nocheck intentionally, may have require() imports, and
  // contain unused imports intentionally exported for documentation.
  {
    files: ["components/blocks/**/*.ts", "components/blocks/**/*.tsx"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  // Verification scripts are Bun scripts, not browser code
  {
    files: ["scripts/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]);

export default eslintConfig;
