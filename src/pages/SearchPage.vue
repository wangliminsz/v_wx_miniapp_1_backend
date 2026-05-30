<template>
  <div class="product-list-section">
    <h2 class="text-2xl font-semibold text-gray-300 mb-6">Search Products</h2>

    <!-- Search Input -->
    <div class="mb-6 flex items-center gap-4">
      <input v-model="searchTerm" @keyup.enter="performSearch" placeholder="Enter search term..."
        class="flex-grow px-4 py-2 bg-dark-200 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors" />
      <button @click="performSearch" :disabled="loading"
        class="px-6 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        {{ loading ? 'Searching...' : 'Search' }}
      </button>
    </div>

    <!-- Search History -->
    <div v-if="searchHistory.length > 0" class="mb-6">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-gray-400 text-sm">Search History:</span>
        <button @click="clearSearchHistory" class="text-xs text-gray-500 hover:text-red-400 transition-colors">
          Clear All
        </button>
      </div>
      <div class="flex flex-wrap gap-2">
        <button v-for="(term, index) in searchHistory" :key="index" @click="searchFromHistory(term)"
          class="px-3 py-1 bg-dark-200 text-gray-300 rounded-full text-sm hover:bg-dark-100 hover:text-white transition-colors">
          {{ term }}
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-10 text-gray-400">Searching products...</div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md mb-6">
      <h3 class="font-bold mb-2">An error occurred:</h3>
      <p class="text-sm">{{ error }}</p>
    </div>

    <!-- Success state -->
    <div v-else-if="products.length > 0">
      <!-- Collection filter and view mode toggle -->
      <div class="mb-6 flex flex-wrap items-center gap-4">
        <!-- Results info -->
        <div class="text-blue-300">
          Found {{ totalCount }} result(s)
        </div>

      </div>

      <!-- Products display - Card or List view -->

      <!-- Card view -->
      <div v-if="viewMode === 'card'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div v-for="product in products" :key="product.productId"
          class="bg-dark-200 rounded-lg border border-dark-100 overflow-hidden transition-all duration-300 hover:border-secondary hover:shadow-lg hover:-translate-y-1">
          <!-- Product image -->
          <div class="h-48 overflow-hidden bg-dark-100">
            <img :src="getAssetUrl(product.productAsset?.preview)" :alt="product.productName"
              class="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
          </div>

          <!-- Product details -->
          <div class="p-4">
            <h3 class="text-lg font-semibold text-white mb-2 line-clamp-2">{{ product.productName }}</h3>
            <p class="text-sm text-gray-400 mb-1">ID: {{ product.productId }}</p>
            <p class="text-sm text-secondary">Variants: {{ product.variantCount }}</p>
            <p class="text-sm text-green-400 mt-1">Price: ${{ product.minPrice }} - ${{ product.maxPrice }}</p>
            <!-- Facets -->
            <div class="mt-2 flex flex-wrap gap-2">
              <span v-for="facet in product.productFacets" :key="facet.id"
                class="text-xs bg-dark-300 text-gray-300 px-2 py-1 rounded-full">
                {{ facet.name }}
              </span>
            </div>
            
            <!-- Product Description Section -->
            <div class="mt-3">
              <div v-if="editingProductId === product.productId" class="space-y-2">
                <textarea
                  v-model="editingDescription"
                  class="w-full px-3 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors resize-vertical min-h-[80px] text-sm"
                  placeholder="Enter product description..."></textarea>
                <div class="flex gap-2">
                  <button
                    @click="saveProductDescription(product)"
                    :disabled="isUpdatingDescription"
                    class="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ isUpdatingDescription ? 'Saving...' : 'Save' }}
                  </button>
                  <button
                    @click="cancelEditingDescription"
                    :disabled="isUpdatingDescription"
                    class="px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Cancel
                  </button>
                </div>
              </div>
              <div v-else class="flex items-start justify-between gap-2">
                <p class="text-sm text-gray-400 flex-1 line-clamp-2" :class="{ 'text-gray-500': !getProductDescription(product) }">
                  {{ getProductDescription(product) || 'No description' }}
                </p>
                <button
                  @click="startEditingDescription(product)"
                  class="flex-shrink-0 px-2 py-1 bg-gray-600 text-white rounded-md text-xs hover:bg-gray-500 transition-colors">
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- List view -->
      <div v-else-if="viewMode === 'list'" class="space-y-4">
        <div v-for="product in products" :key="product.productId"
          class="bg-dark-200 rounded-lg border border-dark-100 overflow-hidden transition-all duration-300 hover:border-secondary hover:shadow-lg">
          <div class="p-4 flex items-center gap-4">
            <!-- Product image -->
            <div class="flex-shrink-0 w-20 h-20 overflow-hidden bg-dark-100 rounded-md">
              <img :src="getAssetUrl(product.productAsset?.preview)" :alt="product.productName"
                class="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
            </div>

            <!-- Product details -->
            <div class="flex-grow min-w-0">
              <h3 class="text-lg font-semibold text-white mb-1 truncate">{{ product.productName }}</h3>


              <div class="flex flex-row mt-2 mb-2">

                <div class="mr-20">
                <p class="text-sm text-gray-400">ID: {{ product.productId }}</p>
                </div>


                <div class="flex flex-row items-center gap-2">
                  <label
                    class="w-5 h-5 rounded-full bg-purple-600 text-white cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    :class="{ 'opacity-50 cursor-not-allowed': uploadingProductId === product.productId }"
                    title="Upload technical documentation">
                    <!-- 加载中 -->
                    <svg v-if="uploadingProductId === product.productId" class="w-3 h-3 animate-spin"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" stroke-width="4" opacity="0.25"></circle>
                      <path
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        fill="currentColor" opacity="0.75"></path>
                    </svg>

                    <!-- 上传图标 -->
                    <svg v-else class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 16V8m0 0l-4 4m4-4l4 4" />
                    </svg>

                    <input type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" class="hidden"
                      @change="handleDocUpload($event, product)" :disabled="uploadingProductId === product.productId" />
                  </label>

                  <!-- 文件列表按钮 -->
                  <button @click="showFileList(product)"
                    class="w-5 h-5 rounded-full bg-blue-600 text-white cursor-pointer flex items-center justify-center"
                    :class="{ 'opacity-50 cursor-not-allowed': !product.customFields?.techDocs?.length }"
                    :disabled="!product.customFields?.techDocs?.length" title="View all documents">
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>

                  <span v-if="uploadSuccessProductId === product.productId" class="text-xs text-green-400">✓</span>
                  <span v-if="uploadErrorProductId === product.productId" class="text-xs text-red-400">✗</span>
                </div>

              </div>


              <p class="text-sm text-green-400">Price: ${{ product.minPrice }} - ${{ product.maxPrice }} | Variants: {{
                product.variantCount }}</p>



              <!-- Facets -->
              <div class="flex flex-wrap gap-2 mt-2">
                <span v-for="facet in product.productFacets" :key="facet.id"
                  class="text-xs bg-dark-300 text-gray-300 px-2 py-1 rounded-full">
                  {{ facet.name }}
                </span>
              </div>
              
              <!-- Product Description Section -->
              <div class="mt-3">
                <div v-if="editingProductId === product.productId" class="space-y-2">
                  <textarea
                    v-model="editingDescription"
                    class="w-full px-3 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors resize-vertical min-h-[80px] text-sm"
                    placeholder="Enter product description..."></textarea>
                  <div class="flex gap-2">
                    <button
                      @click="saveProductDescription(product)"
                      :disabled="isUpdatingDescription"
                      class="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {{ isUpdatingDescription ? 'Saving...' : 'Save' }}
                    </button>
                    <button
                      @click="cancelEditingDescription"
                      :disabled="isUpdatingDescription"
                      class="px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      Cancel
                    </button>
                  </div>
                </div>
                <div v-else class="flex items-start justify-between gap-2">
                  <p class="text-sm text-gray-400 flex-1 line-clamp-2" :class="{ 'text-gray-500': !getProductDescription(product) }">
                    {{ getProductDescription(product) || 'No description' }}
                  </p>
                  <button
                    @click="startEditingDescription(product)"
                    class="flex-shrink-0 px-2 py-1 bg-gray-600 text-white rounded-md text-xs hover:bg-gray-500 transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            </div>

            <!-- Tech Docs List -->
            <div class="flex-shrink-0 flex flex-wrap gap-2.5 max-w-xs">
              <div v-if="product.customFields?.techDocs?.length > 0" class="flex flex-wrap gap-2.5 items-center">
                <div v-for="(doc, index) in product.customFields.techDocs.slice(0, 12)" :key="doc.id"
                  class="group relative w-14 h-14 flex-shrink-0 flex-grow-0 rounded-lg bg-dark-300/50 p-1.5 transition-all duration-300 hover:border-secondary/50 hover:bg-dark-300 hover:shadow-md hover:shadow-secondary/5"
                  :title="doc.name">
                  <img v-if="getFileIcon(doc.name)" :src="`/file_icons/${getFileIcon(doc.name)}`" :alt="doc.name"
                    class="w-full h-full object-contain mr-10" />

                  <img v-else :src="doc.preview || 'https://via.placeholder.com/40?text=Doc'" :alt="doc.name"
                    class="w-full h-full object-cover rounded mr-10">

                  <div
                    class="absolute inset-0 z-10 flex items-center justify-center gap-1.5 rounded-lg bg-dark-400/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <a :href="doc.source" target="_blank"
                      class="w-6 h-6 rounded-md bg-dark-100 border border-dark-50/50 text-gray-300 hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-950/40 flex items-center justify-center transition-colors shadow-sm"
                      title="Download File" @click.stop>
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>

                    <button @click.stop="handleDeleteDoc(product, doc.id)"
                      class="w-6 h-6 rounded-md bg-dark-100 border border-dark-50/50 text-gray-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-950/40 flex items-center justify-center transition-colors shadow-sm"
                      title="Delete Document">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div v-if="product.customFields.techDocs.length > 12"
                  class="w-10 h-10 rounded-lg border border-dark-100 border-dashed bg-dark-300/30 flex flex-col items-center justify-center text-[11px] font-medium text-gray-400 tracking-wider flex-shrink-0 flex-grow-0 cursor-default select-none hover:bg-dark-300/60 transition-colors"
                  :title="`Plus ${product.customFields.techDocs.length - 12} more files`">
                  <span>+{{ product.customFields.techDocs.length - 12 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No results state -->
    <div v-else class="text-center py-10 text-gray-400">
      <p v-if="hasSearched">No products found for "{{ searchTerm }}".</p>
      <p v-else>Enter a search term and click Search.</p>
    </div>
  </div>

  <!-- 文件列表弹窗 -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showFileListModal" class="fixed inset-0 z-50 flex items-center justify-center"
        style="background: rgba(0,0,0,0.5);">
        <div class="relative rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-600"
          style="background-color: #1f2937;">
          <div class="flex items-center justify-between px-6 py-4 border-b border-dark-600">
            <h3 class="text-lg font-semibold text-white">Document List</h3>
            <button @click="closeFileList" class="text-gray-400 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="p-4 max-h-80 overflow-y-auto">
            <div v-if="currentProductDocs.length === 0" class="text-center text-gray-500 py-8">
              No documents found
            </div>
            <div v-else class="space-y-2">
              <div v-for="doc in currentProductDocs" :key="doc.id"
                class="flex items-center justify-between p-3 bg-dark-700 rounded-md hover:bg-dark-600 transition-colors">
                <div class="flex items-center gap-3">
                  <img v-if="getFileIcon(doc.name)" :src="`/file_icons/${getFileIcon(doc.name)}`" :alt="doc.name"
                    class="w-6 h-6 object-contain" />
                  <img v-else :src="doc.preview" :alt="doc.name" class="w-6 h-6 object-cover rounded" />
                  <span class="text-sm text-white truncate max-w-[200px]" :title="doc.name">{{ doc.name }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <a :href="doc.source" target="_blank" rel="noopener noreferrer"
                    class="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                  <button @click="handleDeleteDoc(currentProductForDelete, doc.id)"
                    class="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-md transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="px-6 py-4 border-t border-dark-600">
            <button @click="closeFileList"
              class="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- 删除确认弹窗 -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center"
        style="background: rgba(0,0,0,0.5);">
        <div class="relative rounded-lg shadow-xl w-72 border border-gray-600" style="background-color: #1f2937;">
          <div class="p-4 text-center">
            <div class="w-10 h-10 mx-auto mb-3 bg-red-900/30 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-white mb-2">Confirm Delete</h3>
            <p class="text-gray-400 text-xs mb-4">
              Are you sure you want to delete this document?
            </p>
            <div class="flex gap-2">
              <button @click="cancelDelete"
                class="flex-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-md transition-colors">
                Cancel
              </button>
              <button @click="confirmDelete"
                class="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-md transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'

// Import auth store
import { useAuthStore } from '../stores/auth'

// Get auth store
const authStore = useAuthStore()

// State
const loading = ref(false)
const error = ref('')
const products = ref([])
const totalCount = ref(0)
const searchTerm = ref('')
const hasSearched = ref(false)
const viewMode = ref('list') // Default to list view
const searchHistory = ref([]) // Search history array

const uploadingProductId = ref(null)
const uploadSuccessProductId = ref(null)
const uploadErrorProductId = ref(null)

// Description editing state
const editingProductId = ref(null)
const editingDescription = ref('')
const isUpdatingDescription = ref(false)

// File list modal state
const showFileListModal = ref(false)
const currentProductDocs = ref([])
const currentProductForDelete = ref(null)

// Delete confirmation modal state
const showDeleteModal = ref(false)
const deleteProduct = ref(null)
const deleteDocId = ref(null)

// Helper function to format asset URL
const getAssetUrl = (preview) => {
  if (!preview) return 'https://via.placeholder.com/400x400?text=No+Image'
  const vendureUrl = import.meta.env.VITE_VENDURE_URL || ''
  return `${vendureUrl}/assets/${preview}`
}

// Load search history from localStorage
const loadSearchHistory = () => {
  try {
    const saved = localStorage.getItem('searchHistory')
    if (saved) {
      searchHistory.value = JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load search history:', e)
    searchHistory.value = []
  }
}

// Save search history to localStorage
const saveSearchHistory = () => {
  try {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
  } catch (e) {
    console.error('Failed to save search history:', e)
  }
}

// Add search term to history
const addToSearchHistory = (term) => {
  const trimmedTerm = term.trim().toLowerCase()
  if (!trimmedTerm) return

  // Remove duplicate if exists
  const index = searchHistory.value.findIndex(t => t.toLowerCase() === trimmedTerm)
  if (index > -1) {
    searchHistory.value.splice(index, 1)
  }

  // Add to beginning
  searchHistory.value.unshift(trimmedTerm)

  // Keep only last 10 searches
  if (searchHistory.value.length > 10) {
    searchHistory.value = searchHistory.value.slice(0, 10)
  }

  // Save to localStorage
  saveSearchHistory()
}

// Clear search history
const clearSearchHistory = () => {
  searchHistory.value = []
  saveSearchHistory()
}

// Search from history
const searchFromHistory = (term) => {
  searchTerm.value = term
  performSearch()
}

// Load history on mount
onMounted(() => {
  loadSearchHistory()
})

// GraphQL query for search
const SEARCH_QUERY = gql`
  query SearchProductsWithOptions($term: String!, $page: Int, $pageSize: Int) {
    searchProductsWithOptions(term: $term, page: $page, pageSize: $pageSize) {
      totalCount
      items {
        productId
        productName
        slug
        description
        productAsset {
          id
          preview
        }
        productFacets {
          id
          name
          code
        }
        variantCount
        minPrice
        maxPrice
        minPriceWithTax
        maxPriceWithTax
        variants {
          variantId
          variantName
          price
          priceWithTax
          variantFacets {
            id
            name
            code
          }
          options {
            id
            name
          }
        }
      }
    }
  }
`

const UPDATE_PRODUCT_MUTATION = gql`
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      id
      name
      translations {
        id
        languageCode
        name
        description
      }
    }
  }
`

const GET_PRODUCT_TECH_DOCS_QUERY = gql`
  query GetProductTechDocs($id: ID!) {
    product(id: $id) {
      id
      customFields {
        techDocs { id name preview source }
      }
    }
  }
`

// Create Apollo Client with token and channel token
const createApolloClient = (channelToken = null) => {
  const httpLink = createHttpLink({
    uri: import.meta.env.VITE_VENDURE_ADMIN_API_URL,
    fetchOptions: {
      credentials: 'include'
    }
  })

  const authLink = setContext((_, { headers }) => {
    const requestHeaders = {
      ...headers,
      authorization: authStore.token ? `Bearer ${authStore.token}` : '',
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

// Perform search
const performSearch = async () => {
  if (!searchTerm.value.trim()) {
    return
  }

  loading.value = true
  error.value = ''
  hasSearched.value = true

  try {
    // Use VITE_CHANNEL_TOKEN from env if available, otherwise use active channel from auth store
    const channelToken = import.meta.env.VITE_CHANNEL_TOKEN || (authStore.activeChannel ? authStore.activeChannel.token : null)
    const apolloClient = createApolloClient(channelToken)

    const result = await apolloClient.query({
      query: SEARCH_QUERY,
      variables: {
        term: searchTerm.value,
        page: 1,
        pageSize: 100
      },
      fetchPolicy: 'network-only'
    })

    if (result.data) {
      if (result.data.searchProductsWithOptions) {
        totalCount.value = result.data.searchProductsWithOptions.totalCount || 0
        const searchItems = result.data.searchProductsWithOptions.items || []

        // Fetch techDocs for each product
        const productsWithTechDocs = await Promise.all(
          searchItems.map(async (product) => {
            try {
              const apolloClient = createApolloClient(channelToken)
              const techDocsResult = await apolloClient.query({
                query: GET_PRODUCT_TECH_DOCS_QUERY,
                variables: { id: product.productId },
                fetchPolicy: 'network-only'
              })

              return {
                ...product,
                customFields: {
                  techDocs: techDocsResult.data?.product?.customFields?.techDocs || []
                }
              }
            } catch (err) {
              console.error(`Failed to fetch techDocs for product ${product.productId}:`, err)
              return {
                ...product,
                customFields: { techDocs: [] }
              }
            }
          })
        )

        products.value = productsWithTechDocs
      } else {
        totalCount.value = 0
        products.value = []
      }
    }

    // Add search term to history after successful search
    addToSearchHistory(searchTerm.value)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const uploadFile = async (file, channelToken = null) => {
  try {
    const formData = new FormData()
    const operations = {
      query: `
        mutation UploadCustomerFile($file: Upload!) {
          uploadCustomerFile(file: $file) { id name preview source }
        }
      `,
      variables: { file: null }
    }

    formData.append('operations', JSON.stringify(operations))
    formData.append('map', JSON.stringify({ '0': ['variables.file'] }))
    formData.append('0', file)

    const headers = {}
    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`
    }
    if (channelToken) {
      headers['vendure-token'] = channelToken
    }

    const apiUrl = import.meta.env.VITE_VENDURE_ADMIN_API_URL
    const response = await fetch(apiUrl, { method: 'POST', headers, body: formData })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`HTTP error! status: ${response.status} - ${text}`)
    }

    const json = await response.json()
    if (json.errors) throw new Error(json.errors[0].message)
    return json.data.uploadCustomerFile
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

const updateProductTechDocs = async (productId, assetIds, channelToken = null) => {
  try {
    const apolloClient = createApolloClient(channelToken)
    const UPDATE_PRODUCT_DOCS_MUTATION = gql`
      mutation UpdateProductDocs($input: UpdateProductInput!) {
        updateProduct(input: $input) {
          id
          customFields {
            techDocs { id name preview source }
          }
        }
      }
    `
    const result = await apolloClient.mutate({
      mutation: UPDATE_PRODUCT_DOCS_MUTATION,
      variables: {
        input: { id: productId, customFields: { techDocsIds: assetIds } }
      }
    })
    return result.data.updateProduct
  } catch (error) {
    console.error('Error updating product techDocs:', error)
    throw error
  }
}

const handleDocUpload = async (event, product) => {
  const file = event.target.files[0]
  if (!file) return

  uploadingProductId.value = product.productId
  uploadSuccessProductId.value = null
  uploadErrorProductId.value = null

  try {
    // Get channel token
    const channelToken = import.meta.env.VITE_CHANNEL_TOKEN || (authStore.activeChannel ? authStore.activeChannel.token : null)
    const asset = await uploadFile(file, channelToken)
    if (asset && asset.id) {
      // Gather pure asset IDs
      const existingDocIds = product.customFields?.techDocs?.map(doc => doc.id) || []
      const updatedDocIds = [...existingDocIds, asset.id]

      console.log("1 --> updatedDocIds -->", updatedDocIds)

      const updatedProduct = await updateProductTechDocs(product.productId, updatedDocIds, channelToken)

      console.log("2 --> updatedProduct-->", updatedProduct)

      if (updatedProduct) {
        // Sync local reactive arrays immediately to block layout issues
        const foundIndexProducts = products.value.findIndex(p => p.productId === product.productId)

        if (foundIndexProducts !== -1) {
          products.value[foundIndexProducts].customFields.techDocs = updatedProduct.customFields.techDocs
        }
        uploadSuccessProductId.value = product.productId
      }
    }
  } catch (err) {
    console.error('Upload failed:', err)
    uploadErrorProductId.value = product.productId
  } finally {
    uploadingProductId.value = null
    event.target.value = ''
    setTimeout(() => {
      uploadSuccessProductId.value = null
      uploadErrorProductId.value = null
    }, 3000)
  }
}

// File list popup functions
const showFileList = (product) => {
  currentProductDocs.value = product.customFields?.techDocs || []
  currentProductForDelete.value = product
  showFileListModal.value = true
}

const closeFileList = () => {
  showFileListModal.value = false
  currentProductDocs.value = []
  currentProductForDelete.value = null
}

// Delete confirmation popup functions
const handleDeleteDoc = (product, docId) => {
  deleteProduct.value = product
  deleteDocId.value = docId
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
  deleteProduct.value = null
  deleteDocId.value = null
}

// Product description editing functions
const getProductDescription = (product) => {
  // For search results, we may already have description field
  if (product.description) {
    return product.description
  }
  return ''
}

const startEditingDescription = (product) => {
  editingProductId.value = product.productId
  editingDescription.value = getProductDescription(product) || ''
}

const cancelEditingDescription = () => {
  editingProductId.value = null
  editingDescription.value = ''
}

const saveProductDescription = async (product) => {
  if (editingProductId.value !== product.productId) return
  
  isUpdatingDescription.value = true
  try {
    const channelToken = import.meta.env.VITE_CHANNEL_TOKEN || (authStore.activeChannel ? authStore.activeChannel.token : null)
    const apolloClient = createApolloClient(channelToken)
    
    // For search result products, we don't have translations data
    // We'll create a translation using en as default language
    const translationInput = {
      languageCode: 'en',
      description: editingDescription.value
    }
    
    const result = await apolloClient.mutate({
      mutation: UPDATE_PRODUCT_MUTATION,
      variables: {
        input: {
          id: product.productId,
          translations: [translationInput]
        }
      }
    })
    
    if (result.data?.updateProduct) {
      // Update the local product data
      const productIndex = products.value.findIndex(p => p.productId === product.productId)
      if (productIndex !== -1) {
        products.value[productIndex].description = editingDescription.value
      }
    }
    
    editingProductId.value = null
    editingDescription.value = ''
  } catch (err) {
    console.error('Error updating product description:', err)
  } finally {
    isUpdatingDescription.value = false
  }
}

const confirmDelete = async () => {
  if (!deleteProduct.value || !deleteDocId.value) {
    cancelDelete()
    return
  }

  try {
    const product = deleteProduct.value
    const docId = deleteDocId.value
    const existingDocIds = product.customFields?.techDocs?.map(doc => doc.id) || []
    const updatedDocIds = existingDocIds.filter(id => id !== docId)

    const channelToken = import.meta.env.VITE_CHANNEL_TOKEN || (authStore.activeChannel ? authStore.activeChannel.token : null)
    const updatedProduct = await updateProductTechDocs(product.productId, updatedDocIds, channelToken)

    if (updatedProduct) {
      const foundIndexProducts = products.value.findIndex(p => p.productId === product.productId)

      if (foundIndexProducts !== -1) {
        products.value[foundIndexProducts].customFields.techDocs = updatedProduct.customFields.techDocs
        currentProductDocs.value = updatedProduct.customFields.techDocs
        currentProductForDelete.value = products.value[foundIndexProducts]
      }
    }
  } catch (err) {
    console.error('Error deleting document:', err)
  } finally {
    cancelDelete()
  }
}

const getFileIcon = (filename) => {
  if (!filename) return null
  const ext = filename.toLowerCase().split('.').pop()

  const iconMap = {
    pdf: 'PDF.svg',
    doc: 'WORD.svg',
    docx: 'WORD.svg',
    txt: 'TXT.svg',
    xls: 'EXCEL.svg',
    xlsx: 'EXCEL.svg',
    ppt: 'PPTX.svg',
    pptx: 'PPTX.svg',
    jpg: 'JPG.svg',
    jpeg: 'JPEG.svg',
    png: 'PNG.svg',
    zip: 'ZIP.svg',
    html: 'HTML.svg',
    mp4: 'MP4.svg'
  }

  // Check for image files specifically
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
  if (imageExts.includes(ext)) return null // Use actual image preview

  return iconMap[ext] || 'TXT.svg' // Default to TXT if unknown
}
</script>

<style scoped>
.product-list-section {
  margin-top: 2rem;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.9);
}

.modal-enter-to .relative,
.modal-leave-from .relative {
  transform: scale(1);
}
</style>
