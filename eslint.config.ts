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
      // El logger por defecto en desarrollo es intencionado; en el
      // resto de casos conviene usar el logger estructurado.
      "no-console": "warn",

      // Los argumentos que Express exige en la firma pero no usamos
      // (p. ej. `next` en el manejador de errores) se prefijan con _.
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ]
    }
  },

  // Los scripts de línea de comandos se comunican por stdout: ahí el
  // console.* es la herramienta correcta, no un descuido.
  {
    files: ["prisma/**/*.ts", "scripts/**/*.ts"],
    rules: {
      "no-console": "off"
    }
  }
];

export default config;
