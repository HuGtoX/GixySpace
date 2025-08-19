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
  ...compat.config({
    extends: ["next", "prettier"],
    plugins: ["@gixy/unused-imports"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@gixy/unused-imports/no-unused-imports": "error",
      "@gixy/unused-imports/no-unused-vars": ["warn"],
    },
  }),
];

export default eslintConfig;
