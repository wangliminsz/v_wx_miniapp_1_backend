<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">

      <div class="flex justify-start gap-10">

        <div>
          <h1 class="text-2xl font-bold text-white">Manage Variants</h1>
          <p class="text-gray-400 mt-1">{{ product?.name || 'Loading...' }}</p>
          <div class="flex flex-wrap gap-2 mt-3">
            <span v-for="channel in product?.channels" :key="channel.id"
              class="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded-full border border-blue-700">
              {{ channel.code }}
            </span>
          </div>
        </div>

        <div>
          <button @click="$router.back()" class="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600">
            Back
          </button>
        </div>

      </div>

      <div>

        <button @click="saveVariant" :disabled="isSaving || !selectedVariant"
          class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {{ isSaving ? 'Saving...' : 'Update' }}
        </button>

      </div>

    </div>

    <!-- Error message tooltip -->
    <div v-if="error"
      class="fixed top-4 right-4 z-50 bg-red-900/90 border border-red-500 text-red-400 p-4 rounded-md shadow-lg animate-fadeIn">
      <div class="flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm">{{ error }}</p>
      </div>
    </div>

    <!-- Success message tooltip -->
    <div v-if="successMessage"
      class="fixed top-4 right-4 z-50 bg-green-900/90 border border-green-500 text-green-400 p-4 rounded-md shadow-lg animate-fadeIn">
      <div class="flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <p class="text-sm">{{ successMessage }}</p>
      </div>
    </div>

    <div v-if="loading" class="text-center py-10 text-gray-400">Loading variants...</div>
    <div v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Variant List -->
        <div class="lg:col-span-1">
          <h2 class="text-lg font-semibold text-white mb-4">Variants</h2>
          <div class="space-y-2">
            <div v-for="variant in variants" :key="variant.id" @click="selectVariant(variant)" :class="[
              'p-4 rounded-md border cursor-pointer transition-colors',
              selectedVariant?.id === variant.id
                ? 'bg-blue-900/30 border-blue-500'
                : 'bg-dark-200 border-dark-100 hover:bg-dark-300'
            ]">
              <div class="text-white font-medium">{{ variant.name || 'Unnamed Variant' }}</div>
              <div class="text-sm text-gray-400">SKU: {{ variant.sku }}</div>
            </div>
          </div>
        </div>

        <!-- Variant Details -->
        <div class="lg:col-span-2">
          <div v-if="selectedVariant" class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-white">Variant Details</h2>

            </div>

            <div class="bg-dark-200 rounded-md p-4 border border-dark-100">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm text-gray-300 mb-1">Variant name</label>
                  <input v-model="variantForm.name" type="text" disabled
                    class="w-full px-3 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-blue-500" />
                </div>
                <!-- <div>
                  <label class="block text-sm text-gray-300 mb-1">SKU</label>
                  <input v-model="variantForm.sku" type="text"
                    class="w-full px-3 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-blue-500" />
                </div> -->
              </div>
            </div>

            <!-- <div class="bg-dark-200 rounded-md p-4 border border-dark-100">
              <div class="flex items-center justify-between">
                <div>
                  <label class="block text-sm font-medium text-white mb-1">Enabled</label>
                  <p class="text-xs text-gray-400">When enabled, this product is available in the store</p>
                </div>
                <button @click="variantForm.enabled = !variantForm.enabled" :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                  variantForm.enabled ? 'bg-blue-600' : 'bg-gray-600'
                ]">
                  <span :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    variantForm.enabled ? 'translate-x-6' : 'translate-x-1'
                  ]" />
                </button>
              </div>
            </div> -->

            <div class="bg-dark-200 rounded-md p-4 border border-dark-100">
              <h3 class="text-md font-medium text-white mb-3">Price</h3>
              <div class="flex items-center gap-2">
                <span class="text-gray-400">{{ currencyCode }}</span>
                <input v-model.number="variantForm.price" type="number" step="0.01"
                  class="flex-1 px-3 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div class="bg-dark-200 rounded-md p-4 border border-dark-100">
              <h3 class="text-md font-medium text-white mb-3">Assets</h3>
              <div class="flex flex-wrap gap-2 mb-3">
                <div
                  v-for="asset in variantForm.featuredAsset ? [variantForm.featuredAsset, ...(variantForm.assets?.filter(a => a.id !== variantForm.featuredAsset?.id) || [])] : (variantForm.assets || [])"
                  :key="asset.id" class="group relative w-20 h-20 bg-dark-300 rounded-md overflow-hidden">
                  <img 
                    v-if="getAssetUrl(asset.preview)"
                    :src="getAssetUrl(asset.preview)" 
                    :alt="asset.name" 
                    class="w-full h-full object-cover" 
                    @error="(e) => {
                      console.log('Image failed to load, replacing with inline SVG');
                      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                      svg.setAttribute('width', '80');
                      svg.setAttribute('height', '80');
                      svg.setAttribute('viewBox', '0 0 80 80');
                      svg.classList.add('w-full', 'h-full', 'object-cover');
                      
                      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                      rect.setAttribute('width', '80');
                      rect.setAttribute('height', '80');
                      rect.setAttribute('fill', '#1f2937');
                      svg.appendChild(rect);
                      
                      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                      text.setAttribute('x', '50%');
                      text.setAttribute('y', '50%');
                      text.setAttribute('text-anchor', 'middle');
                      text.setAttribute('dominant-baseline', 'middle');
                      text.setAttribute('fill', '#9ca3af');
                      text.setAttribute('font-size', '12');
                      text.textContent = 'No Image';
                      svg.appendChild(text);
                      
                      e.target.parentNode.replaceChild(svg, e.target);
                    }" 
                  />
                  <svg 
                    v-else
                    width="80" height="80" viewBox="0 0 80 80"
                    class="w-full h-full object-cover"
                  >
                    <rect width="80" height="80" fill="#1f2937" />
                    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#9ca3af" font-size="12">
                      No Image
                    </text>
                  </svg>
                  <div
                    class="absolute inset-0 bg-dark-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2">
                    <button 
                      v-if="variantForm.featuredAsset?.id !== asset.id"
                      @click="setFeaturedAsset(asset)" 
                      class="text-white hover:text-green-400"
                      title="Set as Featured">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                    <button @click="removeAsset(asset.id)" class="text-white hover:text-red-400" title="Remove">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div v-if="variantForm.featuredAsset?.id === asset.id" class="absolute top-1 right-1">
                    <span class="text-xs bg-green-500 text-white px-1 rounded">Featured</span>
                  </div>
                </div>
              </div>
              <button @click="openAssetSelector('add')"
                class="px-4 py-2 bg-gray-700 text-white rounded-md text-sm hover:bg-gray-600">
                + Add Assets
              </button>
            </div>

            <div class="bg-dark-200 rounded-md p-4 border border-dark-100">
              <h3 class="text-md font-medium text-white mb-3">Facet Values</h3>
              <div class="flex flex-wrap gap-2 mb-3">
                <span v-for="facetValue in variantForm.facetValues" :key="facetValue.id"
                  class="text-xs bg-dark-300 text-gray-300 px-2 py-1 rounded-full flex items-center gap-1">
                  {{ facetValue.name }} in {{ facetValue.facet?.name || 'Unknown' }}
                  <button @click="removeFacetValue(facetValue.id)" class="text-gray-500 hover:text-red-400">×</button>
                </span>
              </div>
              <button @click="showFacetSelector = true"
                class="px-4 py-2 bg-gray-700 text-white rounded-md text-sm hover:bg-gray-600">
                + Add Facet Values
              </button>
            </div>
          </div>
          <div v-else class="text-center py-10 text-gray-400">
            <p>Select a variant to view details</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Asset Selector -->
    <Teleport to="body">
      <Transition name="modal">
        <AssetSelector v-if="showAssetSelector"
              :title="assetSelectorMode === 'add' ? 'Select Assets' : 'Set Featured Asset'"
              :model-value="tempSelectedAssetIds" :select-multiple="assetSelectorMode === 'add'"
              :emit-full-assets="true"
              @confirm="updateVariantAssets" @close="closeAssetSelector" />
      </Transition>
    </Teleport>

    <!-- Facet Selector -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showFacetSelector" class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div class="bg-dark-200 rounded-lg p-6 max-w-md w-full mx-4 border border-dark-100">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-white">Add Facet Values</h3>
              <button @click="showFacetSelector = false" class="text-gray-400 hover:text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="max-h-80 overflow-y-auto space-y-4">
              <div v-for="facet in facets" :key="facet.id">
                <h4 class="text-sm text-gray-400 font-medium mb-2">{{ facet.name }}</h4>
                <div class="flex flex-wrap gap-2">
                  <button v-for="value in facet.values" :key="value.id" @click="toggleFacetValue(value)" :class="[
                    'px-3 py-1 text-xs rounded-full transition-colors',
                    isFacetValueSelected(value.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-dark-300 text-gray-300 hover:bg-dark-100'
                  ]">
                    {{ value.name }}
                  </button>
                </div>
              </div>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button @click="showFacetSelector = false"
                class="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600">
                Cancel
              </button>
              <button @click="confirmFacetSelection"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500">
                Confirm
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { useAuthStore } from '../stores/auth'
import AssetSelector from '../components/AssetSelector.vue'
import { getChannelTokenFromQuery } from '../utils/channelToken.js'

