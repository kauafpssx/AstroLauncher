import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

export default defineConfig([
  // dist and Rust build artifacts are generated — never lint them. Worktrees
  // under .claude/worktrees are separate git checkouts for parallel work and
  // must stay out of this repo's own tsconfig root resolution.
  globalIgnores(['dist', 'src-tauri/target', '.claude/worktrees']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Empty `catch {}` blocks are intentional error-swallowing (their
      // explanatory comments were removed project-wide by explicit request).
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Force '@/*' path aliases instead of parent-traversal relative imports.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*'],
              message:
                "Use the '@/*' path alias instead of relative parent imports (e.g. '@/components/ui/button').",
            },
          ],
        },
      ],
    },
  },
  // Prettier owns formatting: disable ESLint rules that would conflict with it.
  {
    files: ['**/*.{ts,tsx}'],
    ...eslintConfigPrettier,
  },
])
