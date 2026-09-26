<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLikesStore } from '@/stores/likes'
import { usePlaylistsStore } from '@/stores/playlists'
import { TokenExpiredError } from '@/utils/errors'
import LoginScreen from '@/components/LoginScreen.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import PreviewScreen from '@/components/PreviewScreen.vue'
import ConfirmationScreen from '@/components/ConfirmationScreen.vue'
import ErrorScreen from '@/components/ErrorScreen.vue'

type AppScreen =
  'login' | 'processing-callback' | 'loading-likes' | 'preview' | 'creating' | 'done' | 'error'

const authStore = useAuthStore()
const likesStore = useLikesStore()
const playlistsStore = usePlaylistsStore()

const screen = ref<AppScreen>('login')
const errorMessage = ref('')

function errorToMessage(error: unknown): string {
  if (error instanceof TokenExpiredError) {
    return 'Ta session a expiré, reconnecte-toi.'
  }
  return 'Une erreur est survenue. Réessaie.'
}

async function loadLikes(): Promise<void> {
  screen.value = 'loading-likes'
  try {
    await likesStore.fetchAll()
    screen.value = 'preview'
  } catch (error) {
    errorMessage.value = errorToMessage(error)
    screen.value = 'error'
  }
}

onMounted(async () => {
  if (window.location.pathname !== '/callback') {
    screen.value = 'login'
    return
  }

  screen.value = 'processing-callback'
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')

  if (params.get('error') || !code) {
    errorMessage.value = 'Connexion refusée.'
    screen.value = 'error'
    return
  }

  try {
    await authStore.handleCallback(code, state)
    window.history.replaceState({}, '', '/')
    await loadLikes()
  } catch (error) {
    errorMessage.value = errorToMessage(error)
    screen.value = 'error'
  }
})

async function onLogin(): Promise<void> {
  await authStore.login()
}

function onToggleMonth(monthKey: string): void {
  playlistsStore.toggleMonth(monthKey)
}

async function onCreate(): Promise<void> {
  screen.value = 'creating'
  try {
    await playlistsStore.createSelected()
    screen.value = 'done'
  } catch (error) {
    errorMessage.value = errorToMessage(error)
    screen.value = 'error'
  }
}

function onRetry(): void {
  authStore.reset()
  errorMessage.value = ''
  screen.value = 'login'
}
</script>

<template>
  <main>
    <LoginScreen v-if="screen === 'login'" @login="onLogin" />
    <LoadingSpinner v-else-if="screen === 'processing-callback'" message="Connexion en cours…" />
    <LoadingSpinner
      v-else-if="screen === 'loading-likes'"
      message="Chargement de tes titres likés…"
    />
    <PreviewScreen
      v-else-if="screen === 'preview'"
      :month-groups="likesStore.monthGroups"
      :selected-months="playlistsStore.selectedMonths"
      @toggle-month="onToggleMonth"
      @create="onCreate"
    />
    <LoadingSpinner v-else-if="screen === 'creating'" message="Création des playlists…" />
    <ConfirmationScreen v-else-if="screen === 'done'" :results="playlistsStore.results" />
    <ErrorScreen v-else-if="screen === 'error'" :message="errorMessage" @retry="onRetry" />
  </main>
</template>
