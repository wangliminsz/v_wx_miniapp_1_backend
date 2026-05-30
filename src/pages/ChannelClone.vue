<template>
  <div class="channel-clone-page">
    <h1 class="text-2xl font-semibold text-gray-300 mb-6">Clone Channel</h1>
    
    <!-- Loading state -->
    <div v-if="loading" class="text-center py-10 text-gray-400">Loading...</div>
    
    <!-- Error state -->
    <div v-else-if="error" class="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md mb-6">
      <h3 class="font-bold mb-2">An error occurred:</h3>
      <p class="text-sm">{{ error }}</p>
    </div>
    
    <!-- Success state -->
    <div v-else-if="channels.length > 0">
      <div class="bg-dark-200 p-6 rounded-md border border-dark-100">
        <!-- <h2 class="text-xl font-bold text-blue-300 mb-4">Select Channel to Clone</h2> -->
        
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-300 mb-2">Source Channel (to clone from):</label>
          <div class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100">
            {{ selectedSourceChannel ? `${selectedSourceChannel.code} (${selectedSourceChannel.currencyCode})` : 'Loading...' }}
          </div>
        </div>
        
        <div class="mb-6">
          <label for="destinationChannel" class="block text-sm font-medium text-gray-300 mb-2">Destination Channel (to clone to):</label>
          <select 
            id="destinationChannel" 
            v-model="selectedDestinationChannel" 
            class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors"
          >
            <option :value="null">Select Destination Channel</option>
            <option 
              v-for="channel in channels" 
              :key="channel.id" 
              :value="channel"
            >
              {{ channel.code }} ({{ channel.currencyCode }})
            </option>
          </select>
        </div>
        
        <div class="flex gap-4 flex-wrap">
          <!-- Collections copy button -->
          <button 
            @click="copyCollections"
            :disabled="isCopying || !selectedSourceChannel || !selectedDestinationChannel"
            class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isCopying ? 'Copying Collections...' : 'Copy Collections' }}
          </button>
          
          <!-- Facets copy button -->
          <button 
            @click="copyFacets"
            :disabled="isCopyingFacets || !selectedSourceChannel || !selectedDestinationChannel"
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isCopyingFacets ? 'Copying Facets...' : 'Copy Facets' }}
          </button>
          
          <!-- Shipping Methods copy button -->
          <button 
            @click="copyShippingMethods"
            :disabled="isCopyingShipping || !selectedSourceChannel || !selectedDestinationChannel"
            class="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isCopyingShipping ? 'Copying Shipping...' : 'Copy Shipping Methods' }}
          </button>
          
          <!-- Payment Methods copy button -->
          <button 
            @click="copyPaymentMethods"
            :disabled="isCopyingPayments || !selectedSourceChannel || !selectedDestinationChannel"
            class="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isCopyingPayments ? 'Copying Payments...' : 'Copy Payment Methods' }}
          </button>
          
          <!-- Copy All Products button -->
          <button 
            @click="copyAllProducts"
            :disabled="isCopyingProducts || !selectedSourceChannel || !selectedDestinationChannel"
            class="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isCopyingProducts ? 'Copying Products...' : 'Copy All Products' }}
          </button>
          
          <button 
            @click="resetForm"
            class="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
      

      
      <!-- Create Stock Location Section -->
      <div class="mt-6 bg-dark-200 p-6 rounded-md border border-dark-100">
        <h2 class="text-xl font-bold text-teal-300 mb-4">Create New Stock Location</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label for="stockLocationName" class="block text-sm font-medium text-gray-300 mb-2">Stock Location Name *:</label>
            <input 
              type="text" 
              id="stockLocationName" 
              v-model="newStockLocationName" 
              placeholder="Enter stock location name" 
              @input="stockLocationNameError = ''"
              class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors"
            >
            <p v-if="stockLocationNameError" class="mt-1 text-sm text-red-400">{{ stockLocationNameError }}</p>
          </div>
          
          <div>
            <label for="stockLocationDescription" class="block text-sm font-medium text-gray-300 mb-2">Description:</label>
            <input 
              type="text" 
              id="stockLocationDescription" 
              v-model="newStockLocationDescription" 
              placeholder="Enter stock location description" 
              class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors"
            >
          </div>
        </div>
        
        <div class="flex gap-4">
          <button 
            @click="createStockLocation"
            :disabled="isCreatingStockLocation"
            class="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isCreatingStockLocation ? 'Creating...' : 'Create Stock Location' }}
          </button>
          
          <button 
            @click="() => { newStockLocationName.value = ''; newStockLocationDescription.value = ''; }"
            class="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
          >
            Clear Form
          </button>
        </div>
      </div>
      
      <!-- Assign Stock Location to Channel Section -->
      <div class="mt-6 bg-dark-200 p-6 rounded-md border border-dark-100">
        <h2 class="text-xl font-bold text-teal-300 mb-4">Assign Stock Location to Channel</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          <!-- ~~~~~~~~~~~~~~~ -->

          <div>
            <label for="stockLocationForAssignment" class="block text-sm font-medium text-gray-300 mb-2">Select Stock Location:</label>
            <select 
              id="stockLocationForAssignment" 
              v-model="selectedStockLocationForAssignment" 
              class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors"
            >
              <option :value="null">Select a Stock Location</option>
              <option 
                v-for="stockLocation in stockLocations" 
                :key="stockLocation.id" 
                :value="stockLocation"
              >
                {{ stockLocation.name }}
              </option>
            </select>
          </div>

          <!-- ~~~~~~~~~~~~~~~ -->
          
          <div>
            <label for="channelForAssignment" class="block text-sm font-medium text-gray-300 mb-2">Select Channel:</label>
            <select 
              id="channelForAssignment" 
              v-model="selectedChannelForAssignment" 
              class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors"
            >
              <option :value="null">Select a Channel</option>
              <option 
                v-for="channel in channels" 
                :key="channel.id" 
                :value="channel"
              >
                {{ channel.code }} ({{ channel.currencyCode }})
              </option>
            </select>
          </div>
          
          <!-- ~~~~~~~~~~~~~~~ -->

        </div>
        
        <div class="flex gap-4">
          <button 
            @click="assignStockLocationToChannel"
            :disabled="isAssigningStockLocation || !selectedChannelForAssignment || !selectedStockLocationForAssignment"
            class="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isAssigningStockLocation ? 'Assigning...' : 'Assign Stock Location to Channel' }}
          </button>
          
          <button 
            @click="() => { selectedChannelForAssignment.value = null; selectedStockLocationForAssignment.value = null; }"
            class="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
          >
            Clear Selection
          </button>
        </div>
      </div>
      
      <!-- Set Stock Level in Bulk Section -->
      <div class="mt-6 bg-dark-200 p-6 rounded-md border border-dark-100">
        <h2 class="text-xl font-bold text-teal-300 mb-4">Set Stock Level in Bulk</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label for="stockLocationForStockLevel" class="block text-sm font-medium text-gray-300 mb-2">Select Stock Location:</label>
            <select 
              id="stockLocationForStockLevel" 
              v-model="selectedStockLocationForStockLevel" 
              class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors"
            >
              <option :value="null">Select a Stock Location</option>
              <option 
                v-for="stockLocation in stockLocations" 
                :key="stockLocation.id" 
                :value="stockLocation"
              >
                {{ stockLocation.name }}
              </option>
            </select>
          </div>
          
          <div>
            <label for="stockLevelValue" class="block text-sm font-medium text-gray-300 mb-2">Stock Level *:</label>
            <input 
              type="number" 
              id="stockLevelValue" 
              v-model="stockLevelValue" 
              placeholder="Enter stock level (e.g., 100)" 
              min="0" 
              step="1" 
              class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors"
            >
          </div>
        </div>
        
        <div class="flex gap-4">
          <button 
            @click="setStockLevelInBulk"
            :disabled="isUpdatingStockLevels || !selectedStockLocationForStockLevel || !stockLevelValue"
            class="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isUpdatingStockLevels ? 'Updating Stock Levels...' : 'Set Stock Level in Bulk' }}
          </button>
          
          <button 
            @click="() => { selectedStockLocationForStockLevel.value = null; stockLevelValue.value = ''; }"
            class="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
          >
            Clear Form
          </button>
        </div>
      </div>
      
    </div>
  </div>
  
  <!-- Success Modal -->
  <div v-if="isSuccessModalVisible" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
    <div class="bg-dark-200 rounded-md border border-green-500 shadow-xl w-full max-w-md p-6">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-xl font-bold text-green-400">Success!</h3>
        <button 
          @click="closeSuccessModal"
          class="text-gray-400 hover:text-gray-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="text-gray-300 mb-6">
        {{ successMessage }}
      </div>
      <div class="flex justify-end">
        <button 
          @click="closeSuccessModal"
          class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
  
  <!-- Price Factor Modal -->
  <div v-if="isPriceFactorModalVisible" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
    <div class="bg-dark-200 rounded-md border border-secondary shadow-xl w-full max-w-md p-6">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-xl font-bold text-secondary">Set Price Factor</h3>
        <button 
          @click="isPriceFactorModalVisible = false"
          class="text-gray-400 hover:text-gray-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="mb-6">
        <p class="text-gray-300 mb-4">Please enter the price factor (currency rate) for copying products from "{{ selectedSourceChannel?.code }}" to "{{ selectedDestinationChannel?.code }}".</p>
        
        <div>
          <label for="priceFactor" class="block text-sm font-medium text-gray-300 mb-2">Price Factor *:</label>
          <input 
            type="number" 
            id="priceFactor" 
            v-model="priceFactorValue" 
            placeholder="Enter price factor (e.g., 2.0)" 
            min="0.01" 
            step="0.01" 
            class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors"
          >
          <p class="mt-1 text-sm text-gray-400">Default value: 1.0</p>
        </div>
      </div>
      <div class="flex gap-4 justify-end">
        <button 
          @click="isPriceFactorModalVisible = false"
          class="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button 
          @click="copyAllProductsWithPriceFactor"
          :disabled="isCopyingProducts"
          class="px-6 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isCopyingProducts ? 'Copying Products...' : 'Copy Products' }}
        </button>
      </div>
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
const channels = ref([])
const selectedSourceChannel = ref(null)
const selectedDestinationChannel = ref(null)
const isCopying = ref(false)
const isCopyingFacets = ref(false)
const isCopyingShipping = ref(false)
const isCopyingPayments = ref(false)
const isCopyingProducts = ref(false)
const successMessage = ref('')
const collections = ref([])
const loadingCollections = ref(false)
const facets = ref([])
const loadingFacets = ref(false)
const shippingMethods = ref([])
const loadingShipping = ref(false)
const paymentMethods = ref([])
const loadingPayments = ref(false)
const products = ref([])
const loadingProducts = ref(false)
const stockLocations = ref([])
const loadingStockLocations = ref(false)
const isCreatingStockLocation = ref(false)
const newStockLocationName = ref('')
const newStockLocationDescription = ref('')
const isSuccessModalVisible = ref(false)
const stockLocationNameError = ref('')
const selectedChannelForAssignment = ref(null)
const selectedStockLocationForAssignment = ref(null)
const isAssigningStockLocation = ref(false)
// Bulk stock level update state
const productVariants = ref([])
const loadingVariants = ref(false)
const selectedStockLocationForStockLevel = ref(null)
const stockLevelValue = ref('')
const isUpdatingStockLevels = ref(false)
// Price factor modal state
const isPriceFactorModalVisible = ref(false)
const priceFactorValue = ref(1)

