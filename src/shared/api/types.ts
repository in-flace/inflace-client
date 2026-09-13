/* -------API-------- */
// API 응답 형식
export interface ApiResponse<T> {
  responseDto: T
  error: ApiError | null
  success: boolean
}

// API 에러 형식
export interface ApiError {
  code: string
  message: string
}

/* -------무한 스크롤-------- */
// 페이지네이션 공통 타입
export interface PageInfo {
  size: number
  numberOfElements: number
  nextCursor: string | null
  hasNext: boolean
}

