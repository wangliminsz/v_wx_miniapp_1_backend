<template>
    <div class="product-list-section">
        <h2 class="text-2xl font-semibold text-gray-300 mb-6">Product List</h2>

        <div v-if="loading" class="text-center py-10 text-gray-400">Loading products...</div>

        <div v-else-if="error" class="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md mb-6">
            <h3 class="font-bold mb-2">An error occurred:</h3>
            <p class="text-sm">{{ error }}</p>
        </div>

        <div v-else-if="products.length > 0">
            <div class="mb-6 flex flex-wrap items-center gap-4">
                <div class="flex items-center gap-2">
                    <label for="collectionFilter" class="font-bold text-blue-300">Filter by Collection:</label>
                    <select id="collectionFilter" v-model="selectedCollection"
                        @change="filterProductsByCollection(selectedCollection)"
                        class="px-4 py-2 bg-dark-200 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors">
                        <option :value="null">All Collections</option>
                        <option v-for="collection in collections" :key="collection.id" :value="collection.id">
                            {{ '\u00A0'.repeat(collection.level * 2) }}- {{ collection.name }}
                        </option>
                    </select>
                </div>

                <div v-if="!isSingleChannel" class="flex items-center gap-2">
                    <label for="channelSelect" class="font-bold text-blue-300">Export Channel:</label>
                    <select id="channelSelect" v-model="selectedChannel"
                        class="px-4 py-2 bg-dark-200 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors">
                        <option :value="null">All Channels</option>
                        <option v-for="channel in channels" :key="channel.id" :value="channel">
                            {{ channel.code }} ({{ channel.currencyCode }})
                        </option>
                    </select>
                </div>
                
                <div v-else-if="displaySelectedChannel" class="flex items-center gap-2">
                    <span class="font-bold text-blue-300">Current Channel:</span>
                    <span class="px-3 py-2 bg-dark-200 text-gray-300 rounded-md border border-dark-100">
                        {{ displaySelectedChannel.code }} ({{ displaySelectedChannel.currencyCode }})
                    </span>
                </div>
            </div>

            <div class="mb-6 p-4 bg-dark-200 rounded-md">
                <div class="flex flex-row justify-between mr-10">
                    <div>
                        <p class="text-blue-300">
                            Showing {{ products.length }} of {{ allProducts.length }} products
                            <span v-if="selectedCollection"> in {{collections.find(c => c.id ===
                                selectedCollection)?.name}}</span>
                        </p>
                    </div>
                    <div>
                        <p class="text-gray-200 text-xs">
                            Selected: {{ selectedProducts.length }}
                        </p>
                    </div>
                </div>

                <div class="mt-2 flex gap-2 flex-wrap">
                    <div class="flex gap-2">
                        <button @click="exportSelectedProducts" :disabled="selectedProducts.length === 0 || isExporting"
                            class="px-4 py-2 bg-green-600 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Export only the selected products">
                            {{ isExporting ? 'Exporting...' : 'Export Selected' }}
                        </button>

                        <button @click="exportAllProducts" :disabled="isExporting"
                            class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Export all products regardless of selection">
                            {{ isExporting ? 'Exporting...' : 'Export All Products' }}
                        </button>
                    </div>

                    <div class="flex gap-2">
                        <button @click="clearSelection" :disabled="selectedProducts.length === 0"
                            class="px-4 py-2 bg-gray-600 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            Clear Selection
                        </button>

                        <button @click="selectedCollection = null; filterProductsByCollection(null)"
                            :disabled="!selectedCollection"
                            class="px-4 py-2 bg-gray-600 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            Show All Products
                        </button>
                    </div>
                </div>

                <p v-if="exportError" class="text-red-400 mt-3 text-sm">
                    Error: {{ exportError }}
                </p>
            </div>

            <div v-if="viewMode === 'list'" class="space-y-4">
                <div v-for="product in products" :key="product.id"
                    class="bg-dark-200 rounded-lg border border-dark-100 overflow-hidden">
                    <div class="p-4 flex items-center gap-4">
                        <div class="flex-shrink-0">
                            <input type="checkbox" :id="`product-${product.id}`" :checked="isSelected(product.id)"
                                @change="toggleProductSelection(product)"
                                class="w-5 h-5 text-secondary focus:ring-secondary rounded transition-colors" />
                            <label :for="`product-${product.id}`" class="sr-only">{{ product.name }}</label>
                        </div>

                        <div class="flex-shrink-0 w-20 h-20 overflow-hidden bg-dark-100 rounded-md">
                            <img :src="product.featuredAsset ? `${product.featuredAsset.preview}?w=100&h=100` : 'https://via.placeholder.com/100x100?text=No+Image'"
                                :alt="product.name" class="w-full h-full object-cover" />
                        </div>

                        <!-- <div class="flex-shrink-0 w-20 h-20 overflow-hidden bg-dark-100 rounded-md">
                            <img :src="product.featuredAsset ? `${product.featuredAsset.preview}?w=100&h=100` : 'https://via.placeholder.com/100x100?text=No+Image'"
                                :alt="product.name"
                                class="w-full h-full object-cover" />
                        </div> -->



                        <div class="flex-grow min-w-0">
                            <h3 class="text-lg font-semibold text-white mb-1 truncate">{{ product.name }}</h3>

                            <div class="flex flex-row items-center gap-2">
                                <p class="text-sm text-gray-400">ID: {{ product.id }}</p>
                                <span class="text-sm text-secondary"
                                    v-if="product.variants && product.variants.length > 0">
                                    {{ product.variants.length }} variants
                                </span>
                                <span class="text-sm text-gray-500" v-else>
                                    0 variants
                                </span>



                                <label
                                    class="w-5 h-5 rounded-full bg-purple-600 text-white cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    :class="{ 'opacity-50 cursor-not-allowed': uploadingProductId === product.id }"
                                    title="Upload technical documentation">
                                    <!-- 加载中 -->
                                    <svg v-if="uploadingProductId === product.id" class="w-3 h-3 animate-spin"
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <circle cx="12" cy="12" r="10" stroke-width="4" opacity="0.25"></circle>
                                        <path
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            fill="currentColor" opacity="0.75"></path>
                                    </svg>

                                    <!-- 上传图标 → 完美居中 -->
                                    <svg v-else class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M12 16V8m0 0l-4 4m4-4l4 4" />
                                    </svg>

                                    <input type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" class="hidden"
                                        @change="handleDocUpload($event, product)"
                                        :disabled="uploadingProductId === product.id">
                                </label>

                                <!-- 文件列表按钮 -->
                                <button
                                    @click="showFileList(product)"
                                    class="w-5 h-5 rounded-full bg-blue-600 text-white cursor-pointer flex items-center justify-center"
                                    :class="{ 'opacity-50 cursor-not-allowed': !product.customFields?.techDocs?.length }"
                                    :disabled="!product.customFields?.techDocs?.length"
                                    title="View all documents">
                                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </button>




                                <span v-if="uploadSuccessProductId === product.id"
                                    class="text-xs text-green-400">✓</span>
                                <span v-if="uploadErrorProductId === product.id" class="text-xs text-red-400">✗</span>
                            </div>

                            <div class="flex flex-wrap gap-2 mt-2">
                                <span v-for="collection in product.collections" :key="collection.id"
                                    class="text-xs bg-dark-300 text-gray-300 px-2 py-1 rounded-full">
                                    {{ collection.name }}
                                </span>
                            </div>
                        </div>









                        <div class="flex-shrink-0 flex flex-wrap gap-2 max-w-xs">




                            <div v-if="product.customFields?.techDocs?.length > 0">
                                <div class="flex flex-wrap gap-2.5 items-center">

                                    <div v-for="(doc, index) in product.customFields.techDocs.slice(0, 12)"
                                        :key="doc.id"
                                        class="group relative w-14 h-14 flex-shrink-0 flex-grow-0 rounded-lg bg-dark-300/50 p-1.5 transition-all duration-300 hover:border-secondary/50 hover:bg-dark-300 hover:shadow-md hover:shadow-secondary/5"
                                        :title="doc.name">

                                        <img v-if="getFileIcon(doc.name)" :src="`/file_icons/${getFileIcon(doc.name)}`"
                                            :alt="doc.name" class="w-full h-full object-contain mr-10" />
                                        
                                        <img v-else :src="doc.preview || 'https://via.placeholder.com/40?text=Doc'"
                                            :alt="doc.name" class="w-full h-full object-cover rounded mr-10" >

                                        <div
                                            class="absolute inset-0 z-10 flex items-center justify-center gap-1.5 rounded-lg bg-dark-400/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300">

                                            <a :href="doc.source" target="_blank"
                                                class="w-6 h-6 rounded-md bg-dark-100 border border-dark-50/50 text-gray-300 hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-950/40 flex items-center justify-center transition-colors shadow-sm"
                                                title="Download File" @click.stop>
                                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor"
                                                    stroke-width="2" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </a>

                                            <button @click.stop="handleDeleteDoc(product, doc.id)"
                                                class="w-6 h-6 rounded-md bg-dark-100 border border-dark-50/50 text-gray-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-950/40 flex items-center justify-center transition-colors shadow-sm"
                                                title="Delete Document">
                                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor"
                                                    stroke-width="2" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                        d="M6 18L18 6M6 6l12 12" />
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
        </div>

        <div v-else class="text-center py-10 text-gray-400">
            <p>No products found.</p>
            <button @click="selectedCollection = null; filterProductsByCollection(null)"
                class="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md text-sm">
                Show All Products
            </button>
        </div>
    </div>

    <!-- 文件列表弹窗 -->
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="showFileListModal" class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.5);">
                <div class="relative rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-600" style="background-color: #1f2937;">
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
                                    <img v-if="getFileIcon(doc.name)" 
                                        :src="`/file_icons/${getFileIcon(doc.name)}`"
                                        :alt="doc.name"
                                        class="w-6 h-6 object-contain" />
                                    <img v-else :src="doc.preview" :alt="doc.name" class="w-6 h-6 object-cover rounded" />
                                    <span class="text-sm text-white truncate max-w-[200px]" :title="doc.name">{{ doc.name }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <a :href="doc.source" target="_blank" rel="noopener noreferrer"
                                        class="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md transition-colors">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        <!-- Download -->
                                    </a>
                                    <button @click="handleDeleteDoc(currentProductForDelete, doc.id)"
                                        class="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-md transition-colors">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        <!-- Delete -->
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
            <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.5);">
                <div class="relative rounded-lg shadow-xl w-72 border border-gray-600" style="background-color: #1f2937;">
                    <div class="p-4 text-center">
                        <div class="w-10 h-10 mx-auto mb-3 bg-red-900/30 rounded-full flex items-center justify-center">
                            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'

