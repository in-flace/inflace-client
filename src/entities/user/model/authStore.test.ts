import { describe, it, expect, beforeEach } from 'vitest'

import { useAuthStore } from './authStore'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().reset()
    useAuthStore.getState().setInitializing(true)
  })

  it('초기 상태: accessToken이 null이다', () => {
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('setAccessToken 호출 시 accessToken이 설정된다', () => {
    useAuthStore.getState().setAccessToken('token123')
    expect(useAuthStore.getState().accessToken).toBe('token123')
  })

  it('reset 호출 시 accessToken이 null로 초기화된다', () => {
    useAuthStore.getState().setAccessToken('token123')
    useAuthStore.getState().reset()
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('setInitializing(false) 호출 시 isInitializing이 false가 된다', () => {
    useAuthStore.getState().setInitializing(false)
    expect(useAuthStore.getState().isInitializing).toBe(false)
  })

  it('setInitializing(true) 호출 시 isInitializing이 true가 된다', () => {
    useAuthStore.getState().setInitializing(false)
    useAuthStore.getState().setInitializing(true)
    expect(useAuthStore.getState().isInitializing).toBe(true)
  })
})
