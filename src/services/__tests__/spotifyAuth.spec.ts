import { describe, it, expect, beforeEach, vi } from 'vitest'
import { buildAuthorizeUrl, exchangeCodeForToken, isValidCallbackState } from '../spotifyAuth'

beforeEach(() => {
  sessionStorage.clear()
})

describe('buildAuthorizeUrl', () => {
  it("construit une URL d'autorisation avec les bons paramètres", async () => {
    const url = await buildAuthorizeUrl()
    const parsed = new URL(url)

    expect(parsed.origin + parsed.pathname).toBe('https://accounts.spotify.com/authorize')
    expect(parsed.searchParams.get('client_id')).toBe('test-client-id')
    expect(parsed.searchParams.get('response_type')).toBe('code')
    expect(parsed.searchParams.get('scope')).toBe(
      'user-library-read playlist-modify-private ugc-image-upload',
    )
    expect(parsed.searchParams.get('code_challenge_method')).toBe('S256')
    expect(parsed.searchParams.get('code_challenge')).toBeTruthy()
    expect(parsed.searchParams.get('state')).toBeTruthy()
  })

  it('stocke le code_verifier et le state en sessionStorage', async () => {
    await buildAuthorizeUrl()
    expect(sessionStorage.getItem('spotify_code_verifier')).toBeTruthy()
    expect(sessionStorage.getItem('spotify_auth_state')).toBeTruthy()
  })
})

describe('isValidCallbackState', () => {
  it('retourne true quand le state correspond à celui stocké', async () => {
    await buildAuthorizeUrl()
    const storedState = sessionStorage.getItem('spotify_auth_state')
    expect(isValidCallbackState(storedState)).toBe(true)
  })

  it('retourne false quand le state ne correspond pas', async () => {
    await buildAuthorizeUrl()
    expect(isValidCallbackState('un-autre-state')).toBe(false)
  })

  it('retourne false quand aucun state n’a été stocké', () => {
    expect(isValidCallbackState('quoi-que-ce-soit')).toBe(false)
  })
})

describe('exchangeCodeForToken', () => {
  it('échoue si aucun code_verifier n’est en attente', async () => {
    await expect(exchangeCodeForToken('some-code')).rejects.toThrow(
      'Aucun code_verifier trouvé pour cet échange',
    )
  })

  it('appelle le endpoint token avec les bons paramètres et retourne le token', async () => {
    await buildAuthorizeUrl()
    const storedVerifier = sessionStorage.getItem('spotify_code_verifier')

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'abc123', expires_in: 3600 }),
    } as Response)
    vi.stubGlobal('fetch', fetchMock)

    const result = await exchangeCodeForToken('the-code')

    expect(result).toEqual({ accessToken: 'abc123', expiresInSeconds: 3600 })
    expect(fetchMock).toHaveBeenCalledOnce()

    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://accounts.spotify.com/api/token')
    const body = init!.body as URLSearchParams
    expect(body.get('grant_type')).toBe('authorization_code')
    expect(body.get('code')).toBe('the-code')
    expect(body.get('code_verifier')).toBe(storedVerifier)
    expect(body.get('client_id')).toBe('test-client-id')

    expect(sessionStorage.getItem('spotify_code_verifier')).toBeNull()
  })

  it("lève une erreur si l'échange échoue côté Spotify", async () => {
    await buildAuthorizeUrl()
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue({ ok: false } as Response))

    await expect(exchangeCodeForToken('the-code')).rejects.toThrow(
      "Échec de l'échange du code contre un token",
    )
  })
})