// Create Apollo Client with token and channel token
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

// GraphQL query to fetch channels
const GET_CHANNELS_QUERY = gql`
  query GetChannels {
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

// GraphQL mutation to assign collections to channel
const ASSIGN_COLLECTIONS_MUTATION = gql`
  mutation AssignCollectionsToChannel($channelId: ID!, $collectionIds: [ID!]!) {
    assignCollectionsToChannel(input: { channelId: $channelId, collectionIds: $collectionIds }) {
      id
      name
    }
  }
`

// GraphQL query to fetch all facets
const GET_FACETS_QUERY = gql`
  query GetAllFacets($options: FacetListOptions) {
    facets(options: $options) {
      totalItems
      items {
        id
        name
        code
        isPrivate
      }
    }
  }
`

// GraphQL mutation to assign facets to channel
const ASSIGN_FACETS_MUTATION = gql`
  mutation AssignFacetsToChannel($channelId: ID!, $facetIds: [ID!]!) {
    assignFacetsToChannel(input: { channelId: $channelId, facetIds: $facetIds }) {
      id
      name
    }
  }
`

// GraphQL query to fetch all shipping methods
const GET_SHIPPING_METHODS_QUERY = gql`
  query GetAllShippingMethods($options: ShippingMethodListOptions) {
    shippingMethods(options: $options) {
      totalItems
      items {
        id
        code
        description
      }
    }
  }
