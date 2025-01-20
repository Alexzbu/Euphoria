import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'Doc/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      // unused vars are errors, but an underscore prefix marks a deliberate discard.
      // express's four-arg error handlers need that, next has to stay in the signature.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      'no-implicit-coercion': 'error',
    },
  },

  // browser code. node globals aren't there at runtime, so leaving them in scope
  // means `process.env` lints clean and then blows up in the tab.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // vite's config runs in node, and is the one file under apps/web that should
  {
    files: ['apps/web/vite.config.ts'],
    languageOptions: { globals: { ...globals.node } },
  },

  // config files run in node before any build step and may use commonjs globals
  {
    files: ['**/*.config.{js,mjs,cjs,ts}', '**/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },

  // must stay last, turns off every rule that would fight prettier
  prettier,
);
