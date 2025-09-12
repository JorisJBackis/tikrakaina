import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  // ADD THIS NEW OBJECT TO RELAX ESLINT RULES FOR TYPESCRIPT
  {
    files: ["**/*.ts", "**/*.tsx"], // Apply these rules only to TypeScript files
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Disable the 'no-explicit-any' error
      "@typescript-eslint/no-unused-vars": "warn", // Change 'no-unused-vars' to a warning instead of an error
      "no-unused-vars": "warn" // Also change the base ESLint 'no-unused-vars' to a warning
    },
  },
];

export default eslintConfig;
