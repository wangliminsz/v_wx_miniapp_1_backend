<template>
  <div class="variant-group-list-section">
    <h2 class="text-3xl font-bold text-center mb-8 text-dark-300 drop-shadow-lg">Variants with Group</h2>

    <div v-if="loading" class="text-center py-10 text-gray-400">Loading variants...</div>

    <div v-else-if="error" class="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md mb-6">
      <h3 class="font-bold mb-2">An error occurred:</h3>
      <p class="text-sm">{{ error }}</p>
    </div>

    <template v-else>
      <!-- Info bar -->
      <div class="mb-4 flex items-center justify-between">
        <span class="text-gray-400 text-sm">{{ totalItems }} variants with price-by-layer</span>
        <button @click="toggleSort" class="px-4 py-2 bg-gray-700 text-white rounded-md text-sm hover:bg-gray-600 transition-colors flex items-center gap-2">
          <span class="text-blue-300 font-bold">Name:</span>
          <svg v-if="sortOrder === 'asc'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
          </svg>
        </button>
      </div>

      <!-- Table -->
      <div v-if="displayedVariants.length" class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-dark-100 text-gray-400 text-sm uppercase tracking-wider">
              <th class="px-4 py-3 font-semibold">Product</th>
              <th class="px-4 py-3 font-semibold">SKU</th>
              <th class="px-4 py-3 font-semibold">Variant</th>
              <th class="px-4 py-3 font-semibold text-right">Price</th>
              <th class="px-4 py-3 font-semibold">Channels</th>
              <th class="px-4 py-3 font-semibold">Price By Layer</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="variant in displayedVariants" :key="variant.id" class="border-b border-dark-100 hover:bg-dark-200/50 transition-colors">
              <td class="px-4 py-3 text-gray-300">{{ variant.product?.name || '-' }}</td>
              <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ variant.sku }}</td>
              <td class="px-4 py-3 text-blue-300 font-mono text-sm">{{ variant.name }}</td>
              <td class="px-4 py-3 text-gray-300 font-mono text-right">{{ formatPrice(variant.price) }}</td>
              <td class="px-4 py-3 text-gray-400 text-xs">{{ variant.channels?.map(c => c.code).join(', ') || '-' }}</td>
              <td class="px-4 py-3 text-gray-300 font-mono text-xs max-w-xs truncate">{{ variant.customFields?.priceByLayer }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center py-10 text-gray-500">No variants with price-by-layer found.</div>

      <!-- Pagination -->
      <div v-if="pageCount > 1" class="flex items-center justify-center gap-3 mt-8">
        <button @click="firstPage" :disabled="currentPage === 1"
          class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">First</button>
        <button @click="prevPage" :disabled="currentPage === 1"
          class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">Previous</button>
        <div class="flex items-center gap-2">
          <button v-for="page in visiblePages" :key="page" @click="goToPage(page)" :class="['px-3 py-2 rounded-md transition-colors',
            currentPage === page ? 'bg-primary text-white' : 'bg-gray-600 text-white']">{{ page }}</button>
        </div>
        <span class="text-gray-300">Page {{ currentPage }} of {{ pageCount }}</span>
        <button @click="nextPage" :disabled="currentPage >= pageCount"
          class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">Next</button>
        <button @click="lastPage" :disabled="currentPage >= pageCount"
          class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">Last</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { getChannelTokenFromQuery } from '../utils/channelToken.js'
import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'

const authStore = useAuthStore()

const totalItems = ref(0)
const items = ref([])
const loading = ref(false)
const error = ref('')
const sortOrder = ref('asc')
const currentPage = ref(1)
const pageSize = 30

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
    if (channelToken) {
      requestHeaders['vendure-token'] = channelToken
    }
    return { headers: requestHeaders }
  })
  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  })
}

const GET_B2B_VARIANTS = gql`
  query GetB2BVariants($options: ProductVariantListOptions) {
    b2bVariants(options: $options) {
      totalItems
      items {
        id
        name
        sku
        price
        customFields {
          priceByLayer
        }
        product {
          id
          name
        }
        channels {
          id
          code
          token
        }
      }
    }
  }
`

const pageCount = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)))

const displayedVariants = computed(() => items.value)

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(pageCount.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const fetchVariants = async () => {
  loading.value = true
  error.value = ''
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    console.log('channelToken----------------------->', channelToken)
    
    const apolloClient = createApolloClient(authStore.token, channelToken)
    const skip = (currentPage.value - 1) * pageSize
    const { data } = await apolloClient.query({
      query: GET_B2B_VARIANTS,
      variables: {
        options: {
          take: pageSize,
          skip,
          sort: { name: sortOrder.value === 'asc' ? 'ASC' : 'DESC' }
        }
      },
      fetchPolicy: 'network-only'
    })
    totalItems.value = data.b2bVariants.totalItems || 0
    items.value = data.b2bVariants.items || []
  } catch (err) {
    console.error('Failed to fetch variants:', err)
    error.value = err.message || 'Failed to load variants'
  } finally {
    loading.value = false
  }
}

const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  currentPage.value = 1
  fetchVariants()
}

const goToPage = (page) => {
  currentPage.value = page
  fetchVariants()
}
const firstPage = () => goToPage(1)
const prevPage = () => goToPage(Math.max(1, currentPage.value - 1))
const nextPage = () => goToPage(Math.min(pageCount.value, currentPage.value + 1))
const lastPage = () => goToPage(pageCount.value)

const formatPrice = (value) => {
  if (value == null) return '-'
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(value / 100)
}

onMounted(() => {
  fetchVariants()
})
</script>
