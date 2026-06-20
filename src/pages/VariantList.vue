<template>
  <div class="variant-list-page p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-blue-300">Variants</h1>
      <div class="flex items-center gap-2 text-sm text-gray-400">
        <span>{{ totalItems }} total</span>
        <span v-if="filteredVariants.length !== totalItems" class="text-gray-500">
          ({{ filteredVariants.length }} shown on this page)
        </span>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md mb-6 relative">
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-bold">An error occurred:</h3>
        <button @click="error = ''" class="text-red-400 hover:text-red-300 transition-colors text-sm" aria-label="Close error message">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p class="text-sm whitespace-pre-wrap">{{ error }}</p>
      <button @click="loadVariants" class="mt-3 px-3 py-1.5 bg-red-700 text-white rounded text-sm hover:bg-red-600">Retry</button>
    </div>

    <!-- Toolbar -->
    <div class="mb-6 bg-dark-200 p-4 rounded-md border border-dark-100">
      <div class="flex flex-wrap items-center gap-3">
        <!-- Search -->
        <div class="flex-grow min-w-[240px] flex items-center gap-2 bg-dark-100 rounded-md px-3 py-2">
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input v-model="searchTerm" placeholder="Search by SKU or variant name…" class="flex-grow bg-transparent text-white text-sm focus:outline-none" />
        </div>

        <!-- Sort -->
        <select v-model="sortOrder" @change="loadVariants" class="px-3 py-2 bg-dark-100 text-white rounded-md border border-dark-100 text-sm focus:outline-none">
          <option value="asc">Name: A → Z</option>
          <option value="desc">Name: Z → A</option>
          <option value="id-asc">ID: smallest first</option>
          <option value="id-desc">ID: largest first</option>
          <option value="sku-asc">SKU: A → Z</option>
          <option value="sku-desc">SKU: Z → A</option>
          <option value="price-asc">Price: low → high</option>
          <option value="price-desc">Price: high → low</option>
        </select>

        <!-- Page size -->
        <select v-model.number="pageSize" @change="onPageSizeChange" class="px-3 py-2 bg-dark-100 text-white rounded-md border border-dark-100 text-sm focus:outline-none">
          <option :value="25">25 / page</option>
          <option :value="50">50 / page</option>
          <option :value="100">100 / page</option>
          <option :value="200">200 / page</option>
        </select>

        <!-- Reset -->
        <button @click="resetFilters" class="px-3 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500 transition-colors">
          Reset
        </button>

        <!-- Refresh -->
        <button @click="loadVariants" class="px-3 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500 transition-colors flex items-center gap-2" :disabled="loading">
          <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <!-- Diagnostic -->
      <div class="mt-3 text-xs text-gray-500">
        raw={{ allVariants.length }} · displayed={{ filteredVariants.length }} · q="{{ searchTerm }}" · page={{ currentPage }} of {{ totalPages }}
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="w-10 h-10 mx-auto border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="mt-3 text-gray-400 text-sm">Loading variants…</p>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredVariants.length === 0" class="text-center py-12 text-gray-500">
      <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p>No variants found</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-dark-200 rounded-md border border-dark-100 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-dark-300 text-gray-300 text-left">
          <tr>
            <th class="px-3 py-3 font-semibold w-16">ID</th>
            <th class="px-3 py-3 font-semibold">Product</th>
            <th class="px-3 py-3 font-semibold">SKU</th>
            <th class="px-3 py-3 font-semibold">Variant Name</th>
            <th class="px-3 py-3 font-semibold text-right">Price</th>
            <th class="px-3 py-3 font-semibold text-center">Stock</th>
            <th class="px-3 py-3 font-semibold">Channels</th>
            <th class="px-3 py-3 font-semibold text-center">Enabled</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in filteredVariants" :key="v.id" class="border-t border-dark-100 hover:bg-dark-100/50 transition-colors">
            <td class="px-3 py-2 text-gray-500 font-mono text-xs">#{{ v.id }}</td>
            <td class="px-3 py-2">
              <button v-if="v.product" @click="openManageVariants(v.product.id)"
                class="text-blue-300 hover:text-blue-200 hover:underline">
                {{ v.product.name }}
              </button>
              <span v-else class="text-gray-500">—</span>
            </td>
            <td class="px-3 py-2 text-gray-300 font-mono text-xs">{{ v.sku || '—' }}</td>
            <td class="px-3 py-2 text-white">{{ v.name }}</td>
            <td class="px-3 py-2 text-gray-300 font-mono text-right">{{ formatPrice(v.price, v.currencyCode) }}</td>
            <td class="px-3 py-2 text-center">
              <span :class="stockClass(v)">{{ formatStock(v) }}</span>
            </td>
            <td class="px-3 py-2 text-gray-400 text-xs font-mono">
              {{ channelCodes(v) || '—' }}
            </td>
            <td class="px-3 py-2 text-center">
              <span v-if="v.enabled" class="px-2 py-0.5 bg-green-600/30 text-green-300 rounded text-xs">Yes</span>
              <span v-else class="px-2 py-0.5 bg-gray-600/30 text-gray-400 rounded text-xs">No</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-6 flex items-center justify-center gap-2 text-sm">
      <button @click="goToPage(1)" :disabled="currentPage === 1" class="px-3 py-1.5 bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500">
        « First
      </button>
      <button @click="prevPage" :disabled="currentPage === 1" class="px-3 py-1.5 bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500">
        ‹ Prev
      </button>
      <span class="text-gray-400 px-3">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button @click="nextPage" :disabled="currentPage >= totalPages" class="px-3 py-1.5 bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500">
        Next ›
      </button>
      <button @click="goToPage(totalPages)" :disabled="currentPage >= totalPages" class="px-3 py-1.5 bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500">
        Last »
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { gql } from '@apollo/client/core'
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { useAuthStore } from '../stores/auth'
import { getChannelTokenFromQuery } from '../utils/channelToken.js'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// Open the Manage Variants page for a given product in a NEW TAB.
// `router.resolve` builds the proper URL (going through the router's
// path resolution and the channel-propagation guard), then we hand
// that URL to window.open.
const openManageVariants = (productId) => {
  const href = router.resolve({
    name: 'ManageVariants',
    params: { productId },
    query: route.query
  }).href
  window.open(href, '_blank', 'noopener,noreferrer')
}

