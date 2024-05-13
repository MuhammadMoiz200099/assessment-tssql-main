module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ["plugin:@typescript-eslint/recommended", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "eslint-plugin-prettier"],
  rules: {
    "prettier/prettier": [
      "warn",
      {
        semi: true,
        arrowParens: "always",
        singleQuote: false,
        endOfLine: "auto",
        trailingComma: "es5",
      },
    ],
    "@typescript-eslint/consistent-type-imports": "error",
  },
};
