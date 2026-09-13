import { describe, it, expect, beforeEach } from 'vitest'

import { useAuthStore } from './authStore'

import { mockUser } from '../mock/mockUser'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().reset()
    useAuthStore.getState().setInitializing(true)
  })

  it('초기 상태: accessToken이 null이다', () => {
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('초기 상태: user가 null이다', () => {
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('초기 상태: isInitializing이 true다', () => {
    useAuthStore.setState({ isInitializing: true })
    expect(useAuthStore.getState().isInitializing).toBe(true)
  })

  it('setAuth 호출 시 accessToken이 설정된다', () => {
    useAuthStore.getState().setAuth('token123', mockUser)
    expect(useAuthStore.getState().accessToken).toBe('token123')
  })

  it('setAuth 호출 시 user가 설정된다', () => {
    useAuthStore.getState().setAuth('token123', mockUser)
    expect(useAuthStore.getState().user).toEqual(mockUser)
  })

  it('reset 호출 시 accessToken이 null로 초기화된다', () => {
    useAuthStore.getState().setAuth('token123', mockUser)
    useAuthStore.getState().reset()
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('reset 호출 시 user가 null로 초기화된다', () => {
    useAuthStore.getState().setAuth('token123', mockUser)
    useAuthStore.getState().reset()
    expect(useAuthStore.getState().user).toBeNull()
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

  it('getState()로 React 외부에서 상태에 접근할 수 있다', () => {
    useAuthStore.getState().setAuth('external-token', mockUser)
    const state = useAuthStore.getState()
    expect(state.accessToken).toBe('external-token')
    expect(state.user).toEqual(mockUser)
  })
})
