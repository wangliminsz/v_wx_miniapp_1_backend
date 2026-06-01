<template>
  <div class="product-list-section">
    <h2 class="text-3xl font-bold text-center mb-8 text-dark-300 drop-shadow-lg">Product by Page</h2>

    <div v-if="loading" class="text-center py-10 text-gray-400">Loading products...</div>

    <div v-else-if="error" class="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md mb-6">
      <h3 class="font-bold mb-2">An error occurred:</h3>
      <p class="text-sm">{{ error }}</p>
    </div>

    <div v-else-if="products.length > 0" class="mb-6">

      <!-- Pagination controls -->
      <div class="flex items-center justify-center gap-3 mb-10">
        <button @click="prevPage" :disabled="currentPage === 1"
          class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">
          Previous
        </button>
        <div class="flex items-center gap-2">
          <button v-for="page in visiblePages" :key="page" @click="goToPage(page)" :class="['px-3 py-2 rounded-md transition-colors',
            currentPage === page ? 'bg-primary text-white' : 'bg-gray-600 text-white']">
            {{ page }}
          </button>
        </div>
        <span class="text-gray-300">
          Page {{ currentPage }} of {{ totalPages }} ({{ totalItems }} products)
        </span>
        <button @click="nextPage" :disabled="currentPage >= totalPages"
          class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">
          Next
        </button>
      </div>


      <!-- Product list -->
      <div class="bg-dark-200 rounded-md p-4 mb-4">
        <ul class="space-y-2">

          <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -->

          <!-- <li v-for="product in products" :key="product.id" class="text-gray-300 p-2 bg-dark-100 rounded-md">
            {{ product.name }}
          </li> -->

          <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -->


          <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -->


        </ul>
      </div>

      <!-- Pagination controls -->
      <div class="flex items-center justify-center gap-3 mt-10">
        <button @click="prevPage" :disabled="currentPage === 1"
          class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">
          Previous
        </button>
        <div class="flex items-center gap-2">
          <button v-for="page in visiblePages" :key="page" @click="goToPage(page)" :class="['px-3 py-2 rounded-md transition-colors',
            currentPage === page ? 'bg-primary text-white' : 'bg-gray-600 text-white']">
            {{ page }}
          </button>
        </div>
        <span class="text-gray-300">
          Page {{ currentPage }} of {{ totalPages }} ({{ totalItems }} products)
        </span>
        <button @click="nextPage" :disabled="currentPage >= totalPages"
          class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>



// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


import { ref, onMounted, watch, onUnmounted, computed, nextTick } from 'vue'
import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'

import { useAuthStore } from '../stores/auth'
import AssetSelector from '../components/AssetSelector.vue'
import { getChannelTokenFromQuery } from '../utils/channelToken.js'


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


// import { ref, onMounted, computed } from 'vue'
// import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client/core'
// import { setContext } from '@apollo/client/link/context'
// import { useAuthStore } from '../stores/auth'
// import { getChannelTokenFromQuery } from '../utils/channelToken'



// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~





// Close menu when clicking outside
const handleClickOutside = (event) => {
  if (showAssetMenu.value) {
    // Don't close if we clicked on a menu button (the three dots)
    const target = event.target
    const isMenuButton = target.closest('[data-asset-menu]')
    if (!isMenuButton) {
      showAssetMenu.value = null
    }
  }
}

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
const sortOrder = ref('asc') // 'asc' | 'desc'

const isExporting = ref(false)
const exportError = ref(null)

const isRemovingFromChannel = ref(false)
const isAssigningToChannel = ref(false)
const showAssignChannelModal = ref(false)
const selectedAssignChannel = ref(null)
const priceFactor = ref(1)

const activeChannel = ref(null)

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

const channels = computed(() => authStore.channels)
const selectedChannel = ref(null)
const facets = ref([])
const editingFacetsProductId = ref(null)
const isUpdatingFacets = ref(false)
const isUpdatingEnabled = ref({})
let apolloClient = null

// Asset management state
const showAssetSelector = ref(false)
const assetSelectorMode = ref(null) // 'add' or 'featured'
const assetSelectorProduct = ref(null)
const tempSelectedAssetIds = ref([])
const isUpdatingAssets = ref(false)

