<template>
  <div class="product-list-section">
    <h2 class="text-2xl font-semibold text-gray-300 mb-6">Product List</h2>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-10 text-gray-400">Loading products...</div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md mb-6">
      <h3 class="font-bold mb-2">An error occurred:</h3>
      <p class="text-sm">{{ error }}</p>
    </div>

    <!-- Success state -->
    <div v-else-if="products.length > 0">
      <!-- Collection filter and view mode toggle -->
      <div class="mb-6 flex flex-wrap items-center gap-4">
        <!-- Collection filter -->
        <div class="flex items-center gap-2">
          <label for="collectionFilter" class="font-bold text-blue-300">Filter by Collection:</label>
          <select id="collectionFilter" v-model="selectedCollection"
            @change="filterProductsByCollection(selectedCollection)"
            class="px-4 py-2 bg-dark-200 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors">
            <option :value="null">All Collections</option>
            <option v-for="collection in collections" :key="collection.id" :value="collection.id">
              <!-- {{ collection.level }} -->
              {{ '\u00A0'.repeat(collection.level * 2) }}- {{ collection.name }}
            </option>
          </select>
        </div>

        <!-- Channel selection for export -->
        <div class="flex items-center gap-2">
          <label for="channelSelect" class="font-bold text-blue-300">Export Channel:</label>
          <select id="channelSelect" v-model="selectedChannel"
            class="px-4 py-2 bg-dark-200 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors">
            <option :value="null">All Channels</option>
            <option v-for="channel in channels" :key="channel.id" :value="channel">
              {{ channel.code }} ({{ channel.currencyCode }})
            </option>
          </select>
        </div>

        <!-- View mode toggle -->
        <!-- <div class="flex items-center gap-2 ml-auto">
          <span class="font-bold text-blue-300">View:</span>
          <div class="flex bg-dark-200 rounded-md border border-dark-100">


            <button 
              @click="viewMode = 'list'"
              class="px-4 py-2 rounded-r-md transition-all duration-300" 
              :class="{
                'bg-secondary text-white': viewMode === 'list',
                'text-gray-300 hover:bg-dark-100': viewMode !== 'list'
              }"
            >
              List
            </button>

            <button 
              @click="viewMode = 'card'"
              class="px-4 py-2 rounded-l-md transition-all duration-300" 
              :class="{
                'bg-blue-500 text-white': viewMode === 'card',
                'text-gray-300 hover:bg-dark-100': viewMode !== 'card'
              }"
            >
              Card
            </button>

          </div>
        </div> -->
      </div>

      <!-- Selected products info -->
      <div class="mb-6 p-4 bg-dark-200 rounded-md">

        <div class="flex flex-row justify-between mr-10">

          <div>
            <p class="text-blue-300">
              Showing {{ products.length }} of {{ allProducts.length }} products
              <span v-if="selectedCollection"> in {{collections.find(c => c.id === selectedCollection)?.name}}</span>
            </p>

          </div>

          <div>
            <p class="text-gray-200 text-xs">
              Selected: {{ selectedProducts.length }}
            </p>

          </div>

        </div>


        <div class="mt-2 flex gap-2 flex-wrap">

          <!-- Import/Export buttons -->
          <div class="flex gap-2">

            <!-- Export Selected Products button -->
            <button @click="exportSelectedProducts" :disabled="selectedProducts.length === 0 || isExporting"
              class="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Export only the selected products">
              {{ isExporting ? 'Exporting...' : 'Export Selected' }}
            </button>

            <!-- Export All Products button -->
            <button @click="exportAllProducts" :disabled="isExporting"
              class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Export all products regardless of selection">
              {{ isExporting ? 'Exporting...' : 'Export All Products' }}
            </button>
          </div>

          <div class="flex gap-2">
            <button @click="clearSelection" :disabled="selectedProducts.length === 0"
              class="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Clear Selection
            </button>

            <button @click="selectedCollection = null; filterProductsByCollection(null)" :disabled="!selectedCollection"
              class="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Show All Products
            </button>
          </div>
        </div>

        <!-- Export error message -->
        <p v-if="exportError" class="text-red-400 mt-3 text-sm">
          Error: {{ exportError }}
        </p>
      </div>

      <!-- Products display - Card or List view -->

      <!-- List view -->
      <div v-if="viewMode === 'list'" class="space-y-4">
        <div v-for="product in products" :key="product.id"
          class="bg-dark-200 rounded-lg border border-dark-100 overflow-hidden transition-all duration-300 hover:border-secondary hover:shadow-lg">
          <div class="p-4 flex items-center gap-4">
            <!-- Checkbox for selection -->
            <div class="flex-shrink-0">
              <input type="checkbox" :id="`product-${product.id}`" :checked="isSelected(product.id)"
                @change="toggleProductSelection(product)"
                class="w-5 h-5 text-secondary focus:ring-secondary rounded transition-colors" />
              <label :for="`product-${product.id}`" class="sr-only">{{ product.name }}</label>
            </div>

            <!-- Product image -->
            <div class="flex-shrink-0 w-20 h-20 overflow-hidden bg-dark-100 rounded-md">
              <img
                :src="product.featuredAsset ? `${product.featuredAsset.preview}?w=100&h=100` : 'https://via.placeholder.com/100x100?text=No+Image'"
                :alt="product.name"
                class="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
            </div>

            <!-- Product details -->
            <div class="flex-grow min-w-0">
              <h3 class="text-lg font-semibold text-white mb-1 truncate">{{ product.name }}</h3>

              <div class="flex flex-row">

                <div>

                  <p class="text-sm text-gray-400 mb-2">ID: {{ product.id }}</p>

                </div>

                <div class="ml-4">

                  <p class="text-sm text-secondary" v-if="product.variants && product.variants.length > 0">
                    {{ product.variants.length }} variants
                  </p>
                  <p class="text-sm text-gray-500" v-else>
                    0 variants
                  </p>

                </div>

              </div>

              <!-- Collections -->
              <div class="flex flex-wrap gap-2">
                <span v-for="collection in product.collections" :key="collection.id"
                  class="text-xs bg-dark-300 text-gray-300 px-2 py-1 rounded-full">
                  {{ collection.name }}
                </span>
              </div>
              
              <!-- Uploaded Tech Docs -->
              <div v-if="product.customFields?.techDocs?.length > 0" class="mt-3">
                <div class="text-xs text-gray-400 mb-2">Tech Docs:</div>
                <div class="flex flex-wrap gap-2">
                  <div v-for="doc in product.customFields.techDocs" :key="doc.id" class="relative group">
                    <div v-if="isPdfFile(doc.name)" 
                         class="px-3 py-2 bg-red-900/30 border border-red-700 rounded-md flex items-center gap-2 cursor-pointer hover:bg-red-800/30 transition-colors">
                      <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v7h7v9H6z"/>
                      </svg>
                      <span class="text-xs text-gray-300 truncate max-w-[100px]">{{ doc.name }}</span>
                    </div>
                    <img v-else 
                         :src="doc.preview" 
                         :alt="doc.name" 
                         class="w-12 h-12 object-cover rounded-md border border-dark-100 cursor-pointer hover:border-secondary transition-colors"
                         :title="doc.name"
                    />
                    <a :href="doc.source" target="_blank" rel="noopener noreferrer" 
                       class="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                       title="Download">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Variant count -->
            <div class="flex-shrink-0 text-right">

            </div>

            <!-- Upload Docs Button -->
            <div class="flex-shrink-0">
              <label 
                class="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-500 cursor-pointer transition-colors inline-block"
                title="Upload technical documentation"
              >
                Upload Docs
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  class="hidden" 
                  @change="handleDocUpload($event, product)"
                  :disabled="uploadingProductId === product.id"
                >
              </label>
              <p v-if="uploadingProductId === product.id" class="text-xs text-blue-400 mt-1">Uploading...</p>
              <p v-if="uploadSuccessProductId === product.id" class="text-xs text-green-400 mt-1">Success!</p>
              <p v-if="uploadErrorProductId === product.id" class="text-xs text-red-400 mt-1">Error!</p>
            </div>


          </div>
        </div>
      </div>
    </div>

    <!-- No results state -->
    <div v-else class="text-center py-10 text-gray-400">
      <p>No products found.</p>
      <button @click="selectedCollection = null; filterProductsByCollection(null)"
        class="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500 transition-colors">
        Show All Products
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'