// ── State ────────────────────────────────────────────────────────────
const allVariants = ref([])
const totalItems = ref(0)
const currentPage = ref(1)
const pageSize = ref(50)
const loading = ref(false)
const error = ref('')
const searchTerm = ref('')
const sortOrder = ref('asc')          // name ASC by default
let searchTimer = null

// ── Apollo client (channel-scoped) ───────────────────────────────────
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
// Sort param maps to ProductVariantSortParameter (one of:
// id, name, sku, price, stockOnHand, etc. — see schema-admin.json)
const sortParamFor = (order) => {
  switch (order) {
    case 'asc': return { name: 'ASC' }
    case 'desc': return { name: 'DESC' }
    case 'id-asc': return { id: 'ASC' }
    case 'id-desc': return { id: 'DESC' }
    case 'sku-asc': return { sku: 'ASC' }
    case 'sku-desc': return { sku: 'DESC' }
    case 'price-asc': return { price: 'ASC' }
    case 'price-desc': return { price: 'DESC' }
    default: return { name: 'ASC' }
  }
}

const LIST_VARIANTS_QUERY = gql`
  query ListVariants($options: ProductVariantListOptions) {
    productVariants(options: $options) {
      items {
        id
        name
        sku
        price
        priceWithTax
        currencyCode
        enabled
        stockOnHand
        stockAllocated
        trackInventory
        createdAt
        updatedAt
        product { id name slug }
        channels { id code }
      }
      totalItems
    }
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

const formatPrice = (price, currency) => {
  if (price == null) return '—'
  return ` ${currency || ''} ${(price/100).toFixed(2)}`.trim()
}

const formatStock = (v) => {
  if (!v.trackInventory) return '∞'
  const onHand = v.stockOnHand ?? 0
  const allocated = v.stockAllocated ?? 0
  return `${onHand - allocated}`
}

const stockClass = (v) => {
  if (!v.trackInventory) return 'text-gray-500 text-xs'
  const onHand = v.stockOnHand ?? 0
  const allocated = v.stockAllocated ?? 0
  const available = onHand - allocated
  if (available <= 0) return 'text-red-400 font-mono text-xs'
  if (available < 10) return 'text-yellow-300 font-mono text-xs'
  return 'text-green-300 font-mono text-xs'
}

const channelCodes = (v) => {
  if (!v.channels?.length) return ''
  return v.channels
    .map(c => c.code)
    .filter(code => code && code !== '__default_channel__')
    .join(', ')
}

// ── Load ─────────────────────────────────────────────────────────────
const loadVariants = async () => {
  loading.value = true
  error.value = ''
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const client = createApolloClient(authStore.token, channelToken)
    const result = await client.query({
      query: LIST_VARIANTS_QUERY,
      variables: {
        options: {
          take: pageSize.value,
          skip: (currentPage.value - 1) * pageSize.value,
          sort: sortParamFor(sortOrder.value)
        }
      },
      fetchPolicy: 'network-only'
    })
    allVariants.value = result.data?.productVariants?.items ?? []
    totalItems.value = result.data?.productVariants?.totalItems ?? allVariants.value.length
    // eslint-disable-next-line no-console
    console.log(`[Variants] Loaded ${allVariants.value.length} of ${totalItems.value} (page ${currentPage.value}, sort=${sortOrder.value})`)
  } catch (err) {
    error.value = extractError(err)
    console.error('[Variants] load error:', err)
  } finally {
    loading.value = false
  }
}

// ── Filter (client-side) ────────────────────────────────────────────
const filteredVariants = computed(() => {
  if (!searchTerm.value) return allVariants.value
  const term = searchTerm.value.toLowerCase()
  return allVariants.value.filter(v =>
    (v.sku && v.sku.toLowerCase().includes(term)) ||
    (v.name && v.name.toLowerCase().includes(term)) ||
    (v.product?.name && v.product.name.toLowerCase().includes(term))
  )
})

const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize.value)))

// ── Pagination ───────────────────────────────────────────────────────
const prevPage = () => { if (currentPage.value > 1) { currentPage.value--; loadVariants() } }
const nextPage = () => { if (currentPage.value < totalPages.value) { currentPage.value++; loadVariants() } }
const goToPage = (n) => { if (n >= 1 && n <= totalPages.value && n !== currentPage.value) { currentPage.value = n; loadVariants() } }
const onPageSizeChange = () => { currentPage.value = 1; loadVariants() }

const resetFilters = () => {
  searchTerm.value = ''
  sortOrder.value = 'asc'
  currentPage.value = 1
  loadVariants()
}

// ── Search debounce → server-side filter via SKU/name ───────────────
// Server-side filter would need a fresh fetch on every keystroke. We
// keep it client-side for snappiness, but debounce a server-side
// SKU-or-name filter as a power-user feature (skips on empty input).
watch(searchTerm, (q) => {
  if (searchTimer) clearTimeout(searchTimer)
})

// ── Lifecycle ────────────────────────────────────────────────────────
onMounted(() => {
  loadVariants()
})
</script>