`

// GraphQL mutation to assign shipping methods to channel
const ASSIGN_SHIPPING_METHODS_MUTATION = gql`
  mutation AssignShippingMethodsToChannel($channelId: ID!, $shippingMethodIds: [ID!]!) {
    assignShippingMethodsToChannel(input: { channelId: $channelId, shippingMethodIds: $shippingMethodIds }) {
      id
      code
      description
    }
  }
`

// GraphQL query to fetch all payment methods
const GET_PAYMENT_METHODS_QUERY = gql`
  query GetAllPaymentMethods($options: PaymentMethodListOptions) {
    paymentMethods(options: $options) {
      totalItems
      items {
        id
        name
        code
        enabled
      }
    }
  }
`

// GraphQL mutation to assign payment methods to channel
const ASSIGN_PAYMENT_METHODS_MUTATION = gql`
  mutation AssignPaymentMethodsToChannel($channelId: ID!, $paymentMethodIds: [ID!]!) {
    assignPaymentMethodsToChannel(input: { channelId: $channelId, paymentMethodIds: $paymentMethodIds }) {
      id
      code
      name
    }
  }
`

// GraphQL query to fetch all products (just IDs)
const GET_ALL_PRODUCTS_QUERY = gql`
  query GetAllProducts {
    products(options: { take: 1000 }) {
      items {
        id
      }
    }
  }
