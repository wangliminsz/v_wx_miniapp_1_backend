<template>
  <div class="import-page">
    <!-- <h1 class="text-2xl font-semibold text-gray-300 mb-6">Import Data</h1> -->
    
    <!-- Loading state -->
    <div v-if="loading" class="text-center py-10 text-gray-400">Loading...</div>
    
    <!-- Error state -->
    <div v-if="error" class="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md mb-6 relative">
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-bold">An error occurred:</h3>
        <button 
          @click="error = ''" 
          class="text-red-400 hover:text-red-300 transition-colors text-sm"
          aria-label="Close error message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p class="text-sm">{{ error }}</p>
    </div>
    
    <!-- Success message -->
    <div v-if="successMessage" class="mt-6 bg-green-900/30 border border-green-500 text-green-400 p-4 rounded-md relative">
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-bold">Success!</h3>
        <button 
          @click="successMessage = ''" 
          class="text-green-400 hover:text-green-300 transition-colors text-sm"
          aria-label="Close success message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p class="text-sm">{{ successMessage }}</p>
    </div>
    
    <!-- Generate Assets Map Section -->
    <div class="mt-6 bg-dark-200 p-6 rounded-md border border-dark-100">
      <h2 class="text-xl font-bold text-blue-300 mb-4">Generate Assets Map</h2>
      
      <div class="mb-4">
        <p class="text-gray-300">Generate an assets-map.json file containing all asset names and their corresponding IDs for use in product imports.</p>
        <p class="mt-2 text-sm text-gray-400">The file will be downloaded automatically after generation.</p>
      </div>
      
      <div class="flex gap-4">
        <button 
          @click="generateAssetsMap"
          :disabled="isImporting"
          class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isImporting ? 'Generating...' : 'Generate Assets Map' }}
        </button>
      </div>
    </div>

    
    
    <!-- Import sections -->
    <div class="grid grid-cols-1 md:grid-cols-1 gap-6 mt-6">

      <!-- Product Import Section -->
      <div class="bg-dark-200 p-6 rounded-md border border-dark-100">
        <h2 class="text-xl font-bold text-blue-300 mb-4">Import Products</h2>
        
        <!-- File upload fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- CSV File Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">CSV File:</label>
            <input 
              type="file" 
              accept=".csv" 
              @change="handleFileChange('products', $event)" 
              class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors"
            >
            <p class="mt-1 text-xs text-gray-400">
              Required columns: productSlug (for all), productName (only for new products)<br>
              Optional columns: productDescription, productFeaturedAsset, productAssets, collections, productFacetValues
            </p>
            <div v-if="importFiles.products" class="mt-2 text-xs text-green-400">
              Selected: {{ importFiles.products.name }}
            </div>
          </div>
          
          <!-- Assets Map JSON File Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Assets Map JSON File:</label>
            <input 
              type="file" 
              accept=".json" 
              @change="handleFileChange('assetsMapJson', $event)" 
              class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors"
            >
            <p class="mt-1 text-xs text-gray-400">
              Generated using the "Generate Assets Map" feature above
            </p>
            <div v-if="importFiles.assetsMapJson" class="mt-2 text-xs text-green-400">
              Selected: {{ importFiles.assetsMapJson.name }}
            </div>
          </div>
        </div>
        
        <!-- Import Button -->
        <div class="mt-6 flex gap-4">
          <button 
            @click="importProducts"
            :disabled="!importFiles.products || !importFiles.assetsMapJson || isImporting"
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isImporting ? 'Importing...' : 'Import Products' }}
          </button>
          
          <button 
            @click="clearProductFiles"
            :disabled="!importFiles.products && !importFiles.assetsMapJson"
            class="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      <!-- Product Import Section -->

      
      <!-- Variant Import Section -->
      <div class="bg-dark-200 p-6 rounded-md border border-dark-100">
        <h2 class="text-xl font-bold text-blue-300 mb-4">Import Variants</h2>
        
        <!-- File upload fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- CSV File Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">CSV File:</label>
            <input 
              type="file" 
              accept=".csv" 
              @change="handleFileChange('variants', $event)" 
              class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors"
            >
            <p class="mt-1 text-xs text-gray-400">
              Supported file format: CSV with columns for variant SKU, price, stock, etc.
            </p>
            <div v-if="importFiles.variants" class="mt-2 text-xs text-green-400">
              Selected: {{ importFiles.variants.name }}
            </div>
          </div>
          
          <!-- Assets Map JSON File Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Assets Map JSON File:</label>
            <input 
              type="file" 
              accept=".json" 
              @change="handleFileChange('assetsMapJson', $event)" 
              class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors"
            >
            <p class="mt-1 text-xs text-gray-400">
              Generated using the "Generate Assets Map" feature above
            </p>
            <div v-if="importFiles.assetsMapJson" class="mt-2 text-xs text-green-400">
              Selected: {{ importFiles.assetsMapJson.name }}
            </div>
          </div>
        </div>
        
        <!-- Import Button -->
        <div class="mt-6 flex gap-4">
          <button 
            @click="importVariants"
            :disabled="!importFiles.variants || isImporting"
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isImporting ? 'Importing...' : 'Import Variants' }}
          </button>
          
          <button 
            @click="clearVariantFiles"
            :disabled="!importFiles.variants"
            class="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      


    </div>



    <!-- Error state -->
    <div v-if="error" class="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md mb-6 relative">
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-bold">An error occurred:</h3>
        <button 
          @click="error = ''" 
          class="text-red-400 hover:text-red-300 transition-colors text-sm"
          aria-label="Close error message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p class="text-sm">{{ error }}</p>
    </div>
    
    <!-- Success message -->
    <div v-if="successMessage" class="mt-6 bg-green-900/30 border border-green-500 text-green-400 p-4 rounded-md relative">
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-bold">Success!</h3>
        <button 
          @click="successMessage = ''" 
          class="text-green-400 hover:text-green-300 transition-colors text-sm"
          aria-label="Close success message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p class="text-sm">{{ successMessage }}</p>
    </div>




  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { useAuthStore } from '../stores/auth'

// Get auth token from store
const authStore = useAuthStore()

// State
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const isImporting = ref(false)
const importFiles = ref({
  products: null,
  variants: null,
  stockLevels: null,
  collections: null,
  collectionAssetsCsv: null,
  assetsMapJson: null,
  facets: null
})
// Collections state
const collections = ref([])
const loadingCollections = ref(false)
const selectedCollection = ref(null)
const collectionSlugToIdMap = ref(new Map())
// Assets map state
const assetsMap = ref({})
const isLoadingAssetsMap = ref(false)
const isImportingCollectionAssets = ref(false)
// Product import state
const allFacetValues = ref([])
const facetValueSlugToIdMap = ref(new Map())
const isLoadingLookupData = ref(false)
// Option groups state
const allOptionGroups = ref([])
const optionGroupMap = ref(new Map()) // code -> { id, code, name, options: Map(code -> id) }
// Options state for variant creation
const allOptions = ref([])
const optionMap = ref(new Map()) // (groupCode:optionCode) -> optionId
// Variant import state
const isImportingVariants = ref(false)

// Create Apollo Client with token and channel token
const createApolloClient = (authToken, channelToken = null) => {
  const httpLink = createHttpLink({
    uri: import.meta.env.VITE_VENDURE_ADMIN_API_URL,
    fetchOptions: {
      credentials: 'include'
    }
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

// GraphQL query to fetch all assets
const LIST_ASSETS_QUERY = gql`
  query ListAssets($options: AssetListOptions) {
    assets(options: $options) {
      items {
        id
        name
      }
      totalItems
    }
  }
`

// GraphQL query to fetch all collections
const GET_COLLECTIONS_QUERY = gql`
  query GetCollections {
    collections {
      items {
        id
        name
        slug
      }
      totalItems
    }
  }
`

// GraphQL query to get collection by slug
const GET_COLLECTION_BY_SLUG_QUERY = gql`
  query GetCollectionBySlug($slug: String!) {
    collection(slug: $slug) {
      id
      name
      featuredAsset { id name preview }
    }
  }
`

// GraphQL mutation to create collection
const CREATE_COLLECTION_MUTATION = gql`
  mutation CreateCollection($input: CreateCollectionInput!) {
    createCollection(input: $input) {
      id
      slug
      parent { id slug }
      featuredAsset { id preview }
      assets { id preview }
    }
  }
`

// GraphQL mutation to update collection
const UPDATE_COLLECTION_MUTATION = gql`
  mutation UpdateCollection($input: UpdateCollectionInput!) {
    updateCollection(input: $input) {
      id
      slug
      featuredAsset { id preview }
      assets { id preview }
    }
  }
`

// GraphQL query to get product by slug
const GET_PRODUCT_BY_SLUG_QUERY = gql`
  query GetProductBySlug($slug: String!) {
    product(slug: $slug) {
      id
      name
      slug
      description
      featuredAsset {
        id
        name
        preview
      }
      assets {
        id
        name
      }
      facetValues {
        id
        code
        name
      }
      collections {
        id
        slug
        name
      }
      optionGroups {
        id
        code
        name
      }
    }
  }
`

// GraphQL mutation to create product
const CREATE_PRODUCT_MUTATION = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      name
      slug
      description
      featuredAsset {
        id
        name
        preview
      }
      assets {
        id
        name
      }
      facetValues {
        id
        code
        name
      }
      collections {
        id
        slug
        name
      }
    }
  }
`

// GraphQL mutation to update product
const UPDATE_PRODUCT_MUTATION = gql`
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      id
      slug
      featuredAsset {
        id
        name
        preview
      }
      assets {
        id
        name
      }
      facetValues {
        id
        code
        name
      }
      collections {
        id
        slug
        name
      }
    }
  }
