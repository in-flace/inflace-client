/**
 * sd.config.js — Style Dictionary 기반 토큰 빌드 스크립트
 *
 * @tokens-studio/sd-transforms 유틸리티로 폰트 굵기·치수를 변환하고,
 * tokens.json의 모든 시맨틱 토큰을 tokens.generated.css 로 출력합니다.
 *
 * 출력 구조:
 *   @theme { ...데스크톱 기본 토큰 }
 *   @media (tablet) { :root { ...오버라이드 } }
 *   @media (mobile) { :root { ...오버라이드 } }
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import {
  transformFontWeight,
  transformDimension,
} from '@tokens-studio/sd-transforms'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const data = JSON.parse(
  readFileSync(join(root, 'src/shared/tokens/tokens.json'), 'utf-8')
)

const primSection = data['0️⃣ Primitive/Mode 1']
const prim = primSection.primitive
const colorSem = data['🎨 Color Semantic/light'].semantic
const comp = data['🟣 Component/light']
const desktop = data['🖥️ Responsive Semantic/desktop'].semantic
const tablet = data['🖥️ Responsive Semantic/tablet'].semantic
const mobile = data['🖥️ Responsive Semantic/mobile'].semantic

// ── Helpers ───────────────────────────────────────────────────────────────────

/** 전체 토큰 루트 (참조 해석용) */
const tokenRoot = { primitive: prim }

/** Text Style 복합 토큰 참조 해석용 루트
 *  {semantic.*} → desktop semantic, {fontSize.*} → primSection.fontSize 등 */
const textStyleRoot = {
  primitive: prim,
  semantic: desktop,
  fontSize: primSection.fontSize,
  letterSpacing: primSection.letterSpacing,
  paragraphSpacing: primSection.paragraphSpacing,
  paragraphIndent: primSection.paragraphIndent,
  textCase: primSection.textCase,
  textDecoration: primSection.textDecoration,
}

/** 점 구분 경로로 토큰 트리에서 노드 탐색 */
function findValueByPath(path, root) {
  const parts = path.split('.')
  let cur = root
  for (const p of parts) {
    cur = cur?.[p]
    if (cur == null) return undefined
  }
  return cur
}

/** {primitive.x.y.z} 참조를 재귀적으로 해석 (순환 참조 방지 포함) */
function resolveReference(val, root, visited = new Set()) {
  if (typeof val !== 'string' || !val.startsWith('{')) return val
  if (visited.has(val)) return val
  visited.add(val)
  const path = val.slice(1, -1)
  const node = findValueByPath(path, root)
  if (node == null) return val
  const inner = typeof node === 'object' && 'value' in node ? node.value : node
  return resolveReference(inner, root, visited)
}

/** {primitive.x.y.z} 참조를 재귀적으로 해석 (CSS 생성용 — 기존 호환) */
function resolve(val) {
  return resolveReference(val, tokenRoot)
}

/** camelCase → kebab-case */
function kebab(s) {
  return s.replace(/([A-Z])/g, (_, c) => `-${c.toLowerCase()}`)
}

/** 숫자값을 px 문자열로 변환 (@tokens-studio/sd-transforms 사용) */
function px(val) {
  const resolved = resolve(val)
  return transformDimension({ value: resolved, type: 'dimension' }) ?? resolved
}

/** letter-spacing 퍼센트값을 em 단위로 변환 (예: "-1%" → "-0.01em") */
function letterSpacingToEm(val) {
  const resolved = resolve(val)
  if (typeof resolved === 'string' && resolved.endsWith('%')) {
    return parseFloat(resolved) / 100 + 'em'
  }
  return resolved
}

/** 폰트 굵기 이름을 CSS 숫자값으로 변환 (@tokens-studio/sd-transforms 사용) */
function fontWeight(val) {
  const resolved = resolve(val)
  return (
    transformFontWeight({ value: resolved, type: 'fontWeight' }) ?? resolved
  )
}

