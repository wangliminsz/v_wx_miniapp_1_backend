<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.75);">
    <div class="relative w-full max-w-5xl mx-4 rounded-lg shadow-xl border border-gray-600" style="background-color: #1f2937;">
      <div class="flex items-center justify-between px-6 py-4 border-b border-dark-600">
        <h3 class="text-lg font-semibold text-white">{{ title }}</h3>
        <button @click="close" class="text-gray-400 hover:text-white transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="p-4 border-b border-dark-600">
        <div class="flex items-center gap-4">
          <div class="flex-grow">
            <div class="flex items-center gap-2 bg-dark-100 rounded-md px-3 py-2">
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                v-model="searchTerm"
                placeholder="Search assets..."
                class="flex-grow bg-transparent text-white text-sm focus:outline-none"
              />
            </div>
          </div>
          
          <select v-model="assetType" class="px-3 py-2 bg-dark-100 text-white rounded-md border border-dark-100 focus:outline-none">
            <option value="">All types</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
            <option value="video">Videos</option>
          </select>
          
          <label 
            class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm flex items-center gap-2 hover:bg-blue-500 transition-colors cursor-pointer"
            :class="{ 'opacity-50 cursor-not-allowed': isUploading }"
            :disabled="isUploading"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16V8m0 0l-4 4m4-4l4 4" />
            </svg>
            {{ isUploading ? 'Uploading...' : 'Upload' }}
            <input type="file" class="hidden" @change="handleFileSelect" :disabled="isUploading" multiple />
          </label>
        </div>
      </div>
      
      <div class="p-4 max-h-[500px] overflow-y-auto">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        
        <div v-else-if="filteredAssets.length === 0" class="text-center py-12 text-gray-500">
          <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>No assets found</p>
        </div>
        
        <div v-else class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-4">
          <div
            v-for="asset in filteredAssets"
            :key="asset.id"
            @click="toggleSelection(asset)"
            class="group relative cursor-pointer transition-all border-2 rounded-lg overflow-hidden"
            :class="isSelected(asset) ? 'border-blue-500' : 'border-transparent hover:border-gray-600'"
          >
            <div class="absolute top-1 right-1 z-10">
              <div
                v-if="isSelected(asset)"
                class="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center"
              >
                <svg class="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <div class="aspect-square bg-dark-100">
              <img
                :src="getAssetPreview(asset)"
                :alt="asset.name"
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                @error="handleImageError($event)"
              />
            </div>
            
            <div class="p-1 bg-dark-800">
              <p class="text-white text-xs truncate" :title="asset.name">{{ asset.name }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex items-center justify-between px-6 py-4 border-t border-dark-600">
        <span class="text-sm text-gray-400">
          {{ selectedCount }} selected of {{ filteredAssets.length }} assets
        </span>
        
        <div class="flex items-center gap-3">
          <button @click="close" class="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500 transition-colors">
            Cancel
          </button>
          <button 
            @click="confirmSelection"
            class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="selectedCount === 0"
          >
            {{ selectMultiple ? 'Select Assets' : 'Select Asset' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { gql } from '@apollo/client/core'
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  title: { type: String, default: 'Select Assets' },
  modelValue: { type: [Array, String], default: () => [] },
  selectMultiple: { type: Boolean, default: true },
  emitFullAssets: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'close', 'confirm'])

const authStore = useAuthStore()
const searchTerm = ref('')
const assetType = ref('')
const loading = ref(false)
const isUploading = ref(false)
const assets = ref([])
const selectedAssetIds = ref([])

const LIST_ASSETS_QUERY = gql`
  query ListAssets($options: AssetListOptions) {
    assets(options: $options) {
      items {
        id
        name
        preview
        source
        fileSize
        mimeType
      }
      totalItems
    }
  }
`

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

const filteredAssets = computed(() => {
  let result = [...assets.value] // Create a copy to avoid mutating the original
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    result = result.filter(a => a.name.toLowerCase().includes(term))
  }
  if (assetType.value) {
    result = result.filter(a => {
      const mime = a.mimeType?.toLowerCase() || ''
      if (assetType.value === 'image') return mime.startsWith('image/')
      if (assetType.value === 'document') return mime.includes('pdf') || mime.includes('doc') || mime.includes('text')
      if (assetType.value === 'video') return mime.startsWith('video/')
      return true
    })
  }
  // Sort by id descending
  return result.sort((a, b) => {
    const idA = parseInt(a.id, 10)
    const idB = parseInt(b.id, 10)
    return idB - idA
  })
})