// Import auth store
import { useAuthStore } from '../stores/auth'

// Get auth store
const authStore = useAuthStore()

// Emits
const emit = defineEmits(['selection-change'])

// State
const loading = ref(false)
const error = ref('')
const products = ref([])
const allProducts = ref([])
const selectedProducts = ref([])
const collections = ref([])
const selectedCollection = ref(null)
// Add view mode state (card or list)
const viewMode = ref('list')

// Export functionality state
const isExporting = ref(false)
const exportError = ref(null)

// Upload functionality state
const uploadingProductId = ref(null)
const uploadSuccessProductId = ref(null)
const uploadErrorProductId = ref(null)

// Channel export state
const channels = ref([])
const selectedChannel = ref(null)
let apolloClient = null

// Create Apollo Client with token
const createApolloClient = (authToken, channelToken = null) => {
  const httpLink = createHttpLink({
    uri: import.meta.env.VITE_VENDURE_ADMIN_API_URL,
    fetchOptions: {
      credentials: 'include' // Important: This allows cookies to be sent with requests
    }
  })

  const authLink = setContext((_, { headers }) => {
    const requestHeaders = {
      ...headers,
      authorization: authToken ? `Bearer ${authToken}` : '',
    }

    // Add channel token if provided
    if (channelToken) {
      requestHeaders['vendure-token'] = channelToken
    }

    return {
      headers: requestHeaders
    }
  })

  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  })
}