/** 토큰 객체를 [cssKeySuffix, rawValue] 배열로 평탄화 */
function flatten(obj, prefix = '') {
  const result = []
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}-${kebab(k)}` : kebab(k)
    if (v && typeof v === 'object' && 'value' in v) {
      result.push([key, v.value])
    } else if (v && typeof v === 'object') {
      result.push(...flatten(v, key))
    }
  }
  return result
}

// ── Dictionary Builders (tokens.generated.ts 용) ──────────────────────────────

/** 색상 토큰 객체를 재귀적으로 실제 값 딕셔너리로 변환 */
function extractColors(obj) {
  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && 'value' in v) {
      result[k] = resolveReference(v.value, tokenRoot)
    } else if (v && typeof v === 'object') {
      result[k] = extractColors(v)
    }
  }
  return result
}

/** semantic 블록 하나를 딕셔너리 서브트리로 변환 */
function transformTokens(sem) {
  const spacing = {}
  for (const [k, v] of Object.entries(sem.spacing ?? {})) {
    spacing[k] = px(v.value)
  }
  for (const [k, v] of Object.entries(sem.breakpoint?.spacing ?? {})) {
    spacing[k] = px(v.value)
  }

  const typo = { size: {}, weight: {}, lineHeight: {}, typeface: {} }
  const t = sem.typo ?? {}
  for (const [cat, variants] of Object.entries(t.size ?? {})) {
    for (const [variant, v] of Object.entries(variants)) {
      typo.size[`${cat}-${variant}`] = px(v.value)
    }
  }
  for (const [cat, variants] of Object.entries(t.weight ?? {})) {
    for (const [variant, v] of Object.entries(variants)) {
      typo.weight[`${cat}-${variant}`] = Number(fontWeight(v.value))
    }
  }
  for (const [cat, variants] of Object.entries(t.lineHeight ?? {})) {
    for (const [variant, v] of Object.entries(variants)) {
      typo.lineHeight[`${cat}-${variant}`] = px(v.value)
    }
  }
  for (const [k, v] of Object.entries(t.typeface ?? {})) {
    typo.typeface[k] = resolveReference(v.value, tokenRoot)
  }

  const radius = {}
  for (const [k, v] of Object.entries(sem.radius ?? {})) {
    radius[k] = px(v.value)
  }

  const opacity = {}
  for (const [k, v] of Object.entries(sem.opacity ?? {})) {
    const raw = resolveReference(v.value, tokenRoot)
    opacity[k] =
      typeof raw === 'number' ? raw / 100 : parseFloat(String(raw)) / 100
  }

  return { spacing, typo, radius, opacity }
}

/** 복합 typography 토큰의 개별 프로퍼티 변환 */
function resolveTypoProp(key, val) {
  const raw = resolveReference(val, textStyleRoot)
  if (
    key === 'fontSize' ||
    key === 'lineHeight' ||
    key === 'paragraphSpacing' ||
    key === 'paragraphIndent'
  ) {
    return transformDimension({ value: raw, type: 'dimension' }) ?? raw
  }
  if (key === 'fontWeight') {
    return transformFontWeight({ value: raw, type: 'fontWeight' }) ?? raw
  }
  if (key === 'letterSpacing') {
    if (typeof raw === 'string' && raw.endsWith('%')) {
      return parseFloat(raw) / 100 + 'em'
    }
    return raw
  }
  return raw
}

/** Text Style 복합 토큰 트리를 재귀적으로 딕셔너리로 변환 */
function extractTextStyles(obj) {
  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    if (
      v &&
      typeof v === 'object' &&
      v.type === 'typography' &&
      typeof v.value === 'object'
    ) {
      const resolved = {}
      for (const [propKey, propVal] of Object.entries(v.value)) {
        resolved[propKey] = resolveTypoProp(propKey, propVal)
      }
      result[k] = resolved
    } else if (v && typeof v === 'object' && !('type' in v)) {
      result[k] = extractTextStyles(v)
    }
  }
  return result
}

/** 브레이크포인트 최솟값 추출 */
function readBreakpointMin(sem, fallback) {
  try {
    const min = sem.breakpoint?.min
    if (min?.value != null) return px(min.value)
  } catch {}
  return fallback
}

// ── Base Generators (@theme 블록) ──────────────────────────────────────────────

function genColors() {
  return flatten(colorSem.color)
    .map(([k, v]) => `  --color-${k}: ${resolve(v)};`)
    .join('\n')
}

function genPrimitiveTransparentColors() {
  return flatten(prim.color.trasparent)
    .map(([k, v]) => `  --primitivecolortrasparent-${k}: ${resolve(v)};`)
    .join('\n')
}

function genPrimitiveBrandColors() {
  return flatten(prim.color.brand)
    .map(([k, v]) => `  --color-primitive-brand-${k}: ${resolve(v)};`)
    .join('\n')
}

function genComponent() {
  return flatten(comp.component.button, 'btn')
    .map(([k, v]) => {
      const deduped = k
        .split('-')
        .filter((seg, i, arr) => seg !== arr[i - 1])
        .join('-')
      return `  --color-${deduped}: ${resolve(v)};`
    })
    .join('\n')
}

function genPrimitiveBasicColors() {
  return flatten(prim.color.basic)
    .map(([k, v]) => `  --color-primitive-basic-${k}: ${resolve(v)};`)
    .join('\n')
}

function genNamedSpacing(sem) {
  return Object.entries(sem.breakpoint.spacing)
    .map(([k, v]) => `  --spacing-${k}: ${px(v.value)};`)
    .join('\n')
}

function genUnitSpacing() {
  return Object.entries(desktop.spacing)
    .map(([k, v]) => `  --spacing-${k}: ${px(v.value)};`)
    .join('\n')
}

function genTypography(sem, indent = '  ') {
  const typo = sem.typo
  const lines = []

  // 폰트 패밀리 (기본 @theme 전용)
  if (indent === '  ') {
    for (const [k, v] of Object.entries(typo.typeface)) {
      lines.push(`${indent}--font-${k}: "${resolve(v.value)}";`)
    }
    for (const [cat, variants] of Object.entries(typo.weight)) {
      for (const [variant, v] of Object.entries(variants)) {
        lines.push(
          `${indent}--font-weight-${cat}-${variant}: ${fontWeight(v.value)};`
        )
      }
    }
  }

  // 폰트 크기
  for (const [cat, variants] of Object.entries(typo.size)) {
    for (const [variant, v] of Object.entries(variants)) {
      lines.push(`${indent}--text-${cat}-${variant}: ${px(v.value)};`)
    }
  }

  // 줄 높이
  for (const [cat, variants] of Object.entries(typo.lineHeight)) {
    for (const [variant, v] of Object.entries(variants)) {
      lines.push(`${indent}--leading-${cat}-${variant}: ${px(v.value)};`)
    }
  }

  return lines.join('\n')
}

function genLetterSpacing(indent = '  ') {
  return Object.entries(primSection.letterSpacing)
    .map(([k, v]) => `${indent}--tracking-${k}: ${letterSpacingToEm(v.value)};`)
    .join('\n')
}

function genRadius(sem, indent = '  ') {
  if (!sem.radius) return ''
  return Object.entries(sem.radius)
    .map(([k, v]) => `${indent}--radius-${k}: ${px(v.value)};`)
    .join('\n')
}

function genOpacity(sem, indent = '  ') {
  if (!sem.opacity) return ''
  return Object.entries(sem.opacity)
    .map(([k, v]) => {
      const raw = resolve(v.value)
      const decimal = typeof raw === 'number' ? raw / 100 : raw
      return `${indent}--opacity-${k}: ${decimal};`
    })
    .join('\n')
}

function genBreakpoints() {
  function readMin(sem, fallback) {
    try {
      const min = sem.breakpoint.min
      if (min?.value != null) return px(min.value)
    } catch {}
    return fallback
  }
  return [
    `  --breakpoint-desktop: ${readMin(desktop, '1024px')};`,
    `  --breakpoint-tablet: ${readMin(tablet, '768px')};`,
    `  --breakpoint-mobile: ${readMin(mobile, '375px')};`,
  ].join('\n')
}

// ── Responsive Generator (@media 블록) ────────────────────────────────────────

function genResponsiveBlock(sem, mediaQuery) {
  const spacingVars = Object.entries(sem.breakpoint.spacing)
    .map(([k, v]) => `    --spacing-${k}: ${px(v.value)};`)
    .join('\n')

  const typoVars = genTypography(sem, '    ')
  const radiusVars = genRadius(sem, '    ')
  const opacityVars = genOpacity(sem, '    ')

  return `@media ${mediaQuery} {
  :root {
${spacingVars}
${typoVars}
${radiusVars}
${opacityVars}
  }
}`
}

// ── Text Style Utilities (@utility 블록) ──────────────────────────────────────

/** fontFamily 참조값 → CSS 변수명 매핑 */
const FONT_VAR_MAP = {
  'Noto Sans KR': 'var(--font-noto)',
  'IBM Plex Sans KR': 'var(--font-ibm), var(--font-noto)',
}

/**
 * Text Style 복합 토큰 트리를 재귀 순회하여 @utility 블록 문자열 배열로 변환
 * @param {object} obj  - 토큰 트리 노드
 * @param {string[]} pathParts - 현재 경로 세그먼트 (클래스명 생성용)
 * @returns {string[]}  - "@utility text-xxx { ... }" 문자열 배열
 */
function collectTextStyleUtilities(obj, pathParts = []) {
  const blocks = []
  for (const [k, v] of Object.entries(obj)) {
    if (
      v &&
      typeof v === 'object' &&
      v.type === 'typography' &&
      typeof v.value === 'object'
    ) {
      const className = ['text', ...pathParts, k].join('-').toLowerCase()
      const val = v.value

      const rawFamily = resolveReference(val.fontFamily, textStyleRoot)
      const fontVar = FONT_VAR_MAP[rawFamily] ?? `"${rawFamily}"`

      const fontSize = resolveTypoProp('fontSize', val.fontSize)
      const fontWeight = resolveTypoProp('fontWeight', val.fontWeight)
      const lineHeight = resolveTypoProp('lineHeight', val.lineHeight)
      const letterSpacing = resolveTypoProp('letterSpacing', val.letterSpacing)

      blocks.push(
        `@utility ${className} {\n` +
          `  font-family: ${fontVar};\n` +
          `  font-size: ${fontSize};\n` +
          `  font-weight: ${fontWeight};\n` +
          `  line-height: ${lineHeight};\n` +
          `  letter-spacing: ${letterSpacing};\n` +
          `}`
      )
    } else if (v && typeof v === 'object' && !('type' in v)) {
      blocks.push(...collectTextStyleUtilities(v, [...pathParts, k]))
    }
  }
  return blocks
}

function genTextStyleUtilities() {
  const textStyles = primSection['Text Style']
  const blocks = collectTextStyleUtilities(textStyles)
  return blocks.join('\n\n')
}

// ── Assemble ──────────────────────────────────────────────────────────────────

const css = `/* 자동생성 파일 — 직접 편집하지 마세요. npm run build:tokens 로 재생성 */

