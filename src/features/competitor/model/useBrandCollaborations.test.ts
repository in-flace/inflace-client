import { describe, expect, it } from 'vitest'

import { DEFAULT_COMPETITOR_FILTER } from './types'
import { toBrandCollaborationsQuery } from './useBrandCollaborations'

describe('toBrandCollaborationsQuery', () => {
  it('포함·제외 키워드를 API 쿼리에 전달한다', () => {
    const query = toBrandCollaborationsQuery({
      ...DEFAULT_COMPETITOR_FILTER,
      includeKeywords: ['갤럭시', '노트북'],
      excludeKeywords: ['아이폰'],
    })

    expect(query).toMatchObject({
      includeKeywords: ['갤럭시', '노트북'],
      excludeKeywords: ['아이폰'],
    })
  })

  it('비어 있는 키워드 배열은 쿼리에서 생략한다', () => {
    const query = toBrandCollaborationsQuery(DEFAULT_COMPETITOR_FILTER)

    expect(query.includeKeywords).toBeUndefined()
    expect(query.excludeKeywords).toBeUndefined()
  })
})
