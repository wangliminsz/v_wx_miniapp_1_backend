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

        <div v-if="!isSingleChannel" class="flex items-center gap-2">
          <label for="channelSelect" class="font-bold text-blue-300">By Channel:</label>
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

      <!-- Product selection info and buttons -->
      <div v-if="products.length > 0" class="mb-6 p-4 bg-dark-200 rounded-md">
        <div class="flex flex-row justify-between mr-10">
          <div>
            <p class="text-gray-200 text-xs">
              Selected: {{ selectedProducts.length }}
            </p>
          </div>
        </div>

        <div class="mt-2 flex gap-2 flex-wrap">
          <div class="flex gap-2">

            <button @click="showAssignChannelModal = true" :disabled="selectedProducts.length === 0 || isAssigningToChannel"
              class="px-4 py-2 bg-purple-600 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Assign selected products to a channel">
              {{ isAssigningToChannel ? 'Assigning...' : 'Assign to Channel' }}
            </button>
            
            <button @click="removeFromChannel" :disabled="selectedProducts.length === 0 || isRemovingFromChannel"
              class="px-4 py-2 bg-orange-600 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove selected products from current channel">
              {{ isRemovingFromChannel ? 'Removing...' : 'Remove from Channel' }}
            </button>

            <button @click="exportSelectedProducts" :disabled="selectedProducts.length === 0 || isExporting"
              class="px-4 py-2 bg-green-600 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export only the selected products">
              {{ isExporting ? 'Exporting...' : 'Export Selected' }}
            </button>

            <button @click="exportAllProducts" :disabled="isExporting"
              class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export all products regardless of selection">
              {{ isExporting ? 'Exporting...' : 'Export All' }}
            </button>

            <button @click="clearSelection" :disabled="selectedProducts.length === 0"
              class="px-4 py-2 bg-gray-600 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              Clear Selection
            </button>
          </div>
        </div>

        <p v-if="exportError" class="text-red-400 mt-3 text-sm">
          Error: {{ exportError }}
        </p>
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
        <div v-for="product in products" :key="product.id"
          class="bg-dark-200 rounded-lg border border-dark-100 overflow-hidden">
          
          <div class="flex flex-col w-full p-5">
            
            <div class="flex flex-row justify-between w-full">

              <div>

                <div class="flex items-center justify-between gap-3 mb-1">
                  <div class="flex items-center gap-3">
                    <h3 class="text-lg font-semibold text-white truncate">{{ product.name }}</h3>
                    <button @click="openManageVariants(product.id)"
                      class="flex-shrink-0 px-3 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-500 transition-colors">
                      Manage variants
                    </button>
                  </div>
                </div>

                <div class="flex flex-row items-center gap-2">

                  <div class="flex-shrink-0">
                    <input type="checkbox" :id="`product-${product.id}`" :checked="isSelected(product.id)"
                      @change="toggleProductSelection(product)"
                      class="w-5 h-5 text-secondary focus:ring-secondary rounded transition-colors" />
                    <label :for="`product-${product.id}`" class="sr-only">{{ product.name }}</label>
                  </div>

                  <p class="text-sm text-gray-400">ID: {{ product.id }}</p>
                  <span class="text-sm text-secondary" v-if="product.variants && product.variants.length > 0">
                    {{ product.variants.length }} variants
                  </span>
                  <span class="text-sm text-gray-500" v-else>
                    0 variants
                  </span>

                </div>

                <div class="flex flex-wrap gap-2 mt-2">
              <span v-for="collection in product.collections" :key="collection.id"
                class="text-xs bg-dark-300 text-gray-300 px-2 py-1 rounded-full">
                {{ collection.name }}
              </span>
            </div>
            <div class="flex flex-wrap gap-2 mt-2">
              <span v-for="channel in product.channels" :key="channel.id"
                class="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded-full border border-blue-700">
                {{ channel.code }}
              </span>
            </div>

              </div>

              <div class="flex-shrink-0 w-20 h-20 overflow-hidden bg-dark-100 rounded-md">
                <img :src="product.featuredAsset ? `${product.featuredAsset.preview}?w=100&h=100` : 'https://via.placeholder.com/100x100?text=No+Image'"
                  :alt="product.name" class="w-full h-full object-cover" />
              </div>

            </div>

            <div class="mt-2"></div>

            <!-- Product Description Section -->
            <div class="mt-3 w-full">
              <div v-if="editingProductId === product.id" class="space-y-2">
                <textarea v-model="editingDescription"
                  class="w-full px-3 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors resize-vertical min-h-[80px] text-sm"
                  placeholder="Enter product description..."></textarea>
                <div class="flex gap-2">
                  <button @click="saveProductDescription(product)" :disabled="isUpdatingDescription"
                    class="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ isUpdatingDescription ? 'Saving...' : 'Save' }}
                  </button>
                  <button @click="cancelEditingDescription" :disabled="isUpdatingDescription"
                    class="px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Cancel
                  </button>
                </div>
              </div>
              <div v-else class="flex items-start justify-between gap-2">
                <p class="text-sm text-gray-400 flex-1 line-clamp-2"
                  :class="{ 'text-gray-500': !getProductDescription(product) }">
                  {{ getProductDescription(product) || 'No description' }}
                </p>
                <button @click="startEditingDescription(product)"
                  class="flex-shrink-0 px-2 py-1 bg-gray-600 text-white rounded-md text-xs hover:bg-gray-500 transition-colors">
                  Edit
                </button>
              </div>
            </div>

            <div class="mt-2"></div>

            <!-- Product Facets Section -->
            <div class="mt-3 w-full">
              <div v-if="editingFacetsProductId === product.id" class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold text-blue-300">Facets</span>
                  <button @click="cancelEditingFacets" :disabled="isUpdatingFacets"
                    class="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors disabled:opacity-50">
                    Done
                  </button>
                </div>
                <div class="space-y-3">
                  <div v-for="facet in facets" :key="facet.id" class="space-y-2">
                    <span class="text-xs text-gray-400 font-medium">{{ facet.name }}</span>
                    <div class="flex flex-wrap gap-2">
                      <button v-for="value in facet.values" :key="value.id"
                        @click="toggleProductFacet(product, value, !isFacetValueSelected(product, value))"
                        :disabled="isUpdatingFacets"
                        class="px-3 py-1 text-xs rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        :class="isFacetValueSelected(product, value) ? 'bg-blue-600 text-white' : 'bg-dark-300 text-gray-300 hover:bg-dark-200'">
                        {{ value.name }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else>
                <div class="flex items-center justify-between gap-2">
                  <div class="flex flex-wrap gap-2 flex-1">
                    <span v-for="facetValue in product.facetValues" :key="facetValue.id"
                      class="text-xs bg-dark-300 text-gray-300 px-2 py-1 rounded-full">
                      {{ facetValue.name }} <span class="text-gray-500">in</span> {{
                        facetValue.facet.name }}
                    </span>
                    <span v-if="!product.facetValues || product.facetValues.length === 0"
                      class="text-xs text-gray-500">
                      No facets
                    </span>
                  </div>
                  <button @click="startEditingFacets(product)"
                    class="flex-shrink-0 px-2 py-1 bg-gray-600 text-white rounded-md text-xs hover:bg-gray-500 transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            </div>

            <div class="mt-2"></div>
            <div class="mt-2"></div>
            <div class="mt-2"></div>

            <div class="flex flex-row justify-between mx-10 gap-20">

              <!-- Product Assets Section -->
              <div class="mt-4">
                <div class="flex items-center justify-start gap-2 mb-2">
                  <span class="text-sm font-semibold text-blue-300">Assets</span>
                  <button @click="openAssetSelector(product, 'add')" :disabled="isUpdatingAssets"
                    class="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add
                  </button>
                </div>

                <div class="flex flex-wrap gap-2">
                  <template v-for="asset in product.assets" :key="asset.id">
                    <div class="group relative w-12 h-12 flex-shrink-0 rounded-md bg-dark-300"
                      :class="{ 'border-2 border-green-500': product.featuredAsset?.id === asset.id }">
                      <img :src="asset.preview || 'https://via.placeholder.com/48?text=Asset'"
                        :alt="asset.name" class="w-full h-full object-cover" />

                      <!-- Featured star icon -->
                      <div v-if="product.featuredAsset?.id === asset.id"
                        class="absolute top-1 right-1 z-10">
                        <span class="text-xs text-green-400">
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </span>
                      </div>

                      <!-- Hover overlay -->
                      <div
                        class="absolute inset-0 bg-dark-400/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-1">
                        <a :href="asset.source" target="_blank"
                          class="w-5 h-5 rounded-md bg-dark-100 text-gray-300 hover:text-blue-400 hover:bg-blue-950/40 flex items-center justify-center"
                          @click.stop>
                          <svg class="w-3 h-3" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </a>
                        <button @click.stop="toggleAssetMenu(product.id, asset.id)"
                          :ref="(el) => { if (el) menuRefs[`${product.id}-${asset.id}`] = el }"
                          data-asset-menu="true"
                          class="w-5 h-5 rounded-md bg-dark-100 text-gray-300 hover:text-blue-400 hover:bg-blue-950/40 flex items-center justify-center">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </template>

                  <span v-if="!product.assets || product.assets.length === 0"
                    class="text-xs text-gray-500 py-2">
                    No assets
                  </span>
                </div>
              </div>

              <!-- 技术文档 Section -->
              <div class="mt-4">
                <div class="flex items-center justify-between mb-2">
                  <div>
                    <span class="text-sm font-semibold text-blue-300">技术文档</span>
                  </div>

                  <div class="flex items-center justify-start ml-2 gap-2">

                    <div><label
                        class="w-5 h-5 rounded-full bg-purple-600 text-white cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        :class="{ 'opacity-50 cursor-not-allowed': uploadingProductId === product.id }"
                        title="Upload technical documentation">
                        <!-- 加载中 -->
                        <svg v-if="uploadingProductId === product.id"
                          class="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor">
                          <circle cx="12" cy="12" r="10" stroke-width="4" opacity="0.25">
                          </circle>
                          <path
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            fill="currentColor" opacity="0.75"></path>
                        </svg>

                        <!-- 上传图标 -->
                        <svg v-else class="w-3 h-3" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" stroke-width="2" stroke-linecap="round"
                          stroke-linejoin="round">
                          <path d="M12 16V8m0 0l-4 4m4-4l4 4" />
                        </svg>

                        <input type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                          class="hidden" @change="handleDocUpload($event, product)"
                          :disabled="uploadingProductId === product.id" />
                      </label>
                    </div>

                    <!-- 文件列表按钮 -->
                    <div>
                      <button @click="showFileList(product)"
                        class="w-5 h-5 rounded-full bg-blue-600 text-white cursor-pointer flex items-center justify-center"
                        :class="{ 'opacity-50 cursor-not-allowed': !product.customFields?.techDocs?.length }"
                        :disabled="!product.customFields?.techDocs?.length" title="View all documents">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" stroke-width="2" stroke-linecap="round"
                          stroke-linejoin="round">
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>

                    <span v-if="uploadSuccessProductId === product.id" class="text-xs text-green-400">✓</span>
                    <span v-if="uploadErrorProductId === product.id" class="text-xs text-red-400">✗</span>

                  </div>


                </div>

                <!-- File Icons next to product name -->
                <div v-if="product.customFields?.techDocs?.length > 0" class="flex flex-wrap gap-2">
                  <div v-for="(doc, index) in product.customFields.techDocs.slice(0, 5)" :key="doc.id"
                    class="group relative w-12 h-12 flex-shrink-0 rounded-md bg-dark-300 transition-all hover:bg-dark-200"
                    :title="doc.name">
                    <img v-if="getFileIcon(doc.name)" :src="`/file_icons/${getFileIcon(doc.name)}`"
                      :alt="doc.name" class="w-full h-full object-contain" />
                    <img v-else :src="doc.preview || 'https://via.placeholder.com/48?text=Doc'"
                      :alt="doc.name" class="w-full h-full object-cover rounded-md" />
                  </div>
                  <span v-if="product.customFields.techDocs.length > 5"
                    class="text-xs text-gray-400">+{{
                      product.customFields.techDocs.length - 5
                    }}</span>
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

  <!-- Asset Context Menu (Teleported to body to avoid overflow issues) -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showAssetMenu" data-asset-menu="true"
        class="fixed z-50 min-w-32 rounded-md bg-dark-800 border border-dark-600 shadow-lg overflow-hidden"
        :style="{ left: `${menuPosition.x}px`, top: `${menuPosition.y}px` }">
        <div class="py-1">
          <!-- Find the current product and asset to render menu correctly -->
          <template v-for="product in products" :key="product.id">
            <template v-for="asset in product.assets" :key="asset.id">
              <template v-if="showAssetMenu.productId === product.id && showAssetMenu.assetId === asset.id">
                <button v-if="product.featuredAsset?.id !== asset.id"
                  @click.stop="setFeaturedAsset(product, asset.id)"
                  class="w-full px-3 py-1.5 text-xs text-left text-gray-300 hover:bg-dark-600 flex items-center gap-2">
                  <svg class="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Set as Featured
                </button>
                <button @click.stop="removeAsset(product, asset.id)"
                  class="w-full px-3 py-1.5 text-xs text-left text-red-400 hover:bg-dark-600 flex items-center gap-2">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Remove
                </button>
              </template>
            </template>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Asset Selector Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <AssetSelector v-if="showAssetSelector"
        :title="assetSelectorMode === 'add' ? 'Select Assets' : 'Set Featured Asset'"
        :modelValue="tempSelectedAssetIds" :selectMultiple="assetSelectorMode === 'add'"
        @confirm="updateProductAssets" @close="closeAssetSelector" />
    </Transition>
  </Teleport>

  <!-- Assign to Channel Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showAssignChannelModal" class="fixed inset-0 z-50 flex items-center justify-center"
        style="background: rgba(0,0,0,0.5);">
        <div class="relative rounded-lg shadow-xl w-80 border border-gray-600"
          style="background-color: #1f2937;">
          <div class="p-4 text-center">
            <h3 class="text-sm font-semibold text-white mb-2">Assign to Channel</h3>
            <p class="text-gray-400 text-xs mb-4">
              Select a channel to assign {{ selectedProducts.length }} product(s) to
            </p>
            
            <div class="mb-4">
              <label class="block text-gray-300 text-sm mb-2 text-left">Channel</label>
              <select v-model="selectedAssignChannel"
                class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none">
                <option :value="null" disabled>Select a channel</option>
                <option v-for="channel in channels" :key="channel.id" :value="channel">
                  {{ channel.code }} ({{ channel.currencyCode }})
                </option>
              </select>
            </div>

            <div class="mb-4">
              <label class="block text-gray-300 text-sm mb-2 text-left">Price conversion factor</label>
              <input type="number" v-model.number="priceFactor" step="0.01" min="0.01"
                class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none">
            </div>

            <div class="flex gap-2">
              <button @click="showAssignChannelModal = false; selectedAssignChannel = null; priceFactor = 1;"
                class="flex-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-md transition-colors">
                Cancel
              </button>
              <button @click="assignToChannel"
                :disabled="!selectedAssignChannel || isAssigningToChannel"
                class="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {{ isAssigningToChannel ? 'Assigning...' : 'Assign' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'

// Import auth store
import { useAuthStore } from '../stores/auth'
import AssetSelector from '../components/AssetSelector.vue'
import { getChannelTokenFromQuery } from '../utils/channelToken'

// Get router
const router = useRouter()
const route = useRoute()

// Get auth store
const authStore = useAuthStore()

// Open the Manage Variants page for a given product in a NEW TAB.
// `router.resolve` builds the proper URL (going through the router's
// path resolution and the channel-propagation guard), then we hand
// that URL to window.open. Using router.resolve — rather than
// concatenating strings — keeps us safe if the route definition ever
// changes.
const openManageVariants = (productId) => {
  const href = router.resolve({
    name: 'ManageVariants',
    params: { productId },
    query: route.query
  }).href
  window.open(href, '_blank', 'noopener,noreferrer')
}

// State
const loading = ref(false)
const error = ref('')
const products = ref([])
const totalCount = ref(0)
const searchTerm = ref('')
const hasSearched = ref(false)
const viewMode = ref('list') // Default to list view
const searchHistory = ref([]) // Search history array
const selectedProducts = ref([])
const facets = ref([])
const isExporting = ref(false)
const exportError = ref(null)

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

// Facet editing state
const editingFacetsProductId = ref(null)
const isUpdatingFacets = ref(false)

// Asset management state
const showAssetSelector = ref(false)
const assetSelectorMode = ref(null) // 'add' or 'featured'
const assetSelectorProduct = ref(null)
const tempSelectedAssetIds = ref([])
const isUpdatingAssets = ref(false)

// Asset menu state
const showAssetMenu = ref(null) // { productId, assetId }
const menuRefs = ref({}) // key: `${productId}-${assetId}`, value: DOM element
const menuPosition = ref({ x: 0, y: 0 })

// Channel management state
const isRemovingFromChannel = ref(false)
const isAssigningToChannel = ref(false)
const showAssignChannelModal = ref(false)
const selectedAssignChannel = ref(null)
const priceFactor = ref(1)
const activeChannel = ref(null)
const selectedChannel = ref(null)

// Computed properties
const channels = computed(() => authStore.channels)
const isSingleChannel = computed(() => authStore.channels.length <= 1)
const displaySelectedChannel = computed(() => {
  if (selectedChannel.value) return selectedChannel.value
  if (authStore.activeChannel) return authStore.activeChannel
  return null
})

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
    activeChannel {
      id code token currencyCode
    }
  }
