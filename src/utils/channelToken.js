const STORAGE_KEY_TOKEN = 'cached_channel_token'
const STORAGE_KEY_NAME = 'selectedChannel'

async function fetchTokenForChannel(channelName) {
  const API_URL = import.meta.env.VITE_VENDURE_ADMIN_API_URL || import.meta.env.VITE_VENDURE_URL
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query GetChannelTokenByCode($code: String!) {
        getChannelTokenByCode(code: $code) {
          id
          code
          token
        }
      }`,
      variables: { code: channelName }
    })
  })
  const data = await response.json()
  if (data.errors) {
    console.error('GraphQL errors in getChannelTokenByCode:', data.errors)
  }
  return data.data?.getChannelTokenByCode?.token || null
}

export async function initializeChannelToken() {
  if (typeof window === 'undefined') return null

  const params = new URLSearchParams(window.location.search)
  let channelName = params.get('channel')

  if (!channelName) {
    channelName = import.meta.env.VITE_URL_IF_NO_CHANNEL || null
  }

  if (!channelName) return null

  sessionStorage.setItem(STORAGE_KEY_NAME, channelName)
  sessionStorage.removeItem(STORAGE_KEY_TOKEN)

  let token = null
  try {
    token = await fetchTokenForChannel(channelName)
  } catch (e) {
    console.error('Failed to fetch channel token:', e)
  }

  if (!token) {
    const fallbackChannel = import.meta.env.VITE_URL_IF_NO_CHANNEL
    if (fallbackChannel && channelName !== fallbackChannel) {
      console.warn(`Channel "${channelName}" not found, falling back to "${fallbackChannel}"`)
      try {
        token = await fetchTokenForChannel(fallbackChannel)
      } catch (e) {
        console.error('Failed to fetch fallback channel token:', e)
      }
    }
  }

  if (token) {
    sessionStorage.setItem(STORAGE_KEY_TOKEN, token)
    return token
  }

  return null
}

export function getChannelTokenFromQuery() {
  let channelMapping = []
  try {
    channelMapping = JSON.parse(import.meta.env.VITE_CHANNEL_MAPPING || '[]')
  } catch (e) {}

  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    let queryChannelName = params.get('channel')

    if (!queryChannelName) {
      queryChannelName = import.meta.env.VITE_URL_IF_NO_CHANNEL || null
    }

    if (queryChannelName) {
      sessionStorage.setItem(STORAGE_KEY_NAME, queryChannelName)
      const cached = sessionStorage.getItem(STORAGE_KEY_TOKEN)
      if (cached) return cached
      const found = channelMapping.find(c => c.name === queryChannelName)
      if (found) return found.token

      const fallbackChannel = import.meta.env.VITE_URL_IF_NO_CHANNEL
      if (fallbackChannel && queryChannelName !== fallbackChannel) {
        const fallbackFound = channelMapping.find(c => c.name === fallbackChannel)
        if (fallbackFound) {
          return fallbackFound.token
        }
      }
    }

    const queryChannelToken = params.get('channelToken')
    if (queryChannelToken) return queryChannelToken
  }

  if (channelMapping.length > 0) return channelMapping[0].token
  return null
}

export function getCachedChannelName() {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(STORAGE_KEY_NAME)
}
