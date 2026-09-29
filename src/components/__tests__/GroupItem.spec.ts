import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import GroupItem from '../GroupItem.vue'
import { usePlaylistsStore } from '@/stores/playlists'
import { formatPlaylistName } from '@/utils/formatPlaylistName'
import type { TrackGroup } from '@/types/spotify'

const group: TrackGroup = {
  key: '2026-Q3',
  label: 'T3 2026',
  tracks: [
    {
      id: '1',
      name: 'Track 1',
      artist: 'Artist',
      artistId: 'artist-1',
      primaryArtistName: 'Artist',
      previewUrl: null,
      uri: 'spotify:track:1',
      addedAt: '2026-09-01T00:00:00Z',
      genres: [],
    },
  ],
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('GroupItem', () => {
  it('affiche le libellé et le nombre de titres du groupe', () => {
    const wrapper = mount(GroupItem, { props: { group } })
    expect(wrapper.text()).toContain('T3 2026')
    expect(wrapper.text()).toContain('1 titres')
  })

  it('coche la case de sélection quand on clique dessus, via le store', async () => {
    const wrapper = mount(GroupItem, { props: { group } })
    const store = usePlaylistsStore()

    expect(store.selectedGroups.has('2026-Q3')).toBe(false)
    await wrapper.find('input[type="checkbox"]').setValue(true)
    expect(store.selectedGroups.has('2026-Q3')).toBe(true)
  })

  it('affiche le nom de playlist par défaut et le met à jour dans le store à la saisie', async () => {
    const wrapper = mount(GroupItem, { props: { group } })
    const store = usePlaylistsStore()
    const nameInput = wrapper.find('input[type="text"]')

    expect((nameInput.element as HTMLInputElement).value).toBe(formatPlaylistName(group))

    await nameInput.setValue('Été chill')

    expect(store.getPlaylistName(group)).toBe('Été chill')
  })
})
