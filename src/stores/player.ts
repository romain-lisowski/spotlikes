import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LikedTrack } from '@/types/spotify'

export const usePlayerStore = defineStore('player', () => {
  const currentTrackId = ref<string | null>(null)
  let audio: HTMLAudioElement | null = null

  function stop(): void {
    audio?.pause()
    currentTrackId.value = null
  }

  function toggle(track: LikedTrack): void {
    if (!track.previewUrl) return

    if (currentTrackId.value === track.id) {
      stop()
      return
    }

    if (!audio) {
      audio = new Audio()
      audio.addEventListener('ended', () => {
        currentTrackId.value = null
      })
    }

    audio.src = track.previewUrl
    audio.play().catch(() => {
      currentTrackId.value = null
    })
    currentTrackId.value = track.id
  }

  return { currentTrackId, toggle, stop }
})
