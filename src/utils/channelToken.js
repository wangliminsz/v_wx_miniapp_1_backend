export function getChannelTokenFromQuery() {
  // Parse channel mapping from .env
  let channelMapping = []
  console.log('VITE_CHANNEL_MAPPING env var:', import.meta.env.VITE_CHANNEL_MAPPING)
  try {
    channelMapping = JSON.parse(import.meta.env.VITE_CHANNEL_MAPPING || '[]')
    console.log('Parsed channel mapping:', channelMapping)
  } catch (e) {
    console.error('Failed to parse VITE_CHANNEL_MAPPING:', e)
  }
  
  // First, try to get from window.location.search
  if (typeof window !== 'undefined') {
    console.log('window.location:', window.location)
    const params = new URLSearchParams(window.location.search)
    const queryChannelName = params.get('channel')
    console.log('Query channel name:', queryChannelName)
    console.log('Current sessionStorage.selectedChannel:', sessionStorage.getItem('selectedChannel'))
    
    if (queryChannelName) {
      // Save channel name to sessionStorage for later use!
      sessionStorage.setItem('selectedChannel', queryChannelName)
      
      const found = channelMapping.find(c => c.name === queryChannelName)
      console.log('Found channel from mapping:', found)
      if (found) {
        console.log('Returning token from query param:', found.token)
        return found.token
      }
    }
    
    // Check sessionStorage if we have a channel saved!
    const savedChannelName = sessionStorage.getItem('selectedChannel')
    console.log('Checking saved channel from sessionStorage:', savedChannelName)
    if (savedChannelName) {
      const found = channelMapping.find(c => c.name === savedChannelName)
      if (found) {
        console.log('Using saved channel from sessionStorage:', found)
        return found.token
      }
    }
    
    // Still support channelToken directly for backward compatibility
    const queryChannelToken = params.get('channelToken')
    if (queryChannelToken) {
      return queryChannelToken
    }
  }
  
  // Fall back to first channel in mapping if available
  console.log('Falling back to first channel in mapping')
  if (channelMapping.length > 0) {
    return channelMapping[0].token
  }
  
  // Otherwise, return null
  return null
}