`

// GraphQL query to get all collections for mapping
const GET_ALL_COLLECTIONS_QUERY = gql`
  query GetAllCollections {
    collections {
      items {
        id
        slug
        name
      }
      totalItems
    }
  }
`

// GraphQL query to get all facet values for mapping
const GET_ALL_FACET_VALUES_QUERY = gql`
  query GetAllFacetValues {
    facetValues(options: { take: 1000 }) {
      items {
        id
        code
        name
        facet {
          code
        }
      }
      totalItems
    }
  }
`

// GraphQL query to get facet value by code
const GET_FACET_VALUE_BY_CODE_QUERY = gql`
  query GetFacetValueByCode($code: String!) {
    facetValues(options: { filter: { code: { eq: $code } } }) {
      items {
        id
        code
        name
        facet {
          code
        }
      }
    }
  }
`

// GraphQL query to get all option groups with their options
const GET_ALL_OPTION_GROUPS_QUERY = gql`
  query GetAllOptionGroups {
    productOptionGroups {
      items {
        id
        code
        name
        options {
          id
          code
          name
        }
      }
    }
  }
`

// GraphQL mutation to create option group with options
const CREATE_OPTION_GROUP_MUTATION = gql`
  mutation CreateOptionGroup($input: CreateProductOptionGroupInput!) {
    createProductOptionGroup(input: $input) {
      id
      code
      name
      options {
        id
        code
        name
      }
    }
  }
`

// GraphQL mutation to add option group to product
const ADD_OPTION_GROUP_TO_PRODUCT_MUTATION = gql`
  mutation AddOptionGroupToProduct($productId: ID!, $optionGroupId: ID!) {
    addOptionGroupToProduct(productId: $productId, optionGroupId: $optionGroupId) {
      id
      name
      optionGroups {
        id
        code
        name
      }
    }
  }
`

// GraphQL mutation to create a single option value
const CREATE_OPTION_MUTATION = gql`
  mutation CreateOption($input: CreateProductOptionInput!) {
    createProductOption(input: $input) {
      id
      code
      name
      group {
        id
        code
      }
    }
  }
`

// GraphQL mutation to create product variants
const CREATE_PRODUCT_VARIANTS_MUTATION = gql`
  mutation CreateProductVariants($input: [CreateProductVariantInput!]!) {
    createProductVariants(input: $input) {
      id
      sku
      name
      price
      stockOnHand
      featuredAsset {
        id
        name
        preview
      }
      assets {
        id
        name
        preview
      }
      facetValues {
        id
        code
        name
      }
    }
  }
`

// GraphQL mutation to update product variant
const UPDATE_PRODUCT_VARIANT_MUTATION = gql`
  mutation UpdateProductVariant($input: UpdateProductVariantInput!) {
    updateProductVariant(input: $input) {
      id
      sku
      name
      price
      stockOnHand
      featuredAsset {
        id
        name
        preview
      }
      assets {
        id
        name
        preview
      }
      facetValues {
        id
        code
        name
      }
    }
  }
`

// GraphQL mutation to update product variants in bulk
const UPDATE_PRODUCT_VARIANTS_MUTATION = gql`
  mutation UpdateProductVariants($input: [UpdateProductVariantInput!]!) {
    updateProductVariants(input: $input) {
      id
      sku
      name
      price
      stockOnHand
      featuredAsset {
        id
        name
        preview
      }
      assets {
        id
        name
        preview
      }
      facetValues {
        id
        code
        name
      }
    }
  }
`

// GraphQL query to get product by slug
const GET_PRODUCT_VARIANTS_QUERY = gql`
  query GetProductVariants($options: ProductVariantListOptions) {
    productVariants(options: $options) {
      items {
        id
        sku
        name
        price
        product {
          id
          slug
          name
        }
        options {
          id
          code
          name
          group {
            id
            code
            name
          }
        }
      }
      totalItems
    }
  }
`

// GraphQL query to get all options with their groups
const GET_ALL_OPTIONS_QUERY = gql`
  query GetAllOptions {
    productOptions {
      items {
        id
        code
        name
        group {
          id
          code
          name
        }
      }
      totalItems
    }
  }
`

// GraphQL query to get all facets
const GET_ALL_FACETS_QUERY = gql`
  query GetAllFacets($options: FacetListOptions) {
    facets(options: $options) {
      totalItems
      items {
        id
        code
        name
        isPrivate
        values {
          id
          code
          name
        }
      }
    }
  }
`

// GraphQL mutation to create a facet
const CREATE_FACET_MUTATION = gql`
  mutation CreateFacet($input: CreateFacetInput!) {
    createFacet(input: $input) {
      id
      code
      name
      values {
        id
        code
        name
      }
    }
  }
`

// GraphQL mutation to create a facet value
const CREATE_FACET_VALUE_MUTATION = gql`
  mutation CreateFacetValue($input: CreateFacetValueInput!) {
    createFacetValue(input: $input) {
      id
      code
      name
      facet {
        id
        code
      }
    }
  }
`

// GraphQL mutation to update a facet
const UPDATE_FACET_MUTATION = gql`
  mutation UpdateFacet($input: UpdateFacetInput!) {
    updateFacet(input: $input) {
      id
      code
      name
      values {
        id
        code
        name
      }
    }
  }
`

// GraphQL mutation to update a facet value
const UPDATE_FACET_VALUE_MUTATION = gql`
  mutation UpdateFacetValue($input: UpdateFacetValueInput!) {
    updateFacetValue(input: $input) {
      id
      code
      name
      facet {
        id
        code
      }
    }
  }
