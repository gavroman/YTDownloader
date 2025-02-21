import pluginJs from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
// import securityPlugin from 'eslint-plugin-security';
import unicornPlugin from 'eslint-plugin-unicorn';
import globals from 'globals';
import tsPlugin from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
    // Security
    // securityPlugin.configs.recommended,
    {
        files: ['**/*.ts', '**/*.js'],
    },
    {
        languageOptions: {globals: globals.node},
    },
    {
        rules: {
            'func-style': ['error', 'expression'],
            'no-restricted-syntax': ['off', 'ForOfStatement'],
            'no-console': ['error'],
            'prefer-template': 'error',
            quotes: ['error', 'single', {avoidEscape: true}],
            'arrow-body-style': ['error', 'as-needed'],
            'object-curly-spacing': 'error',
            'no-restricted-imports': [
                'error',
                {
                    patterns: ['.*'],
                },
            ],
            'padding-line-between-statements': [
                'error',
                {blankLine: 'always', prev: ['*'], next: ['return']},
                {blankLine: 'always', prev: ['import'], next: ['const', 'export', 'class', 'function']},
            ],
        },
    },
    // Prettier
    {
        plugins: {
            prettier,
        },
        rules: {
            'prettier/prettier': [
                1,
                {
                    endOfLine: 'lf',
                    printWidth: 110,
                    semi: true,
                    singleQuote: true,
                    tabWidth: 4,
                    useTabs: false,
                    trailingComma: 'all',
                    bracketSpacing: false,
                },
            ],
        },
    },
    // Unicorn
    {
        plugins: {
            unicorn: unicornPlugin,
        },
        rules: {
            'unicorn/empty-brace-spaces': 'off',
            'unicorn/no-null': 'off',
        },
    },
    pluginJs.configs.recommended,
    ...tsPlugin.configs.recommended,
    // TypeScript Eslint
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
            '@typescript-eslint/no-unused-expressions': [
                'error',
                {allowShortCircuit: true, allowTernary: true},
            ],
        },
    },
];
