import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

const config = [
  // Ignorar carpetas de build y dependencias
  {
    ignores: ["dist/", "node_modules/"]
  },

  // Reglas para todos los archivos TypeScript
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin
    },
    rules: {
      // Reglas básicas de estilo
      semi: ["error", "always"],
      quotes: ["error", "double"],
      "no-console": "warn",

      // Reglas recomendadas de @typescript-eslint
      ...tsPlugin.configs.recommended.rules
    }
  }
];

export default config;
