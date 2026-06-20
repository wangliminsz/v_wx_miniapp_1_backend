<template>
  <div class="assets-list-page p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-blue-300">Assets</h1>
      <div class="flex items-center gap-2 text-sm text-gray-400">
        <span>{{ totalItems }} total</span>
        <span v-if="filteredAssets.length !== totalItems" class="text-gray-500">
          ({{ filteredAssets.length }} shown)
        </span>
      </div>
    </div>

    <!-- Error state -->
    <div v-if="error" class="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md mb-6 relative">
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-bold">An error occurred:</h3>
        <button @click="error = ''" class="text-red-400 hover:text-red-300 transition-colors text-sm" aria-label="Close error message">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p class="text-sm">{{ error }}</p>
      <button @click="loadAssets" class="mt-3 px-3 py-1.5 bg-red-700 text-white rounded text-sm hover:bg-red-600">Retry</button>
    </div>

    <!-- Toolbar -->
    <div class="mb-6 bg-dark-200 p-4 rounded-md border border-dark-100">
      <div class="flex flex-wrap items-center gap-3">
        <!-- Search -->
        <div class="flex-grow min-w-[200px] flex items-center gap-2 bg-dark-100 rounded-md px-3 py-2">
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input v-model="searchTerm" placeholder="Search by name…" class="flex-grow bg-transparent text-white text-sm focus:outline-none" />
        </div>

        <!-- Type filter -->
        <select v-model="typeFilter" class="px-3 py-2 bg-dark-100 text-white rounded-md border border-dark-100 text-sm focus:outline-none">
          <option value="">All types</option>
          <option value="image">Images</option>
          <option value="document">Documents</option>
          <option value="video">Videos</option>
        </select>

        <!-- View mode -->
        <div class="flex items-center bg-dark-100 rounded-md overflow-hidden">
          <button @click="viewMode = 'grid'" :class="viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'" class="px-3 py-2 text-sm transition-colors" title="Grid view">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button @click="viewMode = 'list'" :class="viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'" class="px-3 py-2 text-sm transition-colors" title="List view">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>

        <!-- Upload -->
        <label class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm flex items-center gap-2 hover:bg-blue-500 transition-colors cursor-pointer" :class="{ 'opacity-50 cursor-not-allowed': isUploading }">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16V8m0 0l-4 4m4-4l4 4" />
          </svg>
          {{ isUploading ? 'Uploading…' : 'Upload' }}
          <input type="file" class="hidden" multiple @change="handleFileSelect" :disabled="isUploading" />
        </label>

        <!-- Refresh -->
        <button @click="loadAssets" class="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500 transition-colors flex items-center gap-2" :disabled="loading">
          <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Grid view -->
    <div v-if="viewMode === 'grid'">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="filteredAssets.length === 0" class="text-center py-12 text-gray-500">
        <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p>No assets found</p>
      </div>

      <div v-else class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        <div v-for="asset in filteredAssets" :key="asset.id" class="group relative bg-dark-100 border border-dark-100 hover:border-blue-500 rounded-lg overflow-hidden transition-all">
          <!-- Preview -->
          <div class="aspect-square bg-dark-300">
            <img v-if="isImage(asset)" :src="asset.preview" :alt="asset.name" class="w-full h-full object-cover" @error="handleImageError" />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-500">
              <svg v-if="isVideo(asset)" class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <svg v-else class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          <!-- Info -->
          <div class="p-2">
            <p class="text-white text-xs truncate" :title="asset.name">{{ asset.name }}</p>
            <p class="text-gray-500 text-xs mt-0.5">
              {{ formatBytes(asset.fileSize) }}
              <span v-if="asset.mimeType" class="ml-1">· {{ shortMime(asset.mimeType) }}</span>
            </p>
          </div>

          <!-- Hover overlay with actions -->
          <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button @click.stop="copyAssetId(asset)" class="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500" title="Copy ID">
              Copy ID
            </button>
            <a :href="asset.source" target="_blank" @click.stop class="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-500">
              Open
            </a>
            <button @click.stop="confirmDelete(asset)" class="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-500" title="Delete">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- List view -->
    <div v-else>
      <div v-if="loading" class="text-center py-12 text-gray-400">Loading…</div>
      <div v-else-if="filteredAssets.length === 0" class="text-center py-12 text-gray-500">No assets found</div>
      <div v-else class="bg-dark-200 rounded-md border border-dark-100 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-dark-300 text-gray-300 text-left">
            <tr>
              <th class="px-3 py-2 w-12"></th>
              <th class="px-3 py-2 font-semibold">ID</th>
              <th class="px-3 py-2 font-semibold">Name</th>
              <th class="px-3 py-2 font-semibold">Type</th>
              <th class="px-3 py-2 font-semibold">Size</th>
              <th class="px-3 py-2 font-semibold w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="asset in filteredAssets" :key="asset.id" class="border-t border-dark-100 hover:bg-dark-100/50">
              <td class="px-3 py-2">
                <div class="w-10 h-10 bg-dark-100 rounded overflow-hidden flex items-center justify-center">
                  <img v-if="isImage(asset)" :src="asset.preview" :alt="asset.name" class="w-full h-full object-cover" @error="handleImageError" />
                  <svg v-else class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </td>
              <td class="px-3 py-2 text-gray-400 font-mono text-xs">#{{ asset.id }}</td>
              <td class="px-3 py-2 text-white">{{ asset.name }}</td>
              <td class="px-3 py-2 text-gray-400 text-xs font-mono">{{ shortMime(asset.mimeType) }}</td>
              <td class="px-3 py-2 text-gray-400 text-xs">{{ formatBytes(asset.fileSize) }}</td>
              <td class="px-3 py-2 text-right whitespace-nowrap">
                <button @click="copyAssetId(asset)" class="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500 mr-1">Copy ID</button>
                <a :href="asset.source" target="_blank" class="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-500 mr-1 inline-block">Open</a>
                <button @click="confirmDelete(asset)" class="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-500">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="filteredAssets.length > 0" class="mt-6 flex items-center justify-center gap-2 text-sm">
      <button @click="prevPage" :disabled="currentPage === 1" class="px-3 py-1.5 bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500">
        ‹ Prev
      </button>
      <span class="text-gray-400 px-3">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button @click="nextPage" :disabled="currentPage >= totalPages" class="px-3 py-1.5 bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500">
        Next ›
      </button>
    </div>

    <!-- Delete confirmation modal -->
    <div v-if="assetToDelete" class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.75);">
      <div class="bg-dark-200 rounded-lg shadow-xl border border-gray-600 p-6 max-w-sm">
        <h3 class="text-lg font-semibold text-white mb-3">Delete asset?</h3>
        <p class="text-gray-300 text-sm mb-5">
          Are you sure you want to delete
          <span class="font-semibold text-white">"{{ assetToDelete.name }}"</span>?
          This action cannot be undone.
        </p>
        <div class="flex justify-end gap-2">
          <button @click="assetToDelete = null" class="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500">
            Cancel
          </button>
          <button @click="deleteAsset" :disabled="isDeleting" class="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-500 disabled:opacity-50">
            {{ isDeleting ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast" class="fixed bottom-6 right-6 px-4 py-2 rounded-md text-sm shadow-lg z-50"
      :class="toastType === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'">
      {{ toast }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { gql } from '@apollo/client/core'
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { useAuthStore } from '../stores/auth'
import { getChannelTokenFromQuery } from '../utils/channelToken.js'

const authStore = useAuthStore()

// ── State ────────────────────────────────────────────────────────────
const allAssets = ref([])            // raw list for current page
const totalItems = ref(0)
const currentPage = ref(1)
const pageSize = 100
const loading = ref(false)
const error = ref('')
const searchTerm = ref('')
const typeFilter = ref('')
const viewMode = ref('grid')         // 'grid' or 'list'
const isUploading = ref(false)
const isDeleting = ref(false)
const assetToDelete = ref(null)
const toast = ref('')
const toastType = ref('success')
let toastTimer = null

// ── Apollo client (channel-scoped, same as AssetSelector) ────────────
const createApolloClient = (authToken, channelToken = null) => {
  const httpLink = createHttpLink({
    uri: import.meta.env.VITE_VENDURE_ADMIN_API_URL,
    fetchOptions: { credentials: 'include' }
  })
  const authLink = setContext((_, { headers }) => {
    const requestHeaders = {
      ...headers,
      authorization: authToken ? `Bearer ${authToken}` : '',
    }
    if (channelToken) requestHeaders['vendure-token'] = channelToken
    return { headers: requestHeaders }
  })
  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  })
}

// ── GraphQL ──────────────────────────────────────────────────────────
const LIST_ASSETS_QUERY = gql`
  query ListAssets($options: AssetListOptions) {
    assets(options: $options) {
      items {
        id
        name
        preview
        source
        fileSize
        mimeType
        width
        height
        createdAt
        updatedAt
      }
      totalItems
    }
  }
`

const CREATE_ASSET_MUTATION = gql`
  mutation CreateAsset($input: CreateAssetInput!) {
    createAssets(input: [$input]) {
      ... on Asset { id name }
      ... on MimeTypeError { errorCode message fileName }
    }
  }
`

const DELETE_ASSET_MUTATION = gql`
  mutation DeleteAsset($input: DeleteAssetInput!) {
    deleteAsset(input: $input) { result }
  }
`

// ── Helpers ──────────────────────────────────────────────────────────
const extractError = (err) => {
  if (err.graphQLErrors?.length) {
    return err.graphQLErrors.map(e => e.message).join('\n')
  }
  if (err.networkError) return err.networkError.message || 'Network error'
  return err.message || String(err) || 'Unknown error'
}

const showToast = (message, type = 'success') => {
  toast.value = message
  toastType.value = type
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 3000)
}

