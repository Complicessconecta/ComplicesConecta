import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";

const tsRecommended = tseslint.configs.recommended.map((cfg) => ({
  ...cfg,
  files: ["**/*.{ts,tsx}"],
}));

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  { files: ["**/*.cjs"], languageOptions: { sourceType: "commonjs", globals: globals.node } },
  { files: ["scripts/**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.node }, rules: { "no-empty": "off" } },
  { files: ["server.js"], languageOptions: { sourceType: "module", globals: globals.node }, rules: { "no-undef": "off" } },
  {
    ignores: [
      'REFERENCIA_EXTERNA/**',
      '_REFERENCIA_EXTERNA/**',
      '_archive/**',
      '**/_archive/**',
      'scripts/**',
      'server.js',
      'dist/**',
      'build/**',
      '.vercel/**',
      'node_modules/**',
    ],
  },
  ...tsRecommended,
  pluginReact.configs.flat.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      'react-hooks': pluginReactHooks as unknown as Record<string, unknown>,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-var-requires": "off",
      "no-undef": "off",
      "no-unused-vars": "off",
      "no-empty": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/rules-of-hooks": "off",
      "no-console": "off"
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react/display-name": "off",
      "no-irregular-whitespace": "off",
      "no-console": "off",
    },
  },
]);