`

// GraphQL mutation to assign products to channel
const ASSIGN_PRODUCTS_MUTATION = gql`
  mutation AssignProductsToChannel($input: AssignProductsToChannelInput!) {
    assignProductsToChannel(input: $input) {
      id
      name
      slug
    }
  }
`

// GraphQL query to fetch all stock locations
const GET_ALL_STOCK_LOCATIONS_QUERY = gql`
  query GetAllStockLocationsWithChannels($options: StockLocationListOptions) {
    stockLocations(options: $options) {
      totalItems
      items {
        id
        name
        description
      }
    }
  }
`

// GraphQL mutation to create a stock location
const CREATE_STOCK_LOCATION_MUTATION = gql`
  mutation CreateStockLocation($input: CreateStockLocationInput!) {
    createStockLocation(input: $input) {
      id
      name
      description
    }
  }
`

// GraphQL mutation to assign stock locations to a channel
const ASSIGN_STOCK_LOCATIONS_TO_CHANNEL_MUTATION = gql`
  mutation AssignStockLocationsToChannel($input: AssignStockLocationsToChannelInput!) {
    assignStockLocationsToChannel(input: $input) {
      id
    }
  }
`

// GraphQL query to fetch all product variants
const GET_ALL_PRODUCT_VARIANTS_QUERY = gql`
  query GetAllProductVariants($options: ProductVariantListOptions) {
    productVariants(options: $options) {
      totalItems
      items {
        id
        sku
      }
    }
  }
`

// GraphQL mutation to update variant stock levels in bulk
const UPDATE_VARIANT_STOCK_MUTATION = gql`
  mutation UpdateVariantStock($input: [UpdateProductVariantInput!]!) {
    updateProductVariants(input: $input) {
      id
      name
      stockLevels {
        stockLocation {
          id
          name
        }
        stockOnHand
      }
    }
  }
