<template>
  <div class="collections-list-section">
    <h2 class="text-3xl font-bold text-center mb-8 text-dark-300 drop-shadow-lg">Collections</h2>

    <div v-if="loading && !collections.length" class="text-center py-10 text-gray-400">Loading collections...</div>

    <div v-else-if="error" class="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md mb-6">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <h3 class="font-bold mb-2">An error occurred while loading collections:</h3>
          <p class="text-sm whitespace-pre-wrap">{{ error }}</p>
        </div>
        <button @click="loadCollections" class="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-md text-sm">
          Retry
        </button>
      </div>
    </div>

    <template v-else>
      <!-- Toolbar -->
      <div class="mb-6 flex flex-wrap items-center gap-4">
        <div class="relative flex-1 max-w-md">
          <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="Search by name or slug..."
            class="w-full px-4 py-2 pl-10 bg-dark-200 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors text-sm" />
          <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <label class="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input v-model="topLevelOnly" type="checkbox"
            class="w-4 h-4 rounded border-dark-100 bg-dark-300 text-secondary focus:ring-secondary" />
          Top-level only
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input v-model="showPrivate" type="checkbox"
            class="w-4 h-4 rounded border-dark-100 bg-dark-300 text-secondary focus:ring-secondary" />
          Show private
        </label>
        <div class="flex items-center gap-2 ml-auto">
          <span class="text-sm text-gray-400">
            {{ displayedCollections.length === totalItems
                ? `${totalItems} collections`
                : `${displayedCollections.length} of ${totalItems} collections` }}
          </span>
          <button @click="resetFilters" :disabled="loading"
            class="px-3 py-1.5 bg-gray-700 text-white rounded-md text-sm transition-colors hover:bg-gray-600 disabled:opacity-50"
            title="Reset search and show-private toggle">
            Reset
          </button>
          <button @click="loadCollections" :disabled="loading"
            class="px-3 py-1.5 bg-gray-600 text-white rounded-md text-sm transition-colors hover:bg-gray-500 disabled:opacity-50">
            {{ loading ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>
      </div>

      <!-- Tiny diagnostic so it's obvious what state we're in -->
      <div class="mb-3 text-xs text-gray-500">
        raw={{ collections.length }} · displayed={{ displayedCollections.length }} ·
        private={{ collections.filter(c => c.isPrivate === true).length }} ·
        public={{ collections.filter(c => c.isPrivate !== true).length }}
      </div>

      <!-- Collections table -->
      <div v-if="displayedCollections.length" class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-dark-100 text-gray-400 text-sm uppercase tracking-wider">
              <th class="px-4 py-3 font-semibold w-20">ID</th>
              <th class="px-4 py-3 font-semibold">Name</th>
              <th class="px-4 py-3 font-semibold">Slug</th>
              <th class="px-4 py-3 font-semibold">Position</th>
              <th class="px-4 py-3 font-semibold">Parent</th>
              <th class="px-4 py-3 font-semibold">Products</th>
              <th class="px-4 py-3 font-semibold">Featured</th>
              <th v-if="isSuperAdmin" class="px-4 py-3 font-semibold">Channel</th>
              <th class="px-4 py-3 font-semibold">Visibility</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in displayedCollections" :key="c.id" @click="goToDetail(c)"
              class="border-b border-dark-100 hover:bg-dark-200/50 transition-colors cursor-pointer">
              <td class="px-4 py-3 text-blue-300 font-mono text-xs">{{ c.id }}</td>
              <td class="px-4 py-3 text-gray-200 font-medium">
                <div class="flex items-center gap-2" :style="{ paddingLeft: (c.__depth || 0) * 20 + 'px' }">
                  <span v-if="c.__depth > 0" class="text-gray-600 text-xs">└─</span>
                  <span>{{ c.name }}</span>
                  <span v-if="c.children?.length && c.__depth === 0" class="text-xs text-gray-500">+{{ c.children.length }} children</span>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-400 font-mono text-xs">{{ c.slug }}</td>
              <td class="px-4 py-3 text-gray-300 text-center">{{ c.position }}</td>
              <td class="px-4 py-3 text-gray-300 text-sm font-mono">
                <span v-if="c.parent">#{{ c.parentId }}</span>
                <span v-else class="text-gray-600">—</span>
              </td>
              <td class="px-4 py-3 text-gray-300 text-center">{{ productCount(c) }}</td>
              <td class="px-4 py-3">
                <img v-if="c.featuredAsset" :src="c.featuredAsset.preview" :alt="c.featuredAsset.name"
                  class="w-10 h-10 object-cover rounded border border-dark-100" />
                <span v-else class="text-gray-600 text-xs">—</span>
              </td>
              <td v-if="isSuperAdmin" class="px-4 py-3 text-gray-300 text-xs font-mono">
                <span v-if="channelMap[c.id] === undefined" class="text-gray-600 italic">loading…</span>
                <span v-else-if="channelMap[c.id]" class="text-blue-300">{{ channelMap[c.id] }}</span>
                <span v-else class="text-gray-600">—</span>
              </td>
              <td class="px-4 py-3">
                <span v-if="c.isPrivate"
                  class="px-2 py-0.5 bg-yellow-600/30 text-yellow-300 rounded text-xs font-bold">Private</span>
                <span v-else
                  class="px-2 py-0.5 bg-green-600/30 text-green-300 rounded text-xs font-bold">Public</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center py-10 text-gray-500">No collections found.</div>
    </template>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { useAuthStore } from '../stores/auth.js'
import { getChannelTokenFromQuery } from '../utils/channelToken.js'

const authStore = useAuthStore()
const isSuperAdmin = computed(() => !!authStore.isSuperAdmin)
const collections = ref([])            // raw, un-sorted from server
const displayedCollections = ref([])   // final list shown in the table
                                              // (= sorted + filtered). Updated
                                              // directly in the load function
                                              // and in resetFilters.
const loading = ref(false)
const error = ref('')
const totalItems = ref(0)
const channelMap = ref({})             // collectionId -> "channel_Wang, channel_Dsy_sp, blank_channel"
                                       // (the system __default_channel__ is filtered out,
                                       // matching the CustomerList helper)

const topLevelOnly = ref(false)
const showPrivate = ref(true)
const searchQuery = ref('')
let searchTimer = null

// GraphQL query — schema-admin.json `Collection` type fields
// (id, name, slug, description, position, parentId, isPrivate,
//  createdAt, updatedAt, parent, children, productVariants, featuredAsset)
const LIST_COLLECTIONS_QUERY = gql`
  query ListCollections($options: CollectionListOptions) {
    collections(options: $options) {
      totalItems
      items {
        id
        name
        slug
        description
        position
        parentId
        isPrivate
        createdAt
        updatedAt
        parent { id name }
        children { id }
        productVariants(options: { take: 1 }) { totalItems }
        featuredAsset { id name preview }
      }
    }
  }
`

const buildApolloClient = () => {
  const httpLink = createHttpLink({
    uri: import.meta.env.VITE_VENDURE_ADMIN_API_URL,
    fetchOptions: { credentials: 'include' }
  })
  const authLink = setContext((_, { headers }) => {
    const requestHeaders = {
      ...headers,
      authorization: authStore.token ? `Bearer ${authStore.token}` : '',
    }
    // Scope the listing to the active channel (from URL or auth store).
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token
    if (channelToken) requestHeaders['vendure-token'] = channelToken
    return { headers: requestHeaders }
  })
  return new ApolloClient({ link: authLink.concat(httpLink), cache: new InMemoryCache() })
}

// Sort helper: build a `parentId -> children[]` index, then walk
// top-level collections in id ASC order, emitting each parent and all
// of its descendants in id ASC order. Each emitted record gets a
// `__depth` field so the template can render a visual indent.
//
// Robust to:
//   - parentId === null  (canonical top-level)
//   - parentId === 0     (some Vendure installs serialize 0 as a
//                         placeholder; we treat it as top-level)
//   - parentId points to a collection that ISN'T in the loaded page
//     (orphan — emit it as if it were top-level so the user still
//     sees it instead of silently dropping it)
const byId = (a, b) => Number(a.id) - Number(b.id)
const buildSortedList = (list) => {
  // Index every loaded collection by id so we can check whether a
  // given parentId refers to a real collection or to something else.
  const loadedIds = new Set(list.map(c => String(c.id)))
  const childrenByParent = new Map()
  let topLevelCount = 0
  let subCount = 0
  let orphanCount = 0
  for (const c of list) {
    const isTopLevel = c.parentId == null
    const isOrphan = !isTopLevel && !loadedIds.has(String(c.parentId))
    let key
    if (isTopLevel || isOrphan) {
      key = '__root__'
      if (isTopLevel) topLevelCount++
      else orphanCount++
    } else {
      key = String(c.parentId)
      subCount++
    }
    if (!childrenByParent.has(key)) childrenByParent.set(key, [])
    childrenByParent.get(key).push(c)
  }
  for (const arr of childrenByParent.values()) arr.sort(byId)

  const out = []
  const walk = (parentKey, depth) => {
    const kids = childrenByParent.get(parentKey) || []
    for (const c of kids) {
      out.push({ ...c, __depth: depth })
      walk(String(c.id), depth + 1)
    }
  }
  walk('__root__', 0)
  // eslint-disable-next-line no-console
  console.log(`[Collections] buildSortedList: in=${list.length}, topLevel=${topLevelCount}, sub=${subCount}, orphan=${orphanCount}, out=${out.length}`)
  return out
}

// Sort + filter helper. Called explicitly from the load function and
// from resetFilters. This avoids the computed-reactivity timing issue
// we were hitting (the filter re-running before the data was set).
const applyFilters = () => {
  const q = searchQuery.value.trim().toLowerCase()
  const sorted = buildSortedList(collections.value)
  const out = sorted.filter(c => {
    if (c.isPrivate === true && !showPrivate.value) return false
    if (!q) return true
    return (c.name || '').toLowerCase().includes(q) ||
           (c.slug || '').toLowerCase().includes(q)
  })
  displayedCollections.value = out
  // eslint-disable-next-line no-console
  console.log(`[Collections] applyFilters: raw=${collections.value.length}, sorted=${sorted.length}, out=${out.length}, q="${q}", showPrivate=${showPrivate.value}`)
}

const productCount = (c) => c.productVariants?.totalItems ?? 0

// Per-collection channel fetch (superadmin only). Mirrors the
// REST-client request shape from the user:
//   query GetCollectionWithChannels($id: ID!) {
//     collection(id: $id) { assignedChannels { id code token } }
//   }
// One request per collection, fired in parallel. Promise.allSettled
// ensures one bad row doesn't kill the whole batch.
const GET_COLLECTION_CHANNELS_QUERY = gql`
  query GetCollectionWithChannels($id: ID!) {
    collection(id: $id) {
      id
      assignedChannels { id code token }
    }
  }
`
const loadChannelsForCollections = async (list) => {
  if (!isSuperAdmin.value || !list.length) return
  const client = buildApolloClient()
  const results = await Promise.allSettled(
    list.map(c =>
      client.query({
        query: GET_COLLECTION_CHANNELS_QUERY,
        variables: { id: c.id },
        fetchPolicy: 'network-only'
      })
    )
  )
  const next = { ...channelMap.value }
  results.forEach((r, i) => {
    const id = String(list[i].id)
    if (r.status === 'fulfilled') {
      const channels = r.value.data?.collection?.assignedChannels ?? []
      const codes = channels
        .map(ch => ch.code)
        .filter(code => code && code !== '__default_channel__')
      next[id] = codes.join(', ')
    } else {
      // Mark as empty string (not undefined) so the cell stops
      // showing "loading…" and shows "—"
      next[id] = ''
      // eslint-disable-next-line no-console
      console.warn(`[Collections] channel fetch failed for ${id}:`, r.reason)
    }
  })
  channelMap.value = next
}

const goToDetail = (c) => {
  // Vendure admin URL: open in a new tab to avoid leaving the panel
  const apiUrl = import.meta.env.VITE_VENDURE_ADMIN_API_URL || import.meta.env.VITE_VENDURE_URL || ''
  const adminUiBase = apiUrl.replace(/\/admin-api.*$/, '').replace(/\/api\/.*$/, '') + '/admin'
  window.open(`${adminUiBase}/catalog/collections/${c.id}`, '_blank')
}

const loadCollections = async () => {
  loading.value = true
  error.value = ''
  try {
    const client = buildApolloClient()
    // Vendure caps `take` at MAX_LIST_SIZE (default 100) on the admin
    // API, so we page through the full list ourselves. The hierarchical
    // sort needs every record in memory at once.
    const PAGE_SIZE = 100
    const allItems = []
    let totalItemsValue = 0
    let skip = 0
    // Safety cap to avoid infinite loops if the API ever reports more
    // items than it can return within MAX_LIST_SIZE per request.
    const MAX_PAGES = 50
    for (let i = 0; i < MAX_PAGES; i++) {
      const result = await client.query({
        query: LIST_COLLECTIONS_QUERY,
        variables: {
          options: {
            take: PAGE_SIZE,
            skip,
            topLevelOnly: topLevelOnly.value,
            sort: { id: 'ASC' }
          }
        },
        fetchPolicy: 'network-only'
      })
      const items = result.data?.collections?.items ?? []
      totalItemsValue = result.data?.collections?.totalItems ?? 0
      allItems.push(...items)
      // Stop when we've fetched everything, or the page came back short
      if (allItems.length >= totalItemsValue || items.length < PAGE_SIZE) break
      skip += PAGE_SIZE
    }
    collections.value = allItems
    totalItems.value = totalItemsValue
    applyFilters()
    // eslint-disable-next-line no-console
    console.log(`[Collections] Loaded ${allItems.length} of ${totalItemsValue}`)
    // Superadmin-only: fetch each collection's assigned channels in
    // parallel. Non-blocking — the table is already rendered by now.
    loadChannelsForCollections(allItems)
  } catch (err) {
    // GraphQL errors are usually in err.graphQLErrors, not err.message
    const messages = []
    if (err?.graphQLErrors?.length) {
      for (const e of err.graphQLErrors) messages.push(e.message)
    }
    if (err?.networkError) messages.push(`Network error: ${err.networkError.message || err.networkError}`)
    if (!messages.length) messages.push(err?.message || String(err) || 'Unknown error')
    error.value = messages.join('\n')
    // eslint-disable-next-line no-console
    console.error('[Collections] Load failed:', err)
  } finally {
    loading.value = false
  }
}

const onSearchInput = () => {
  // Debounced search just re-filters the in-memory list (no network).
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (collections.value.length) applyFilters()
  }, 200)
}

const resetFilters = () => {
  searchQuery.value = ''
  showPrivate.value = true
  // Re-apply filters immediately against whatever is loaded
  if (collections.value.length) applyFilters()
  // topLevelOnly stays — that's a server-side filter, the user has to
  // explicitly toggle it (and that triggers its own refetch).
}

// Re-fetch only when the server-side filter changes. `showPrivate` and
// the search query are pure client-side filters and don't need a refetch.
watch(topLevelOnly, () => {
  loadCollections()
})

// Re-apply filters when the client-side toggles change (cheap, no network)
watch([showPrivate, searchQuery], () => {
  if (collections.value.length) applyFilters()
})

onMounted(loadCollections)
</script>

<style scoped>
.collections-list-section {
  margin-top: 2rem;
}
</style>