const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref('')
const product = ref(null)
const variants = ref([])
const selectedVariant = ref(null)
const facets = ref([])
const allAssets = ref([])
const isSaving = ref(false)
const currencyCode = ref('')
const defaultLanguageCode = ref('en')
const successMessage = ref('')

// Auto-dismiss success messages after 3 seconds
const autoDismissSuccess = () => {
  if (successMessage.value) {
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  }
}

watch(successMessage, autoDismissSuccess)

// Form state
const variantForm = ref({
  id: null,
  name: '',
  enabled: true,
  sku: '',
  price: 0,
  assets: [],
  featuredAsset: null,
  facetValues: [],
  translations: []
})

// Asset selector
const showAssetSelector = ref(false)
const assetSelectorMode = ref('add')
const tempSelectedAssetIds = ref([])

// Facet selector
const showFacetSelector = ref(false)
const tempSelectedFacetValueIds = ref([])

let apolloClient = null

const createApolloClient = (authToken, channelToken = null) => {
  const httpLink = createHttpLink({
    uri: import.meta.env.VITE_VENDURE_ADMIN_API_URL,
    fetchOptions: { credentials: 'include' }
  })

  const authLink = setContext((_, { headers }) => {
    const requestHeaders = {
      ...headers,
      authorization: authToken ? `Bearer ${authToken}` : ''
    }
    if (channelToken) {
      requestHeaders['vendure-token'] = channelToken
    }
    return { headers: requestHeaders }
  })

  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache()
  })
}