@theme {

  /* === Semantic Colors === */
${genColors()}


  /* === Primitive Brand Colors === */
${genPrimitiveBrandColors()}


  /* === Primitive Basic Colors === */
${genPrimitiveBasicColors()}


  /* === Primitive Transparent Colors === */
${genPrimitiveTransparentColors()}


  /* === Component Tokens === */
${genComponent()}


  /* === Spacing — Named (Desktop default) === */
${genNamedSpacing(desktop)}


  /* === Spacing — Unit Scale === */
${genUnitSpacing()}


  /* === Typography === */
${genTypography(desktop)}
${genLetterSpacing()}


  /* === Border Radius === */
${genRadius(desktop)}


  /* === Opacity === */
${genOpacity(desktop)}


  /* === Breakpoints === */
${genBreakpoints()}
}

/* === Responsive — Tablet (768px ~ 1023px) === */
${genResponsiveBlock(tablet, '(min-width: 768px) and (max-width: 1023px)')}

/* === Responsive — Mobile (max 767px) === */
${genResponsiveBlock(mobile, '(max-width: 767px)')}

/* === Text Style Utilities === */
${genTextStyleUtilities()}
`

const outPath = join(root, 'src/app/styles/tokens.generated.css')
writeFileSync(outPath, css, 'utf-8')

// ── TypeScript Dictionary Output ───────────────────────────────────────────────

const tokenDict = {
  color: extractColors(colorSem.color),
  ...transformTokens(desktop),
  breakpoint: {
    desktop: readBreakpointMin(desktop, '1024px'),
    tablet: readBreakpointMin(tablet, '768px'),
    mobile: readBreakpointMin(mobile, '375px'),
  },
  responsive: {
    tablet: transformTokens(tablet),
    mobile: transformTokens(mobile),
  },
  textStyle: extractTextStyles(primSection['Text Style']),
}

const ts = `/* 자동생성 파일 — 직접 편집하지 마세요. npm run build:tokens 로 재생성 */

export const tokens = ${JSON.stringify(tokenDict, null, 2)} as const

export type Tokens = typeof tokens
`

const tsOutPath = join(root, 'src/shared/tokens/tokens.generated.ts')
writeFileSync(tsOutPath, ts, 'utf-8')
