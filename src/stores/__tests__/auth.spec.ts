import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import type { TokenResponse } from '@/services/spotifyAuth'
import type { SpotifyUser } from '@/types/spotify'

vi.mock('@/services/spotifyAuth', () => ({
  redirectToAuthorize: vi.fn<() => Promise<void>>(),
  exchangeCodeForToken: vi.fn<(code: string) => Promise<TokenResponse>>(),
  isValidCallbackState: vi.fn<(state: string | null) => boolean>(),
}))

vi.mock('@/services/spotifyApi', () => ({
  getCurrentUser: vi.fn<(accessToken: string) => Promise<SpotifyUser>>(),
}))

import {
  redirectToAuthorize,
  exchangeCodeForToken,
  isValidCallbackState,
} from '@/services/spotifyAuth'
import { getCurrentUser } from '@/services/spotifyApi'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useAuthStore', () => {
  it('login délègue la redirection OAuth au service spotifyAuth', async () => {
    const store = useAuthStore()

    await store.login()

    expect(redirectToAuthorize).toHaveBeenCalledOnce()
  })

  it('handleCallback échange le code et stocke le token et l’utilisateur si le state est valide', async () => {
    vi.mocked(isValidCallbackState).mockReturnValue(true)
    vi.mocked(exchangeCodeForToken).mockResolvedValue({
      accessToken: 'abc',
      expiresInSeconds: 3600,
    })
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'user1', displayName: 'Rom' })

    const store = useAuthStore()
    await store.handleCallback('code', 'state')

    expect(store.accessToken).toBe('abc')
    expect(store.user).toEqual({ id: 'user1', displayName: 'Rom' })
  })

  it('handleCallback lève une erreur et ne stocke rien si le state est invalide', async () => {
    vi.mocked(isValidCallbackState).mockReturnValue(false)

    const store = useAuthStore()
    await expect(store.handleCallback('code', 'wrong-state')).rejects.toThrow(
      'State OAuth invalide',
    )

    expect(store.accessToken).toBeNull()
    expect(exchangeCodeForToken).not.toHaveBeenCalled()
  })

  it('reset efface le token et l’utilisateur', async () => {
    vi.mocked(isValidCallbackState).mockReturnValue(true)
    vi.mocked(exchangeCodeForToken).mockResolvedValue({
      accessToken: 'abc',
      expiresInSeconds: 3600,
    })
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'user1', displayName: 'Rom' })

    const store = useAuthStore()
    await store.handleCallback('code', 'state')
    store.reset()

    expect(store.accessToken).toBeNull()
    expect(store.user).toBeNull()
  })
})