`

// Fetch collections for lookup map and display
const fetchCollections = async () => {
  loadingCollections.value = true
  error.value = ''
  
  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.query({
      query: GET_ALL_COLLECTIONS_QUERY,
      fetchPolicy: 'network-only'
    })
    
    if (result.data && result.data.collections && result.data.collections.items) {
      collections.value = result.data.collections.items
      // Create collection slug to ID map
      const map = new Map()
      result.data.collections.items.forEach(collection => {
        map.set(collection.slug, collection.id)
      })
      collectionSlugToIdMap.value = map
      console.log('Collections map created with', map.size, 'entries')
    }
  } catch (err) {
    error.value = err.message
    console.error('Error fetching collections:', err)
  } finally {
    loadingCollections.value = false
  }
}

// Fetch all facet values for lookup map
const fetchFacetValues = async () => {
  isLoadingLookupData.value = true
  error.value = ''
  
  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.query({
      query: GET_ALL_FACET_VALUES_QUERY,
      fetchPolicy: 'network-only'
    })
    
    if (result.data && result.data.facetValues && result.data.facetValues.items) {
      allFacetValues.value = result.data.facetValues.items
      // Create facet value slug to ID map (format: facetCode:valueCode)
      const map = new Map()
      result.data.facetValues.items.forEach(facetValue => {
        const key = `${facetValue.facet.code}:${facetValue.code}`
        map.set(key, facetValue.id)
      })
      facetValueSlugToIdMap.value = map
      console.log('Facet values map created with', map.size, 'entries')
    }
  } catch (err) {
    error.value = err.message
    console.error('Error fetching facet values:', err)
  } finally {
    isLoadingLookupData.value = false
  }
}

// Fetch all option groups with their options
const fetchOptionGroups = async () => {
  isLoadingLookupData.value = true
  error.value = ''
  
  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.query({
      query: GET_ALL_OPTION_GROUPS_QUERY,
      fetchPolicy: 'network-only'
    })
    
    if (result.data && result.data.productOptionGroups && result.data.productOptionGroups.items) {
      allOptionGroups.value = result.data.productOptionGroups.items
      // Create a map for quick lookup
      const map = new Map()
      result.data.productOptionGroups.items.forEach(group => {
        const optionsMap = new Map()
        group.options.forEach(option => {
          optionsMap.set(option.code, option.id)
        })
        map.set(group.code, {
          id: group.id,
          code: group.code,
          name: group.name,
          options: optionsMap
        })
      })
      optionGroupMap.value = map
      console.log('Option groups map created with', map.size, 'entries')
    }
  } catch (err) {
    error.value = err.message
    console.error('Error fetching option groups:', err)
  } finally {
    isLoadingLookupData.value = false
  }
}

// Fetch all options with their groups for variant creation
const fetchOptions = async () => {
  isLoadingLookupData.value = true
  error.value = ''
  
  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.query({
      query: GET_ALL_OPTIONS_QUERY,
      fetchPolicy: 'network-only'
    })
    
    if (result.data && result.data.productOptions && result.data.productOptions.items) {
      allOptions.value = result.data.productOptions.items
      // Create a map for quick lookup: (groupCode:optionCode) -> optionId
      const map = new Map()
      result.data.productOptions.items.forEach(option => {
        if (option.group) {
          const key = `${option.group.code}:${option.code}`
          map.set(key, option.id)
        }
      })
      optionMap.value = map
      console.log('Options map created with', map.size, 'entries')
    }
  } catch (err) {
    error.value = err.message
    console.error('Error fetching options:', err)
  } finally {
    isLoadingLookupData.value = false
  }
}

// Pre-fetch all lookup data
const prefetchLookupData = async () => {
  try {
    await Promise.all([
      fetchCollections(),
      fetchFacetValues(),
      fetchOptionGroups(),
      fetchOptions()
    ])
  } catch (err) {
    console.error('Error prefetching lookup data:', err)
    error.value = err.message
  }
}

// Generate and download assets map JSON file
const generateAssetsMap = async () => {
  isImporting.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    console.log('Generating assets map...')
    
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const allAssets = []
    let skip = 0
    const take = 1000
    let totalItems = 0
    
    // Fetch assets in batches until we get all of them
    do {
      const result = await apolloClient.query({
        query: LIST_ASSETS_QUERY,
        variables: {
          options: {
            take,
            skip
          }
        },
        fetchPolicy: 'network-only'
      })
      
      if (result.data && result.data.assets) {
        totalItems = result.data.assets.totalItems
        const batchAssets = result.data.assets.items
        
        if (batchAssets && batchAssets.length > 0) {
          allAssets.push(...batchAssets)
          skip += batchAssets.length
        }
      }
      
      // Exit loop if we've fetched all items or no items returned in this batch
    } while (allAssets.length < totalItems)
    
    if (allAssets.length === 0) {
      throw new Error('No assets found')
    }
    
    // Create assets map in the requested format
    const assetsMap = {}
    allAssets.forEach(asset => {
      assetsMap[asset.name] = parseInt(asset.id)
    })
    
    // Convert to JSON string with proper formatting
    const jsonString = JSON.stringify(assetsMap, null, 2)
    
    // Create a blob and download it
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'assets-map.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    successMessage.value = `Successfully generated assets-map.json with ${Object.keys(assetsMap).length} assets`
    console.log('Assets map generated successfully:', assetsMap)
  } catch (err) {
    error.value = err.message
    console.error('Error generating assets map:', err)
  } finally {
    isImporting.value = false
  }
}

// File handling
const handleFileChange = (type, event) => {
  importFiles.value[type] = event.target.files[0]
  // Load assets map automatically when JSON file is selected
  if (type === 'assetsMapJson') {
    loadAssetsMap(event.target.files[0])
  }
}

const clearFile = (type) => {
  importFiles.value[type] = null
  // Clear the specific file input
  const inputs = document.querySelectorAll(`input[type="file"]`)
  inputs.forEach(input => {
    input.value = ''
  })
}

const clearCollectionAssetsFiles = () => {
  importFiles.value.collectionAssetsCsv = null
  importFiles.value.assetsMapJson = null
  assetsMap.value = {}
  // Clear file inputs
  const inputs = document.querySelectorAll(`input[type="file"]`)
  inputs.forEach(input => {
    input.value = ''
  })
}

const clearProductFiles = () => {
  importFiles.value.products = null
  // Don't clear assetsMapJson as it might be used by other import sections
  // Clear file inputs
  const inputs = document.querySelectorAll(`input[type="file"]`)
  inputs.forEach(input => {
    input.value = ''
  })
}

const clearVariantFiles = () => {
  importFiles.value.variants = null
  // Don't clear assetsMapJson as it might be used by other import sections
  // Clear file inputs
  const inputs = document.querySelectorAll(`input[type="file"]`)
  inputs.forEach(input => {
    input.value = ''
  })
}

// Import functions
const importProducts = async () => {
  if (!importFiles.value.products) {
    error.value = 'Please select a CSV file to import'
    return
  }
  
  // Step 1: Read and parse CSV file to check if we need assets map
  const csvText = await readFileAsText(importFiles.value.products)
  const records = parseCsv(csvText)
  
  if (records.length === 0) {
    error.value = 'No valid records found in CSV file'
    return
  }
  
  // Only require assets map if we're importing assets
  const hasAssetColumns = row => row.productFeaturedAsset || row.productAssets
  const needsAssetsMap = records.some(hasAssetColumns)
  
  if (needsAssetsMap && Object.keys(assetsMap.value).length === 0) {
    error.value = 'Please load the assets map JSON file first'
    return
  }
  
  isImporting.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    console.log('Starting product import for', records.length, 'records')
    
    // Refresh facet values map to ensure we have the latest data
    await fetchFacetValues()
    
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    let successCount = 0
    let errorCount = 0
    const errors = []
    
    // Step 2: Process each record
        for (const row of records) {
          try {
            const slug = (row.productSlug || '').trim()
            const name = (row.productName || '').trim()
            
            if (!slug) {
              errorCount++
              errors.push(`Row skipped: missing productSlug`)
              continue
            }
            
            console.log('Processing product:', slug)
            
            // Step 3: Check if product exists
            let productExists = false
            let existingProduct = null
            
            try {
              const productResult = await apolloClient.query({
                query: GET_PRODUCT_BY_SLUG_QUERY,
                variables: { slug },
                fetchPolicy: 'network-only'
              })
              
              existingProduct = productResult.data.product
              productExists = !!existingProduct
            } catch (queryError) {
              console.error('Error checking product existence:', queryError)
              // If query fails, assume product doesn't exist and try to create
              productExists = false
            }
            
            // For new products, productName is required
            if (!productExists && !name) {
              errorCount++
              errors.push(`Row skipped: missing productName for new product`)
              continue
            }
        
        // Step 4: Process assets
        const featuredFilename = (row.productFeaturedAsset || '').trim()
        const featuredAssetId = featuredFilename ? assetsMap.value[featuredFilename] : undefined
        
        const productAssetsStr = (row.productAssets || '').trim()
        const assetFilenames = safeSplit(productAssetsStr, '|')
        const assetIds = assetFilenames
          .map(filename => assetsMap.value[filename])
          .filter(id => id !== undefined)
          .map(String)
        
        // Step 5: Process collections
        const collectionsStr = (row.collections || '').trim()
        const collectionSlugs = safeSplit(collectionsStr, '|')
        const collectionIds = collectionSlugs
          .map(collectionSlug => collectionSlugToIdMap.value.get(collectionSlug))
          .filter(id => id !== undefined)
          .map(String)
        
        // Step 6: Process facet values
        const facetValuesStr = (row.productFacetValues || '').trim()
        const facetValueSlugs = safeSplit(facetValuesStr, '|')
        const facetValueIds = facetValueSlugs
          .map(facetValueSlug => facetValueSlugToIdMap.value.get(facetValueSlug))
          .filter(id => id !== undefined)
          .map(String)
        
        // Step 7: Process description
        const description = (row.productDescription || '').trim()
        
        // Step 8: Process product options
        const productOptionsStr = (row.productOptions || '').trim()
        const optionPairs = safeSplit(productOptionsStr, '|')
        
        // Group options by their group code
        const optionsByGroup = new Map()
        optionPairs.forEach(pair => {
          const [groupWithCode, optionCode] = pair.split(':')
          if (groupWithCode && optionCode) {
            if (!optionsByGroup.has(groupWithCode)) {
              optionsByGroup.set(groupWithCode, [])
            }
            optionsByGroup.get(groupWithCode).push(optionCode)
          }
        })
        
        // Step 9: Execute mutation - either update or create
        let productId
        if (productExists) {
          // Update existing product
          console.log('Updating existing product:', slug)
          const updateInput = {
            id: existingProduct.id
          }
          
          // Add optional fields if they have values
          if (featuredAssetId) {
            updateInput.featuredAssetId = String(featuredAssetId)
          }
          
          if (assetIds.length > 0) {
            updateInput.assetIds = assetIds
          }
          
          if (facetValueIds.length > 0) {
            updateInput.facetValueIds = facetValueIds
          }
          
          // Handle translatable description field - must use translations array
          if (description) {
            updateInput.translations = [{
              languageCode: 'en',
              description: description
            }]
          }
          
          // Execute update mutation
          await apolloClient.mutate({
            mutation: UPDATE_PRODUCT_MUTATION,
            variables: { input: updateInput }
          })
          
          productId = existingProduct.id
          successCount++
          console.log('Updated product:', slug)
        } else {
          // Create new product
          console.log('Creating new product:', slug)
          const createInput = {
            translations: [
              {
                languageCode: 'en',
                name: name,
                slug: slug,
                description: description
              }
            ]
          }
          
          // Add optional fields if they have values
          if (featuredAssetId) {
            createInput.featuredAssetId = String(featuredAssetId)
          }
          
          if (assetIds.length > 0) {
            createInput.assetIds = assetIds
          }
          
          if (facetValueIds.length > 0) {
            createInput.facetValueIds = facetValueIds
          }
          
          // Execute create mutation
          const createResult = await apolloClient.mutate({
            mutation: CREATE_PRODUCT_MUTATION,
            variables: { input: createInput }
          })
          
          const newProduct = createResult.data.createProduct
          productId = newProduct.id
          successCount++
          console.log('Created product:', slug)
        }
        
        // Step 10: Handle product options
        if (optionsByGroup.size > 0) {
          console.log('Processing options for product:', slug, optionsByGroup)
          
          // Get existing option groups for the product
          const existingOptionGroups = new Set()
          if (productExists) {
            // If updating existing product, get its current option groups
            const productDetails = await apolloClient.query({
              query: GET_PRODUCT_BY_SLUG_QUERY,
              variables: { slug: slug },
              fetchPolicy: 'network-only'
            })
            
            if (productDetails.data.product?.optionGroups) {
              productDetails.data.product.optionGroups.forEach(group => {
                existingOptionGroups.add(group.id)
              })
              console.log('Existing option groups for product:', Array.from(existingOptionGroups))
            }
          }
          
          // Process each option group
          for (const [groupCode, optionCodes] of optionsByGroup.entries()) {
            console.log('Processing option group:', groupCode, 'with options:', optionCodes)
            
            // Check if option group exists
            const existingGroup = optionGroupMap.value.get(groupCode)
            
            if (existingGroup) {
              console.log('Option group exists:', groupCode)
              
              // Check if any options are missing
              const missingOptions = optionCodes.filter(optCode => !existingGroup.options.has(optCode))
              
              if (missingOptions.length > 0) {
                console.log('Missing options in group:', missingOptions)
                // TODO: Implement adding missing options to existing group
                // This would require the createProductOption mutation with groupId
              }
              
              // Check if option group is already assigned to product
              if (!existingOptionGroups.has(existingGroup.id)) {
                // Add existing option group to product
                console.log('Adding existing option group to product:', groupCode)
                await apolloClient.mutate({
                  mutation: ADD_OPTION_GROUP_TO_PRODUCT_MUTATION,
                  variables: {
                    productId: productId,
                    optionGroupId: existingGroup.id
                  }
                })
              } else {
                console.log('Option group already assigned to product, skipping:', groupCode)
              }
            } else {
              console.log('Option group does not exist, creating:', groupCode)
              
              // Create new option group with all its options
              const optionsInput = optionCodes.map(optCode => ({
                code: optCode,
                translations: [{
                  languageCode: 'en',
                  name: optCode.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                }]
              }))
              
              const createGroupResult = await apolloClient.mutate({
                mutation: CREATE_OPTION_GROUP_MUTATION,
                variables: {
                  input: {
                    code: groupCode,
                    translations: [{
                      languageCode: 'en',
                      name: groupCode.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    }],
                    options: optionsInput
                  }
                }
              })
              
              const newGroup = createGroupResult.data.createProductOptionGroup
              console.log('Created new option group:', newGroup.code, 'with options:', newGroup.options.length)
              
              // Add new option group to product
              await apolloClient.mutate({
                mutation: ADD_OPTION_GROUP_TO_PRODUCT_MUTATION,
                variables: {
                  productId: productId,
                  optionGroupId: newGroup.id
                }
              })
              
              // Update the local option group map with the new group
              const optionsMap = new Map()
              newGroup.options.forEach(option => {
                optionsMap.set(option.code, option.id)
              })
              optionGroupMap.value.set(newGroup.code, {
                id: newGroup.id,
                code: newGroup.code,
                name: newGroup.name,
                options: optionsMap
              })
            }
          }
        }
        
      } catch (rowError) {
        errorCount++
        const errorMsg = `Row failed for product "${(row.productName || '').trim()}": ${rowError.message}`
        errors.push(errorMsg)
        console.error('Row processing error:', errorMsg)
      }
    }
    
    // Step 9: Show results
    successMessage.value = `Product import completed: ${successCount} products processed successfully, ${errorCount} errors`
    
    if (errors.length > 0) {
      console.error('Import errors:', errors)
      // Show first 5 errors in the UI
      error.value = `Some errors occurred during product import:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : ''}`
    }
    
  } catch (err) {
    error.value = `Error during product import: ${err.message}`
    console.error('Error importing products:', err)
  } finally {
    isImporting.value = false
  }
}

const importVariants = async () => {
  if (!importFiles.value.variants) {
    error.value = 'Please select a CSV file to import'
    return
  }
  
  // Step 1: Read and parse CSV file to check if we need assets map
  const csvText = await readFileAsText(importFiles.value.variants)
  const records = parseCsv(csvText)
  
  if (records.length === 0) {
    error.value = 'No valid records found in CSV file'
    return
  }
  
  // Only require assets map if we're importing assets
  const hasAssetColumns = row => row.variantFeaturedAsset || row.variantAssets
  const needsAssetsMap = records.some(hasAssetColumns)
  
  if (needsAssetsMap && Object.keys(assetsMap.value).length === 0) {
    error.value = 'Please load the assets map JSON file first'
    return
  }
  
  // Re-read CSV file later in the function after validation passes
  
  isImportingVariants.value = true
  isImporting.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    console.log('Starting variant import for', records.length, 'records')
    
    // Refresh facet values map to ensure we have the latest data
    await fetchFacetValues()
    
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    let successCount = 0
    let errorCount = 0
    const errors = []
    
    // Step 2: Process each record
    for (const row of records) {
      try {
        const sku = (row.variantSku || '').trim()
        const productSlug = (row.productSlug || '').trim()
        
        if (!sku || !productSlug) {
          errorCount++
          errors.push(`Row skipped: missing variantSku or productSlug`)
          continue
        }
        
        console.log('Processing variant:', sku, 'for product:', productSlug)
        
        // Step 3: Find parent product by slug
        const productResult = await apolloClient.query({
          query: GET_PRODUCT_BY_SLUG_QUERY,
          variables: { slug: productSlug },
          fetchPolicy: 'network-only'
        })
        
        const product = productResult.data.product
        if (!product) {
          errorCount++
          errors.push(`Product not found for slug: ${productSlug}`)
          continue
        }
        
        // Step 4: Check if variant already exists by SKU
        const variantResult = await apolloClient.query({
          query: GET_PRODUCT_VARIANTS_QUERY,
          variables: {
            options: {
              filter: { sku: { eq: sku } }
            }
          },
          fetchPolicy: 'network-only'
        })
        
        const existingVariant = variantResult.data.productVariants?.items?.[0]
        let variantId
        
        if (existingVariant) {
          // Update existing variant
          console.log('Updating existing variant:', sku)
          
          // Process variant assets
          const variantFeaturedFilename = (row.variantFeaturedAsset || '').trim()
          const variantFeaturedAssetId = variantFeaturedFilename ? assetsMap.value[variantFeaturedFilename] : undefined
          
          const variantAssetsStr = (row.variantAssets || '').trim()
          const variantAssetFilenames = safeSplit(variantAssetsStr, '|')
          const variantAssetIds = variantAssetFilenames
            .map(filename => assetsMap.value[filename])
            .filter(id => id !== undefined)
            .map(String)
          
          // Process variant facet values
          const variantFacetValuesStr = (row.variantFacetValues || '').trim()
          const variantFacetValueIds = []
          
          if (variantFacetValuesStr) {
            console.log('Processing facet values string:', variantFacetValuesStr)
            const facetValueTokens = safeSplit(variantFacetValuesStr, '|')
            console.log('Facet value tokens:', facetValueTokens)
            
            // Log all available facet value map entries at the beginning
            console.log('All available facet value map entries:', Array.from(facetValueSlugToIdMap.value.entries()))
            
            for (const token of facetValueTokens) {
              console.log('Processing facet value token:', token)
              if (token.includes(':')) {
                // Extract facet code and value code to verify format
                const [facetCode, valueCode] = token.split(':')
                console.log('Extracted facetCode:', facetCode, 'valueCode:', valueCode)
                
                const facetValueId = facetValueSlugToIdMap.value.get(token)
                if (facetValueId) {
                  console.log('Found facet value ID:', facetValueId, 'for token:', token)
                  variantFacetValueIds.push(facetValueId)
                } else {
                  console.log('No facet value ID found for token:', token)
                  
                  // Check if there's a case mismatch or formatting issue
                  const normalizedToken = token.toLowerCase().trim()
                  const normalizedMatch = Array.from(facetValueSlugToIdMap.value.entries())
                    .find(([key]) => key.toLowerCase().trim() === normalizedToken)
                  
                  if (normalizedMatch) {
                    console.log('Found match with normalized token:', normalizedToken, '->', normalizedMatch[0], ':', normalizedMatch[1])
                    variantFacetValueIds.push(normalizedMatch[1])
                  } else {
                    console.log('No match found even after normalization for token:', token)
                  }
                }
              } else {
                console.log('Skipping token (no colon):', token)
              }
            }
          }
          
          console.log('Final facet value IDs:', variantFacetValueIds)
          
          // Use updateProductVariants mutation with ID directly
          const updateVariantInput = {
            id: existingVariant.id
          }
          
          if (variantFeaturedAssetId) {
            updateVariantInput.featuredAssetId = String(variantFeaturedAssetId)
          }
          
          if (variantAssetIds.length > 0) {
            updateVariantInput.assetIds = variantAssetIds
          }
          
          if (variantFacetValueIds.length > 0) {
            updateVariantInput.facetValueIds = variantFacetValueIds
          }
          
          // Execute update mutation
          await apolloClient.mutate({
            mutation: UPDATE_PRODUCT_VARIANTS_MUTATION,
            variables: {
              input: [updateVariantInput]
            }
          })
          
          console.log('Successfully updated variant:', sku)
        } else {
          // Process options
          const optionsStr = (row.options || '').trim()
          const optionPairs = safeSplit(optionsStr, '|')
          const optionIds = optionPairs
            .map(pair => {
              const [groupCode, optionCode] = pair.split(':')
              return optionMap.value.get(`${groupCode}:${optionCode}`)
            })
            .filter(id => id !== undefined)
            .map(String)
          
          // Process variant facet values
          const variantFacetValuesStr = (row.variantFacetValues || '').trim()
          const variantFacetValueIds = []
          if (variantFacetValuesStr) {
            console.log('Processing facet values string for new variant:', variantFacetValuesStr)
            const facetValueTokens = safeSplit(variantFacetValuesStr, '|')
            console.log('Facet value tokens for new variant:', facetValueTokens)
            
            for (const token of facetValueTokens) {
              if (token.includes(':')) {
                console.log('Processing facet value token for new variant:', token)
                const facetValueId = facetValueSlugToIdMap.value.get(token)
                if (facetValueId) {
                  console.log('Found facet value ID:', facetValueId, 'for token:', token)
                  variantFacetValueIds.push(facetValueId)
                } else {
                  console.log('No facet value ID found for token:', token)
                  console.log('Available facet value map entries:', Array.from(facetValueSlugToIdMap.value.entries()))
                }
              }
            }
          }
          
          console.log('Final facet value IDs for new variant:', variantFacetValueIds)
          
          // Process variant data
          const variantName = (row.variantName || row.productName || `Variant ${sku}`).trim()
          const price = Number(row.variantPrice) || 0
          const priceInCents = Math.round(price * 100)
          
          // Create variant
          const createResult = await apolloClient.mutate({
            mutation: CREATE_PRODUCT_VARIANTS_MUTATION,
            variables: {
              input: [{
                productId: product.id,
                sku: sku,
                price: priceInCents,
                optionIds: optionIds,
                facetValueIds: variantFacetValueIds,
                translations: [{
                  languageCode: 'en',
                  name: variantName
                }]
              }]
            }
          })
          
          const newVariant = createResult.data.createProductVariants[0]
          variantId = newVariant.id
          console.log('Created variant:', sku, 'with ID:', variantId)
        }
        
        // Step 5: Process variant assets if not already handled in update
        if (!existingVariant && variantId) {
          const variantFeaturedFilename = (row.variantFeaturedAsset || '').trim()
          const variantFeaturedAssetId = variantFeaturedFilename ? assetsMap.value[variantFeaturedFilename] : undefined
          
          const variantAssetsStr = (row.variantAssets || '').trim()
          const variantAssetFilenames = safeSplit(variantAssetsStr, '|')
          const variantAssetIds = variantAssetFilenames
            .map(filename => assetsMap.value[filename])
            .filter(id => id !== undefined)
            .map(String)
          
          if (variantFeaturedAssetId || variantAssetIds.length > 0) {
            const updateInput = {
              id: variantId
            }
            
            if (variantFeaturedAssetId) {
              updateInput.featuredAssetId = String(variantFeaturedAssetId)
            }
            
            if (variantAssetIds.length > 0) {
              updateInput.assetIds = variantAssetIds
            }
            
            await apolloClient.mutate({
              mutation: UPDATE_PRODUCT_VARIANT_MUTATION,
              variables: { input: updateInput }
            })
            console.log('Updated variant assets for:', sku)
          }
        }
        
        // Step 6: Process stock levels
        const stockLevelsStr = (row.stockLevels || '').trim()
        if (stockLevelsStr && variantId) {
          const [stockSku, stockQtyStr] = stockLevelsStr.split(':')
          const stockQty = parseInt(stockQtyStr || stockLevelsStr)
          
          if (!isNaN(stockQty)) {
            await apolloClient.mutate({
              mutation: UPDATE_PRODUCT_VARIANT_MUTATION,
              variables: {
                input: {
                  id: variantId,
                  stockOnHand: stockQty
                }
              }
            })
            console.log('Set stock level to', stockQty, 'for variant:', sku)
          }
        }
        
        successCount++
        console.log('Processed variant:', sku)
        
      } catch (rowError) {
        errorCount++
        const errorMsg = `Row failed for variant "${(row.variantSku || '').trim()}": ${rowError.message}`
        errors.push(errorMsg)
        console.error('Row processing error:', errorMsg)
      }
    }
    
    // Step 7: Show results
    successMessage.value = `Variant import completed: ${successCount} variants processed successfully, ${errorCount} errors`
    
    if (errors.length > 0) {
      console.error('Import errors:', errors)
      // Show first 5 errors in the UI
      error.value = `Some errors occurred during variant import:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : ''}`
    }
    
  } catch (err) {
    error.value = `Error during variant import: ${err.message}`
    console.error('Error importing variants:', err)
  } finally {
    isImportingVariants.value = false
    isImporting.value = false
  }
}

const importStockLevels = async () => {
  if (!importFiles.value.stockLevels) {
    error.value = 'Please select a CSV file to import'
    return
  }
  
  isImporting.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    // Read and parse CSV file
    const csvText = await readFileAsText(importFiles.value.stockLevels)
    const stockLevels = parseCsv(csvText)
    
    // TODO: Implement stock levels import logic here
    // This would involve creating GraphQL mutations for each stock level
    
    successMessage.value = `Successfully imported stock levels for ${stockLevels.length} variants`
    console.log('Stock levels imported:', stockLevels)
  } catch (err) {
    error.value = err.message
    console.error('Error importing stock levels:', err)
  } finally {
    isImporting.value = false
  }
}

const importFacets = async () => {
  if (!importFiles.value.facets) {
    error.value = 'Please select a CSV file to import'
    return
  }
  
  isImporting.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    // Step 1: Read and parse CSV file
    const csvText = await readFileAsText(importFiles.value.facets)
    const records = parseCsv(csvText)
    
    if (records.length === 0) {
      throw new Error('No valid records found in CSV file')
    }
    
    console.log('Starting facet import for', records.length, 'records')
    
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    let successCount = 0
    let errorCount = 0
    const errors = []
    
    // Step 2: Get all existing facets to avoid duplicates
    const facetsResult = await apolloClient.query({
      query: GET_ALL_FACETS_QUERY,
      variables: {
        options: {
          take: 1000,
          skip: 0
        }
      },
      fetchPolicy: 'network-only'
    })
    
    const existingFacets = new Map()
    if (facetsResult.data && facetsResult.data.facets && facetsResult.data.facets.items) {
      facetsResult.data.facets.items.forEach(facet => {
        const facetValuesMap = new Map()
        facet.values.forEach(value => {
          facetValuesMap.set(value.code, {
            id: value.id,
            name: value.name
          })
        })
        existingFacets.set(facet.code, {
          id: facet.id,
          name: facet.name,
          values: facetValuesMap
        })
      })
      console.log('Found', existingFacets.size, 'existing facets')
    }
    
    // Step 3: Process each record
    for (const row of records) {
      try {
        const facetCode = (row.facetCode || '').trim()
        const facetName = (row.facetName || '').trim()
        const facetValueCode = (row.facetValueCode || '').trim()
        const facetValueName = (row.facetValueName || '').trim()
        
        if (!facetCode || !facetName || !facetValueCode || !facetValueName) {
          errorCount++
          errors.push(`Row skipped: missing required fields`)
          continue
        }
        
        console.log('Processing facet:', facetCode, 'value:', facetValueCode)
        
        let facetId
        
        // Step 4: Check if facet exists, create if not, update if name has changed
        if (existingFacets.has(facetCode)) {
          console.log('Facet exists:', facetCode)
          const existingFacet = existingFacets.get(facetCode)
          facetId = existingFacet.id
          
          // Check if facet name has changed
          if (existingFacet.name !== facetName) {
            console.log('Updating facet name:', facetCode, 'from', existingFacet.name, 'to', facetName)
            await apolloClient.mutate({
              mutation: UPDATE_FACET_MUTATION,
              variables: {
                input: {
                  id: facetId,
                  translations: [{
                    languageCode: 'en',
                    name: facetName
                  }]
                }
              }
            })
            // Update the map with new name
            existingFacet.name = facetName
            console.log('Updated facet name:', facetCode)
          }
        } else {
          console.log('Creating new facet:', facetCode)
          const createFacetResult = await apolloClient.mutate({
            mutation: CREATE_FACET_MUTATION,
            variables: {
              input: {
                code: facetCode,
                isPrivate: false,
                translations: [{
                  languageCode: 'en',
                  name: facetName
                }]
              }
            }
          })
          
          const newFacet = createFacetResult.data.createFacet
          facetId = newFacet.id
          // Add to existing facets map
          existingFacets.set(facetCode, {
            id: newFacet.id,
            name: newFacet.name,
            values: new Map()
          })
          console.log('Created facet:', facetCode, 'with ID:', facetId)
        }
        
        // Step 5: Check if facet value exists, create if not, update if name has changed
        const facetValuesMap = existingFacets.get(facetCode).values
        if (!facetValuesMap.has(facetValueCode)) {
          console.log('Creating new facet value:', facetValueCode, 'for facet:', facetCode)
          const createFacetValueResult = await apolloClient.mutate({
            mutation: CREATE_FACET_VALUE_MUTATION,
            variables: {
              input: {
                facetId: facetId,
                code: facetValueCode,
                translations: [{
                  languageCode: 'en',
                  name: facetValueName
                }]
              }
            }
          })
          
          const newFacetValue = createFacetValueResult.data.createFacetValue
          facetValuesMap.set(facetValueCode, {
            id: newFacetValue.id,
            name: newFacetValue.name
          })
          console.log('Created facet value:', facetValueCode, 'with ID:', newFacetValue.id)
        } else {
          // Check if facet value name needs update
          console.log('Facet value exists, checking if update needed:', facetValueCode)
          const existingFacetValue = facetValuesMap.get(facetValueCode)
          
          if (existingFacetValue.name !== facetValueName) {
            console.log('Updating facet value name:', facetValueCode, 'from', existingFacetValue.name, 'to', facetValueName)
            await apolloClient.mutate({
              mutation: UPDATE_FACET_VALUE_MUTATION,
              variables: {
                input: {
                  id: existingFacetValue.id,
                  translations: [{
                    languageCode: 'en',
                    name: facetValueName
                  }]
                }
              }
            })
            // Update the map with new name
            existingFacetValue.name = facetValueName
            console.log('Updated facet value:', facetValueCode)
          } else {
            console.log('Facet value name is already up to date:', facetValueCode)
          }
        }
        
        successCount++
        console.log('Processed facet:', facetCode, 'value:', facetValueCode)
        
      } catch (rowError) {
        errorCount++
        const errorMsg = `Row failed: ${rowError.message}`
        errors.push(errorMsg)
        console.error('Row processing error:', errorMsg)
      }
    }
    
    // Step 6: Show results
    successMessage.value = `Facet import completed: ${successCount} facets/facet values processed successfully, ${errorCount} errors`
    
    if (errors.length > 0) {
      console.error('Import errors:', errors)
      // Show first 5 errors in the UI
      error.value = `Some errors occurred during facet import:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : ''}`
    }
    
    // Step 7: Refresh facet values map for future imports
    await fetchFacetValues()
    
  } catch (err) {
    error.value = `Error during facet import: ${err.message}`
    console.error('Error importing facets:', err)
  } finally {
    isImporting.value = false
  }
}

const importCollections = async () => {
  if (!importFiles.value.collections) {
    error.value = 'Please select a CSV file to import'
    return
  }
  
  isImporting.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    // Read and parse CSV file
    const csvText = await readFileAsText(importFiles.value.collections)
    const records = parseCsv(csvText)
    
    if (records.length === 0) {
      throw new Error('No valid records found in CSV file')
    }
    
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    let successCount = 0
    let errorCount = 0
    const errors = []
    
    // Step 1: Refresh collections map to get latest data
    await fetchCollections()
    
    // Step 2: Process each record
    for (const row of records) {
      try {
        const slug = (row.collectionSlug || '').trim()
        const name = (row.collectionName || '').trim()
        
        if (!slug) {
          errorCount++
          errors.push(`Row skipped: missing collectionSlug`)
          continue
        }
        
        console.log('Processing collection:', slug)
        
        // Step 3: Check if collection exists
        let collectionExists = false
        let existingCollection = null
        
        try {
          const collectionResult = await apolloClient.query({
            query: GET_COLLECTION_BY_SLUG_QUERY,
            variables: { slug },
            fetchPolicy: 'network-only'
          })
          
          existingCollection = collectionResult.data.collection
          collectionExists = !!existingCollection
        } catch (queryError) {
          console.error('Error checking collection existence:', queryError)
          // If query fails, assume collection doesn't exist and try to create
          collectionExists = false
        }
        
        // Only require collectionName for new collections
        if (!collectionExists && !name) {
          errorCount++
          errors.push(`Row skipped: missing collectionName for new collection`)
          continue
        }
        
        // Step 4: Process parent collection
        let parentId = undefined
        const parentSlug = (row.parentSlug || '').trim()
        
        if (parentSlug) {
          // Check if parent exists in our map first
          parentId = collectionSlugToIdMap.value.get(parentSlug)
          
          // If not in map, fetch it
          if (!parentId) {
            try {
              const parentResult = await apolloClient.query({
                query: GET_COLLECTION_BY_SLUG_QUERY,
                variables: { slug: parentSlug },
                fetchPolicy: 'network-only'
              })
              
              if (parentResult.data.collection) {
                parentId = parentResult.data.collection.id
                // Update our map for future use
                collectionSlugToIdMap.value.set(parentSlug, parentId)
              } else {
                throw new Error(`Parent collection not found: ${parentSlug}`)
              }
            } catch (parentError) {
              throw new Error(`Error fetching parent collection: ${parentError.message}`)
            }
          }
        }
        
        // Step 5: Process assets (only if we have an assets map)
        let featuredAssetId = undefined
        let assetIds = []
        
        if (Object.keys(assetsMap.value).length > 0) {
          const featuredFilename = (row.collectionFeaturedAsset || '').trim()
          featuredAssetId = featuredFilename ? assetsMap.value[featuredFilename] : undefined
          
          const collectionAssetsStr = (row.collectionAssets || '').trim()
          const assetFilenames = safeSplit(collectionAssetsStr, '|')
          assetIds = assetFilenames
            .map(filename => assetsMap.value[filename])
            .filter(id => id !== undefined)
            .map(String)
        }
        
        // Step 6: Process facet value filters
        let filters = []
        const facetValueCodeForFilter = (row.facetValueCodeForFilter || '').trim()
        console.log('Processing facetValueCodeForFilter:', facetValueCodeForFilter, 'for collection:', slug)
        
        if (facetValueCodeForFilter) {
          const facetValueCodes = safeSplit(facetValueCodeForFilter, '|')
          console.log('Resolving facet value codes:', facetValueCodes)
          const facetValueIds = []
          
          // Resolve each facet value code to its ID
          for (const code of facetValueCodes) {
            const trimmedCode = code.trim()
            console.log('Resolving facet value code:', trimmedCode)
            
            try {
              // Log the full query being sent
              console.log('Sending facet value query for code:', trimmedCode)
              const facetValueResult = await apolloClient.query({
                query: GET_FACET_VALUE_BY_CODE_QUERY,
                variables: { code: trimmedCode },
                fetchPolicy: 'network-only'
              })
              
              // Log the full response
              console.log('Facet value query response:', JSON.stringify(facetValueResult.data, null, 2))
              
              if (facetValueResult.data.facetValues?.items?.length > 0) {
                const facetValueId = facetValueResult.data.facetValues.items[0].id
                facetValueIds.push(facetValueId)
                console.log('Found facet value ID:', facetValueId, 'for code:', trimmedCode)
              } else {
                console.warn('No facet value found for code:', trimmedCode)
                console.warn('Available facet values:', JSON.stringify(facetValueResult.data.facetValues, null, 2))
              }
            } catch (queryError) {
              console.error('Error querying facet value:', trimmedCode, queryError)
              console.error('Error details:', JSON.stringify(queryError, null, 2))
            }
          }
          
          // Add facet value filter if we found any IDs
          console.log('Final facet value IDs:', facetValueIds)
          if (facetValueIds.length > 0) {
            filters = [
              {
                code: 'facet-value-filter',
                arguments: [
                  {
                    name: 'facetValueIds',
                    value: JSON.stringify(facetValueIds) // Convert array to JSON string
                  },
                  {
                    name: 'containsAny',
                    value: 'false' // AND logic (product must have all facet values)
                  }
                ]
              }
            ]
            console.log('Created filters array:', JSON.stringify(filters, null, 2))
          } else {
            console.log('No facet value IDs found, using empty filters array')
          }
        } else {
          console.log('No facetValueCodeForFilter provided, using empty filters array')
        }
        
        if (collectionExists) {
          // Update existing collection
          console.log('Updating existing collection:', slug)
          
          const updateInput = {
            id: existingCollection.id,
            filters // Always update filters, even if empty array
          }
          
          // Add optional fields if they have values
          if (parentId) {
            updateInput.parentId = parentId
          }
          
          if (featuredAssetId) {
            updateInput.featuredAssetId = String(featuredAssetId)
          }
          
          if (assetIds.length > 0) {
            updateInput.assetIds = assetIds
          }
          
          // Log the full update input
          console.log('Sending update mutation with input:', JSON.stringify(updateInput, null, 2))
          
          // Execute update mutation
          const updateResult = await apolloClient.mutate({
            mutation: UPDATE_COLLECTION_MUTATION,
            variables: { input: updateInput }
          })
          
          // Log the update result
          console.log('Update mutation result:', JSON.stringify(updateResult.data, null, 2))
          
          successCount++
          console.log('Updated collection:', slug)
        } else {
          // Create new collection
          console.log('Creating new collection:', slug)
          
          const createInput = {
            translations: [
              {
                languageCode: 'en',
                name: name,
                slug: slug,
                description: '' // Required field, using empty string if not provided
              }
            ],
            filters: filters // Use the dynamically built filters array
          }
          
          // Add optional fields if they have values
          if (parentId) {
            createInput.parentId = parentId
          }
          
          if (featuredAssetId) {
            createInput.featuredAssetId = String(featuredAssetId)
          }
          
          if (assetIds.length > 0) {
            createInput.assetIds = assetIds
          }
          
          // Log the full create input
          console.log('Sending create mutation with input:', JSON.stringify(createInput, null, 2))
          
          // Execute create mutation
          const createResult = await apolloClient.mutate({
            mutation: CREATE_COLLECTION_MUTATION,
            variables: { input: createInput }
          })
          
          // Log the create result
          console.log('Create mutation result:', JSON.stringify(createResult.data, null, 2))
          
          successCount++
          console.log('Created collection:', slug)
          
          // Update collections map with new collection
          await fetchCollections()
        }
        
      } catch (rowError) {
        errorCount++
        const errorMsg = `Row failed for collection "${(row.collectionSlug || '').trim()}": ${rowError.message}`
        errors.push(errorMsg)
        console.error('Row processing error:', errorMsg)
      }
    }
    
    // Step 3: Show results
    successMessage.value = `Collection import completed: ${successCount} collections processed successfully, ${errorCount} errors`
    
    if (errors.length > 0) {
      console.error('Import errors:', errors)
      // Show first 5 errors in the UI
      error.value = `Some errors occurred during collection import:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : ''}`
    }
    
  } catch (err) {
    error.value = `Error during collection import: ${err.message}`
    console.error('Error importing collections:', err)
  } finally {
    isImporting.value = false
  }
}

// Helper functions
const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      // Read as ArrayBuffer so we can pick the correct encoding.
      // `readAsText(file)` with no argument defaults to UTF-8, which
      // mangles Chinese-Windows CSVs (typically saved as GBK / GB18030
      // by Excel and Notepad) — turning "白色" into "��ɫ".
      const buf = e.target.result
      const bytes = new Uint8Array(buf)
      const len = bytes.length

      // Quick BOM sniff so we honor the user's explicit encoding when
      // they've bothered to write one.  The hard cases are BOM-less
      // Chinese-Windows files; for those we fall through to the
      // trial-decode logic below.
      let bomEncoding = null
      if (len >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
        bomEncoding = 'utf-8'
      } else if (len >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
        bomEncoding = 'utf-16le'
      } else if (len >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
        bomEncoding = 'utf-16be'
      }

      // Trial-decode: pick the encoding that produces the fewest
      // Unicode replacement characters (U+FFFD).  For ASCII files
      // both decoders agree; for GBK-only files UTF-8 produces a
      // mojibake full of �s, while GB18030 (a superset of GBK and
      // the modern Chinese standard) decodes cleanly.  For valid
      // UTF-8 files UTF-8 wins.
      const countRepl = (s) => (s.match(/\uFFFD/g) || []).length
      const tryDecode = (enc) => {
        try { return new TextDecoder(enc).decode(bytes) }
        catch (e) { return null }
      }

      let text
      if (bomEncoding) {
        text = tryDecode(bomEncoding) || tryDecode('utf-8') || ''
        // Strip a stray UTF-8 BOM that may have slipped into the
        // decoded string.
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
      } else {
        // No BOM -> try UTF-8 and GB18030, keep whichever looks cleanest.
        const utf8 = tryDecode('utf-8')
        const utf8Repl = utf8 ? countRepl(utf8) : Infinity

        const gb = tryDecode('gb18030')  // 'gbk' is a Chrome 130+ alias
        const gbRepl = gb ? countRepl(gb) : Infinity

        // Only fall back to GB18030 if it's *strictly better* than
        // UTF-8 — this prevents accidentally mangling genuine Latin-1
        // or Windows-1252 files.
        if (gb && gbRepl < utf8Repl) {
          text = gb
        } else if (utf8) {
          text = utf8
        } else {
          text = new TextDecoder('utf-8').decode(bytes)
        }
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)

        // Log the chosen encoding so encoding issues are easy to debug
        // from the console.  Cheap, runs only on file load.
        console.log(
          `[readFileAsText] file=${file.name}  size=${len}B  ` +
          `utf8_repl=${utf8Repl}  gb18030_repl=${gbRepl}  ` +
          `chose=${gb && gbRepl < utf8Repl ? 'gb18030' : 'utf-8'}`
        )
      }

      resolve(text)
    }
    reader.onerror = () => reject(new Error('Error reading file'))
    reader.readAsArrayBuffer(file)
  })
}

// Helper function to safely split strings
const safeSplit = (s, sep = '|') => {
  if (!s) return []
  return s.split(sep).map(t => t.trim()).filter(Boolean)
}

const parseCsv = (csvText) => {
  // Simple CSV parser with quoted field support
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []
  
  // Parse headers and remove empty headers (caused by extra commas)
  let headers = lines[0].split(',').map(header => header.trim().replace(/^"|"$/g, ''))
  // Filter out empty headers
  headers = headers.filter(header => header !== '')
  console.log('Parsed CSV headers:', headers)
  
  return lines.slice(1).map((line, lineIndex) => {
    // Handle quoted fields properly
    const values = []
    let currentValue = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim().replace(/^"|"$/g, ''))
        currentValue = ''
      } else {
        currentValue += char
      }
    }
    values.push(currentValue.trim().replace(/^"|"$/g, ''))
    
    console.log(`Line ${lineIndex + 2} values:`, values)
    console.log(`Line ${lineIndex + 2} headers vs values length: ${headers.length} vs ${values.length}`)
    
    const obj = {}
    headers.forEach((header, index) => {
      // Map the value to the header, handling the case where there might be fewer values than headers
      obj[header] = values[index] || ''
      console.log(`Line ${lineIndex + 2} - ${header}: "${values[index] || ''}"`)
    })
    
    return obj
  })
}

// Load and parse assets map from JSON file
const loadAssetsMap = async (file) => {
  isLoadingAssetsMap.value = true
  error.value = ''
  
  try {
    const text = await readFileAsText(file)
    assetsMap.value = JSON.parse(text)
    successMessage.value = `Successfully loaded assets map with ${Object.keys(assetsMap.value).length} entries`
  } catch (err) {
    error.value = `Error loading assets map: ${err.message}`
    console.error('Error loading assets map:', err)
  } finally {
    isLoadingAssetsMap.value = false
  }
}

// Import collection assets from CSV
const importCollectionAssets = async () => {
  if (!importFiles.value.collectionAssetsCsv) {
    error.value = 'Please select a CSV file to import'
    return
  }
  
  if (Object.keys(assetsMap.value).length === 0) {
    error.value = 'Please load the assets map JSON file first'
    return
  }
  
  isImportingCollectionAssets.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    // Step 1: Read and parse CSV file
    const csvText = await readFileAsText(importFiles.value.collectionAssetsCsv)
    const records = parseCsv(csvText)
    
    if (records.length === 0) {
      throw new Error('No valid records found in CSV file')
    }
    
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    let successCount = 0
    let errorCount = 0
    const errors = []
    
    // Step 2: Refresh collections map to get latest data
    await fetchCollections()
    
    // Step 3: Process each record
    for (const row of records) {
      try {
        const slug = (row.collectionSlug || '').trim()
        if (!slug) {
          errorCount++
          errors.push(`Row skipped: missing collectionSlug`)
          continue
        }
        
        // Step 4: Get or create collection by slug
        let collection
        
        // Check if collection exists
        try {
          const collectionResult = await apolloClient.query({
            query: GET_COLLECTION_BY_SLUG_QUERY,
            variables: { slug },
            fetchPolicy: 'network-only'
          })
          
          collection = collectionResult.data.collection
        } catch (queryError) {
          console.error('Error checking collection existence:', queryError)
        }
        
        // If collection doesn't exist, create it
        if (!collection) {
          const collectionName = (row.collectionName || slug).trim()
          
          // Process parent collection if parentSlug is provided
          let parentId = undefined
          const parentSlug = (row.parentSlug || '').trim()
          
          if (parentSlug) {
            // Check if parent exists in our map first
            parentId = collectionSlugToIdMap.value.get(parentSlug)
            
            // If not in map, fetch it
            if (!parentId) {
              try {
                const parentResult = await apolloClient.query({
                  query: GET_COLLECTION_BY_SLUG_QUERY,
                  variables: { slug: parentSlug },
                  fetchPolicy: 'network-only'
                })
                
                if (parentResult.data.collection) {
                  parentId = parentResult.data.collection.id
                  // Update our map for future use
                  collectionSlugToIdMap.value.set(parentSlug, parentId)
                }
              } catch (parentError) {
                throw new Error(`Parent collection not found: ${parentSlug}`)
              }
            }
          }
          
          // Create new collection with required fields
          // Process facet value filters if provided
          let filters = []
          const facetValueCodeForFilter = (row.facetValueCodeForFilter || '').trim()
          console.log('Processing facetValueCodeForFilter in assets import:', facetValueCodeForFilter, 'for collection:', slug)
          
          if (facetValueCodeForFilter) {
            const facetValueCodes = safeSplit(facetValueCodeForFilter, '|')
            console.log('Resolving facet value codes in assets import:', facetValueCodes)
            const facetValueIds = []
            
            // Resolve each facet value code to its ID
            for (const code of facetValueCodes) {
              const trimmedCode = code.trim()
              console.log('Resolving facet value code in assets import:', trimmedCode)
              
              try {
                const facetValueResult = await apolloClient.query({
                  query: GET_FACET_VALUE_BY_CODE_QUERY,
                  variables: { code: trimmedCode },
                  fetchPolicy: 'network-only'
                })
                
                console.log('Facet value query result in assets import:', facetValueResult.data.facetValues)
                
                if (facetValueResult.data.facetValues?.items?.length > 0) {
                  const facetValueId = facetValueResult.data.facetValues.items[0].id
                  facetValueIds.push(facetValueId)
                  console.log('Found facet value ID in assets import:', facetValueId, 'for code:', trimmedCode)
                } else {
                  console.warn('No facet value found in assets import for code:', trimmedCode)
                }
              } catch (queryError) {
                console.error('Error querying facet value in assets import:', trimmedCode, queryError)
              }
            }
            
            // Add facet value filter if we found any IDs
            console.log('Final facet value IDs in assets import:', facetValueIds)
            if (facetValueIds.length > 0) {
              filters = [
                {
                  code: 'facet-value-filter',
                  arguments: [
                    {
                      name: 'facetValueIds',
                      value: JSON.stringify(facetValueIds) // Convert array to JSON string
                    },
                    {
                      name: 'containsAny',
                      value: 'false' // AND logic (product must have all facet values)
                    }
                  ]
                }
              ]
              console.log('Created filters array in assets import:', filters)
            }
          } else {
            console.log('No facetValueCodeForFilter provided in assets import, using empty filters array')
          }
          
          const createResult = await apolloClient.mutate({
            mutation: CREATE_COLLECTION_MUTATION,
            variables: {
              input: {
                translations: [
                  {
                    languageCode: 'en',
                    name: collectionName,
                    slug: slug,
                    description: '' // Required field, using empty string if not provided
                  }
                ],
                filters: filters,
                ...(parentId && { parentId })
              }
            }
          })
          
          collection = createResult.data.createCollection
          console.log('Created new collection:', slug)
          
          // Update collections map with new collection
          await fetchCollections()
        }
        
        // Step 4: Process facet value filters for existing collection
        let filters = []
        const facetValueCodeForFilter = (row.facetValueCodeForFilter || '').trim()
        console.log('Processing facetValueCodeForFilter for existing collection:', facetValueCodeForFilter, 'for collection:', slug)
        
        if (facetValueCodeForFilter) {
          const facetValueCodes = safeSplit(facetValueCodeForFilter, '|')
          console.log('Resolving facet value codes for existing collection:', facetValueCodes)
          const facetValueIds = []
          
          // Resolve each facet value code to its ID
          for (const code of facetValueCodes) {
            const trimmedCode = code.trim()
            console.log('Resolving facet value code for existing collection:', trimmedCode)
            
            try {
              const facetValueResult = await apolloClient.query({
                query: GET_FACET_VALUE_BY_CODE_QUERY,
                variables: { code: trimmedCode },
                fetchPolicy: 'network-only'
              })
              
              console.log('Facet value query result for existing collection:', facetValueResult.data.facetValues)
              
              if (facetValueResult.data.facetValues?.items?.length > 0) {
                const facetValueId = facetValueResult.data.facetValues.items[0].id
                facetValueIds.push(facetValueId)
                console.log('Found facet value ID for existing collection:', facetValueId, 'for code:', trimmedCode)
              } else {
                console.warn('No facet value found for existing collection:', trimmedCode)
              }
            } catch (queryError) {
              console.error('Error querying facet value for existing collection:', trimmedCode, queryError)
            }
          }
          
          // Add facet value filter if we found any IDs
          console.log('Final facet value IDs for existing collection:', facetValueIds)
          if (facetValueIds.length > 0) {
            filters = [
              {
                code: 'facet-value-filter',
                arguments: [
                  {
                    name: 'facetValueIds',
                    value: JSON.stringify(facetValueIds) // Convert array to JSON string
                  },
                  {
                    name: 'containsAny',
                    value: 'false' // AND logic (product must have all facet values)
                  }
                ]
              }
            ]
            console.log('Created filters array for existing collection:', filters)
          }
        }
        
        // Step 5: Process featured asset
        const featuredFilename = (row.collectionFeaturedAsset ?? '').trim()
        const featuredAssetId = featuredFilename ? assetsMap.value[featuredFilename] : undefined
        
        // Step 6: Process multiple assets
        const assetFilenames = safeSplit(row.collectionAssets, '|')
        const assetIds = assetFilenames
          .map(filename => assetsMap.value[filename])
          .filter(id => id !== undefined)
          .map(String)
        
        // Step 7: Build update input with filters
        const input = {
          id: collection.id,
          filters // Always include filters, even if empty array
        }
        
        if (featuredAssetId) {
          input.featuredAssetId = String(featuredAssetId)
        }
        
        if (assetIds.length > 0) {
          input.assetIds = assetIds
        }
        
        // Step 8: Update collection with assets and filters
        const updateResult = await apolloClient.mutate({
          mutation: UPDATE_COLLECTION_MUTATION,
          variables: { input }
        })
        
        console.log('Update mutation result for existing collection:', updateResult.data)
        
        successCount++
        console.log('Processed collection:', slug)
      } catch (rowError) {
        errorCount++
        errors.push(`Row failed: ${rowError.message}`)
      }
    }
    
    // Step 9: Show results
    successMessage.value = `Import completed: ${successCount} collections processed, ${errorCount} errors`
    
    if (errors.length > 0) {
      console.error('Import errors:', errors)
      // Show first 5 errors in the UI
      error.value = `Some errors occurred:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : ''}`
    }
  } catch (err) {
    error.value = err.message
    console.error('Error importing collection assets:', err)
  } finally {
    isImportingCollectionAssets.value = false
  }
}

// Fetch collections and facet values on component mount
onMounted(async () => {
  await prefetchLookupData()
})
</script>

<style scoped>
.import-page {
  margin-top: 2rem;
}
</style>