// Asset menu state
const showAssetMenu = ref(null) // { productId, assetId }
const menuRefs = ref({}) // key: "${productId}-${assetId}", value: DOM element
const menuPosition = ref({ x: 0, y: 0 })

// Computed properties
const isSingleChannel = computed(() => authStore.channels.length <= 1)
const displaySelectedChannel = computed(() => {
  if (selectedChannel.value) return selectedChannel.value
  if (authStore.activeChannel) return authStore.activeChannel
  return null
})


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


// const authStore = useAuthStore()

// State
// const loading = ref(false)
// const error = ref('')
// const products = ref([])
const currentPage = ref(1)
const totalItems = ref(0)
const pageSize = Number(import.meta.env.VITE_VENDURE_PRODUCT_PAGE_NUMBER || 10)

// Computed total pages
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize))

// Visible pages (show up to 5 pages around current)
const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const goToPage = (page) => {
  if (page !== currentPage.value) {
    currentPage.value = page
    fetchPaginatedProducts()
  }
}

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

const GET_PAGINATED_PRODUCTS_QUERY = gql`
  query GetPaginatedProducts($take: Int!, $skip: Int!) {
    products(options: { take: $take, skip: $skip, sort: { name: ASC } }) {
      items {
        id
        name
      }
      totalItems
    }
  }
`

const fetchPaginatedProducts = async () => {
  loading.value = true
  error.value = ''
  try {
    const apolloClient = createApolloClient(authStore.token, getChannelTokenFromQuery())
    const { data } = await apolloClient.query({
      query: GET_PAGINATED_PRODUCTS_QUERY,
      variables: {
        take: pageSize,
        skip: (currentPage.value - 1) * pageSize
      }
    })
    products.value = data.products.items
    totalItems.value = data.products.totalItems
  } catch (err) {
    console.error('Error fetching paginated products:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchPaginatedProducts()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchPaginatedProducts()
  }
}








// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~




const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  products.value = sortProductsById(products.value)
}