const GET_PRODUCT_QUERY = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      name
      channels {
        id
        code
        token
      }
      variants {
        id
        name
        enabled
        sku
        price
        translations {
          id
          languageCode
          name
        }
        featuredAsset {
          id
          preview
          name
        }
        assets {
          id
          preview
          name
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
      id
      code
      currencyCode
      defaultLanguageCode
    }
  }
`

const LIST_ASSETS_QUERY = gql`
  query ListAssets($options: AssetListOptions) {
    assets(options: $options) {
      items {
        id
        name
        preview
      }
    }
  }
`

const UPDATE_VARIANT_MUTATION = gql`
  mutation UpdateProductVariant($input: UpdateProductVariantInput!) {
    updateProductVariant(input: $input) {
      id
      name
      enabled
      sku
      price
      translations {
        id
        languageCode
        name
      }
      featuredAsset {
        id
        preview
        name
      }
      assets {
        id
        preview
        name
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

const fetchProduct = async () => {
  loading.value = true
  error.value = ''
  try {
    const channelToken = getChannelTokenFromQuery() || (authStore.activeChannel ? authStore.activeChannel.token : null)
    apolloClient = createApolloClient(authStore.token, channelToken)
    // Create Apollo client without channel token to get ALL channels!
    const apolloClientNoChannel = createApolloClient(authStore.token, null)

    const [productResult, assetsResult] = await Promise.all([
      apolloClientNoChannel.query({
        query: GET_PRODUCT_QUERY,
        variables: { id: route.params.productId },
        fetchPolicy: 'network-only'
      }),
      apolloClient.query({
        query: LIST_ASSETS_QUERY,
        variables: { options: { take: 1000, skip: 0 } },
        fetchPolicy: 'network-only'
      })
    ])

    if (productResult.data?.product) {
      product.value = JSON.parse(JSON.stringify(productResult.data.product))
      variants.value = [...(productResult.data.product.variants || [])]
      
      // Auto-select the first variant
      if (variants.value.length > 0) {
        selectVariant(variants.value[0])
      }
    }
    if (productResult.data?.facets?.items) {
      facets.value = JSON.parse(JSON.stringify(productResult.data.facets.items))
    }
    if (productResult.data?.activeChannel?.currencyCode) {
      currencyCode.value = productResult.data.activeChannel.currencyCode
    }
    if (productResult.data?.activeChannel?.defaultLanguageCode) {
      defaultLanguageCode.value = productResult.data.activeChannel.defaultLanguageCode
    }
    if (assetsResult.data?.assets?.items) {
      allAssets.value = JSON.parse(JSON.stringify(assetsResult.data.assets.items))
    }
  } catch (err) {
    console.error(err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const selectVariant = (variant) => {
  selectedVariant.value = variant
  // Find the name in the default language
  let name = variant.name || ''
  const defaultTrans = variant.translations?.find(t => t.languageCode === defaultLanguageCode.value)
  if (defaultTrans?.name) {
    name = defaultTrans.name
  }
  // Clean up the data, removing __typename fields
  const cleanVariant = JSON.parse(JSON.stringify(variant))
  const cleanTranslations = (cleanVariant.translations || []).map(t => {
    const { __typename, ...rest } = t
    return rest
  })
  // Convert price from cents to dollars for display
  const displayPrice = cleanVariant.price ? (cleanVariant.price / 100).toFixed(2) : '0.00'
  
  variantForm.value = {
    id: cleanVariant.id,
    name: name,
    enabled: cleanVariant.enabled !== false,
    sku: cleanVariant.sku || '',
    price: parseFloat(displayPrice),
    assets: (cleanVariant.assets || []).map(a => {
      const { __typename, ...rest } = a
      return rest
    }),
    featuredAsset: cleanVariant.featuredAsset ? (() => {
      const { __typename, ...rest } = cleanVariant.featuredAsset
      return rest
    })() : null,
    facetValues: (cleanVariant.facetValues || []).map(fv => {
      const { __typename, ...restFv } = fv
      if (restFv.facet) {
        const { __typename: ft, ...restFacet } = restFv.facet
        restFv.facet = restFacet
      }
      return restFv
    }),
    translations: cleanTranslations
  }
}

const getAssetUrl = (preview) => {
  if (!preview || typeof preview !== 'string') return null
  
  // If it's already the placeholder URL, return null to trigger inline SVG
  if (preview.includes('via.placeholder.com')) return null
  
  // Handle case where URL is doubled (e.g., http://example.com/http://example.com/...)
  const vendureUrl = import.meta.env.VITE_VENDURE_URL || ''
  if (preview.startsWith(vendureUrl) && preview.includes(vendureUrl + vendureUrl)) {
    // Extract the last occurrence of the vendure URL and everything after
    const lastIndex = preview.lastIndexOf(vendureUrl)
    return preview.slice(lastIndex)
  }
  
  // Vendure's Asset.preview is already a full URL, return it directly!
  return preview
}

const saveVariant = async () => {
  if (!selectedVariant.value) return
  isSaving.value = true
  error.value = ''
  try {
    // Prepare translations: update or add the default language, and strip __typename!
    let updatedTranslations = (variantForm.value.translations || []).map(t => {
      const { __typename, ...rest } = t
      return rest
    })
    const defaultTransIdx = updatedTranslations.findIndex(t => t.languageCode === defaultLanguageCode.value)
    if (defaultTransIdx !== -1) {
      updatedTranslations[defaultTransIdx] = {
        ...updatedTranslations[defaultTransIdx],
        name: variantForm.value.name
      }
    } else {
      updatedTranslations.push({
        languageCode: defaultLanguageCode.value,
        name: variantForm.value.name
      })
    }

    // Convert price back to cents for Vendure
    const priceInCents = Math.round(variantForm.value.price * 100)
    const result = await apolloClient.mutate({
      mutation: UPDATE_VARIANT_MUTATION,
      variables: {
        input: {
          id: variantForm.value.id,
          enabled: variantForm.value.enabled,
          sku: variantForm.value.sku,
          price: priceInCents,
          translations: updatedTranslations,
          assetIds: variantForm.value.assets?.map(a => a.id) || [],
          featuredAssetId: variantForm.value.featuredAsset?.id || null,
          facetValueIds: variantForm.value.facetValues?.map(fv => fv.id) || []
        }
      }
    })

    if (result.data?.updateProductVariant) {
      // Update the variant in the list - use a new array to avoid mutating frozen Apollo data
      const updatedVariants = variants.value.map(v =>
        v.id === variantForm.value.id ? result.data.updateProductVariant : v
      )
      variants.value = updatedVariants
      selectVariant(result.data.updateProductVariant)
      successMessage.value = 'Successfully updated product variant'
      
      // Re-fetch all assets to get any newly uploaded ones
      const assetsResult = await apolloClient.query({
        query: LIST_ASSETS_QUERY,
        variables: { options: { take: 1000, skip: 0 } },
        fetchPolicy: 'network-only'
      })
      if (assetsResult.data?.assets?.items) {
        allAssets.value = JSON.parse(JSON.stringify(assetsResult.data.assets.items))
      }
    }
  } catch (err) {
    console.error(err)
    error.value = err.message
  } finally {
    isSaving.value = false
  }
}

// Asset management
const openAssetSelector = (mode) => {
  assetSelectorMode.value = mode
  if (mode === 'add') {
    tempSelectedAssetIds.value = variantForm.value.assets?.map(a => a.id) || []
  } else {
    tempSelectedAssetIds.value = variantForm.value.featuredAsset?.id || ''
  }
  showAssetSelector.value = true
}

const closeAssetSelector = () => {
  showAssetSelector.value = false
  tempSelectedAssetIds.value = []
}

const updateVariantAssets = (selectedAssets) => {
  if (assetSelectorMode.value === 'add') {
    variantForm.value.assets = selectedAssets.map(asset => ({
      id: asset.id,
      name: asset.name,
      preview: asset.preview,
      source: asset.source
    }))
  } else {
    variantForm.value.featuredAsset = selectedAssets ? {
      id: selectedAssets.id,
      name: selectedAssets.name,
      preview: selectedAssets.preview,
      source: selectedAssets.source
    } : null
  }
  
  // Also add these assets to allAssets so we have them for next time
  if (Array.isArray(selectedAssets)) {
    selectedAssets.forEach(asset => {
      if (!allAssets.value.find(a => a.id === asset.id)) {
        allAssets.value.push(asset)
      }
    })
  } else if (selectedAssets && !allAssets.value.find(a => a.id === selectedAssets.id)) {
    allAssets.value.push(selectedAssets)
  }
  
  closeAssetSelector()
}

const removeAsset = (assetId) => {
  if (variantForm.value.featuredAsset?.id === assetId) {
    variantForm.value.featuredAsset = null
  }
  variantForm.value.assets = variantForm.value.assets?.filter(a => a.id !== assetId) || []
}

const setFeaturedAsset = (asset) => {
  // If the asset isn't already in the assets list, add it
  if (!variantForm.value.assets?.find(a => a.id === asset.id)) {
    variantForm.value.assets.push(asset)
  }
  variantForm.value.featuredAsset = asset
}

// Facet management
const isFacetValueSelected = (facetValueId) => {
  return variantForm.value.facetValues?.some(fv => fv.id === facetValueId) || tempSelectedFacetValueIds.value.includes(facetValueId)
}

const toggleFacetValue = (facetValue) => {
  if (variantForm.value.facetValues?.some(fv => fv.id === facetValue.id)) {
    // Already selected, do nothing or remove
  } else {
    const idx = tempSelectedFacetValueIds.value.indexOf(facetValue.id)
    if (idx > -1) {
      tempSelectedFacetValueIds.value.splice(idx, 1)
    } else {
      tempSelectedFacetValueIds.value.push(facetValue.id)
    }
  }
}

const confirmFacetSelection = () => {
  // Combine existing facet values with selected ones
  const existingFacetValueIds = new Set(variantForm.value.facetValues?.map(fv => fv.id) || [])
  const newFacetValues = [...(variantForm.value.facetValues || [])]

  // Loop through all facets to find selected values and attach the facet
  for (const facet of facets.value) {
    if (!facet.values) continue
    for (const value of facet.values) {
      if (tempSelectedFacetValueIds.value.includes(value.id) && !existingFacetValueIds.has(value.id)) {
        newFacetValues.push({
          ...value,
          facet: {
            id: facet.id,
            name: facet.name,
            code: facet.code
          }
        })
      }
    }
  }

  variantForm.value.facetValues = newFacetValues
  showFacetSelector.value = false
  tempSelectedFacetValueIds.value = []
}

const removeFacetValue = (facetValueId) => {
  variantForm.value.facetValues = variantForm.value.facetValues?.filter(fv => fv.id !== facetValueId) || []
}

onMounted(() => {
  fetchProduct()
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>