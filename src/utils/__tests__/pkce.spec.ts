import { describe, it, expect } from 'vitest'
import { generateCodeVerifier, generateCodeChallenge } from '../pkce'

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/

describe('generateCodeVerifier', () => {
  it('génère une chaîne au format base64url', () => {
    const verifier = generateCodeVerifier()
    expect(verifier).toMatch(BASE64URL_PATTERN)
  })

  it('génère un verifier différent à chaque appel', () => {
    expect(generateCodeVerifier()).not.toBe(generateCodeVerifier())
  })
})

describe('generateCodeChallenge', () => {
  it('génère un challenge au format base64url', async () => {
    const challenge = await generateCodeChallenge(generateCodeVerifier())
    expect(challenge).toMatch(BASE64URL_PATTERN)
  })

  it('produit toujours le même challenge pour un même verifier', async () => {
    const verifier = generateCodeVerifier()
    const challengeA = await generateCodeChallenge(verifier)
    const challengeB = await generateCodeChallenge(verifier)
    expect(challengeA).toBe(challengeB)
  })

  it('produit des challenges différents pour des verifiers différents', async () => {
    const challengeA = await generateCodeChallenge(generateCodeVerifier())
    const challengeB = await generateCodeChallenge(generateCodeVerifier())
    expect(challengeA).not.toBe(challengeB)
  })
})
