import {
  SPOTIFY_AUTHORIZE_URL,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_REDIRECT_URI,
  SPOTIFY_SCOPES,
  SPOTIFY_TOKEN_URL,
} from '@/config/spotify'
import { generateCodeChallenge, generateCodeVerifier } from '@/utils/pkce'

const CODE_VERIFIER_KEY = 'spotify_code_verifier'
const STATE_KEY = 'spotify_auth_state'

export interface TokenResponse {
  accessToken: string
  expiresInSeconds: number
}

function generateState(): string {
  return crypto.randomUUID()
}

export async function buildAuthorizeUrl(): Promise<string> {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = generateState()

  sessionStorage.setItem(CODE_VERIFIER_KEY, verifier)
  sessionStorage.setItem(STATE_KEY, state)

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SPOTIFY_SCOPES.join(' '),
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
  })

  return `${SPOTIFY_AUTHORIZE_URL}?${params.toString()}`
}

export async function redirectToAuthorize(): Promise<void> {
  window.location.assign(await buildAuthorizeUrl())
}

export function isValidCallbackState(receivedState: string | null): boolean {
  const expectedState = sessionStorage.getItem(STATE_KEY)
  sessionStorage.removeItem(STATE_KEY)
  return receivedState !== null && receivedState === expectedState
}

function consumeCodeVerifier(): string | null {
  const verifier = sessionStorage.getItem(CODE_VERIFIER_KEY)
  sessionStorage.removeItem(CODE_VERIFIER_KEY)
  return verifier
}

export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const verifier = consumeCodeVerifier()
  if (!verifier) {
    throw new Error('Aucun code_verifier trouvé pour cet échange')
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    client_id: SPOTIFY_CLIENT_ID,
    code_verifier: verifier,
  })

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    throw new Error("Échec de l'échange du code contre un token")
  }

  const data = await response.json()
  return { accessToken: data.access_token, expiresInSeconds: data.expires_in }
}
