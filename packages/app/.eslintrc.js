// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {},
  overrides: [
    {
      files: ['src/**/*.vue'],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: {
          ts: '@typescript-eslint/parser',
          '<template>': 'espree',
        }
      },
      extends: ['plugin:vue/vue3-recommended', 'plugin:prettier/recommended'],
    },
  ],
}