// GraphQL query to fetch products for display
const GET_PRODUCTS_QUERY = gql`
  query GetProducts {
    products(options: { take: 100 }) {
      items {
        id
        name
        variants {
          id
        }
        featuredAsset {
          id
          preview
        }
        collections {
          id
          name
        }
        customFields {
          techDocs {
            id
            name
            preview
            source
          }
        }
      }
    }
    collections {
      items {
        id
        name
        slug
        parent {
          id
          name
        }
        children {
          id
          name
          slug
        }
      }
    }
    # Fetch channels for export selection
    channels(options: { take: 100 }) {
      items {
        id
        code
        token
        defaultLanguageCode
        currencyCode
        pricesIncludeTax
      }
    }
  }
`

// GraphQL query for comprehensive product export (enhanced for import/export)
const PRODUCT_EXPORT_QUERY = gql`
  query FullProductExportQuery {
    products(options: { take: 1000 }) {
      items {
        id
        name
        slug
        description
        featuredAsset {
          id
          name
          source
        }
        # Fetch the full list of assets for the product
        assets {
          id
          name
          source
        }
        # Get collections with their slugs for stable identification
        collections {
          id
          slug
          name
        }
        # Get channels with their codes
        channels {
          id
          code
        }
        # Get facet values with their codes
        facetValues {
          id
          code
          # Get the facet group to which this value belongs
          facet {
            id
            code
          }
        }
        variants {
          id
          name
          sku
          # Raw price without tax for accuracy
          price
          currencyCode
          taxCategory {
            id
            name
          }
          # Get stock levels by location
          stockLevels {
            stockLocationId
            stockOnHand
          }
          # --- NEW: Fetch variant-level assets and facets --- 
          # Fetch assets that belong specifically to this variant
          assets {
            id
            source
          }
          facetValues {
            id
            code
            facet {
              id
              code
            }
          }
          featuredAsset {
            id
            source
          }
          # --- NEW: Fetch all prices for multi-channel support --- 
          prices {
            price        # This is the integer price value
            currencyCode
          }
          # -----------------------------------------------
          # --- THIS IS THE FINAL, CRUCIAL PART --- 
          # For each variant, get its defining options
          options {
            id
            code # e.g., "small", "red"
            group {
              id
              code # e.g., "size", "color"
            }
          }
          # --------------------------
        }
      }
    }
  }
`