import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const emit = defineEmits(['selection-change'])

// State
const loading = ref(false)
const error = ref('')
const products = ref([])
const allProducts = ref([])
const selectedProducts = ref([])
const collections = ref([])
const selectedCollection = ref(null)
const viewMode = ref('list')

const isExporting = ref(false)
const exportError = ref(null)

const uploadingProductId = ref(null)
const uploadSuccessProductId = ref(null)
const uploadErrorProductId = ref(null)

// File list modal state
const showFileListModal = ref(false)
const currentProductDocs = ref([])
const currentProductForDelete = ref(null)

// Delete confirmation modal state
const showDeleteModal = ref(false)
const deleteProduct = ref(null)
const deleteDocId = ref(null)

const channels = ref([])
const selectedChannel = ref(null)
let apolloClient = null

// Computed properties
const isSingleChannel = computed(() => authStore.channels.length <= 1)
const displaySelectedChannel = computed(() => {
  if (selectedChannel.value) return selectedChannel.value
  if (authStore.activeChannel) return authStore.activeChannel
  return null
})

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

const GET_PRODUCTS_QUERY = gql`
  query GetProducts {
    products(options: { take: 100 }) {
      items {
        id
        name
        variants { id }
        featuredAsset { id preview }
        collections { id name }
        customFields {
          techDocs { id name preview source }
        }
      }
    }
    collections {
      items {
        id name slug
        parent { id name }
        children { id name slug }
      }
    }
    channels(options: { take: 100 }) {
      items { id code token defaultLanguageCode currencyCode pricesIncludeTax }
    }
  }
`

