<template>
  <div class="clone-sub-page">
    <h1 class="text-2xl font-semibold text-gray-300 mb-6">Clone Channel</h1>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-10 text-gray-400">Loading...</div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md mb-6">
      <h3 class="font-bold mb-2">An error occurred:</h3>
      <p class="text-sm">{{ error }}</p>
    </div>

    <!-- Main form -->
    <div v-else-if="channels.length > 0">
      <!-- Chinese explanation of what "Clone" means -->
      <!-- <div class="mb-6 bg-dark-200 border border-dark-100 rounded-md p-5 text-sm leading-relaxed text-gray-300">
        <h2 class="text-lg font-bold text-blue-300 mb-3">关于「Clone（克隆 / 复制）」功能说明</h2>
        <p class="mb-3">
          <span class="text-gray-400">本功能用于把一个频道（Channel）的配置和数据「复制」到另一个频道。</span>
        </p>
        <p class="mb-3">
          <span class="font-semibold text-blue-300">Source Channel（源频道）</span>：要复制的频道。系统会读取该频道下的分类、属性、配送方式、支付方式、商品等配置。
        </p>
        <p class="mb-3">
          <span class="font-semibold text-blue-300">Destination Channel（目标频道）</span>：接收复制内容的频道。系统会把源频道下的所有相关数据 <span class="text-yellow-300">关联/分配</span> 到目标频道（并不会删除目标频道原有内容）。
        </p>
        <p class="mb-3">
          <span class="font-semibold text-yellow-300">⚠ 重要：</span>
          <span class="text-gray-300">本功能不是「创建」分类/属性等数据，而是「关联」分类/属性等数据。</span>
          也就是说：源频道下已有的分类（Collection）、属性（Facet）、配送方式（Shipping Method）、支付方式（Payment Method）、商品（Product），
          都会被分配到目标频道，使目标频道也拥有这些数据。源频道与目标频道将共享同一份分类/属性/商品。
        </p>
        <p class="mb-3">
          <span class="font-semibold text-blue-300">与「Clone Channel」的区别：</span>
          <span class="text-gray-300">「Clone Channel」默认以 Default 频道为源，复制<span class="text-yellow-300">全站</span>的内容到目标频道；</span>
          <span class="font-semibold text-blue-300">本功能「Clone Sub」严格按源频道过滤</span>，
          <span class="text-gray-300">只复制<span class="text-yellow-300">源频道 A 实际拥有的</span>分类/属性/配送方式/支付方式/商品到目标频道 B。</span>
        </p>
        <p class="text-gray-400 text-xs">
          建议先备份数据；选择好源和目标后，按需点击下方按钮进行复制。
        </p>
      </div> -->

      <!-- Source / Destination channel selectors -->
      <div class="bg-dark-200 p-6 rounded-md border border-dark-100">
        <div class="mb-6">
          <label for="sourceChannel" class="block text-sm font-medium text-gray-300 mb-2">
            Source Channel (to clone from) - 源频道:
          </label>
          <select
            id="sourceChannel"
            v-model="selectedSourceChannel"
            class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors"
          >
            <option :value="null">Select Source Channel</option>
            <option
              v-for="channel in channels"
              :key="channel.id"
              :value="channel"
            >
              {{ channel.code }} ({{ channel.currencyCode }})
            </option>
          </select>
        </div>

        <div class="mb-6">
          <label for="destinationChannel" class="block text-sm font-medium text-gray-300 mb-2">
            Destination Channel (to clone to) - 目标频道:
          </label>
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
          <button
            @click="copyCollections"
            :disabled="isCopying || !selectedSourceChannel || !selectedDestinationChannel"
            class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isCopying ? 'Copying Collections...' : 'Copy Collections - 复制分类' }}
          </button>

          <button
            @click="copyFacets"
            :disabled="isCopyingFacets || !selectedSourceChannel || !selectedDestinationChannel"
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isCopyingFacets ? 'Copying Facets...' : 'Copy Facets - 复制属性' }}
          </button>

          <button
            @click="copyShippingMethods"
            :disabled="isCopyingShipping || !selectedSourceChannel || !selectedDestinationChannel"
            class="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isCopyingShipping ? 'Copying Shipping...' : 'Copy Shipping Methods - 复制配送方式' }}
          </button>

          <button
            @click="copyPaymentMethods"
            :disabled="isCopyingPayments || !selectedSourceChannel || !selectedDestinationChannel"
            class="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isCopyingPayments ? 'Copying Payments...' : 'Copy Payment Methods - 复制支付方式' }}
          </button>

          <button
            @click="copyAllProducts"
            :disabled="isCopyingProducts || !selectedSourceChannel || !selectedDestinationChannel"
            class="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isCopyingProducts ? 'Copying Products...' : 'Copy All Products - 复制商品' }}
          </button>

          <button
            @click="resetForm"
            class="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
          >
            Reset - 重置
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
        <button @click="closeSuccessModal" class="text-gray-400 hover:text-gray-300 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="text-gray-300 mb-6">{{ successMessage }}</div>
      <div class="flex justify-end">
        <button @click="closeSuccessModal" class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors">
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
        <button @click="isPriceFactorModalVisible = false" class="text-gray-400 hover:text-gray-300 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="mb-6">
        <p class="text-gray-300 mb-4">Please enter the price factor (currency rate) for copying products from
          "{{ selectedSourceChannel?.code }}" to "{{ selectedDestinationChannel?.code }}".</p>
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
        <button @click="isPriceFactorModalVisible = false" class="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">
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
const isSuccessModalVisible = ref(false)
const isPriceFactorModalVisible = ref(false)
const priceFactorValue = ref(1)

