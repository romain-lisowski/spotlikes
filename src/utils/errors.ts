export class TokenExpiredError extends Error {
  constructor() {
    super('Le token Spotify a expiré')
    this.name = 'TokenExpiredError'
  }
}