const isImage = (a) => a.mimeType?.toLowerCase().startsWith('image/')
const isVideo = (a) => a.mimeType?.toLowerCase().startsWith('video/')
const shortMime = (mime) => mime ? mime.split('/').pop().toUpperCase().slice(0, 6) : '—'

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let n = bytes
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`
}

const handleImageError = (event) => {
  event.target.src = 'https://via.placeholder.com/200x200?text=Asset'
}

const copyAssetId = async (asset) => {
  try {
    await navigator.clipboard.writeText(asset.id)
    showToast(`Copied ID: ${asset.id}`)
  } catch {
    showToast('Failed to copy ID', 'error')
  }
}

// ── Load (paginated) ─────────────────────────────────────────────────
const loadAssets = async () => {
  loading.value = true
  error.value = ''
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const client = createApolloClient(authStore.token, channelToken)
    const result = await client.query({
      query: LIST_ASSETS_QUERY,
      variables: {
        options: {
          take: pageSize,
          skip: (currentPage.value - 1) * pageSize,
          sort: { id: 'DESC' }
        }
      },
      fetchPolicy: 'network-only'
    })
    allAssets.value = result.data?.assets?.items ?? []
    totalItems.value = result.data?.assets?.totalItems ?? allAssets.value.length
    // eslint-disable-next-line no-console
    console.log(`[Assets] Loaded ${allAssets.value.length} of ${totalItems.value} (page ${currentPage.value})`)
  } catch (err) {
    error.value = extractError(err)
    console.error('[Assets] load error:', err)
  } finally {
    loading.value = false
  }
}

// ── Filter (client-side) ────────────────────────────────────────────
const filteredAssets = computed(() => {
  let result = [...allAssets.value]
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    result = result.filter(a => a.name.toLowerCase().includes(term))
  }
  if (typeFilter.value) {
    result = result.filter(a => {
      const mime = a.mimeType?.toLowerCase() || ''
      if (typeFilter.value === 'image') return mime.startsWith('image/')
      if (typeFilter.value === 'document') return mime.includes('pdf') || mime.includes('doc') || mime.includes('text') || mime.includes('sheet')
      if (typeFilter.value === 'video') return mime.startsWith('video/')
      return true
    })
  }
  return result
})

const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)))

// ── Pagination ───────────────────────────────────────────────────────
const prevPage = () => { if (currentPage.value > 1) { currentPage.value--; loadAssets() } }
const nextPage = () => { if (currentPage.value < totalPages.value) { currentPage.value++; loadAssets() } }

// ── Upload ───────────────────────────────────────────────────────────
// graphql-multipart-request-spec: `operations` + `map` + `0`, `1`, ...
const uploadOneAsset = async (file) => {
  const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
  const operations = {
    query: CREATE_ASSET_MUTATION.loc.source.body,
    variables: { input: { file: null } }
  }
  const map = { '0': ['variables.input.file'] }
  const fd = new FormData()
  fd.append('operations', JSON.stringify(operations))
  fd.append('map', JSON.stringify(map))
  fd.append('0', file, file.name)

  const apiUrl = import.meta.env.VITE_VENDURE_ADMIN_API_URL
  const headers = { 'Authorization': `Bearer ${authStore.token}` }
  if (channelToken) headers['vendure-token'] = channelToken

  const res = await fetch(apiUrl, { method: 'POST', body: fd, headers })
  const json = await res.json()
  const result = json?.data?.createAssets?.[0]
  if (!result) {
    throw new Error(json?.errors?.[0]?.message || 'Upload failed')
  }
  if (result.errorCode) {
    throw new Error(`${result.fileName || 'file'}: ${result.message}`)
  }
  return result
}

const handleFileSelect = async (event) => {
  const files = Array.from(event.target.files || [])
  if (!files.length) return
  event.target.value = ''
  isUploading.value = true
  let success = 0
  const failures = []
  for (const file of files) {
    try {
      await uploadOneAsset(file)
      success++
    } catch (e) {
      failures.push(`${file.name}: ${e.message}`)
    }
  }
  isUploading.value = false
  if (failures.length === 0) {
    showToast(`Uploaded ${success} file${success !== 1 ? 's' : ''}`)
  } else if (success > 0) {
    showToast(`Uploaded ${success}; failed: ${failures.join('; ')}`, 'error')
  } else {
    showToast(`All ${failures.length} uploads failed: ${failures.join('; ')}`, 'error')
  }
  if (success > 0) loadAssets()
}

// ── Delete ───────────────────────────────────────────────────────────
const confirmDelete = (asset) => { assetToDelete.value = asset }

const deleteAsset = async () => {
  if (!assetToDelete.value) return
  isDeleting.value = true
  const id = assetToDelete.value.id
  try {
    const client = createApolloClient(
      authStore.token,
      getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    )
    await client.mutate({
      mutation: DELETE_ASSET_MUTATION,
      variables: { input: { id, force: true } }
    })
    showToast(`Deleted asset #${id}`)
    assetToDelete.value = null
    loadAssets()
  } catch (err) {
    showToast(`Delete failed: ${extractError(err)}`, 'error')
  } finally {
    isDeleting.value = false
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────
onMounted(() => {
  loadAssets()
})

// Reset to page 1 if filters change
watch([searchTerm, typeFilter], () => { /* client-side only, no refetch */ })
</script>