const PRODUCT_EXPORT_QUERY = gql`
  query FullProductExportQuery {
    products(options: { take: 1000 }) {
      items {
        id name slug description
        featuredAsset { id name source }
        assets { id name source }
        collections { id slug name }
        channels { id code }
        facetValues { id code facet { id code } }
        variants {
          id name sku price currencyCode
          taxCategory { id name }
          stockLevels { stockLocationId stockOnHand }
          assets { id source }
          facetValues { id code facet { id code } }
          featuredAsset { id source }
          prices { price currencyCode }
          options { id code group { id code } }
        }
      }
    }
  }
`

const fetchProducts = async () => {
    loading.value = true
    error.value = ''
    try {
        // Use active channel from auth store if available and no channel selected
        let channelToken = null
        if (selectedChannel.value) {
            channelToken = selectedChannel.value.token
        } else if (authStore.activeChannel) {
            channelToken = authStore.activeChannel.token
        }
        
        apolloClient = createApolloClient(authStore.token, channelToken)

        const result = await apolloClient.query({
            query: GET_PRODUCTS_QUERY,
            fetchPolicy: 'network-only'
        })

        if (result.data) {
            if (result.data.products && result.data.products.items) {
                allProducts.value = JSON.parse(JSON.stringify(result.data.products.items))
                // Re-apply active collection filter to state if present
                filterProductsByCollection(selectedCollection.value)
            } else {
                allProducts.value = []
                products.value = []
            }

            if (result.data.collections && result.data.collections.items) {
                const allCollections = result.data.collections.items.filter(c => c.id !== '1')
                const collectionMap = new Map()
                allCollections.forEach(collection => {
                    collectionMap.set(collection.id, { ...collection, children: [] })
                })

                const topLevelCollections = []
                allCollections.forEach(collection => {
                    if (collection.parent && collection.parent.id === '1') {
                        topLevelCollections.push(collectionMap.get(collection.id))
                    } else if (collection.parent) {
                        const parent = collectionMap.get(collection.parent.id)
                        if (parent) parent.children.push(collectionMap.get(collection.id))
                    }
                })

                const flattenedCollections = []
                const flattenCollections = (cols, level = 0) => {
                    cols.forEach(collection => {
                        flattenedCollections.push({ id: collection.id, name: collection.name, slug: collection.slug, level })
                        if (collection.children && collection.children.length > 0) {
                            flattenCollections(collection.children, level + 1)
                        }
                    })
                }

                flattenCollections(topLevelCollections)
                collections.value = flattenedCollections
            } else {
                collections.value = []
            }

            if (result.data.channels && result.data.channels.items) {
                channels.value = result.data.channels.items
                // If we have auth store channels and they differ, use auth store ones
                if (authStore.channels.length > 0) {
                    channels.value = authStore.channels
                }
            } else {
                channels.value = authStore.channels.length > 0 ? authStore.channels : []
            }
        }
    } catch (err) {
        error.value = err.message
    } finally {
        loading.value = false
    }
}

