// Baseline lint rules for TypeScript (ESLint flat config with typescript-eslint).
// Copied into a repository on the owner's yes; the repository's own config wins where it is stricter.
// Each rule is here because it catches a mistake a reviewer would otherwise have to find by reading.
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "build/**", "coverage/**", "node_modules/**"] },
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // No `any`, written or leaked.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      // Explicit types on what other code depends on.
      "@typescript-eslint/explicit-module-boundary-types": "error",
      // Promises are awaited or handled, never dropped.
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      // Escape hatches need a reason, and non-null assertions are not one.
      "@typescript-eslint/ban-ts-comment": ["error", { "ts-expect-error": "allow-with-description", "ts-ignore": true }],
      "@typescript-eslint/no-non-null-assertion": "error",
      // Logging goes through the project's logger.
      "no-console": "error",
      // Name the constant.
      "@typescript-eslint/no-magic-numbers": ["error", { ignore: [-1, 0, 1, 2], ignoreEnums: true, ignoreReadonlyClassProperties: true, ignoreTypeIndexes: true, ignoreNumericLiteralTypes: true, ignoreDefaultValues: true }],
      // Needless complexity.
      complexity: ["error", 10],
      "max-depth": ["error", 4],
      eqeqeq: ["error", "always"],
      // Architecture boundaries: add one pattern per boundary the repository has, for example
      // { group: ["**/server/**"], message: "Client code imports shared types only, never server code." }
      "no-restricted-imports": ["error", { patterns: [] }],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx", "**/tests/**"],
    rules: { "@typescript-eslint/no-magic-numbers": "off" },
  },
);
