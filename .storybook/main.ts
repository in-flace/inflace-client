import type { StorybookConfig } from '@storybook/nextjs-vite'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
  ],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {
      image: {
        /* next-image 플러그인은 모듈 ID를 문자열로 이어붙이는데,
         * Windows에서 alias(백슬래시)와 import 경로(슬래시)가 섞이면
         * 백슬래시를 이스케이프로 해석해 경로가 깨진다.
         * 스토리에서는 next/image 최적화가 필요 없으므로 전부 제외한다. */
        excludeFiles: [
          '**/*.svg',
          '**/*.png',
          '**/*.jpg',
          '**/*.jpeg',
          '**/*.webp',
          '**/*.gif',
          '**/*.avif',
        ],
      },
    },
  },
  viteFinal: async (config) => {
    config.plugins = config.plugins ?? []

    config.plugins.unshift(
      tailwindcss(),
      svgr({
        include: /\.svg(\?.*)?$/,
        svgrOptions: {
          icon: true,
        },
      })
    )

    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../src'),
    }

    return config
  },
}
export default config
