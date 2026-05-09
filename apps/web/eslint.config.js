import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import promise from 'eslint-plugin-promise'
import sonarjs from 'eslint-plugin-sonarjs'
import unicorn from 'eslint-plugin-unicorn'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'build',
      'node_modules',
      'coverage',
      'playwright-report',
      'test-results',
      'lint-baseline.json',
    ],
  },
  {
    extends: [
      js.configs.recommended, 
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'react': react,
      'jsx-a11y': jsxA11y,
      'promise': promise,
      'sonarjs': sonarjs,
      'unicorn': unicorn,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React rules
      ...reactHooks.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'warn',
      
      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      
      // Promise rules
      ...promise.configs.recommended.rules,
      'promise/always-return': 'error',
      'promise/catch-or-return': 'error',
      'promise/no-nesting': 'warn',
      'promise/prefer-await-to-then': 'error',
      
      // SonarJS rules
      ...sonarjs.configs.recommended.rules,
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-duplicate-string': ['error', { threshold: 3 }],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-redundant-boolean': 'error',
      'sonarjs/no-unused-collection': 'error',
      'sonarjs/prefer-immediate-return': 'error',
      'sonarjs/prefer-single-boolean-return': 'error',
      
      // SDK Import Rules - Prevent direct SDK imports in components
      'no-restricted-imports': [
        'error',
        {
          'patterns': [
            {
              'group': ['@packages/sdk'],
              'message': 'Use @api/types instead of direct SDK imports. This ensures consistent type management and single source of truth.'
            }
          ]
        }
      ],

      // Unicorn rules (simplified)
      'unicorn/better-regex': 'error',
      'unicorn/catch-error-name': 'error',
      'unicorn/consistent-destructuring': 'error',
      'unicorn/explicit-length-check': 'error',
      'unicorn/no-array-callback-reference': 'error',
      'unicorn/no-array-for-each': 'error',
      'unicorn/no-array-method-this-argument': 'error',
      'unicorn/no-array-push-push': 'error',
      'unicorn/no-console-spaces': 'error',
      'unicorn/no-for-loop': 'error',
      'unicorn/no-lonely-if': 'error',
      'unicorn/no-nested-ternary': 'error',
      'unicorn/no-new-array': 'error',
      'unicorn/no-new-buffer': 'error',
      'unicorn/no-null': 'warn',
      'unicorn/no-object-as-default-parameter': 'error',
      'unicorn/no-process-exit': 'error',
      'unicorn/no-thenable': 'error',
      'unicorn/no-typeof-undefined': 'error',
      'unicorn/no-unnecessary-await': 'error',
      'unicorn/no-unreadable-array-destructuring': 'error',
      'unicorn/no-unused-properties': 'error',
      'unicorn/no-useless-undefined': 'error',
      'unicorn/no-zero-fractions': 'error',
      'unicorn/number-literal-case': 'error',
      'unicorn/numeric-separators-style': 'error',
      'unicorn/prefer-add-event-listener': 'error',
      'unicorn/prefer-array-find': 'error',
      'unicorn/prefer-array-flat': 'error',
      'unicorn/prefer-array-flat-map': 'error',
      'unicorn/prefer-array-index-of': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-code-point': 'error',
      'unicorn/prefer-date-now': 'error',
      'unicorn/prefer-default-parameters': 'error',
      'unicorn/prefer-dom-node-append': 'error',
      'unicorn/prefer-dom-node-dataset': 'error',
      'unicorn/prefer-dom-node-remove': 'error',
      'unicorn/prefer-export-from': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-json-parse-buffer': 'error',
      'unicorn/prefer-keyboard-event-key': 'error',
      'unicorn/prefer-logical-operator-over-ternary': 'error',
      'unicorn/prefer-math-trunc': 'error',
      'unicorn/prefer-modern-dom-apis': 'error',
      'unicorn/prefer-modern-math-apis': 'error',
      'unicorn/prefer-module': 'error',
      'unicorn/prefer-native-coercion-functions': 'error',
      'unicorn/prefer-negative-index': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-number-properties': 'error',
      'unicorn/prefer-optional-catch-binding': 'error',
      'unicorn/prefer-prototype-methods': 'error',
      'unicorn/prefer-query-selector': 'error',
      'unicorn/prefer-reflect-apply': 'error',
      'unicorn/prefer-regexp-test': 'error',
      'unicorn/prefer-set-has': 'error',
      'unicorn/prefer-set-size': 'error',
      'unicorn/prefer-spread': 'error',
      'unicorn/prefer-string-replace-all': 'error',
      'unicorn/prefer-string-slice': 'error',
      'unicorn/prefer-string-starts-ends-with': 'error',
      'unicorn/prefer-string-trim-start-end': 'error',
      'unicorn/prefer-switch': 'error',
      'unicorn/prefer-ternary': 'error',
      'unicorn/prefer-top-level-await': 'error',
      'unicorn/prefer-type-error': 'error',
      'unicorn/relative-url-style': 'error',
      'unicorn/require-array-join-separator': 'error',
      'unicorn/require-number-to-fixed-digits-argument': 'error',
      'unicorn/require-post-message-target-origin': 'error',
      'unicorn/string-content': 'error',
      'unicorn/switch-case-braces': 'error',
      'unicorn/text-encoding-identifier-case': 'error',
      'unicorn/throw-new-error': 'error',
    },
  },
  {
    files: ['scripts/**/*.{js,cjs,mjs,ts}', 'src/scripts/**/*.{js,cjs,mjs,ts}'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'sonarjs/slow-regex': 'off',
    },
  },
  {
    files: [
      'src/types/api.ts',
      'src/api/apiWrapper.ts',
      'src/api/types/**/*.ts',
      'src/shared/hooks/generated.ts',
      'src/shared/hooks/hooks/generated.ts',
    ],
    rules: {
      'sonarjs/class-name': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-identical-functions': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  {
    files: [
      'src/shared/ui/primitives/ui/States/index.ts',
      'src/shared/ui/templates/FormPageTemplate.tsx',
    ],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
    },
  },
  // Demote noisy stylistic / duplicate checks to warn so `npm run lint:serious` (eslint --quiet)
  // surfaces async, correctness, imports boundary, and similar errors first.
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'sonarjs/unused-import': 'warn',
      'sonarjs/prefer-read-only-props': 'warn',
      'sonarjs/no-duplicate-string': 'warn',
      'sonarjs/no-nested-conditional': 'warn',
      'sonarjs/todo-tag': 'warn',
      'sonarjs/no-redundant-optional': 'warn',
      'sonarjs/no-nested-template-literals': 'warn',
      'sonarjs/no-redundant-jump': 'warn',
      'unicorn/text-encoding-identifier-case': 'warn',
      'unicorn/switch-case-braces': 'warn',
      'unicorn/prefer-number-properties': 'warn',
      'unicorn/no-array-callback-reference': 'warn',
      'unicorn/prefer-top-level-await': 'warn',
      'unicorn/consistent-destructuring': 'warn',
    },
  },
)

