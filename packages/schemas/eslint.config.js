import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      },
      globals: {
        console: 'writable',
        process: 'writable',
        generateCreateInputSchema: 'writable',
        generateUpdateInputSchema: 'writable',
        generateResponseSchema: 'writable',
        generateListResponseSchema: 'writable',
        generateQuerySchema: 'writable'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
      'prefer-const': 'error',
      'no-var': 'error'
    }
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.config.ts',
      '*.config.js',
      '**/generated/**',
      'src/generated/**',
      '**/*.generated.*',
      '**/*.d.ts'
    ]
  }
]