const filterProductsByCollection = (collectionId) => {
    selectedCollection.value = collectionId
    if (collectionId === null) {
        products.value = [...allProducts.value]
    } else {
        products.value = allProducts.value.filter(product => {
            return product.collections.some(collection => collection.id === collectionId)
        })
    }
}

const isSelected = (productId) => {
    return selectedProducts.value.some(p => p.id === productId)
}

const toggleProductSelection = (product) => {
    const index = selectedProducts.value.findIndex(p => p.id === product.id)
    if (index > -1) {
        selectedProducts.value.splice(index, 1)
    } else {
        selectedProducts.value.push(product)
    }
    emit('selection-change', selectedProducts.value)
}

const uploadFile = async (file) => {
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

const updateProductTechDocs = async (productId, assetIds) => {
    try {
        const apolloClient = createApolloClient(authStore.token)
        const UPDATE_PRODUCT_MUTATION = gql`
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
            mutation: UPDATE_PRODUCT_MUTATION,
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

    uploadingProductId.value = product.id
    uploadSuccessProductId.value = null
    uploadErrorProductId.value = null

    try {
        const asset = await uploadFile(file)
        if (asset && asset.id) {
            // Gather pure asset IDs
            const existingDocIds = product.customFields?.techDocs?.map(doc => doc.id) || []
            const updatedDocIds = [...existingDocIds, asset.id]

            console.log("1 --> updatedDocIds -->", updatedDocIds)

            const updatedProduct = await updateProductTechDocs(product.id, updatedDocIds)

            console.log("2 --> updatedProduct-->", updatedProduct)

            if (updatedProduct) {
                // Sync local reactive arrays immediately to block layout issues
                const foundIndexAll = allProducts.value.findIndex(p => p.id === product.id)
                const foundIndexProducts = products.value.findIndex(p => p.id === product.id)

                if (foundIndexAll !== -1) {
                    allProducts.value[foundIndexAll].customFields.techDocs = updatedProduct.customFields.techDocs
                }
                if (foundIndexProducts !== -1) {
                    products.value[foundIndexProducts].customFields.techDocs = updatedProduct.customFields.techDocs
                }
                filterProductsByCollection(selectedCollection.value)
                uploadSuccessProductId.value = product.id
            }
        }
    } catch (err) {
        console.error('Upload failed:', err)
        uploadErrorProductId.value = product.id
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

        const updatedProduct = await updateProductTechDocs(product.id, updatedDocIds)

        if (updatedProduct) {
            const foundIndexAll = allProducts.value.findIndex(p => p.id === product.id)
            const foundIndexProducts = products.value.findIndex(p => p.id === product.id)

            if (foundIndexAll !== -1) {
                allProducts.value[foundIndexAll].customFields.techDocs = updatedProduct.customFields.techDocs
            }
            if (foundIndexProducts !== -1) {
                products.value[foundIndexProducts].customFields.techDocs = updatedProduct.customFields.techDocs
                currentProductDocs.value = updatedProduct.customFields.techDocs
                currentProductForDelete.value = products.value[foundIndexProducts]
            }
            filterProductsByCollection(selectedCollection.value)
        }
    } catch (err) {
        console.error('Error deleting document:', err)
    } finally {
        cancelDelete()
    }
}

const isPdfFile = (filename) => {
    if (!filename) return false
    return filename.toLowerCase().endsWith('.pdf')
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

const clearSelection = () => {
    selectedProducts.value = []
    emit('selection-change', [])
}

// CSV Handlers
const exportSelectedProducts = async () => {
    exportError.value = null
    isExporting.value = true
    try {
        if (selectedProducts.value.length === 0) throw new Error('Please select at least one product.')
        
        // Use active channel from auth store if available and no channel selected
        let channelToken = null
        if (selectedChannel.value) {
            channelToken = selectedChannel.value.token
        } else if (authStore.activeChannel) {
            channelToken = authStore.activeChannel.token
        }
        
        apolloClient = createApolloClient(authStore.token, channelToken)

        const { data } = await apolloClient.query({
            query: PRODUCT_EXPORT_QUERY,
            fetchPolicy: 'network-only',
        })

        if (!data?.products?.items) throw new Error('No data received from API.')

        const selectedProductIds = new Set(selectedProducts.value.map(p => p.id))
        const selectedProductsData = data.products.items.filter(p => selectedProductIds.has(p.id))

        const flatData = []
        selectedProductsData.forEach(product => {
            const collectionSlugs = product.collections.map(c => c.slug).join('|')
            const collectionNames = product.collections.map(c => c.name).join(', ')
            const channelCodes = product.channels.map(ch => ch.code).join('|')
            const productFacetValues = product.facetValues.map(fv => `${fv.facet?.code || 'unknown'}:${fv.code}`).join('|')
            const productAssets = product.assets.map(asset => asset.source).join('|')

            if (product.variants.length === 0) {
                flatData.push({
                    productId: product.id, productName: product.name, productSlug: product.slug || '',
                    productDescription: product.description || '', featuredAssetSource: product.featuredAsset?.source || '',
                    productAssets, productFacetValues, variantId: '', variantName: '', variantSku: '', variantPrice: '',
                    variantCurrencyCode: '', taxCategoryName: '', variantFeaturedAsset: '', variantAssets: '', variantFacetValues: '',
                    collections: collectionSlugs, collectionNames: collectionNames, channels: channelCodes, stockLevels: '',
                })
            } else {
                product.variants.forEach(variant => {
                    let stockLevelString = '';
                    if (variant.stockLevels?.length > 0) {
                        stockLevelString = variant.stockLevels.map(sl => `${sl.stockLocationId || 'default'}:${Math.trunc(Number(sl.stockOnHand)) || 0}`).join(';');
                    }

                    let multiChannelPrices = '';
                    if (variant.prices?.length > 0) {
                        multiChannelPrices = variant.prices.map(price => `${price.channelId}:${(price.price / 100).toFixed(2)}:${price.currencyCode}`).join('|');
                    }

                    flatData.push({
                        productId: product.id, productName: product.name, productSlug: product.slug || '',
                        productDescription: product.description || '', featuredAssetSource: product.featuredAsset?.source || '',
                        productAssets, productFacetValues, variantId: variant.id, variantName: variant.name, variantSku: variant.sku || '',
                        variantPrice: variant.price ? (variant.price / 100).toFixed(2) : '', variantCurrencyCode: variant.currencyCode || '',
                        variantFeaturedAsset: variant.featuredAsset?.source || '', taxCategoryName: variant.taxCategory?.name || '',
                        variantAssets: variant.assets.map(a => a.source).join('|'), variantFacetValues: variant.facetValues.map(fv => `${fv.facet?.code || 'unknown'}:${fv.code}`).join('|'),
                        options: variant.options.map(o => `${o.group.code}:${o.code}`).join('|'), collections: collectionSlugs,
                        collectionNames, channels: channelCodes, stockLevels: stockLevelString, multiChannelPrices,
                    })
                })
            }
        })

        const csvString = convertToCsv(flatData)
        downloadBlob(csvString, `vendure-product-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;')
    } catch (err) {
        exportError.value = err.message
    } finally { isExporting.value = false }
}

const exportAllProducts = async () => {
    exportError.value = null
    isExporting.value = true
    try {
        // Use active channel from auth store if available and no channel selected
        let channelToken = null
        if (selectedChannel.value) {
            channelToken = selectedChannel.value.token
        } else if (authStore.activeChannel) {
            channelToken = authStore.activeChannel.token
        }
        
        apolloClient = createApolloClient(authStore.token, channelToken)

        const { data } = await apolloClient.query({
            query: PRODUCT_EXPORT_QUERY,
            fetchPolicy: 'network-only',
        })

        if (!data?.products?.items) throw new Error('No data received from API.')

        const flatData = []
        data.products.items.forEach(product => {
            const collectionSlugs = product.collections.map(c => c.slug).join('|')
            const collectionNames = product.collections.map(c => c.name).join(', ')
            const channelCodes = product.channels.map(ch => ch.code).join('|')
            const productFacetValues = product.facetValues.map(fv => `${fv.facet?.code || 'unknown'}:${fv.code}`).join('|')
            const productAssets = product.assets.map(asset => asset.source).join('|')

            if (product.variants.length === 0) {
                flatData.push({
                    productId: product.id, productName: product.name, productSlug: product.slug || '',
                    productDescription: product.description || '', featuredAssetSource: product.featuredAsset?.source || '',
                    productAssets, productFacetValues, variantId: '', variantName: '', variantSku: '', variantPrice: '',
                    variantCurrencyCode: '', taxCategoryName: '', variantFeaturedAsset: '', variantAssets: '', variantFacetValues: '',
                    collections: collectionSlugs, collectionNames: collectionNames, channels: channelCodes, stockLevels: '',
                })
            } else {
                product.variants.forEach(variant => {
                    let stockLevelString = '';
                    if (variant.stockLevels?.length > 0) {
                        stockLevelString = variant.stockLevels.map(sl => `${sl.stockLocationId || 'default'}:${Math.trunc(Number(sl.stockOnHand)) || 0}`).join(';');
                    }

                    flatData.push({
                        productId: product.id, productName: product.name, productSlug: product.slug || '',
                        productDescription: product.description || '', featuredAssetSource: product.featuredAsset?.source || '',
                        productAssets, productFacetValues, variantId: variant.id, variantName: variant.name, variantSku: variant.sku || '',
                        variantPrice: variant.price ? (variant.price / 100).toFixed(2) : '', variantCurrencyCode: variant.currencyCode || '',
                        variantFeaturedAsset: variant.featuredAsset?.source || '', taxCategoryName: variant.taxCategory?.name || '',
                        variantAssets: variant.assets.map(a => a.source).join('|'), variantFacetValues: variant.facetValues.map(fv => `${fv.facet?.code || 'unknown'}:${fv.code}`).join('|'),
                        options: variant.options.map(o => `${o.group.code}:${o.code}`).join('|'), collections: collectionSlugs,
                        collectionNames, channels: channelCodes, stockLevels: stockLevelString,
                    })
                })
            }
        })

        const csvString = convertToCsv(flatData)
        downloadBlob(csvString, `vendure-product-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;')
    } catch (err) {
        exportError.value = err.message
    } finally { isExporting.value = false }
}

const convertToCsv = (data) => {
    if (!data?.length) return ''
    const headers = Object.keys(data[0])
    const headerRow = headers.join(',') + '\r\n'
    const rows = data.map(row => {
        return headers.map(header => {
            let cell = row[header] ?? ''
            return `"${cell.toString().replace(/"/g, '""')}"`
        }).join(',')
    })
    return headerRow + rows.join('\r\n')
}

const downloadBlob = (content, fileName, contentType) => {
    const blob = new Blob([content], { type: contentType })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
}

onMounted(() => { fetchProducts() })
const unwatchToken = watch(() => authStore.token, () => { fetchProducts() })
const unwatchChannel = watch(() => selectedChannel.value, () => { fetchProducts() })
onUnmounted(() => { unwatchToken(); unwatchChannel() })
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