`

// Fetch channels and automatically set default channel as source
const fetchChannels = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.query({
      query: GET_CHANNELS_QUERY,
      fetchPolicy: 'network-only'
    })
    
    if (result.data && result.data.channels && result.data.channels.items) {
      channels.value = result.data.channels.items
      
      // Set the default channel as source (assuming it's the first one or has code 'default')
      const defaultChannel = channels.value.find(channel => channel.code === 'default' || channel.code.toLowerCase().includes('default')) || channels.value[0]
      selectedSourceChannel.value = defaultChannel
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Fetch all collections
const fetchCollections = async () => {
  loadingCollections.value = true
  error.value = ''
  
  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.query({
      query: GET_COLLECTIONS_QUERY,
      fetchPolicy: 'network-only'
    })
    
    if (result.data && result.data.collections && result.data.collections.items) {
      collections.value = result.data.collections.items
      return result.data.collections.items
    }
    return []
  } catch (err) {
    error.value = err.message
    return []
  } finally {
    loadingCollections.value = false
  }
}

// Fetch all facets
const fetchFacets = async () => {
  loadingFacets.value = true
  error.value = ''
  
  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.query({
      query: GET_FACETS_QUERY,
      variables: {
        options: {
          take: 1000,
          skip: 0
        }
      },
      fetchPolicy: 'network-only'
    })
    
    if (result.data && result.data.facets && result.data.facets.items) {
      facets.value = result.data.facets.items
      return result.data.facets.items
    }
    return []
  } catch (err) {
    error.value = err.message
    return []
  } finally {
    loadingFacets.value = false
  }
}

// Fetch all shipping methods
const fetchShippingMethods = async () => {
  loadingShipping.value = true
  error.value = ''
  
  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.query({
      query: GET_SHIPPING_METHODS_QUERY,
      variables: {
        options: {
          take: 1000,
          skip: 0
        }
      },
      fetchPolicy: 'network-only'
    })
    
    if (result.data && result.data.shippingMethods && result.data.shippingMethods.items) {
      shippingMethods.value = result.data.shippingMethods.items
      return result.data.shippingMethods.items
    }
    return []
  } catch (err) {
    error.value = err.message
    return []
  } finally {
    loadingShipping.value = false
  }
}

// Fetch all payment methods
const fetchPaymentMethods = async () => {
  loadingPayments.value = true
  error.value = ''
  
  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.query({
      query: GET_PAYMENT_METHODS_QUERY,
      variables: {
        options: {
          take: 1000,
          skip: 0
        }
      },
      fetchPolicy: 'network-only'
    })
    
    if (result.data && result.data.paymentMethods && result.data.paymentMethods.items) {
      paymentMethods.value = result.data.paymentMethods.items
      return result.data.paymentMethods.items
    }
    return []
  } catch (err) {
    error.value = err.message
    return []
  } finally {
    loadingPayments.value = false
  }
}

// Fetch all products (just IDs)
const fetchAllProducts = async () => {
  loadingProducts.value = true
  error.value = ''
  
  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.query({
      query: GET_ALL_PRODUCTS_QUERY,
      fetchPolicy: 'network-only'
    })
    
    if (result.data && result.data.products && result.data.products.items) {
      products.value = result.data.products.items
      return result.data.products.items
    }
    return []
  } catch (err) {
    error.value = err.message
    return []
  } finally {
    loadingProducts.value = false
  }
}

// Fetch all stock locations
const fetchStockLocations = async () => {
  loadingStockLocations.value = true
  error.value = ''
  
  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.query({
      query: GET_ALL_STOCK_LOCATIONS_QUERY,
      variables: {
        options: {
          take: 1000,
          skip: 0
        }
      },
      fetchPolicy: 'network-only'
    })
    
    if (result.data && result.data.stockLocations && result.data.stockLocations.items) {
      stockLocations.value = result.data.stockLocations.items
      return result.data.stockLocations.items
    }
    return []
  } catch (err) {
    error.value = err.message
    return []
  } finally {
    loadingStockLocations.value = false
  }
}

// Fetch all product variants
const fetchAllProductVariants = async () => {
  loadingVariants.value = true
  error.value = ''
  
  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.query({
      query: GET_ALL_PRODUCT_VARIANTS_QUERY,
      variables: {
        options: {
          take: 1000,
          skip: 0
        }
      },
      fetchPolicy: 'network-only'
    })
    
    if (result.data && result.data.productVariants && result.data.productVariants.items) {
      productVariants.value = result.data.productVariants.items
      return result.data.productVariants.items
    }
    return []
  } catch (err) {
    error.value = err.message
    return []
  } finally {
    loadingVariants.value = false
  }
}

// Copy collections from source channel to destination channel
const copyCollections = async () => {
  if (!selectedSourceChannel.value || !selectedDestinationChannel.value) {
    error.value = 'Please select both source and destination channels'
    return
  }
  
  // Prevent copying to the same channel
  if (selectedSourceChannel.value.id === selectedDestinationChannel.value.id) {
    error.value = 'Source and destination channels cannot be the same'
    return
  }
  
  isCopying.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    console.log('Copying collections from channel:', selectedSourceChannel.value.id, 'to channel:', selectedDestinationChannel.value.id)
    
    // Step 1: Fetch all collections
    const allCollections = await fetchCollections()
    
    if (allCollections.length === 0) {
      throw new Error('No collections found to copy')
    }
    
    // Step 2: Extract collection IDs
    const collectionIds = allCollections.map(collection => collection.id)
    console.log('Found', collectionIds.length, 'collections to copy:', collectionIds)
    
    // Step 3: Assign collections to destination channel
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.mutate({
      mutation: ASSIGN_COLLECTIONS_MUTATION,
      variables: {
        channelId: selectedDestinationChannel.value.id,
        collectionIds: collectionIds
      }
    })
    
    if (result.data && result.data.assignCollectionsToChannel) {
      successMessage.value = `Successfully assigned ${result.data.assignCollectionsToChannel.length} collections to ${selectedDestinationChannel.value.code}`
      isSuccessModalVisible.value = true
      console.log('Successfully assigned collections:', result.data.assignCollectionsToChannel)
    } else {
      throw new Error('Failed to assign collections')
    }
  } catch (err) {
    console.error('Error copying collections:', err)
    error.value = err.message
  } finally {
    isCopying.value = false
  }
}

// Copy facets from source channel to destination channel
const copyFacets = async () => {
  if (!selectedSourceChannel.value || !selectedDestinationChannel.value) {
    error.value = 'Please select both source and destination channels'
    return
  }
  
  // Prevent copying to the same channel
  if (selectedSourceChannel.value.id === selectedDestinationChannel.value.id) {
    error.value = 'Source and destination channels cannot be the same'
    return
  }
  
  isCopyingFacets.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    console.log('Copying facets from channel:', selectedSourceChannel.value.id, 'to channel:', selectedDestinationChannel.value.id)
    
    // Step 1: Fetch all facets
    const allFacets = await fetchFacets()
    
    if (allFacets.length === 0) {
      throw new Error('No facets found to copy')
    }
    
    // Step 2: Extract facet IDs
    const facetIds = allFacets.map(facet => facet.id)
    console.log('Found', facetIds.length, 'facets to copy:', facetIds)
    
    // Step 3: Assign facets to destination channel
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.mutate({
      mutation: ASSIGN_FACETS_MUTATION,
      variables: {
        channelId: selectedDestinationChannel.value.id,
        facetIds: facetIds
      }
    })
    
    if (result.data && result.data.assignFacetsToChannel) {
      successMessage.value = `Successfully assigned ${result.data.assignFacetsToChannel.length} facets to ${selectedDestinationChannel.value.code}`
      isSuccessModalVisible.value = true
      console.log('Successfully assigned facets:', result.data.assignFacetsToChannel)
    } else {
      throw new Error('Failed to assign facets')
    }
  } catch (err) {
    console.error('Error copying facets:', err)
    error.value = err.message
  } finally {
    isCopyingFacets.value = false
  }
}

// Copy shipping methods from source channel to destination channel
const copyShippingMethods = async () => {
  if (!selectedSourceChannel.value || !selectedDestinationChannel.value) {
    error.value = 'Please select both source and destination channels'
    return
  }
  
  // Prevent copying to the same channel
  if (selectedSourceChannel.value.id === selectedDestinationChannel.value.id) {
    error.value = 'Source and destination channels cannot be the same'
    return
  }
  
  isCopyingShipping.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    console.log('Copying shipping methods from channel:', selectedSourceChannel.value.id, 'to channel:', selectedDestinationChannel.value.id)
    
    // Step 1: Fetch all shipping methods
    const allShippingMethods = await fetchShippingMethods()
    
    if (allShippingMethods.length === 0) {
      throw new Error('No shipping methods found to copy')
    }
    
    // Step 2: Extract shipping method IDs
    const shippingMethodIds = allShippingMethods.map(method => method.id)
    console.log('Found', shippingMethodIds.length, 'shipping methods to copy:', shippingMethodIds)
    
    // Step 3: Assign shipping methods to destination channel
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.mutate({
      mutation: ASSIGN_SHIPPING_METHODS_MUTATION,
      variables: {
        channelId: selectedDestinationChannel.value.id,
        shippingMethodIds: shippingMethodIds
      }
    })
    
    if (result.data && result.data.assignShippingMethodsToChannel) {
      successMessage.value = `Successfully assigned ${result.data.assignShippingMethodsToChannel.length} shipping methods to ${selectedDestinationChannel.value.code}`
      isSuccessModalVisible.value = true
      console.log('Successfully assigned shipping methods:', result.data.assignShippingMethodsToChannel)
    } else {
      throw new Error('Failed to assign shipping methods')
    }
  } catch (err) {
    console.error('Error copying shipping methods:', err)
    error.value = err.message
  } finally {
    isCopyingShipping.value = false
  }
}

// Copy payment methods from source channel to destination channel
const copyPaymentMethods = async () => {
  if (!selectedSourceChannel.value || !selectedDestinationChannel.value) {
    error.value = 'Please select both source and destination channels'
    return
  }
  
  // Prevent copying to the same channel
  if (selectedSourceChannel.value.id === selectedDestinationChannel.value.id) {
    error.value = 'Source and destination channels cannot be the same'
    return
  }
  
  isCopyingPayments.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    console.log('Copying payment methods from channel:', selectedSourceChannel.value.id, 'to channel:', selectedDestinationChannel.value.id)
    
    // Step 1: Fetch all payment methods
    const allPaymentMethods = await fetchPaymentMethods()
    
    if (allPaymentMethods.length === 0) {
      throw new Error('No payment methods found to copy')
    }
    
    // Step 2: Extract payment method IDs
    const paymentMethodIds = allPaymentMethods.map(method => method.id)
    console.log('Found', paymentMethodIds.length, 'payment methods to copy:', paymentMethodIds)
    
    // Step 3: Assign payment methods to destination channel
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.mutate({
      mutation: ASSIGN_PAYMENT_METHODS_MUTATION,
      variables: {
        channelId: selectedDestinationChannel.value.id,
        paymentMethodIds: paymentMethodIds
      }
    })
    
    if (result.data && result.data.assignPaymentMethodsToChannel) {
      successMessage.value = `Successfully assigned ${result.data.assignPaymentMethodsToChannel.length} payment methods to ${selectedDestinationChannel.value.code}`
      isSuccessModalVisible.value = true
      console.log('Successfully assigned payment methods:', result.data.assignPaymentMethodsToChannel)
    } else {
      throw new Error('Failed to assign payment methods')
    }
  } catch (err) {
    console.error('Error copying payment methods:', err)
    error.value = err.message
  } finally {
    isCopyingPayments.value = false
  }
}

// Show price factor modal
const copyAllProducts = () => {
  if (!selectedSourceChannel.value || !selectedDestinationChannel.value) {
    error.value = 'Please select both source and destination channels'
    return
  }
  
  // Prevent copying to the same channel
  if (selectedSourceChannel.value.id === selectedDestinationChannel.value.id) {
    error.value = 'Source and destination channels cannot be the same'
    return
  }
  
  // Reset price factor to default
  priceFactorValue.value = 1
  // Show the modal
  isPriceFactorModalVisible.value = true
}

// Copy all products from source channel to destination channel with price factor
const copyAllProductsWithPriceFactor = async () => {
  if (!selectedSourceChannel.value || !selectedDestinationChannel.value) {
    error.value = 'Please select both source and destination channels'
    return
  }
  
  // Prevent copying to the same channel
  if (selectedSourceChannel.value.id === selectedDestinationChannel.value.id) {
    error.value = 'Source and destination channels cannot be the same'
    return
  }
  
  // Validate price factor is a positive number
  const priceFactor = parseFloat(priceFactorValue.value)
  if (isNaN(priceFactor) || priceFactor <= 0) {
    error.value = 'Please enter a valid positive number for price factor'
    return
  }
  
  isCopyingProducts.value = true
  error.value = ''
  successMessage.value = ''
  isPriceFactorModalVisible.value = false
  
  try {
    console.log('Copying products from channel:', selectedSourceChannel.value.id, 'to channel:', selectedDestinationChannel.value.id, 'with price factor:', priceFactor)
    
    // Step 1: Fetch all products
    const allProducts = await fetchAllProducts()
    
    if (allProducts.length === 0) {
      throw new Error('No products found to copy')
    }
    
    // Step 2: Extract product IDs
    const productIds = allProducts.map(product => product.id)
    console.log('Found', productIds.length, 'products to copy:', productIds)
    
    // Step 3: Assign products to destination channel with price factor
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.mutate({
      mutation: ASSIGN_PRODUCTS_MUTATION,
      variables: {
        input: {
          channelId: selectedDestinationChannel.value.id,
          productIds: productIds,
          priceFactor: priceFactor
        }
      }
    })
    
    if (result.data && result.data.assignProductsToChannel) {
      successMessage.value = `Successfully assigned ${result.data.assignProductsToChannel.length} products to ${selectedDestinationChannel.value.code} with price factor ${priceFactor}`
      isSuccessModalVisible.value = true
      console.log('Successfully assigned products:', result.data.assignProductsToChannel)
    } else {
      throw new Error('Failed to assign products')
    }
  } catch (err) {
    console.error('Error copying products:', err)
    error.value = err.message
  } finally {
    isCopyingProducts.value = false
  }
}

// Create new stock location
const createStockLocation = async () => {
  // Validate form inputs
  stockLocationNameError.value = ''
  
  if (!newStockLocationName.value.trim()) {
    stockLocationNameError.value = 'Stock location name is required'
    return
  }
  
  isCreatingStockLocation.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    console.log('Creating new stock location:', newStockLocationName.value)
    
    // Create the stock location
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.mutate({
      mutation: CREATE_STOCK_LOCATION_MUTATION,
      variables: {
        input: {
          name: newStockLocationName.value.trim(),
          description: newStockLocationDescription.value.trim()
        }
      }
    })
    
    if (result.data && result.data.createStockLocation) {
      // Reset form
      newStockLocationName.value = ''
      newStockLocationDescription.value = ''
      
      // Refresh stock locations list
      await fetchStockLocations()
      
      successMessage.value = `Successfully created stock location: ${result.data.createStockLocation.name}`
      isSuccessModalVisible.value = true
      console.log('Successfully created stock location:', result.data.createStockLocation)
    } else {
      throw new Error('Failed to create stock location')
    }
  } catch (err) {
    console.error('Error creating stock location:', err)
    error.value = err.message
  } finally {
    isCreatingStockLocation.value = false
  }
}

// Assign stock location to channel
const assignStockLocationToChannel = async () => {
  if (!selectedChannelForAssignment.value || !selectedStockLocationForAssignment.value) {
    error.value = 'Please select both a channel and a stock location'
    return
  }
  
  isAssigningStockLocation.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    console.log('Assigning stock location:', selectedStockLocationForAssignment.value.id, 'to channel:', selectedChannelForAssignment.value.id)
    
    // Assign the stock location to the channel
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.mutate({
      mutation: ASSIGN_STOCK_LOCATIONS_TO_CHANNEL_MUTATION,
      variables: {
        input: {
          channelId: selectedChannelForAssignment.value.id,
          stockLocationIds: [selectedStockLocationForAssignment.value.id]
        }
      }
    })
    
    if (result.data && result.data.assignStockLocationsToChannel) {
      successMessage.value = `Successfully assigned stock location "${selectedStockLocationForAssignment.value.name}" to channel "${selectedChannelForAssignment.value.code}"`
      isSuccessModalVisible.value = true
      console.log('Successfully assigned stock location to channel:', result.data.assignStockLocationsToChannel)
      
      // Clear selections
      selectedChannelForAssignment.value = null
      selectedStockLocationForAssignment.value = null
    } else {
      throw new Error('Failed to assign stock location to channel')
    }
  } catch (err) {
    console.error('Error assigning stock location to channel:', err)
    error.value = err.message
  } finally {
    isAssigningStockLocation.value = false
  }
}

// Close success modal
const closeSuccessModal = () => {
  isSuccessModalVisible.value = false
  successMessage.value = ''
}

// Set stock level in bulk for all product variants
const setStockLevelInBulk = async () => {
  if (!selectedStockLocationForStockLevel.value || !stockLevelValue.value) {
    error.value = 'Please select a stock location and enter a stock level'
    return
  }
  
  isUpdatingStockLevels.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    console.log('Setting stock level:', stockLevelValue.value, 'for all variants at location:', selectedStockLocationForStockLevel.value.id)
    
    // Step 1: Fetch all product variants if not already fetched
    if (productVariants.value.length === 0) {
      await fetchAllProductVariants()
    }
    
    if (productVariants.value.length === 0) {
      throw new Error('No product variants found to update')
    }
    
    // Step 2: Create input array for the mutation
    const stockLevel = parseInt(stockLevelValue.value)
    const inputArray = productVariants.value.map(variant => ({
      id: variant.id,
      stockLevels: [
        {
          stockLocationId: selectedStockLocationForStockLevel.value.id,
          stockOnHand: stockLevel
        }
      ]
    }))
    
    console.log('Prepared input for', inputArray.length, 'variants')
    
    // Step 3: Update stock levels for all variants
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.mutate({
      mutation: UPDATE_VARIANT_STOCK_MUTATION,
      variables: {
        input: inputArray
      }
    })
    
    if (result.data && result.data.updateProductVariants) {
      successMessage.value = `Successfully updated stock levels for ${result.data.updateProductVariants.length} product variants at "${selectedStockLocationForStockLevel.value.name}" to ${stockLevel}`
      isSuccessModalVisible.value = true
      console.log('Successfully updated stock levels:', result.data.updateProductVariants.length, 'variants')
      
      // Clear selections
      selectedStockLocationForStockLevel.value = null
      stockLevelValue.value = ''
    } else {
      throw new Error('Failed to update stock levels')
    }
  } catch (err) {
    console.error('Error updating stock levels:', err)
    error.value = err.message
  } finally {
    isUpdatingStockLevels.value = false
  }
}

// Reset form
const resetForm = () => {
  selectedSourceChannel.value = null
  selectedDestinationChannel.value = null
}

// Fetch channels and stock locations on mount
onMounted(async () => {
  await fetchChannels()
  await fetchStockLocations()
})
</script>

<style scoped>
.channel-clone-page {
  margin-top: 2rem;
}
</style>