`

const GET_FULL_PRODUCT_DATA_QUERY = gql`
  query GetProductById($id: ID!) {
    product(id: $id) {
      id
      name
      enabled
      translations {
        id
        languageCode
        name
        description
      }
      variants {
        id
      }
      featuredAsset {
        id
        preview
        source
        name
      }
      assets {
        id
        preview
        source
        name
      }
      collections {
        id
        name
      }
      channels {
        id
        code
        token
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
`

const GET_FACETS_QUERY = gql`
  query GetFacets {
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

let apolloClient = null

// Create Apollo Client with token and channel token
const createApolloClient = (authToken, channelToken = null) => {
  console.log('createApolloClient', { authToken, channelToken })
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
    console.log('Sending request headers', requestHeaders)
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
    // Use getChannelTokenFromQuery if available, otherwise use active channel from auth store
    let channelToken = getChannelTokenFromQuery() || null
    if (selectedChannel.value) {
      channelToken = selectedChannel.value.token
    } else if (authStore.activeChannel && !getChannelTokenFromQuery()) {
      channelToken = authStore.activeChannel.token
    }
    const apolloClientInstance = createApolloClient(authStore.token, channelToken)

    // Fetch facets first
    try {
      const facetsResult = await apolloClientInstance.query({
        query: GET_FACETS_QUERY,
        fetchPolicy: 'network-only'
      })
      if (facetsResult.data?.facets?.items) {
        facets.value = facetsResult.data.facets.items
      }
    } catch (err) {
      console.error('Failed to fetch facets:', err)
    }

    const result = await apolloClientInstance.query({
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

        // Fetch full product data for each product
        const productsWithFullData = await Promise.all(
          searchItems.map(async (searchProduct) => {
            try {
              const productResult = await apolloClientInstance.query({
                query: GET_FULL_PRODUCT_DATA_QUERY,
                variables: { id: searchProduct.productId },
                fetchPolicy: 'network-only'
              })

              const fullProduct = productResult.data?.product
              if (fullProduct) {
                // Map the search result properties to the full product format, and clone to make it mutable
                return JSON.parse(JSON.stringify({
                  ...fullProduct,
                  // Keep search-specific fields as well
                  productId: searchProduct.productId,
                  productName: searchProduct.productName,
                  minPrice: searchProduct.minPrice,
                  maxPrice: searchProduct.maxPrice,
                  variantCount: searchProduct.variantCount
                }))
              }

              // Fallback if full product data can't be fetched, clone to make it mutable
              return JSON.parse(JSON.stringify({
                id: searchProduct.productId,
                name: searchProduct.productName,
                productId: searchProduct.productId,
                productName: searchProduct.productName,
                minPrice: searchProduct.minPrice,
                maxPrice: searchProduct.maxPrice,
                variantCount: searchProduct.variantCount,
                enabled: true,
                translations: [],
                variants: searchProduct.variants || [],
                featuredAsset: searchProduct.productAsset || null,
                assets: [],
                collections: [],
                facetValues: [],
                customFields: { techDocs: [] }
              }))
            } catch (err) {
              console.error(`Failed to fetch full data for product ${searchProduct.productId}:`, err)
              // Fallback product, clone to make it mutable
              return JSON.parse(JSON.stringify({
                id: searchProduct.productId,
                name: searchProduct.productName,
                productId: searchProduct.productId,
                productName: searchProduct.productName,
                minPrice: searchProduct.minPrice,
                maxPrice: searchProduct.maxPrice,
                variantCount: searchProduct.variantCount,
                enabled: true,
                translations: [],
                variants: searchProduct.variants || [],
                featuredAsset: searchProduct.productAsset || null,
                assets: [],
                collections: [],
                facetValues: [],
                customFields: { techDocs: [] }
              }))
            }
          })
        )

        products.value = productsWithFullData
      } else {
        totalCount.value = 0
        products.value = []
      }
    }

    if (result.data.activeChannel) {
      activeChannel.value = result.data.activeChannel
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
    const apolloClientInstance = createApolloClient(authStore.token, channelToken)
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
    const result = await apolloClientInstance.mutate({
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
        const foundIndexProducts = products.value.findIndex(p => p.id === product.id)

        if (foundIndexProducts !== -1) {
          products.value[foundIndexProducts].customFields.techDocs = updatedProduct.customFields.techDocs
        }
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

// Product selection functions
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
}

const clearSelection = () => {
  selectedProducts.value = []
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
    
    const channelId = selectedChannel.value?.id || activeChannel.value?.id || authStore.activeChannel?.id || channels.value.find(c => c.token === channelToken)?.id
    
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
    await performSearch()
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
    await performSearch()
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

// Product description editing functions (updated)
const getProductDescription = (product) => {
  if (product.translations && product.translations.length > 0) {
    // Try to find English translation first, otherwise use the first one
    const enTranslation = product.translations.find(t => t.languageCode === 'en')
    if (enTranslation && enTranslation.description) {
      return enTranslation.description
    }
    return product.translations[0].description || ''
  }
  return product.description || ''
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
    // Use getChannelTokenFromQuery if available
    let channelToken = getChannelTokenFromQuery() || null
    if (selectedChannel.value) {
      channelToken = selectedChannel.value.token
    } else if (authStore.activeChannel && !getChannelTokenFromQuery()) {
      channelToken = authStore.activeChannel.token
    }
    const apolloClientInstance = createApolloClient(authStore.token, channelToken)

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

    const result = await apolloClientInstance.mutate({
      mutation: UPDATE_PRODUCT_MUTATION,
      variables: {
        input: {
        id: product.id,
        translations: [translationInput]
      }}
    })

    if (result.data?.updateProduct) {
      // Update the local product data
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
    // Use getChannelTokenFromQuery if available
    let channelToken = getChannelTokenFromQuery() || null
    if (selectedChannel.value) {
      channelToken = selectedChannel.value.token
    } else if (authStore.activeChannel && !getChannelTokenFromQuery()) {
      channelToken = authStore.activeChannel.token
    }
    const apolloClientInstance = createApolloClient(authStore.token, channelToken)

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

    const result = await apolloClientInstance.mutate({
      mutation: UPDATE_PRODUCT_ASSETS_MUTATION,
      variables: {
        input: mutationInput
      }
    })

    if (result.data?.updateProduct) {
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
    // Use getChannelTokenFromQuery if available
    let channelToken = getChannelTokenFromQuery() || null
    if (selectedChannel.value) {
      channelToken = selectedChannel.value.token
    } else if (authStore.activeChannel && !getChannelTokenFromQuery()) {
      channelToken = authStore.activeChannel.token
    }
    const apolloClientInstance = createApolloClient(authStore.token, channelToken)

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

    const result = await apolloClientInstance.mutate({
      mutation: UPDATE_PRODUCT_ASSETS_MUTATION,
      variables: {
        input: mutationInput
      }
    })

    if (result.data?.updateProduct) {
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
    // Use getChannelTokenFromQuery if available
    let channelToken = getChannelTokenFromQuery() || null
    if (selectedChannel.value) {
      channelToken = selectedChannel.value.token
    } else if (authStore.activeChannel && !getChannelTokenFromQuery()) {
      channelToken = authStore.activeChannel.token
    }
    const apolloClientInstance = createApolloClient(authStore.token, channelToken)

    const UPDATE_PRODUCT_ASSETS_MUTATION = gql`
            mutation UpdateProductAssets($input: UpdateProductInput!) {
                updateProduct(input: $input) {
                    id
                    assets { id name preview source }
                    featuredAsset { id name preview source }
                }
            }
        `

    const result = await apolloClientInstance.mutate({
      mutation: UPDATE_PRODUCT_ASSETS_MUTATION,
      variables: {
        input: {
          id: product.id,
          featuredAssetId: assetId
        }
      }
    })

    if (result.data?.updateProduct) {
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

// Facet editing functions
const startEditingFacets = (product) => {
  editingFacetsProductId.value = product.id
}

const cancelEditingFacets = () => {
  editingFacetsProductId.value = null
}

const toggleProductFacet = async (product, facetValue, isSelected) => {
  isUpdatingFacets.value = true
  try {
    // Use getChannelTokenFromQuery if available
    let channelToken = getChannelTokenFromQuery() || null
    if (selectedChannel.value) {
      channelToken = selectedChannel.value.token
    } else if (authStore.activeChannel && !getChannelTokenFromQuery()) {
      channelToken = authStore.activeChannel.token
    }
    const apolloClientInstance = createApolloClient(authStore.token, channelToken)

    const currentFacetValueIds = (product.facetValues || []).map(fv => fv.id)
    let newFacetValueIds
    if (isSelected) {
      newFacetValueIds = [...currentFacetValueIds, facetValue.id]
    } else {
      newFacetValueIds = currentFacetValueIds.filter(id => id !== facetValue.id)
    }

    const result = await apolloClientInstance.mutate({
      mutation: UPDATE_PRODUCT_MUTATION,
      variables: {
        input: {
          id: product.id,
          facetValueIds: newFacetValueIds
        }
      }
    })

    if (result.data?.updateProduct) {
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

    // Use getChannelTokenFromQuery if available
    let channelToken = getChannelTokenFromQuery() || null
    if (selectedChannel.value) {
      channelToken = selectedChannel.value.token
    } else if (authStore.activeChannel && !getChannelTokenFromQuery()) {
      channelToken = authStore.activeChannel.token
    }
    const updatedProduct = await updateProductTechDocs(product.id, updatedDocIds, channelToken)

    if (updatedProduct) {
      const foundIndexProducts = products.value.findIndex(p => p.id === product.id)

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

  return iconMap[ext] || 'TXT.svg'
}

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

const exportSelectedProducts = async () => {
  exportError.value = null
  isExporting.value = true
  try {
    if (selectedProducts.value.length === 0) throw new Error('Please select at least one product.')

    let channelToken = getChannelTokenFromQuery() || null
    if (selectedChannel.value) {
      channelToken = selectedChannel.value.token
    } else if (authStore.activeChannel && !getChannelTokenFromQuery()) {
      channelToken = authStore.activeChannel.token
    }

    const apolloClientInstance = createApolloClient(authStore.token, channelToken)

    const { data } = await apolloClientInstance.query({
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
    let channelToken = getChannelTokenFromQuery() || null
    if (selectedChannel.value) {
      channelToken = selectedChannel.value.token
    } else if (authStore.activeChannel && !getChannelTokenFromQuery()) {
      channelToken = authStore.activeChannel.token
    }

    const apolloClientInstance = createApolloClient(authStore.token, channelToken)

    const { data } = await apolloClientInstance.query({
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

// Watchers
const unwatchToken = watch(() => authStore.token, () => {
  if (hasSearched) {
    performSearch()
  }
})
const unwatchChannel = watch(() => selectedChannel.value, () => {
  if (hasSearched) {
    performSearch()
  }
})

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  unwatchToken()
  unwatchChannel()
})
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