// Apollo client factory (same pattern as ChannelClone)
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
  return new ApolloClient({ link: authLink.concat(httpLink), cache: new InMemoryCache() })
}

// GraphQL queries / mutations (identical to ChannelClone)
const GET_CHANNELS_QUERY = gql`
  query GetChannels {
    channels(options: { take: 100 }) {
      items { id code token defaultLanguageCode currencyCode pricesIncludeTax }
    }
  }
`
const GET_COLLECTIONS_QUERY = gql`
  query GetCollections { collections { items { id name slug } totalItems } }
`
const ASSIGN_COLLECTIONS_MUTATION = gql`
  mutation AssignCollectionsToChannel($channelId: ID!, $collectionIds: [ID!]!) {
    assignCollectionsToChannel(input: { channelId: $channelId, collectionIds: $collectionIds }) { id name }
  }
`
const GET_FACETS_QUERY = gql`
  query GetAllFacets($options: FacetListOptions) {
    facets(options: $options) { totalItems items { id name code isPrivate } }
  }
`
const ASSIGN_FACETS_MUTATION = gql`
  mutation AssignFacetsToChannel($channelId: ID!, $facetIds: [ID!]!) {
    assignFacetsToChannel(input: { channelId: $channelId, facetIds: $facetIds }) { id name }
  }
`
const GET_SHIPPING_METHODS_QUERY = gql`
  query GetAllShippingMethods($options: ShippingMethodListOptions) {
    shippingMethods(options: $options) { totalItems items { id code description } }
  }
`
const ASSIGN_SHIPPING_METHODS_MUTATION = gql`
  mutation AssignShippingMethodsToChannel($channelId: ID!, $shippingMethodIds: [ID!]!) {
    assignShippingMethodsToChannel(input: { channelId: $channelId, shippingMethodIds: $shippingMethodIds }) { id code description }
  }
`
const GET_PAYMENT_METHODS_QUERY = gql`
  query GetAllPaymentMethods($options: PaymentMethodListOptions) {
    paymentMethods(options: $options) { totalItems items { id name code enabled } }
  }
`
const ASSIGN_PAYMENT_METHODS_MUTATION = gql`
  mutation AssignPaymentMethodsToChannel($channelId: ID!, $paymentMethodIds: [ID!]!) {
    assignPaymentMethodsToChannel(input: { channelId: $channelId, paymentMethodIds: $paymentMethodIds }) { id code name }
  }
`
const GET_ALL_PRODUCTS_QUERY = gql`
  query GetAllProducts { products(options: { take: 1000 }) { items { id } } }
`
const ASSIGN_PRODUCTS_MUTATION = gql`
  mutation AssignProductsToChannel($input: AssignProductsToChannelInput!) {
    assignProductsToChannel(input: $input) { id name slug }
  }
`

