import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  redirectToAuthorize,
  exchangeCodeForToken,
  isValidCallbackState,
} from '@/services/spotifyAuth'
import { getCurrentUser } from '@/services/spotifyApi'
import type { SpotifyUser } from '@/types/spotify'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)
  const user = ref<SpotifyUser | null>(null)

  async function login(): Promise<void> {
    await redirectToAuthorize()
  }

  async function handleCallback(code: string, state: string | null): Promise<void> {
    if (!isValidCallbackState(state)) {
      throw new Error('State OAuth invalide')
    }

    const token = await exchangeCodeForToken(code)
    accessToken.value = token.accessToken
    user.value = await getCurrentUser(token.accessToken)
  }

  function reset(): void {
    accessToken.value = null
    user.value = null
  }

  return { accessToken, user, login, handleCallback, reset }
})
