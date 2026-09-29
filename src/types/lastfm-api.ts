export interface LastfmTopTagsResponse {
  toptags?: {
    tag: { name: string }[]
  }
  error?: number
  message?: string
}