// Fetch channels (no default pre-selection — that's the only difference
// vs ChannelClone)
const fetchChannels = async () => {
  loading.value = true
  error.value = ''
  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.query({ query: GET_CHANNELS_QUERY, fetchPolicy: 'network-only' })
    if (result.data?.channels?.items) channels.value = result.data.channels.items
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const fetchCollections = async () => {
  // Scope the query to the source channel via its vendure-token, so we
  // only copy collections that actually belong to the source channel —
  // not every collection in the database.
  const apolloClient = createApolloClient(
    authStore.token,
    selectedSourceChannel.value?.token || null
  )
  const r = await apolloClient.query({ query: GET_COLLECTIONS_QUERY, fetchPolicy: 'network-only' })
  return r.data?.collections?.items ?? []
}
const fetchFacets = async () => {
  const apolloClient = createApolloClient(
    authStore.token,
    selectedSourceChannel.value?.token || null
  )
  const r = await apolloClient.query({
    query: GET_FACETS_QUERY,
    variables: { options: { take: 1000, skip: 0 } },
    fetchPolicy: 'network-only'
  })
  return r.data?.facets?.items ?? []
}
const fetchShippingMethods = async () => {
  const apolloClient = createApolloClient(
    authStore.token,
    selectedSourceChannel.value?.token || null
  )
  const r = await apolloClient.query({
    query: GET_SHIPPING_METHODS_QUERY,
    variables: { options: { take: 1000, skip: 0 } },
    fetchPolicy: 'network-only'
  })
  return r.data?.shippingMethods?.items ?? []
}
const fetchPaymentMethods = async () => {
  const apolloClient = createApolloClient(
    authStore.token,
    selectedSourceChannel.value?.token || null
  )
  const r = await apolloClient.query({
    query: GET_PAYMENT_METHODS_QUERY,
    variables: { options: { take: 1000, skip: 0 } },
    fetchPolicy: 'network-only'
  })
  return r.data?.paymentMethods?.items ?? []
}
const fetchAllProducts = async () => {
  const apolloClient = createApolloClient(
    authStore.token,
    selectedSourceChannel.value?.token || null
  )
  const r = await apolloClient.query({ query: GET_ALL_PRODUCTS_QUERY, fetchPolicy: 'network-only' })
  return r.data?.products?.items ?? []
}

const checkSelection = () => {
  if (!selectedSourceChannel.value || !selectedDestinationChannel.value) {
    error.value = 'Please select both source and destination channels'
    return false
  }
  if (selectedSourceChannel.value.id === selectedDestinationChannel.value.id) {
    error.value = 'Source and destination channels cannot be the same'
    return false
  }
  return true
}

const copyCollections = async () => {
  if (!checkSelection()) return
  isCopying.value = true
  error.value = ''
  successMessage.value = ''
  try {
    const all = await fetchCollections()
    if (!all.length) throw new Error('No collections found to copy')
    const ids = all.map(c => c.id)
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const r = await apolloClient.mutate({
      mutation: ASSIGN_COLLECTIONS_MUTATION,
      variables: { channelId: selectedDestinationChannel.value.id, collectionIds: ids }
    })
    successMessage.value = `Successfully assigned ${r.data.assignCollectionsToChannel.length} collections to ${selectedDestinationChannel.value.code}`
    isSuccessModalVisible.value = true
  } catch (err) {
    error.value = err.message
  } finally {
    isCopying.value = false
  }
}

const copyFacets = async () => {
  if (!checkSelection()) return
  isCopyingFacets.value = true
  error.value = ''
  successMessage.value = ''
  try {
    const all = await fetchFacets()
    if (!all.length) throw new Error('No facets found to copy')
    const ids = all.map(f => f.id)
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const r = await apolloClient.mutate({
      mutation: ASSIGN_FACETS_MUTATION,
      variables: { channelId: selectedDestinationChannel.value.id, facetIds: ids }
    })
    successMessage.value = `Successfully assigned ${r.data.assignFacetsToChannel.length} facets to ${selectedDestinationChannel.value.code}`
    isSuccessModalVisible.value = true
  } catch (err) {
    error.value = err.message
  } finally {
    isCopyingFacets.value = false
  }
}

const copyShippingMethods = async () => {
  if (!checkSelection()) return
  isCopyingShipping.value = true
  error.value = ''
  successMessage.value = ''
  try {
    const all = await fetchShippingMethods()
    if (!all.length) throw new Error('No shipping methods found to copy')
    const ids = all.map(m => m.id)
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const r = await apolloClient.mutate({
      mutation: ASSIGN_SHIPPING_METHODS_MUTATION,
      variables: { channelId: selectedDestinationChannel.value.id, shippingMethodIds: ids }
    })
    successMessage.value = `Successfully assigned ${r.data.assignShippingMethodsToChannel.length} shipping methods to ${selectedDestinationChannel.value.code}`
    isSuccessModalVisible.value = true
  } catch (err) {
    error.value = err.message
  } finally {
    isCopyingShipping.value = false
  }
}

const copyPaymentMethods = async () => {
  if (!checkSelection()) return
  isCopyingPayments.value = true
  error.value = ''
  successMessage.value = ''
  try {
    const all = await fetchPaymentMethods()
    if (!all.length) throw new Error('No payment methods found to copy')
    const ids = all.map(m => m.id)
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const r = await apolloClient.mutate({
      mutation: ASSIGN_PAYMENT_METHODS_MUTATION,
      variables: { channelId: selectedDestinationChannel.value.id, paymentMethodIds: ids }
    })
    successMessage.value = `Successfully assigned ${r.data.assignPaymentMethodsToChannel.length} payment methods to ${selectedDestinationChannel.value.code}`
    isSuccessModalVisible.value = true
  } catch (err) {
    error.value = err.message
  } finally {
    isCopyingPayments.value = false
  }
}

const copyAllProducts = () => {
  if (!checkSelection()) return
  priceFactorValue.value = 1
  isPriceFactorModalVisible.value = true
}

const copyAllProductsWithPriceFactor = async () => {
  if (!checkSelection()) return
  const pf = parseFloat(priceFactorValue.value)
  if (isNaN(pf) || pf <= 0) {
    error.value = 'Please enter a valid positive number for price factor'
    return
  }
  isCopyingProducts.value = true
  error.value = ''
  successMessage.value = ''
  isPriceFactorModalVisible.value = false
  try {
    const all = await fetchAllProducts()
    if (!all.length) throw new Error('No products found to copy')
    const ids = all.map(p => p.id)
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const r = await apolloClient.mutate({
      mutation: ASSIGN_PRODUCTS_MUTATION,
      variables: { input: { channelId: selectedDestinationChannel.value.id, productIds: ids, priceFactor: pf } }
    })
    successMessage.value = `Successfully assigned ${r.data.assignProductsToChannel.length} products to ${selectedDestinationChannel.value.code} with price factor ${pf}`
    isSuccessModalVisible.value = true
  } catch (err) {
    error.value = err.message
  } finally {
    isCopyingProducts.value = false
  }
}

const closeSuccessModal = () => {
  isSuccessModalVisible.value = false
  successMessage.value = ''
}

const resetForm = () => {
  selectedSourceChannel.value = null
  selectedDestinationChannel.value = null
}

onMounted(() => {
  fetchChannels()
})
</script>

<style scoped>
.clone-sub-page {
  margin-top: 2rem;
}
</style>