const selectedCount = computed(() => selectedAssetIds.value.length)

const isSelected = (asset) => selectedAssetIds.value.includes(asset.id)

const getAssetPreview = (asset) => {
  if (asset.preview && typeof asset.preview === 'string') {
    // Vendure's Asset.preview is already a full URL, return it directly!
    return asset.preview
  }
  return 'https://via.placeholder.com/200x200?text=Asset'
}

const handleImageError = (event) => {
  event.target.src = 'https://via.placeholder.com/200x200?text=Asset'
}

const toggleSelection = (asset) => {
  const index = selectedAssetIds.value.indexOf(asset.id)
  if (props.selectMultiple) {
    if (index > -1) {
      selectedAssetIds.value.splice(index, 1)
    } else {
      selectedAssetIds.value.push(asset.id)
    }
  } else {
    selectedAssetIds.value = index > -1 ? [] : [asset.id]
  }
}

const close = () => emit('close')

const confirmSelection = () => {
  if (props.emitFullAssets) {
    const selectedAssets = assets.value.filter(a => selectedAssetIds.value.includes(a.id))
    if (props.selectMultiple) {
      emit('confirm', selectedAssets)
    } else {
      emit('confirm', selectedAssets[0] || null)
    }
  } else {
    if (props.selectMultiple) {
      emit('confirm', [...selectedAssetIds.value])
    } else {
      emit('confirm', selectedAssetIds.value[0] || '')
    }
  }
}

const fetchAssets = async () => {
    loading.value = true
    try {
        let channelToken = import.meta.env.VITE_CHANNEL_TOKEN || null
        if (authStore.activeChannel && !import.meta.env.VITE_CHANNEL_TOKEN) {
            channelToken = authStore.activeChannel.token
        }
        
        const apolloClient = createApolloClient(authStore.token, channelToken)
        
        const result = await apolloClient.query({
            query: LIST_ASSETS_QUERY,
            variables: {
                options: {
                    take: 100,
                    skip: 0
                }
            }
        })
        
        if (result.data?.assets?.items) {
            assets.value = result.data.assets.items
        }
    } catch (err) {
        console.error('Error fetching assets:', err)
    } finally {
        loading.value = false
    }
}

const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    
    isUploading.value = true
    
    try {
        let channelToken = import.meta.env.VITE_CHANNEL_TOKEN || null
        if (authStore.activeChannel && !import.meta.env.VITE_CHANNEL_TOKEN) {
            channelToken = authStore.activeChannel.token
        }
        
        for (const file of files) {
            const uploadedAsset = await uploadAsset(file, channelToken)
            if (uploadedAsset) {
                // Create a new array to avoid mutating the original
                assets.value = [uploadedAsset, ...assets.value]
                
                // Auto select newly uploaded asset
                if (!selectedAssetIds.value.includes(uploadedAsset.id)) {
                    selectedAssetIds.value = [...selectedAssetIds.value, uploadedAsset.id]
                }
            }
        }
    } catch (err) {
        console.error('Error uploading files:', err)
    } finally {
        isUploading.value = false
        e.target.value = '' // Clear input
    }
}

const uploadAsset = async (file, channelToken = null) => {
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
        console.error('Error uploading asset:', error)
        throw error
    }
}

onMounted(() => {
  fetchAssets()
  
  if (props.modelValue) {
    if (props.selectMultiple && Array.isArray(props.modelValue)) {
      selectedAssetIds.value = [...props.modelValue]
    } else if (!props.selectMultiple && typeof props.modelValue === 'string') {
      selectedAssetIds.value = props.modelValue ? [props.modelValue] : []
    }
  }
})
</script>

<style scoped>
/* Custom scrollbar */
.max-h-\[500px\]::-webkit-scrollbar {
  width: 6px;
}
.max-h-\[500px\]::-webkit-scrollbar-track {
  background: #1f2937;
}
.max-h-\[500px\]::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 3px;
}
.max-h-\[500px\]::-webkit-scrollbar-thumb:hover {
  background: #4b5563;
}
</style>
