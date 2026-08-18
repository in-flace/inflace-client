import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

/* DOM이 필요 없는 테스트 — 순수 함수, zustand 스토어, Route Handler.
 * jsdom 인스턴스 생성이 전체 실행 시간의 최대 항목이므로 node 환경으로 분리한다.
 * 새 순수 로직 테스트는 이 글롭에 걸리는 위치에 두는 것이 좋다.
 * hooks는 React 렌더가 필요하므로 src/shared/lib 바로 아래만 포함한다(재귀 아님). */
const NODE_ENV_TESTS = [
  'app/**/*.test.{ts,tsx}',
  'src/shared/lib/*.test.ts',
  'src/shared/api/*.test.ts',
];

/* 두 단위 테스트 프로젝트가 공유하는 빌드 설정 */
const sharedUnitConfig = {
  plugins: [
    {
      name: 'svg-mock',
      transform(_code: string, id: string) {
        if (/\.svg(\?.*)?$/.test(id)) {
          return {
            code: `
              import { createElement } from 'react';
              const SvgMock = (props) => createElement('svg', props);
              SvgMock.displayName = 'SvgMock';
              export default SvgMock;
            `,
            map: null,
          };
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  esbuild: {
    jsx: 'automatic' as const,
  },
};

/* 두 단위 테스트 프로젝트가 공유하는 실행 옵션 */
const sharedUnitTestOptions = {
  globals: true,
  /* Windows에서 워커를 병렬로 띄우면 일부가 기동 타임아웃으로 죽는데,
   * vitest는 그 파일들을 "실행되지 않음"이 아니라 집계에서 누락시킨 뒤
   * 나머지만으로 초록 요약을 출력한다(25개 중 18개만 실행된 상태로 통과 표시).
   * 조용한 미실행을 막기 위해 파일 단위 병렬을 끈다. */
  fileParallelism: false,
  env: {
    /* 날짜 포맷 함수가 로컬 타임존에 의존하므로 실행 환경을 고정한다. */
    TZ: 'Asia/Seoul',
    /* testing-library는 조회 실패 시 DOM 전체를 출력한다(기본 7000자).
     * 실패 1건이 로그 수십 줄을 차지하므로 앞부분만 남긴다. */
    DEBUG_PRINT_LIMIT: '2000',
  },
};

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    /* Radix Dialog의 Presence가 act() 밖에서 상태를 갱신해 경고가 대량 발생한다
     * (LoginModal.test.tsx 한 파일에서 120건 = 로그의 약 63%).
     * 원인은 테스트 쪽이므로 수정 전까지 출력만 걸러 로그를 읽을 수 있게 한다.
     * 다른 act 경고까지 가려지므로, LoginModal.test.tsx를 고치면 이 필터도 제거할 것.
     * (프로젝트 단위로는 지정할 수 없어 루트에 둔다) */
    onConsoleLog(log, type) {
      if (type === 'stderr' && log.includes('was not wrapped in act(')) {
        return false;
      }
    },
    coverage: {
      provider: 'v8',
      /* include를 지정하면 테스트가 import하지 않은 파일도 집계에 포함된다.
       * 지정하지 않으면 미도달 파일이 0%가 아니라 분모에서 아예 빠진다. */
      include: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.stories.tsx',
        '**/mock/**',
        '**/index.ts',
        '**/*.d.ts',
      ],
      reporter: ['text-summary', 'json-summary', 'html'],
    },
    projects: [
      // 컴포넌트 테스트 프로젝트 (jsdom + @testing-library/react)
      {
        ...sharedUnitConfig,
        test: {
          ...sharedUnitTestOptions,
          name: 'unit',
          environment: 'jsdom',
          setupFiles: ['./vitest.setup.ts'],
          include: ['src/**/*.test.{ts,tsx}', 'app/**/*.test.{ts,tsx}'],
          exclude: NODE_ENV_TESTS,
        },
      },
      /* 순수 로직 테스트 프로젝트 (node).
       * jsdom을 띄우지 않아 같은 테스트가 훨씬 빨리 끝난다.
       * 리팩터링 중 반복 실행할 대상은 여기에 모으는 것이 이득이다. */
      {
        ...sharedUnitConfig,
        test: {
          ...sharedUnitTestOptions,
          name: 'unit-node',
          environment: 'node',
          include: NODE_ENV_TESTS,
        },
      },
      // Storybook 테스트 프로젝트
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
