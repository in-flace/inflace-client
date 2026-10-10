import { defineConfig } from 'steiger'
import fsd from '@feature-sliced/steiger-plugin'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // 번들에 들어가지 않는 개발·검증용 코드라 레이어 규칙을 적용하면 실제 결합과 섞여 신호가 흐려진다
    ignores: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.stories.tsx',
      '**/mock/**',
      './src/shared/api/msw/**',
    ],
  },
  {
    rules: {
      // 슬라이스 그룹 폴더에 index.ts를 두는 구조(@/widgets/competitor 등)를 슬라이스로 인식하지 못해 오탐이 난다
      'fsd/no-reserved-folder-names': 'off',
      // 단일 사용처 슬라이스 병합은 구조 취향 문제라 결합도 개선과 무관하고, 같은 원인의 "참조 없음" 오탐도 섞인다
      'fsd/insignificant-slice': 'off',
    },
  },
])
