// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  // globalIgnores가 기본 ignore를 덮어쓰므로, 새 산출물 디렉토리가 생기면 여기에 추가해야 한다.
  // ESLint 9 flat config는 .gitignore를 자동으로 읽지 않는다.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 빌드 · 테스트 산출물
    "storybook-static/**",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
    "blob-report/**",
  ]),
  ...storybook.configs["flat/recommended"],
  {
    rules: {
      'react-hooks/refs': 'off',
    },
  },
]);

export default eslintConfig;