// Fetch products
const fetchProducts = async () => {
  loading.value = true
  error.value = ''

  try {
    // Get channel token from selected channel
    const channelToken = selectedChannel.value ? selectedChannel.value.token : null

    // Create Apollo Client with token and channel token if provided
    apolloClient = createApolloClient(authStore.token, channelToken)

    const result = await apolloClient.query({
      query: GET_PRODUCTS_QUERY,
      fetchPolicy: 'network-only' // Ensure fresh data for each channel selection
    })

    if (result.data) {
      // Store all products
      if (result.data.products && result.data.products.items) {
        allProducts.value = result.data.products.items
        products.value = [...allProducts.value]
      } else {
        allProducts.value = []
        products.value = []
      }

      // Store collections and organize them hierarchically
      if (result.data.collections && result.data.collections.items) {
        // First, filter out the root collection
        const allCollections = result.data.collections.items.filter(c => c.id !== '1')

        // Build a map of all collections for quick lookup
        const collectionMap = new Map()
        allCollections.forEach(collection => {
          collectionMap.set(collection.id, { ...collection, children: [] })
        })

        // Build the proper parent-child relationships
        const topLevelCollections = []

        allCollections.forEach(collection => {
          if (collection.parent && collection.parent.id === '1') {
            // This is a top-level collection
            topLevelCollections.push(collectionMap.get(collection.id))
          } else if (collection.parent) {
            // This is a child collection, add it to its parent's children array
            const parent = collectionMap.get(collection.parent.id)
            if (parent) {
              parent.children.push(collectionMap.get(collection.id))
            }
          }
        })

        // Create a flat array with indentation for the dropdown
        const flattenedCollections = []

        // Helper function to flatten nested collections with indentation
        const flattenCollections = (collections, level = 0) => {
          collections.forEach(collection => {
            flattenedCollections.push({
              id: collection.id,
              name: collection.name,
              slug: collection.slug,
              level
            })
            // Recursively flatten children if they exist
            if (collection.children && collection.children.length > 0) {
              flattenCollections(collection.children, level + 1)
            }
          })
        }

        // Flatten the hierarchical collections
        flattenCollections(topLevelCollections)
        collections.value = flattenedCollections
      } else {
        collections.value = []
      }

      // Store channels for export selection
      if (result.data.channels && result.data.channels.items) {
        channels.value = result.data.channels.items
      } else {
        channels.value = []
      }
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Filter products by collection
const filterProductsByCollection = (collectionId) => {
  selectedCollection.value = collectionId

  if (collectionId === null) {
    // Show all products
    products.value = [...allProducts.value]
  } else {
    // Filter products by selected collection
    products.value = allProducts.value.filter(product => {
      return product.collections.some(collection => collection.id === collectionId)
    })
  }
}

// Check if product is selected
const isSelected = (productId) => {
  return selectedProducts.value.some(p => p.id === productId)
}

// Toggle product selection
const toggleProductSelection = (product) => {
  const index = selectedProducts.value.findIndex(p => p.id === product.id)

  if (index > -1) {
    // Remove from selection
    selectedProducts.value.splice(index, 1)
  } else {
    // Add to selection
    selectedProducts.value.push(product)
  }

  // Emit selection change event
  emit('selection-change', selectedProducts.value)
}

// Upload file to Vendure
const uploadFile = async (file) => {
  try {
    const formData = new FormData()
    
    const operations = {
      query: `
        mutation UploadCustomerFile($file: Upload!) {
          uploadCustomerFile(file: $file) {
            id
            name
            preview
            source
          }
        }
      `,
      variables: { file: null }
    }
    
    formData.append('operations', JSON.stringify(operations))
    formData.append('map', JSON.stringify({ '0': ['variables.file'] }))
    formData.append('0', file)

    const headers = {}
    const token = authStore.token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const apiUrl = import.meta.env.VITE_VENDURE_ADMIN_API_URL

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: formData
    })

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

// Update product custom field with techDocs
const updateProductTechDocs = async (productId, assetIds) => {
  try {
    const apolloClient = createApolloClient(authStore.token)
    
    const UPDATE_PRODUCT_MUTATION = gql`
      mutation UpdateProductDocs($input: UpdateProductInput!) {
        updateProduct(input: $input) {
          id
          customFields {
            techDocs {
              id
              preview
            }
          }
        }
      }
    `

    const result = await apolloClient.mutate({
      mutation: UPDATE_PRODUCT_MUTATION,
      variables: {
        input: {
          id: productId,
          customFields: {
            techDocs: assetIds
          }
        }
      }
    })

    return result.data.updateProduct
  } catch (error) {
    console.error('Error updating product techDocs:', error)
    throw error
  }
}

// Handle document upload
const handleDocUpload = async (event, product) => {
  const file = event.target.files[0]
  if (!file) return

  uploadingProductId.value = product.id
  uploadSuccessProductId.value = null
  uploadErrorProductId.value = null

  try {
    const asset = await uploadFile(file)
    
    if (asset && asset.id) {
      const existingDocIds = product.customFields?.techDocs?.map(doc => doc.id) || []
      const updatedDocIds = [...existingDocIds, asset.id]
      await updateProductTechDocs(product.id, updatedDocIds)
      uploadSuccessProductId.value = product.id
    }
  } catch (err) {
    console.error('Upload failed:', err)
    uploadErrorProductId.value = product.id
  } finally {
    uploadingProductId.value = null
    event.target.value = ''
    
    // Clear success/error messages after 3 seconds
    setTimeout(() => {
      uploadSuccessProductId.value = null
      uploadErrorProductId.value = null
    }, 3000)
  }
}

// Check if file is PDF
const isPdfFile = (filename) => {
  if (!filename) return false
  return filename.toLowerCase().endsWith('.pdf')
}

// Clear selection
const clearSelection = () => {
  selectedProducts.value = []
  emit('selection-change', [])
}

// Export selected products to CSV (browser-based generation)
const exportSelectedProducts = async () => {
  // Clear any previous errors and set the loading state
  exportError.value = null
  isExporting.value = true

  try {
    // Check if any products are selected
    if (selectedProducts.value.length === 0) {
      throw new Error('Please select at least one product to export.')
    }

    // Create Apollo Client with token and selected channel token if provided
    const channelToken = selectedChannel.value ? selectedChannel.value.token : null
    apolloClient = createApolloClient(authStore.token, channelToken)

    // Fetch comprehensive product data including variants and assets
    const { data } = await apolloClient.query({
      query: PRODUCT_EXPORT_QUERY,
      fetchPolicy: 'network-only', // Ensure we get fresh data
    })

    if (!data || !data.products || !data.products.items) {
      throw new Error('No product data received from the API.')
    }

    // Filter products to only include selected ones
    const selectedProductIds = new Set(selectedProducts.value.map(p => p.id))
    const selectedProductsData = data.products.items.filter(product =>
      selectedProductIds.has(product.id)
    )

    // --- Step 1: Flatten the Data for the CSV --- 
    const flatData = []
    selectedProductsData.forEach(product => {
      // Convert collections to slug format (pipe-separated for import)
      const collectionSlugs = product.collections.map(c => c.slug).join('|')
      const collectionNames = product.collections.map(c => c.name).join(', ')

      // Convert channels to code format (pipe-separated for import)
      const channelCodes = product.channels.map(ch => ch.code).join('|')

      // --- PRODUCT-LEVEL DATA --- 
      // Convert product facet values to group:value format (pipe-separated for import)
      const productFacetValues = product.facetValues.map(fv =>
        `${fv.facet?.code || 'unknown'}:${fv.code}`
      ).join('|')

      // Process all product assets into pipe-separated URLs
      const productAssets = product.assets
        .map(asset => asset.source)
        .join('|')
      // --- END OF PRODUCT-LEVEL DATA --- 

      if (product.variants.length === 0) {
        // Handle products with no variants
        flatData.push({
          productId: product.id,
          productName: product.name,
          productSlug: product.slug || '',
          productDescription: product.description || '',
          featuredAssetSource: product.featuredAsset?.source || '',
          // --- PRODUCT-LEVEL DATA --- 
          productAssets: productAssets,
          productFacetValues: productFacetValues,
          // --- END OF PRODUCT-LEVEL DATA --- 
          variantId: '',
          variantName: '',
          variantSku: '',
          variantPrice: '',
          variantCurrencyCode: '',
          taxCategoryName: '',
          // --- VARIANT-LEVEL DATA --- 
          variantFeaturedAsset: '',
          variantAssets: '',
          variantFacetValues: '',
          // --- END OF VARIANT-LEVEL DATA --- 
          collections: collectionSlugs,
          collectionNames: collectionNames,
          channels: channelCodes,
          stockLevels: '',
        })
      } else {
        // Create a new row for each variant
        product.variants.forEach(variant => {
          // --- FIX FOR STOCK LEVELS --- 
          let stockLevelString = ''; // Default to empty string if no stock levels exist
          if (variant.stockLevels && variant.stockLevels.length > 0) {
            // If stock levels exist, format them correctly with semicolon separator
            stockLevelString = variant.stockLevels
              .map(sl => {
                // Ensure stockOnHand is an integer, not a float
                const locationId = sl.stockLocationId || 'default';
                // Ensure stockOnHand is an integer, using Math.trunc for maximum robustness
                const stockOnHand = Math.trunc(Number(sl.stockOnHand)) || 0; // Remove decimal part, default to 0 if invalid
                return `${locationId}:${stockOnHand}`;
              })
              .join(';'); // Use semicolon separator for better readability
          }

          // --- NEW: Process multi-channel prices into pipe-separated string --- 
          let multiChannelPrices = '';
          if (variant.prices && variant.prices.length > 0) {
            multiChannelPrices = variant.prices
              .map(price => {
                // Format as channelId:price:currencyCode, converting price from minor units to decimal
                const formattedPrice = (price.price / 100).toFixed(2);
                return `${price.channelId}:${formattedPrice}:${price.currencyCode}`;
              })
              .join('|'); // Use pipe separator for readability
          }

          flatData.push({
            productId: product.id,
            productName: product.name,
            productSlug: product.slug || '',
            productDescription: product.description || '',
            featuredAssetSource: product.featuredAsset?.source || '',
            // --- PRODUCT-LEVEL DATA --- 
            productAssets: productAssets,
            productFacetValues: productFacetValues,
            // --- END OF PRODUCT-LEVEL DATA --- 
            variantId: variant.id,
            variantName: variant.name,
            variantSku: variant.sku || '',
            // Convert price from cents/minor units to a decimal format
            variantPrice: variant.price ? (variant.price / 100).toFixed(2) : '',
            variantCurrencyCode: variant.currencyCode || '',
            variantFeaturedAsset: variant.featuredAsset?.source || '',
            taxCategoryName: variant.taxCategory?.name || '',
            // --- VARIANT-LEVEL DATA --- 
            variantAssets: variant.assets.map(asset => asset.source).join('|'),
            variantFacetValues: variant.facetValues.map(fv => `${fv.facet?.code || 'unknown'}:${fv.code}`).join('|'),
            // --- NEW: Add options column --- 
            options: variant.options.map(option => `${option.group.code}:${option.code}`).join('|'),
            // --- END OF NEW PART --- 
            // Stable identifiers for import
            collections: collectionSlugs,
            // Human-readable for reference
            collectionNames: collectionNames,
            channels: channelCodes,
            stockLevels: stockLevelString,
            multiChannelPrices: multiChannelPrices,
          })
        })
      }
    })

    if (flatData.length === 0) {
      throw new Error('There are no products to export.')
    }

    // --- Step 2: Generate the CSV and Trigger Download --- 
    const csvString = convertToCsv(flatData)
    downloadBlob(csvString, `vendure-product-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;')

  } catch (err) {
    console.error('Export failed:', err)
    exportError.value = err.message
  } finally {
    // Reset the loading state
    isExporting.value = false
  }
}

// Handle CSV import
const handleImport = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    exportError.value = 'Please select a CSV file'
    return
  }

  try {
    exportError.value = null
    isExporting.value = true

    // Read the CSV file
    const text = await file.text()
    console.log('Imported CSV content:', text)

    // TODO: Implement CSV parsing and product import logic
    // This could include:
    // 1. Parsing CSV into objects
    // 2. Validating product data
    // 3. Calling GraphQL mutations to create/update products
    // 4. Showing progress and success/error messages

    alert(`Successfully imported CSV file: ${file.name}`)

    // Reset file input
    event.target.value = ''

    // Refresh product list to show imported products
    fetchProducts()
  } catch (err) {
    console.error('Import failed:', err)
    exportError.value = `Import failed: ${err.message}`
  } finally {
    isExporting.value = false
  }
}

// Export ALL products to CSV
const exportAllProducts = async () => {
  // Clear any previous errors and set the loading state
  exportError.value = null
  isExporting.value = true

  try {
    // Create Apollo Client with token and selected channel token if provided
    const channelToken = selectedChannel.value ? selectedChannel.value.token : null
    apolloClient = createApolloClient(authStore.token, channelToken)

    // Fetch comprehensive product data including variants and assets
    const { data } = await apolloClient.query({
      query: PRODUCT_EXPORT_QUERY,
      fetchPolicy: 'network-only', // Ensure we get fresh data
    })

    if (!data || !data.products || !data.products.items) {
      throw new Error('No product data received from the API.')
    }

    // --- Step 1: Flatten the Data for the CSV --- 
    const flatData = []
    data.products.items.forEach(product => {
      // Convert collections to slug format (pipe-separated for import)
      const collectionSlugs = product.collections.map(c => c.slug).join('|')
      const collectionNames = product.collections.map(c => c.name).join(', ')

      // Convert channels to code format (pipe-separated for import)
      const channelCodes = product.channels.map(ch => ch.code).join('|')

      // --- PRODUCT-LEVEL DATA --- 
      // Convert product facet values to group:value format (pipe-separated for import)
      const productFacetValues = product.facetValues.map(fv =>
        `${fv.facet?.code || 'unknown'}:${fv.code}`
      ).join('|')

      // Process all product assets into pipe-separated URLs
      const productAssets = product.assets
        .map(asset => asset.source)
        .join('|')
      // --- END OF PRODUCT-LEVEL DATA --- 

      if (product.variants.length === 0) {
        // Handle products with no variants
        flatData.push({
          productId: product.id,
          productName: product.name,
          productSlug: product.slug || '',
          productDescription: product.description || '',
          featuredAssetSource: product.featuredAsset?.source || '',
          // --- PRODUCT-LEVEL DATA --- 
          productAssets: productAssets,
          productFacetValues: productFacetValues,
          // --- END OF PRODUCT-LEVEL DATA --- 
          variantId: '',
          variantName: '',
          variantSku: '',
          variantPrice: '',
          variantCurrencyCode: '',
          taxCategoryName: '',
          // --- VARIANT-LEVEL DATA --- 
          variantFeaturedAsset: '',
          variantAssets: '',
          variantFacetValues: '',
          // --- END OF VARIANT-LEVEL DATA --- 
          collections: collectionSlugs,
          collectionNames: collectionNames,
          channels: channelCodes,
          stockLevels: '',
        })
      } else {
        // Create a new row for each variant
        product.variants.forEach(variant => {
          // --- FIX FOR STOCK LEVELS --- 
          let stockLevelString = ''; // Default to empty string if no stock levels exist
          if (variant.stockLevels && variant.stockLevels.length > 0) {
            // If stock levels exist, format them correctly with semicolon separator
            stockLevelString = variant.stockLevels
              .map(sl => {
                const locationId = sl.stockLocationId || 'default';
                // Ensure stockOnHand is an integer, using Math.trunc for maximum robustness
                const stockOnHand = Math.trunc(Number(sl.stockOnHand)) || 0; // Remove decimal part, default to 0 if invalid
                return `${locationId}:${stockOnHand}`;
              })
              .join(';'); // Use semicolon separator for better readability
          }

          // --- NEW: Process multi-channel prices into pipe-separated string --- 
          let multiChannelPrices = '';
          if (variant.prices && variant.prices.length > 0) {
            multiChannelPrices = variant.prices
              .map(price => {
                // Format as channelId:price:currencyCode, converting price from minor units to decimal
                const formattedPrice = (price.price / 100).toFixed(2);
                return `${price.channelId}:${formattedPrice}:${price.currencyCode}`;
              })
              .join('|'); // Use pipe separator for readability
          }

          flatData.push({
            productId: product.id,
            productName: product.name,
            productSlug: product.slug || '',
            productDescription: product.description || '',
            featuredAssetSource: product.featuredAsset?.source || '',
            // --- PRODUCT-LEVEL DATA --- 
            productAssets: productAssets,
            productFacetValues: productFacetValues,
            // --- END OF PRODUCT-LEVEL DATA --- 
            variantId: variant.id,
            variantName: variant.name,
            variantSku: variant.sku || '',
            // Convert price from cents/minor units to a decimal format
            variantPrice: variant.price ? (variant.price / 100).toFixed(2) : '',
            variantCurrencyCode: variant.currencyCode || '',
            variantFeaturedAsset: variant.featuredAsset?.source || '',
            taxCategoryName: variant.taxCategory?.name || '',
            // --- VARIANT-LEVEL DATA --- 
            variantAssets: variant.assets.map(asset => asset.source).join('|'),
            variantFacetValues: variant.facetValues.map(fv => `${fv.facet?.code || 'unknown'}:${fv.code}`).join('|'),
            // --- NEW: Add options column --- 
            options: variant.options.map(option => `${option.group.code}:${option.code}`).join('|'),
            // --- END OF NEW PART --- 
            // Stable identifiers for import
            collections: collectionSlugs,
            // Human-readable for reference
            collectionNames: collectionNames,
            channels: channelCodes,
            stockLevels: stockLevelString,
          })
        })
      }
    })

    if (flatData.length === 0) {
      throw new Error('There are no products to export.')
    }

    // --- Step 2: Generate the CSV and Trigger Download --- 
    const csvString = convertToCsv(flatData)
    downloadBlob(csvString, `vendure-product-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;')

  } catch (err) {
    console.error('Export failed:', err)
    exportError.value = err.message
  } finally {
    // Reset the loading state
    isExporting.value = false
  }
}

// Convert data to CSV format
const convertToCsv = (data) => {
  if (!data || data.length === 0) {
    return ''
  }

  const headers = Object.keys(data[0])
  const headerRow = headers.join(',') + '\r\n'

  const rows = data.map(row => {
    return headers.map(header => {
      let cell = row[header]
      if (cell === null || cell === undefined) {
        cell = ''
      }
      // Escape double quotes and handle values with commas
      const cellString = cell.toString().replace(/"/g, '""')
      return `"${cellString}"`
    }).join(',')
  })

  return headerRow + rows.join('\r\n')
}

// Download helper function
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

// Fetch products when component mounts or token changes
onMounted(() => {
  fetchProducts()
})

// Watch for token changes in auth store
const unwatchToken = watch(() => authStore.token, () => {
  fetchProducts()
})

// Watch for channel changes to refresh products with channel-specific token
const unwatchChannel = watch(() => selectedChannel.value, (newChannel) => {
  fetchProducts()
})

// Cleanup watchers
onUnmounted(() => {
  unwatchToken()
  unwatchChannel()
})
</script>

<style scoped>
.product-list-section {
  margin-top: 2rem;
}
</style>