const filterProductsByCollection = (collectionId) => {
  selectedCollection.value = collectionId
  if (collectionId === null) {
    products.value = sortProductsById(allProducts.value)
  } else {
    const filtered = allProducts.value.filter(product => {
      return product.collections.some(collection => collection.id === collectionId)
    })
    products.value = sortProductsById(filtered)
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
    const apolloClient = createApolloClient(authStore.token, channelToken)
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
    // Get channel token
    let channelToken = getChannelTokenFromQuery() || null
    if (selectedChannel.value) {
      channelToken = selectedChannel.value.token
    } else if (authStore.activeChannel && !getChannelTokenFromQuery()) {
      channelToken = authStore.activeChannel.token
    }

    const asset = await uploadFile(file, channelToken)
    if (asset && asset.id) {
      // Gather pure asset IDs
      const existingDocIds = product.customFields?.techDocs?.map(doc => doc.id) || []
      const updatedDocIds = [...existingDocIds, asset.id]

      console.log("1 --> updatedDocIds -->", updatedDocIds)

      const updatedProduct = await updateProductTechDocs(product.id, updatedDocIds, channelToken)

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

    // Get channel token
    let channelToken = getChannelTokenFromQuery() || null
    if (selectedChannel.value) {
      channelToken = selectedChannel.value.token
    } else if (authStore.activeChannel && !getChannelTokenFromQuery()) {
      channelToken = authStore.activeChannel.token
    }

    const updatedProduct = await updateProductTechDocs(product.id, updatedDocIds, channelToken)

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

const removeFromChannel = async () => {
  if (selectedProducts.value.length === 0) {
    alert('Please select at least one product to remove from the channel.')
    return
  }

  if (!confirm(`Are you sure you want to remove ${selectedProducts.value.length} product(s) from the current channel?`)) {
    return
  }

  isRemovingFromChannel.value = true
  try {
    let channelToken = getChannelTokenFromQuery() || null
    if (selectedChannel.value) {
      channelToken = selectedChannel.value.token
    } else if (authStore.activeChannel && !getChannelTokenFromQuery()) {
      channelToken = authStore.activeChannel.token
    }

    const channelId = selectedChannel.value?.id || activeChannel.value?.id

    if (!channelId) {
      throw new Error('No active channel found. Please select a channel first.')
    }

    apolloClient = createApolloClient(authStore.token, channelToken)

    const { data } = await apolloClient.mutate({
      mutation: REMOVE_PRODUCTS_FROM_CHANNEL_MUTATION,
      variables: {
        input: {
          channelId: channelId,
          productIds: selectedProducts.value.map(p => p.id)
        }
      }
    })

    alert(`Successfully removed ${selectedProducts.value.length} product(s) from the channel.`)

    // Refresh product list
    await fetchProducts()
    clearSelection()
  } catch (err) {
    console.error('Error removing products from channel:', err)
    alert(`Failed to remove products: ${err.message}`)
  } finally {
    isRemovingFromChannel.value = false
  }
}

const assignToChannel = async () => {
  if (selectedProducts.value.length === 0 || !selectedAssignChannel.value) {
    return
  }

  isAssigningToChannel.value = true
  try {
    // Use CURRENT channel token (not target channel's) so the mutation knows the original prices
    const currentChannelToken = getChannelTokenFromQuery()
    apolloClient = createApolloClient(authStore.token, currentChannelToken)

    const { data } = await apolloClient.mutate({
      mutation: ADD_PRODUCTS_TO_CHANNEL_MUTATION,
      variables: {
        input: {
          channelId: selectedAssignChannel.value.id,
          productIds: selectedProducts.value.map(p => p.id),
          priceFactor: priceFactor.value
        }
      }
    })

    alert(`Successfully assigned ${selectedProducts.value.length} product(s) to ${selectedAssignChannel.value.code}!`)

    // Refresh product list
    await fetchProducts()
    clearSelection()
    // Close modal
    showAssignChannelModal.value = false
    selectedAssignChannel.value = null
    priceFactor.value = 1
  } catch (err) {
    console.error('Error assigning products to channel:', err)
    alert(`Failed to assign products: ${err.message}`)
  } finally {
    isAssigningToChannel.value = false
  }
}

// CSV Handlers
const exportSelectedProducts = async () => {
  exportError.value = null
  isExporting.value = true
  try {
    if (selectedProducts.value.length === 0) throw new Error('Please select at least one product.')

    // Use active channel from auth store if available and no channel selected
    let channelToken = getChannelTokenFromQuery() || null
    if (selectedChannel.value) {
      channelToken = selectedChannel.value.token
    } else if (authStore.activeChannel && !getChannelTokenFromQuery()) {
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
    let channelToken = getChannelTokenFromQuery() || null
    if (selectedChannel.value) {
      channelToken = selectedChannel.value.token
    } else if (authStore.activeChannel && !getChannelTokenFromQuery()) {
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

// Product description editing functions
const getProductDescription = (product) => {
  if (product.translations && product.translations.length > 0) {
    // Try to find English translation first, otherwise use the first one
    const enTranslation = product.translations.find(t => t.languageCode === 'en')
    if (enTranslation && enTranslation.description) {
      return enTranslation.description
    }
    return product.translations[0].description || ''
  }
  return ''
}

const startEditingDescription = (product) => {
  editingProductId.value = product.id
  editingDescription.value = getProductDescription(product) || ''
}

const cancelEditingDescription = () => {
  editingProductId.value = null
  editingDescription.value = ''
}

const saveProductDescription = async (product) => {
  if (editingProductId.value !== product.id) return

  isUpdatingDescription.value = true
  try {
    // Use active channel from auth store if available
    let channelToken = getChannelTokenFromQuery() || null
    if (selectedChannel.value) {
      channelToken = selectedChannel.value.token
    } else if (authStore.activeChannel && !getChannelTokenFromQuery()) {
      channelToken = authStore.activeChannel.token
    }

    apolloClient = createApolloClient(authStore.token, channelToken)

    // Find the existing translation to update or create a new one
    let translationInput
    if (product.translations && product.translations.length > 0) {
      // Use the first translation or find the default language (e.g., en)
      translationInput = {
        id: product.translations[0].id,
        languageCode: product.translations[0].languageCode,
        description: editingDescription.value
      }
    } else {
      // If no translation exists, create a default one (using en as default)
      translationInput = {
        languageCode: 'en',
        description: editingDescription.value
      }
    }

    const result = await apolloClient.mutate({
      mutation: UPDATE_PRODUCT_MUTATION,
      variables: {
        input: {
          id: product.id,
          translations: [translationInput]
        }
      }
    })

    if (result.data?.updateProduct) {
      // Update the local product data
      const allProductIndex = allProducts.value.findIndex(p => p.id === product.id)
      if (allProductIndex !== -1) {
        allProducts.value[allProductIndex].translations = result.data.updateProduct.translations
      }
      const productIndex = products.value.findIndex(p => p.id === product.id)
      if (productIndex !== -1) {
        products.value[productIndex].translations = result.data.updateProduct.translations
      }
    }

    editingProductId.value = null
    editingDescription.value = ''
  } catch (err) {
    console.error('Error updating product description:', err)
    error.value = err.message
  } finally {
    isUpdatingDescription.value = false
  }
}

const toggleProductEnabled = async (product) => {
  isUpdatingEnabled.value[product.id] = true
  try {
    let channelToken = getChannelTokenFromQuery() || null
    if (selectedChannel.value) {
      channelToken = selectedChannel.value.token
    } else if (authStore.activeChannel && !getChannelTokenFromQuery()) {
      channelToken = authStore.activeChannel.token
    }

    apolloClient = createApolloClient(authStore.token, channelToken)

    const result = await apolloClient.mutate({
      mutation: UPDATE_PRODUCT_MUTATION,
      variables: {
        input: {
          id: product.id,
          enabled: !product.enabled
        }
      }
    })

    if (result.data?.updateProduct) {
      const allProductIndex = allProducts.value.findIndex(p => p.id === product.id)
      if (allProductIndex !== -1) {
        allProducts.value[allProductIndex].enabled = result.data.updateProduct.enabled
      }
      const productIndex = products.value.findIndex(p => p.id === product.id)
      if (productIndex !== -1) {
        products.value[productIndex].enabled = result.data.updateProduct.enabled
      }
    }
  } catch (err) {
    console.error('Error toggling product enabled:', err)
    error.value = err.message
  } finally {
    isUpdatingEnabled.value[product.id] = false
  }
}

// Asset management functions
const openAssetSelector = (product, mode) => {
  assetSelectorProduct.value = product
  assetSelectorMode.value = mode

  if (mode === 'add') {
    tempSelectedAssetIds.value = product.assets?.map(a => a.id) || []
  } else if (mode === 'featured') {
    tempSelectedAssetIds.value = product.featuredAsset?.id || ''
  }

  showAssetSelector.value = true
}

const closeAssetSelector = () => {
  showAssetSelector.value = false
  assetSelectorProduct.value = null
  assetSelectorMode.value = null
  tempSelectedAssetIds.value = []
}

const updateProductAssets = async (selectedIds) => {
  // 先保存引用，防止中途被清空
  const product = assetSelectorProduct.value
  const mode = assetSelectorMode.value

  if (!product) return

  isUpdatingAssets.value = true
  try {
    let channelToken = getChannelTokenFromQuery() || null
    if (selectedChannel.value) {
      channelToken = selectedChannel.value.token
    } else if (authStore.activeChannel && !getChannelTokenFromQuery()) {
      channelToken = authStore.activeChannel.token
    }

    apolloClient = createApolloClient(authStore.token, channelToken)

    const UPDATE_PRODUCT_ASSETS_MUTATION = gql`
            mutation UpdateProductAssets($input: UpdateProductInput!) {
                updateProduct(input: $input) {
                    id
                    assets { id name preview source }
                    featuredAsset { id name preview source }
                }
            }
        `

    let mutationInput = { id: product.id }

    if (mode === 'add') {
      mutationInput.assetIds = selectedIds
    } else if (mode === 'featured') {
      mutationInput.featuredAssetId = selectedIds || null
    }

    const result = await apolloClient.mutate({
      mutation: UPDATE_PRODUCT_ASSETS_MUTATION,
      variables: {
        input: mutationInput
      }
    })

    if (result.data?.updateProduct) {
      const allProductIndex = allProducts.value.findIndex(p => p.id === product.id)
      if (allProductIndex !== -1) {
        allProducts.value[allProductIndex].assets = result.data.updateProduct.assets
        allProducts.value[allProductIndex].featuredAsset = result.data.updateProduct.featuredAsset
      }
      const productIndex = products.value.findIndex(p => p.id === product.id)
      if (productIndex !== -1) {
        products.value[productIndex].assets = result.data.updateProduct.assets
        products.value[productIndex].featuredAsset = result.data.updateProduct.featuredAsset
      }
    }

    closeAssetSelector()
  } catch (err) {
    console.error('Error updating product assets:', err)
    error.value = err.message
    closeAssetSelector()
  } finally {
    isUpdatingAssets.value = false
  }
}

const removeAsset = async (product, assetId) => {
  try {
    let channelToken = getChannelTokenFromQuery() || null
    if (selectedChannel.value) {
      channelToken = selectedChannel.value.token
    } else if (authStore.activeChannel && !getChannelTokenFromQuery()) {
      channelToken = authStore.activeChannel.token
    }

    apolloClient = createApolloClient(authStore.token, channelToken)

    const UPDATE_PRODUCT_ASSETS_MUTATION = gql`
            mutation UpdateProductAssets($input: UpdateProductInput!) {
                updateProduct(input: $input) {
                    id
                    assets { id name preview source }
                    featuredAsset { id name preview source }
                }
            }
        `

    const currentAssetIds = product.assets?.map(a => a.id) || []
    const newAssetIds = currentAssetIds.filter(id => id !== assetId)

    // 如果删除的是特色资产，也要清除特色资产
    let mutationInput = {
      id: product.id,
      assetIds: newAssetIds
    }

    if (product.featuredAsset?.id === assetId) {
      mutationInput.featuredAssetId = null
    }

    const result = await apolloClient.mutate({
      mutation: UPDATE_PRODUCT_ASSETS_MUTATION,
      variables: {
        input: mutationInput
      }
    })

    if (result.data?.updateProduct) {
      const allProductIndex = allProducts.value.findIndex(p => p.id === product.id)
      if (allProductIndex !== -1) {
        allProducts.value[allProductIndex].assets = result.data.updateProduct.assets
        allProducts.value[allProductIndex].featuredAsset = result.data.updateProduct.featuredAsset
      }
      const productIndex = products.value.findIndex(p => p.id === product.id)
      if (productIndex !== -1) {
        products.value[productIndex].assets = result.data.updateProduct.assets
        products.value[productIndex].featuredAsset = result.data.updateProduct.featuredAsset
      }
    }
  } catch (err) {
    console.error('Error removing asset:', err)
    error.value = err.message
  } finally {
    showAssetMenu.value = null
  }
}

const setFeaturedAsset = async (product, assetId) => {
  showAssetMenu.value = null
  try {
    let channelToken = getChannelTokenFromQuery() || null
    if (selectedChannel.value) {
      channelToken = selectedChannel.value.token
    } else if (authStore.activeChannel && !getChannelTokenFromQuery()) {
      channelToken = authStore.activeChannel.token
    }

    apolloClient = createApolloClient(authStore.token, channelToken)

    const UPDATE_PRODUCT_ASSETS_MUTATION = gql`
            mutation UpdateProductAssets($input: UpdateProductInput!) {
                updateProduct(input: $input) {
                    id
                    assets { id name preview source }
                    featuredAsset { id name preview source }
                }
            }
        `

    const result = await apolloClient.mutate({
      mutation: UPDATE_PRODUCT_ASSETS_MUTATION,
      variables: {
        input: {
          id: product.id,
          featuredAssetId: assetId
        }
      }
    })

    if (result.data?.updateProduct) {
      const allProductIndex = allProducts.value.findIndex(p => p.id === product.id)
      if (allProductIndex !== -1) {
        allProducts.value[allProductIndex].assets = result.data.updateProduct.assets
        allProducts.value[allProductIndex].featuredAsset = result.data.updateProduct.featuredAsset
      }
      const productIndex = products.value.findIndex(p => p.id === product.id)
      if (productIndex !== -1) {
        products.value[productIndex].assets = result.data.updateProduct.assets
        products.value[productIndex].featuredAsset = result.data.updateProduct.featuredAsset
      }
    }
  } catch (err) {
    console.error('Error setting featured asset:', err)
    error.value = err.message
  }
}

const toggleAssetMenu = (productId, assetId) => {
  console.log('toggleAssetMenu called with:', { productId, assetId })
  if (showAssetMenu.value?.productId === productId && showAssetMenu.value?.assetId === assetId) {
    showAssetMenu.value = null
  } else {
    // Calculate menu position from the button
    const key = `${productId}-${assetId}`
    const buttonEl = menuRefs.value[key]
    if (buttonEl) {
      const rect = buttonEl.getBoundingClientRect()
      menuPosition.value = {
        x: rect.right - 150, // Align menu to the right of the button
        y: rect.bottom + 8 // Position below the button
      }
    }
    showAssetMenu.value = { productId, assetId }
  }
}

const startEditingFacets = (product) => {
  editingFacetsProductId.value = product.id
}

const cancelEditingFacets = () => {
  editingFacetsProductId.value = null
}

const toggleProductFacet = async (product, facetValue, isSelected) => {
  isUpdatingFacets.value = true
  try {
    let channelToken = getChannelTokenFromQuery() || null
    if (selectedChannel.value) {
      channelToken = selectedChannel.value.token
    } else if (authStore.activeChannel && !getChannelTokenFromQuery()) {
      channelToken = authStore.activeChannel.token
    }

    apolloClient = createApolloClient(authStore.token, channelToken)

    const currentFacetValueIds = (product.facetValues || []).map(fv => fv.id)
    let newFacetValueIds
    if (isSelected) {
      newFacetValueIds = [...currentFacetValueIds, facetValue.id]
    } else {
      newFacetValueIds = currentFacetValueIds.filter(id => id !== facetValue.id)
    }

    const result = await apolloClient.mutate({
      mutation: UPDATE_PRODUCT_MUTATION,
      variables: {
        input: {
          id: product.id,
          facetValueIds: newFacetValueIds
        }
      }
    })

    if (result.data?.updateProduct) {
      const allProductIndex = allProducts.value.findIndex(p => p.id === product.id)
      if (allProductIndex !== -1) {
        allProducts.value[allProductIndex].facetValues = result.data.updateProduct.facetValues
      }
      const productIndex = products.value.findIndex(p => p.id === product.id)
      if (productIndex !== -1) {
        products.value[productIndex].facetValues = result.data.updateProduct.facetValues
      }
    }
  } catch (err) {
    console.error('Error updating product facet:', err)
    error.value = err.message
  } finally {
    isUpdatingFacets.value = false
  }
}

const isFacetValueSelected = (product, facetValue) => {
  return (product.facetValues || []).some(fv => fv.id === facetValue.id)
}




// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~







// Fetch products on mount
onMounted(() => {
  fetchPaginatedProducts()
  document.addEventListener('click', handleClickOutside)
})

// onMounted(() => {
//     fetchProducts()
//     document.addEventListener('click', handleClickOutside)
// })
const unwatchToken = watch(() => authStore.token, () => { fetchProducts() })
const unwatchChannel = watch(() => selectedChannel.value, () => { fetchProducts() })
onUnmounted(() => {
  unwatchToken();
  unwatchChannel()
  document.removeEventListener('click', handleClickOutside)
})








// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


const GET_PRODUCTS_QUERY = gql`
  query GetProducts {
    products(options: { take: 100 }) {
      items {
        id
        name
        enabled
        translations {
          id
          languageCode
          name
          description
        }
        variants { id }
        featuredAsset { id preview source name }
        assets { id preview source name }
        collections { id name }
        channels { id code token }
        facetValues {
          id
          name
          facet {
            id
            name
            code
          }
        }
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
    facets {
      items {
        id
        name
        code
        values {
          id
          name
          code
        }
      }
    }
    activeChannel {
      id code token defaultLanguageCode currencyCode pricesIncludeTax
    }
  }
`

const UPDATE_PRODUCT_MUTATION = gql`
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      id
      name
      enabled
      translations {
        id
        languageCode
        name
        description
      }
      facetValues {
        id
        name
        facet {
          id
          name
          code
        }
      }
    }
  }
`

const REMOVE_PRODUCTS_FROM_CHANNEL_MUTATION = gql`
  mutation RemoveProductsFromChannel($input: RemoveProductsFromChannelInput!) {
    removeProductsFromChannel(input: $input) {
      id
      name
      slug
    }
  }
`

const ADD_PRODUCTS_TO_CHANNEL_MUTATION = gql`
  mutation AssignProductsToChannel($input: AssignProductsToChannelInput!) {
    assignProductsToChannel(input: $input) {
      id
      name
      slug
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




// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~




</script>
