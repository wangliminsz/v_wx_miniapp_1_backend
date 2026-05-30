<template>
  <div class="i18n-zh-page">
    <h1 class="text-2xl font-semibold text-gray-300 mb-6">i18n Chinese Translation</h1>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-10 text-gray-400">Loading...</div>

    <!-- Error message tooltip -->
    <div v-else-if="error"
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

    <!-- Collections Section -->
    <div class="mt-6 bg-dark-200 p-6 rounded-md border border-dark-100">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-blue-300">Collections</h2>
        <button @click="toggleCollapse"
          class="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors text-sm flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
              v-if="isCollapsed" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" v-else />
          </svg>
          {{ isCollapsed ? 'Expand' : 'Collapse' }}
        </button>
      </div>

      <!-- Collections list -->
      <div v-if="!isCollapsed">
        <div v-if="collections.length > 0">
          <div class="overflow-x-auto">
            <!-- min-w-full bg-dark-300 rounded-md overflow-hidden -->
            <table class="w-full table-fixed">
              <thead class="bg-dark-100">
                <tr>
                  <!-- transition-colors flex items-center gap-1 justify-center -->
                  <th 
                    class="w-[5%] px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-300"
                    @click="toggleSortOrder">
                    ID
                    <!-- <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h13M3 16h9m-9 4h13m-15 0l4.586 4.586a2 2 0 002.828 0L19 20M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg> -->
                    <!-- <span class="text-blue-300">{{ sortOrder }}</span> -->
                  </th>
                  <th class="w-[30%] px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Default
                    Name</th>
                  <th class="w-[15%] px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Default
                    Slug</th>
                  <th class="w-[30%] px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Chinese
                    Name</th>
                  <th class="w-[20%] px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-dark-100">
                <template v-for="collection in collections" :key="collection.id">
                  <tr class="bg-dark-300">
                    <td class="text-center px-6 py-4 whitespace-nowrap text-sm text-gray-300">{{ collection.id }}</td>
                    <td class="text-center px-6 py-4 text-sm text-gray-300">
                      {{ collection.name }}
                    </td>
                    <td class="text-center px-6 py-4 text-sm text-gray-300">{{ collection.slug }}</td>
                    <td class="text-center px-6 py-4 whitespace-nowrap">
                      <input v-model="collection.translations.zh.name" type="text"
                        class="w-full px-3 py-2 bg-dark-400 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors text-sm"
                        placeholder="Enter Chinese name">
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button @click="translateCollection(collection)" :disabled="isTranslating.includes(collection.id)"
                        class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mr-2">
                        {{ isTranslating.includes(collection.id) ? 'Translating...' : 'Translate' }}
                      </button>
                      <button @click="updateCollection(collection)" :disabled="isUpdating.includes(collection.id)"
                        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        {{ isUpdating.includes(collection.id) ? 'Updating...' : 'Update' }}
                      </button>
                    </td>
                  </tr>
                  <tr class="bg-dark-300">
                    <td colspan="6" class="px-6 py-4">
                      <div class="grid grid-cols-2 gap-6 px-2">
                        <div>
                          <!-- border border-dark-100  -->
                          <h4 class="text-xs ml-2 font-medium text-gray-400 uppercase mb-2 text-left">Default
                            Description</h4>
                          <p
                            class="w-full px-3 py-2 bg-dark-400 text-white rounded-md text-sm whitespace-pre-wrap text-left min-h-[68px] line-height-normal">
                            {{ collection.description || '' }}</p>
                        </div>
                        <div>
                          <h4 class="text-xs ml-2 font-medium text-gray-400 uppercase mb-2 text-left">Chinese
                            Description</h4>
                          <textarea v-model="collection.translations.zh.description"
                            class="w-full px-3 py-2 bg-dark-400 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors text-sm"
                            placeholder="Enter Chinese description" rows="3"></textarea>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else-if="!loading" class="text-center py-10 text-gray-400">No collections found</div>
      </div>
    </div>

    <!-- Facets Section -->
    <div class="mt-6 bg-dark-200 p-6 rounded-md border border-dark-100">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-blue-300">Facets</h2>
        <button @click="toggleFacetsCollapse"
          class="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors text-sm flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
              v-if="isFacetsCollapsed" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" v-else />
          </svg>
          {{ isFacetsCollapsed ? 'Expand' : 'Collapse' }}
        </button>
      </div>

      <div v-if="!isFacetsCollapsed">
        <div v-if="facets.length > 0">
          <div v-for="facet in facets" :key="facet.id"
            class="mb-6 bg-dark-300 rounded-md overflow-hidden border border-dark-100">
            <!-- Facet Header -->
            <div class="bg-dark-100 px-6 py-4 flex justify-between items-center">
              <div class="flex-1">
                <div class="flex items-center gap-4">
                  <div class="font-semibold text-gray-200">{{ facet.name }}</div>
                  <div class="text-sm text-gray-500">({{ facet.code }})</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="text-sm text-gray-400">Chinese:</div>
                <input v-model="facet.translations.zh.name" type="text"
                  class="w-48 px-3 py-2 bg-dark-400 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors text-sm"
                  placeholder="Enter Chinese name">
                <button @click="translateFacet(facet)" :disabled="isTranslating.includes(facet.id)"
                  class="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
                  {{ isTranslating.includes(facet.id) ? 'Translating...' : 'Translate' }}
                </button>
                <button @click="updateFacet(facet)" :disabled="isUpdating.includes(facet.id)"
                  class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
                  {{ isUpdating.includes(facet.id) ? 'Updating...' : 'Update' }}
                </button>
              </div>
            </div>

            <!-- Facet Values Table -->
            <div class="overflow-x-auto">
              <table class="min-w-full">
                <thead>
                  <tr class="bg-dark-200">
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Facet
                      Value
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Chinese
                      Translation</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-dark-100">
                  <tr v-for="value in facet.values" :key="value.id" class="hover:bg-dark-200 transition-colors">
                    <td class="px-6 py-4 text-sm text-gray-300">{{ value.name }}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">{{ value.code }}</td>
                    <td class="px-6 py-4">
                      <input v-model="value.translations.zh.name" type="text"
                        class="w-full px-3 py-2 bg-dark-400 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors text-sm"
                        placeholder="Enter Chinese name">
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div class="flex items-center gap-2">
                        <button @click="translateFacetValue(value)" :disabled="isTranslating.includes(value.id)"
                          class="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs">
                          {{ isTranslating.includes(value.id) ? 'Translating...' : 'Translate' }}
                        </button>
                        <button @click="updateFacetValue(value)" :disabled="isUpdating.includes(value.id)"
                          class="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs">
                          {{ isUpdating.includes(value.id) ? 'Updating...' : 'Update' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div v-else-if="!loading" class="text-center py-10 text-gray-400">No facets found</div>
      </div>
    </div>


    <!-- Product Options Section -->
    <div class="mt-6 bg-dark-200 p-6 rounded-md border border-dark-100">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-blue-300">Product Option Groups</h2>
        <button @click="toggleProductOptionGroupsCollapse"
          class="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors text-sm flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
              v-if="isProductOptionGroupsCollapsed" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" v-else />
          </svg>
          {{ isProductOptionGroupsCollapsed ? 'Expand' : 'Collapse' }}
        </button>
      </div>

      <div v-if="!isProductOptionGroupsCollapsed">
        <div v-if="productOptionGroups.length > 0">
          <div v-for="group in productOptionGroups" :key="group.id"
            class="mb-6 bg-dark-300 rounded-md overflow-hidden border border-dark-100">
            <!-- Product Option Header -->
            <div class="bg-dark-100 px-6 py-4 flex justify-between items-center">
              <div class="flex-1">
                <div class="flex items-center gap-4">
                  <div class="font-semibold text-gray-200">{{ group.name }}</div>
                  <div class="text-sm text-gray-500">({{ group.code }})</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="text-sm text-gray-400">Chinese:</div>
                <input v-model="group.translations.zh.name" type="text"
                  class="w-48 px-3 py-2 bg-dark-400 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors text-sm"
                  placeholder="Enter Chinese name">
                <button @click="translateProductOptionGroup(group)" :disabled="isTranslating.includes(group.id)"
                  class="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
                  {{ isTranslating.includes(group.id) ? 'Translating...' : 'Translate' }}
                </button>
                <button @click="updateProductOptionGroup(group)" :disabled="isUpdating.includes(group.id)"
                  class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
                  {{ isUpdating.includes(group.id) ? 'Updating...' : 'Update' }}
                </button>
              </div>
            </div>

            <!-- Product Option Values Table -->
            <div class="overflow-x-auto">
              <table class="min-w-full">
                <thead>
                  <tr class="bg-dark-200">
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Option
                      Value
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Chinese
                      Translation</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-dark-100">
                  <tr v-for="option in group.options" :key="option.id" class="hover:bg-dark-200 transition-colors">
                    <td class="px-6 py-4 text-sm text-gray-300">{{ option.name }}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">{{ option.code }}</td>
                    <td class="px-6 py-4">
                      <input v-model="option.translations.zh.name" type="text"
                        class="w-full px-3 py-2 bg-dark-400 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors text-sm"
                        placeholder="Enter Chinese name">
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div class="flex items-center gap-2">
                        <button @click="translateProductOption(option)" :disabled="isTranslating.includes(option.id)"
                          class="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs">
                          {{ isTranslating.includes(option.id) ? 'Translating...' : 'Translate' }}
                        </button>
                        <button @click="updateProductOption(option)" :disabled="isUpdating.includes(option.id)"
                          class="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs">
                          {{ isUpdating.includes(option.id) ? 'Updating...' : 'Update' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div v-else-if="!loading" class="text-center py-10 text-gray-400">No product options found</div>
      </div>
    </div>


    <!-- Products Section -->
    <div class="mt-6 bg-dark-200 p-6 rounded-md border border-dark-100">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-blue-300">Products</h2>
        <button @click="toggleProductsCollapse"
          class="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors text-sm flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
              v-if="isProductsCollapsed" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" v-else />
          </svg>
          {{ isProductsCollapsed ? 'Expand' : 'Collapse' }}
        </button>
      </div>

      <div v-if="!isProductsCollapsed">
        <div v-if="products.length > 0">
          <div v-for="product in products" :key="product.id"
            class="mb-6 bg-dark-300 rounded-md overflow-hidden border border-dark-100">
            <!-- Product Header -->
            <div class="bg-dark-100 px-6 py-4">
              <div class="flex flex-wrap justify-between items-center gap-4 mb-4">
                <div class="flex items-center gap-4">
                  <div class="bg-dark-400 text-white px-3 py-1 rounded-md text-sm font-mono">ID: {{ product.id }}</div>
                  <div class="font-semibold text-gray-200 text-lg">{{ product.name }}</div>
                  <div class="flex items-center gap-2">
                    <div class="text-sm text-gray-400">Slug:</div>
                    <div class="bg-dark-400 text-white px-3 py-1 rounded-md text-sm font-mono">{{ product.slug }}</div>
                    <!-- <button 
                      @click="copyProductSlug(product)"
                      class="px-2 py-1 bg-secondary text-white rounded-md hover:bg-secondary/80 transition-colors text-xs flex items-center gap-1"
                      title="Copy slug to clipboard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button> -->
                  </div>
                </div>
                <button @click="updateProduct(product)" :disabled="isUpdating.includes(product.id)"
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
                  {{ isUpdating.includes(product.id) ? 'Updating...' : 'Update Product' }}
                </button>
              </div>
            </div>

            <!-- Product Translation Form -->
            <div class="px-6 py-4">
              <!-- Product Name Translation -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="block text-sm font-medium text-gray-300">Product Name (English)</label>
                    <button @click="translateProductName(product)" :disabled="isTranslating.includes(product.id)"
                      class="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs">
                      {{ isTranslating.includes(product.id) ? 'Translating...' : 'Translate Name' }}
                    </button>
                  </div>
                  <div class="bg-dark-400 text-white px-3 py-2 rounded-md border border-dark-100 text-sm">
                    {{ product.name }}
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Product Name (Chinese)</label>
                  <input v-model="product.translations.zh.name" type="text"
                    class="w-full px-3 py-2 bg-dark-400 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors text-sm"
                    placeholder="Enter Chinese name">
                </div>
              </div>

              <!-- Product Description Translation -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="block text-sm font-medium text-gray-300">Product Description (English)</label>
                    <button @click="translateProductDescription(product)" :disabled="isTranslating.includes(product.id)"
                      class="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs">
                      {{ isTranslating.includes(product.id) ? 'Translating...' : 'Translate Description' }}
                    </button>
                  </div>
                  <div
                    class="bg-dark-400 text-white px-3 py-2 rounded-md border border-dark-100 text-sm whitespace-pre-wrap min-h-[80px]">
                    {{ product.description || '-' }}
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Product Description (Chinese)</label>
                  <textarea v-model="product.translations.zh.description"
                    class="w-full px-3 py-2 bg-dark-400 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors text-sm"
                    placeholder="Enter Chinese description" rows="4"></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="!loading" class="text-center py-10 text-gray-400">No products found</div>
      </div>
    </div>

    <!-- Product Variants Section -->
    <div class="mt-6 bg-dark-200 p-6 rounded-md border border-dark-100">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-blue-300">Product Variants</h2>
        <button @click="toggleProductVariantsCollapse"
          class="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors text-sm flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
              v-if="isProductVariantsCollapsed" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" v-else />
          </svg>
          {{ isProductVariantsCollapsed ? 'Expand' : 'Collapse' }}
        </button>
      </div>

      <div v-if="!isProductVariantsCollapsed">
        <div v-if="productVariants.length > 0">
          <!-- product-variants-table -->
          <!-- class="min-w-full bg-dark-300 rounded-md overflow-hidden" -->
          <div class="overflow-x-auto">
            <table class="w-full table-fixed">
              <thead class="bg-dark-100">
                <tr>
                  <th class="w-[2%] px-3 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-300" @click="toggleSortOrderVariants">
                    ID</th>
                  <th class="w-[15%] px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Product</th>
                  <th class="w-[33%] px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Variant Name (English)</th>
                  <th class="w-[30%] px-3 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Variant Name (Chinese)</th>
                  <th class="w-[20%] px-3 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions</th>
                </tr>
              </thead>

              <tbody class="divide-y divide-dark-100">
                <template v-for="variant in productVariants" :key="variant.id">
                  <tr class="bg-dark-300 hover:bg-dark-200 transition-colors">
                    <td class="text-left px-3 py-4 whitespace-nowrap text-sm text-gray-300">{{ variant.id }}</td>
                    <td class="text-left px-6 py-4 whitespace-nowrap text-sm text-gray-300">{{ variant.product.name }}</td>
                    <td class="text-left px-6 py-4 whitespace-nowrap">
                      <div class="text-center text-sm text-gray-300">{{ variant.name }}</div>
                      <div class="text-center text-xs text-gray-500 font-mono">({{ variant.sku }})</div>
                    </td>
                    <td class="text-center px-6 py-4 whitespace-nowrap">
                      <input v-model="variant.translations.zh.name" type="text"
                        class="w-full px-3 py-2 bg-dark-400 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors text-sm"
                        placeholder="Enter Chinese variant name">
                    </td>
                    <td class="text-center px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div class="flex items-center gap-2">
                        <button @click="translateProductVariant(variant)" :disabled="isTranslating.includes(variant.id)"
                          class="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs">
                          {{ isTranslating.includes(variant.id) ? 'Translating...' : 'Translate' }}
                        </button>
                        <button @click="updateProductVariant(variant)" :disabled="isUpdating.includes(variant.id)"
                          class="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs">
                          {{ isUpdating.includes(variant.id) ? 'Updating...' : 'Update' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>

            </table>
          </div>
        </div>
        <div v-else-if="!loading" class="text-center py-10 text-gray-400">No product variants found</div>
      </div>
    </div>




  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

// Get auth token from store
const authStore = useAuthStore()

// State
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const collections = ref([])
const facets = ref([])
const productOptionGroups = ref([])
const products = ref([])
const productVariants = ref([])
const isUpdating = ref([])
const isTranslating = ref([])
const isCollapsed = ref(true)
const sortOrder = ref('asc')
const sortOrderProducts = ref('asc')
const sortOrderVariants = ref('asc')
const isFacetsCollapsed = ref(true)
const isProductOptionGroupsCollapsed = ref(true)
const isProductsCollapsed = ref(true)
const isProductVariantsCollapsed = ref(true)

// Auto-dismiss success messages after 3 seconds
const autoDismissSuccess = () => {
  if (successMessage.value) {
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  }
}

// Auto-dismiss error messages after 5 seconds
const autoDismissError = () => {
  if (error.value) {
    setTimeout(() => {
      error.value = ''
    }, 5000)
  }
}

// Watch for message changes to trigger auto-dismiss
// import { watch } from 'vue'
watch(successMessage, autoDismissSuccess)
watch(error, autoDismissError)

// Create Apollo Client with token and channel token
const createApolloClient = (authToken, channelToken = null) => {
  // 从环境变量中获取 API 地址，同时设置默认值防止环境变量未定义
  const apiUrl = import.meta.env.VITE_VENDURE_ADMIN_API_URL 
  const httpLink = createHttpLink({
    uri: apiUrl,
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

// GraphQL query to get all collections
const GET_COLLECTIONS_QUERY = gql`
  query {
    collections {
      items {
        id
        name
        description
        slug
        translations {
          languageCode
          name
          slug
          description
        }
      }
      totalItems
    }
  }
`

// GraphQL query to get all facets with their values
const GET_FACETS_QUERY = gql`
  query {
    facets {
      items {
        id
        name
        code
        translations {
          languageCode
          name
        }
        values {
          id
          name
          code
          translations {
            languageCode
            name
          }
        }
      }
      totalItems
    }
  }
`

// GraphQL mutation to update collection
const UPDATE_COLLECTION_MUTATION = gql`
  mutation UpdateCollectionZh($input: UpdateCollectionInput!) {
    updateCollection(input: $input) {
      id
      name
      slug
      description
      translations {
        languageCode
        name
        slug
        description
      }
    }
  }
`

// GraphQL mutation to update facet
const UPDATE_FACET_MUTATION = gql`
  mutation UpdateFacet($input: UpdateFacetInput!) {
    updateFacet(input: $input) {
      id
      code
      name
      translations {
        languageCode
        name
      }
    }
  }
`

// GraphQL mutation to update facet value
const UPDATE_FACET_VALUE_MUTATION = gql`
  mutation UpdateFacetValue($input: UpdateFacetValueInput!) {
    updateFacetValue(input: $input) {
      id
      code
      name
      translations {
        languageCode
        name
      }
      facet {
        id
        name
      }
    }
  }
`

// GraphQL query to get all product option groups with their options
const GET_PRODUCT_OPTION_GROUPS_QUERY = gql`
  query {
    productOptionGroups {
      items {
        id
        code
        name
        translations {
          languageCode
          name
        }
        options {
          id
          code
          name
          translations {
            languageCode
            name
          }
        }
      }
    }
  }
`

// GraphQL mutation to update product option group
const UPDATE_PRODUCT_OPTION_GROUP_MUTATION = gql`
  mutation UpdateProductOptionGroup($input: UpdateProductOptionGroupInput!) {
    updateProductOptionGroup(input: $input) {
      id
      code
      name
      translations {
        languageCode
        name
      }
      options {
        id
        code
        name
        translations {
          languageCode
          name
        }
      }
    }
  }
`

// GraphQL mutation to update product option
const UPDATE_PRODUCT_OPTION_MUTATION = gql`
  mutation UpdateProductOption($input: UpdateProductOptionInput!) {
    updateProductOption(input: $input) {
      id
      code
      name
      translations {
        languageCode
        name
      }
    }
  }
`

// GraphQL query to get all products
const GET_PRODUCTS_QUERY = gql`
  query {
    products {
      items {
        id
        name
        slug
        description
        translations {
          languageCode
          name
          description
        }
      }
      totalItems
    }
  }
`

// GraphQL query to get all product variants with their translations
const GET_PRODUCT_VARIANTS_QUERY = gql`
  query {
    productVariants {
      items {
        id
        name
        sku
        product {
          id
          name
        }
        translations {
          languageCode
          name
        }
      }
      totalItems
    }
  }
`

// GraphQL mutation to update product
const UPDATE_PRODUCT_MUTATION = gql`
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      id
      name
      slug
      description
      translations {
        languageCode
        name
        description
      }
    }
  }
`

// GraphQL mutation to update product variants
const UPDATE_PRODUCT_VARIANT_MUTATION = gql`
  mutation UpdateProductVariantTranslations($input: UpdateProductVariantInput!) {
    updateProductVariant(input: $input) {
      id
      name
      sku
      translations {
        languageCode
        name
      }
    }
  }
`

// Sort collections by ID
const sortCollections = (collectionsList, order) => {
  return [...collectionsList].sort((a, b) => {
    const idA = parseInt(a.id)
    const idB = parseInt(b.id)
    return order === 'asc' ? idA - idB : idB - idA
  })
}

// Sort products by ID
const sortProducts = (productsList, order) => {
  return [...productsList].sort((a, b) => {
    const idA = parseInt(a.id)
    const idB = parseInt(b.id)
    return order === 'asc' ? idA - idB : idB - idA
  })
}

// Sort product variants by ID
const sortProductVariants = (variantsList, order) => {
  return [...variantsList].sort((a, b) => {
    const idA = parseInt(a.id)
    const idB = parseInt(b.id)
    return order === 'asc' ? idA - idB : idB - idA
  })
}

// Fetch all collections
const fetchCollections = async () => {
  loading.value = true
  error.value = ''

  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.query({
      query: GET_COLLECTIONS_QUERY,
      fetchPolicy: 'network-only'
    })

    if (result.data && result.data.collections && result.data.collections.items) {
      // Process collections to add zh translations if they don't exist
      const processedCollections = result.data.collections.items.map(collection => {
        // Find existing zh translation or create new one
        const existingZhTranslation = collection.translations?.find(t => t.languageCode === 'zh') || null

        // Create a new writable object for the zh translation
        const zhTranslation = existingZhTranslation
          ? {
            ...existingZhTranslation, // Make a copy to ensure it's writable
            slug: collection.slug // Always use current collection slug
          }
          : {
            languageCode: 'zh',
            name: '',
            slug: collection.slug,
            description: ''
          }

        // Create a completely new object with all writable properties
        return {
          ...collection,
          translations: {
            zh: zhTranslation
          }
        }
      })

      // Sort collections by ID
      collections.value = sortCollections(processedCollections, sortOrder.value)
    }
  } catch (err) {
    error.value = err.message
    console.error('Error fetching collections:', err)
  } finally {
    loading.value = false
  }
}

// Toggle sort order
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  collections.value = sortCollections(collections.value, sortOrder.value)
}

// Toggle sort order for products
const toggleSortOrderProducts = () => {
  sortOrderProducts.value = sortOrderProducts.value === 'asc' ? 'desc' : 'asc'
  products.value = sortProducts(products.value, sortOrderProducts.value)
}

// Toggle sort order for product variants
const toggleSortOrderVariants = () => {
  sortOrderVariants.value = sortOrderVariants.value === 'asc' ? 'desc' : 'asc'
  productVariants.value = sortProductVariants(productVariants.value, sortOrderVariants.value)
}

// Toggle collapse state
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// // Translate collection name to Chinese
// const translateCollectionName = async (collection) => {
//   try {
//     isTranslating.value.push(collection.id)

//     console.log('Translating:', collection.name, 'to Chinese')

//     // Call translation API using GET request with query parameters
//     const response = await axios.get('https://linefs.favor100.site/v_trans', {
//       params: {
//         text: collection.name,
//         dest: 'zh-cn'
//       }
//     })

//     console.log('----------------> Translation response:', response.data)

//     // Fill translated text into Chinese name input
//     if (response.data && response.data.text) {
//       collection.translations.zh.name = response.data.text
//       successMessage.value = `Successfully translated: ${collection.name} → ${response.data.text}`
//     } else {
//       throw new Error('Invalid translation response format')
//     }
//   } catch (err) {
//     console.error('Translation error details:', err)
//     error.value = `Translation error: ${err.response?.data?.message || err.message}`
//   } finally {
//     isTranslating.value = isTranslating.value.filter(id => id !== collection.id)
//   }
// }


// Translate collection name and description to Chinese
const translateCollection = async (collection) => {
  try {
    isTranslating.value.push(collection.id)

    // Translate the name first using GET request
    console.log('Translating name:', collection.name, 'to Chinese')

    const nameResponse = await axios.get('https://linefs.favor100.site/v_trans', {
      params: {
        text: collection.name,
        dest: 'zh-cn'
      }
    })

    console.log('----------------> Name translation response:', nameResponse.data)

    // Translate description if it exists
    let descriptionResponse = null
    let translatedDescription = ''

    if (collection.description) {
      console.log('Translating description to Chinese')
      descriptionResponse = await axios.get('https://linefs.favor100.site/v_trans', {
        params: {
          text: collection.description,
          dest: 'zh-cn'
        }
      })
      console.log('----------------> Description translation response:', descriptionResponse.data)
      translatedDescription = descriptionResponse.data.text
    }

    // Update the collection with translated values
    if (nameResponse.data && nameResponse.data.text) {
      collection.translations.zh.name = nameResponse.data.text

      if (collection.description && descriptionResponse?.data?.text) {
        collection.translations.zh.description = descriptionResponse.data.text
        successMessage.value = `Successfully translated name and description for: ${collection.name}`
      } else {
        successMessage.value = `Successfully translated name for: ${collection.name}`
      }
    } else {
      throw new Error('Invalid translation response format')
    }
  } catch (err) {
    console.error('Translation error details:', err)
    error.value = `Translation error: ${err.response?.data?.message || err.message}`
  } finally {
    isTranslating.value = isTranslating.value.filter(id => id !== collection.id)
  }
}

// Update collection with Chinese translation
const updateCollection = async (collection) => {
  isUpdating.value.push(collection.id)
  error.value = ''
  successMessage.value = ''

  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)

    const result = await apolloClient.mutate({
      mutation: UPDATE_COLLECTION_MUTATION,
      variables: {
        input: {
          id: collection.id,
          translations: [{
            languageCode: 'zh',
            name: collection.translations.zh.name.trim(),
            slug: collection.slug, // Always use default slug
            description: collection.translations.zh.description.trim()
          }]
        }
      }
    })

    successMessage.value = `Successfully updated collection: ${collection.name}`
    console.log('Collection updated:', result.data.updateCollection)
  } catch (err) {
    error.value = err.message
    console.error('Error updating collection:', err)
  } finally {
    isUpdating.value = isUpdating.value.filter(id => id !== collection.id)
  }
}

// Fetch all facets
const fetchFacets = async () => {
  loading.value = true
  error.value = ''

  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.query({
      query: GET_FACETS_QUERY,
      fetchPolicy: 'network-only'
    })

    if (result.data && result.data.facets && result.data.facets.items) {
      // Process facets to add zh translations if they don't exist
      const processedFacets = result.data.facets.items.map(facet => {
        // Find existing zh translation or create new one for facet
        const existingZhTranslation = facet.translations?.find(t => t.languageCode === 'zh') || null
        const zhTranslation = existingZhTranslation
          ? { ...existingZhTranslation }
          : { languageCode: 'zh', name: '' }

        // Process facet values
        const processedValues = facet.values.map(value => {
          const existingValueZhTranslation = value.translations?.find(t => t.languageCode === 'zh') || null
          const valueZhTranslation = existingValueZhTranslation
            ? { ...existingValueZhTranslation }
            : { languageCode: 'zh', name: '' }

          return {
            ...value,
            translations: {
              zh: valueZhTranslation
            }
          }
        })

        return {
          ...facet,
          translations: {
            zh: zhTranslation
          },
          values: processedValues
        }
      })

      facets.value = processedFacets
    }
  } catch (err) {
    error.value = err.message
    console.error('Error fetching facets:', err)
  } finally {
    loading.value = false
  }
}

// Translate facet name to Chinese
const translateFacet = async (facet) => {
  isTranslating.value.push(facet.id)
  error.value = ''
  successMessage.value = ''

  try {
    // Call translation API using GET request
    const response = await axios.get('https://linefs.favor100.site/v_trans', {
      params: {
        text: facet.name,
        dest: 'zh-cn'
      }
    })

    if (response.data && response.data.text) {
      facet.translations.zh.name = response.data.text
      successMessage.value = `Successfully translated facet: ${facet.name}`
    } else {
      throw new Error('Invalid translation response format')
    }
  } catch (err) {
    console.error('Translation error details:', err)
    error.value = `Translation error: ${err.response?.data?.message || err.message}`
  } finally {
    isTranslating.value = isTranslating.value.filter(id => id !== facet.id)
  }
}

// Translate facet value to Chinese
const translateFacetValue = async (facetValue) => {
  isTranslating.value.push(facetValue.id)
  error.value = ''
  successMessage.value = ''

  try {
    // Call translation API using GET request
    const response = await axios.get('https://linefs.favor100.site/v_trans', {
      params: {
        text: facetValue.name,
        dest: 'zh-cn'
      }
    })

    if (response.data && response.data.text) {
      facetValue.translations.zh.name = response.data.text
      successMessage.value = `Successfully translated facet value: ${facetValue.name}`
    } else {
      throw new Error('Invalid translation response format')
    }
  } catch (err) {
    console.error('Translation error details:', err)
    error.value = `Translation error: ${err.response?.data?.message || err.message}`
  } finally {
    isTranslating.value = isTranslating.value.filter(id => id !== facetValue.id)
  }
}

// Update facet with Chinese translation
const updateFacet = async (facet) => {
  isUpdating.value.push(facet.id)
  error.value = ''
  successMessage.value = ''

  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)

    const result = await apolloClient.mutate({
      mutation: UPDATE_FACET_MUTATION,
      variables: {
        input: {
          id: facet.id,
          translations: [{
            languageCode: 'zh',
            name: facet.translations.zh.name.trim()
          }]
        }
      }
    })

    successMessage.value = `Successfully updated facet: ${facet.name}`
    console.log('Facet updated:', result.data.updateFacet)
  } catch (err) {
    error.value = err.message
    console.error('Error updating facet:', err)
  } finally {
    isUpdating.value = isUpdating.value.filter(id => id !== facet.id)
  }
}

// Update facet value with Chinese translation
const updateFacetValue = async (facetValue) => {
  isUpdating.value.push(facetValue.id)
  error.value = ''
  successMessage.value = ''

  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)

    const result = await apolloClient.mutate({
      mutation: UPDATE_FACET_VALUE_MUTATION,
      variables: {
        input: {
          id: facetValue.id,
          translations: [{
            languageCode: 'zh',
            name: facetValue.translations.zh.name.trim()
          }]
        }
      }
    })

    successMessage.value = `Successfully updated facet value: ${facetValue.name}`
    console.log('Facet value updated:', result.data.updateFacetValue)
  } catch (err) {
    error.value = err.message
    console.error('Error updating facet value:', err)
  } finally {
    isUpdating.value = isUpdating.value.filter(id => id !== facetValue.id)
  }
}

// Toggle collapse state for facets
const toggleFacetsCollapse = () => {
  isFacetsCollapsed.value = !isFacetsCollapsed.value
}

// Fetch all product options
const fetchProductOptionGroups = async () => {
  loading.value = true
  error.value = ''

  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.query({
      query: GET_PRODUCT_OPTION_GROUPS_QUERY,
      fetchPolicy: 'network-only'
    })

    if (result.data && result.data.productOptionGroups && result.data.productOptionGroups.items) {
      // Process product option groups to add zh translations if they don't exist
      const processedGroups = result.data.productOptionGroups.items.map(group => {
        // Find existing zh translation or create new one for group
        const existingZhTranslation = group.translations?.find(t => t.languageCode === 'zh') || null
        const zhTranslation = existingZhTranslation
          ? { ...existingZhTranslation }
          : { languageCode: 'zh', name: '' }

        // Process group options
        const processedOptions = group.options.map(option => {
          const existingOptionZhTranslation = option.translations?.find(t => t.languageCode === 'zh') || null
          const optionZhTranslation = existingOptionZhTranslation
            ? { ...existingOptionZhTranslation }
            : { languageCode: 'zh', name: '' }

          return {
            ...option,
            translations: {
              zh: optionZhTranslation
            }
          }
        })

        return {
          ...group,
          translations: {
            zh: zhTranslation
          },
          options: processedOptions
        }
      })

      productOptionGroups.value = processedGroups
    }
  } catch (err) {
    error.value = err.message
    console.error('Error fetching product option groups:', err)
  } finally {
    loading.value = false
  }
}



// Translate product option group name to Chinese
const translateProductOptionGroup = async (group) => {
  isTranslating.value.push(group.id)
  error.value = ''
  successMessage.value = ''

  try {
    // Call translation API using GET request
    const response = await axios.get('https://linefs.favor100.site/v_trans', {
      params: {
        text: group.name,
        dest: 'zh-cn'
      }
    })

    if (response.data && response.data.text) {
      group.translations.zh.name = response.data.text
      successMessage.value = `Successfully translated product option group: ${group.name}`
    } else {
      throw new Error('Invalid translation response format')
    }
  } catch (err) {
    console.error('Translation error details:', err)
    error.value = `Translation error: ${err.response?.data?.message || err.message}`
  } finally {
    isTranslating.value = isTranslating.value.filter(id => id !== group.id)
  }
}

// Update product option group with Chinese translation
const updateProductOptionGroup = async (group) => {
  isUpdating.value.push(group.id)
  error.value = ''
  successMessage.value = ''

  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)

    const result = await apolloClient.mutate({
      mutation: UPDATE_PRODUCT_OPTION_GROUP_MUTATION,
      variables: {
        input: {
          id: group.id,
          translations: [{
            languageCode: 'zh',
            name: group.translations.zh.name.trim()
          }]
        }
      }
    })

    successMessage.value = `Successfully updated product option group: ${group.name}`
    console.log('Product option group updated:', result.data.updateProductOptionGroup)
  } catch (err) {
    error.value = err.message
    console.error('Error updating product option group:', err)
  } finally {
    isUpdating.value = isUpdating.value.filter(id => id !== group.id)
  }
}

// Translate product option name to Chinese
const translateProductOption = async (option) => {
  isTranslating.value.push(option.id)
  error.value = ''
  successMessage.value = ''

  try {
    // Call translation API using GET request
    const response = await axios.get('https://linefs.favor100.site/v_trans', {
      params: {
        text: option.name,
        dest: 'zh-cn'
      }
    })

    if (response.data && response.data.text) {
      option.translations.zh.name = response.data.text
      successMessage.value = `Successfully translated product option: ${option.name}`
    } else {
      throw new Error('Invalid translation response format')
    }
  } catch (err) {
    console.error('Translation error details:', err)
    error.value = `Translation error: ${err.response?.data?.message || err.message}`
  } finally {
    isTranslating.value = isTranslating.value.filter(id => id !== option.id)
  }
}

// Update product option with Chinese translation
const updateProductOption = async (option) => {
  isUpdating.value.push(option.id)
  error.value = ''
  successMessage.value = ''

  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)

    const result = await apolloClient.mutate({
      mutation: UPDATE_PRODUCT_OPTION_MUTATION,
      variables: {
        input: {
          id: option.id,
          translations: [{
            languageCode: 'zh',
            name: option.translations.zh.name.trim()
          }]
        }
      }
    })

    successMessage.value = `Successfully updated product option: ${option.name}`
    console.log('Product option updated:', result.data.updateProductOption)
  } catch (err) {
    error.value = err.message
    console.error('Error updating product option:', err)
  } finally {
    isUpdating.value = isUpdating.value.filter(id => id !== option.id)
  }
}

// Toggle collapse state for product option groups
const toggleProductOptionGroupsCollapse = () => {
  isProductOptionGroupsCollapsed.value = !isProductOptionGroupsCollapsed.value
}

// Fetch all products
const fetchProducts = async () => {
  loading.value = true
  error.value = ''

  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.query({
      query: GET_PRODUCTS_QUERY,
      fetchPolicy: 'network-only'
    })

    if (result.data && result.data.products && result.data.products.items) {
      // Process products to add zh translations if they don't exist
      const processedProducts = result.data.products.items.map(product => {
        // Find existing zh translation or create new one for product
        const existingZhTranslation = product.translations?.find(t => t.languageCode === 'zh') || null
        const zhTranslation = existingZhTranslation
          ? {
            ...existingZhTranslation,
            slug: product.slug // Always use current product slug
          }
          : {
            languageCode: 'zh',
            name: '',
            slug: product.slug, // Use current product slug
            description: ''
          }

        return {
          ...product,
          translations: {
            zh: zhTranslation
          }
        }
      })

      products.value = sortProducts(processedProducts, sortOrderProducts.value)
    }
  } catch (err) {
    error.value = err.message
    console.error('Error fetching products:', err)
  } finally {
    loading.value = false
  }
}

// Fetch all product variants
const fetchProductVariants = async () => {
  loading.value = true
  error.value = ''

  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)
    const result = await apolloClient.query({
      query: GET_PRODUCT_VARIANTS_QUERY,
      fetchPolicy: 'network-only'
    })

    if (result.data && result.data.productVariants && result.data.productVariants.items) {
      // Process product variants to add zh translations if they don't exist
      const processedVariants = result.data.productVariants.items.map(variant => {
        // Find existing zh translation or create new one for variant
        const existingZhTranslation = variant.translations?.find(t => t.languageCode === 'zh') || null
        const zhTranslation = existingZhTranslation
          ? { ...existingZhTranslation }
          : {
            languageCode: 'zh',
            name: ''
          }

        return {
          ...variant,
          translations: {
            zh: zhTranslation
          }
        }
      })

      productVariants.value = sortProductVariants(processedVariants, sortOrderVariants.value)
    }
  } catch (err) {
    error.value = err.message
    console.error('Error fetching product variants:', err)
  } finally {
    loading.value = false
  }
}

// Translate product name to Chinese
const translateProductName = async (product) => {
  isTranslating.value.push(product.id)
  error.value = ''
  successMessage.value = ''

  try {
    // Call translation API using GET request
    const response = await axios.get('https://linefs.favor100.site/v_trans', {
      params: {
        text: product.name,
        dest: 'zh-cn'
      }
    })

    if (response.data && response.data.text) {
      product.translations.zh.name = response.data.text
      successMessage.value = `Successfully translated product name: ${product.name}`
    } else {
      throw new Error('Invalid translation response format')
    }
  } catch (err) {
    console.error('Translation error details:', err)
    error.value = `Translation error: ${err.response?.data?.message || err.message}`
  } finally {
    isTranslating.value = isTranslating.value.filter(id => id !== product.id)
  }
}

// Translate product description to Chinese
const translateProductDescription = async (product) => {
  isTranslating.value.push(product.id)
  error.value = ''
  successMessage.value = ''

  try {
    // Call translation API using GET request
    const response = await axios.get('https://linefs.favor100.site/v_trans', {
      params: {
        text: product.description,
        dest: 'zh-cn'
      }
    })

    if (response.data && response.data.text) {
      product.translations.zh.description = response.data.text
      successMessage.value = `Successfully translated product description: ${product.name}`
    } else {
      throw new Error('Invalid translation response format')
    }
  } catch (err) {
    console.error('Translation error details:', err)
    error.value = `Translation error: ${err.response?.data?.message || err.message}`
  } finally {
    isTranslating.value = isTranslating.value.filter(id => id !== product.id)
  }
}

// Update product with Chinese translations
const updateProduct = async (product) => {
  isUpdating.value.push(product.id)
  error.value = ''
  successMessage.value = ''

  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)

    const result = await apolloClient.mutate({
      mutation: UPDATE_PRODUCT_MUTATION,
      variables: {
        input: {
          id: product.id,
          translations: [{
            languageCode: 'zh',
            name: product.translations.zh.name.trim(),
            slug: product.slug, // Always use current product slug for translations
            description: product.translations.zh.description.trim()
          }]
        }
      }
    })

    successMessage.value = `Successfully updated product: ${product.name}`
    console.log('Product updated:', result.data.updateProduct)
  } catch (err) {
    error.value = err.message
    console.error('Error updating product:', err)
  } finally {
    isUpdating.value = isUpdating.value.filter(id => id !== product.id)
  }
}

// Copy product slug to clipboard
const copyProductSlug = async (product) => {
  try {
    await navigator.clipboard.writeText(product.slug)
    successMessage.value = `Successfully copied slug for: ${product.name}`
  } catch (err) {
    console.error('Copy slug error:', err)
    error.value = `Failed to copy slug: ${err.message}`
  }
}

// Translate product variant name to Chinese
const translateProductVariant = async (variant) => {
  isTranslating.value.push(variant.id)
  error.value = ''
  successMessage.value = ''

  try {
    // Call translation API using GET request
    const response = await axios.get('https://linefs.favor100.site/v_trans', {
      params: {
        text: variant.name,
        dest: 'zh-cn'
      }
    })

    if (response.data && response.data.text) {
      variant.translations.zh.name = response.data.text
      successMessage.value = `Successfully translated product variant: ${variant.name}`
    } else {
      throw new Error('Invalid translation response format')
    }
  } catch (err) {
    console.error('Translation error details:', err)
    error.value = `Translation error: ${err.response?.data?.message || err.message}`
  } finally {
    isTranslating.value = isTranslating.value.filter(id => id !== variant.id)
  }
}

// Update product variant with Chinese translation
const updateProductVariant = async (variant) => {
  isUpdating.value.push(variant.id)
  error.value = ''
  successMessage.value = ''

  try {
    const apolloClient = createApolloClient(authStore.token, import.meta.env.VITE_CHANNEL_TOKEN || null)

    const result = await apolloClient.mutate({
      mutation: UPDATE_PRODUCT_VARIANT_MUTATION,
      variables: {
        input: {
          id: variant.id,
          translations: [{
            languageCode: 'zh',
            name: variant.translations.zh.name.trim()
          }]
        }
      }
    })

    successMessage.value = `Successfully updated product variant: ${variant.name}`
    console.log('Product variant updated:', result.data.updateProductVariant)
  } catch (err) {
    error.value = err.message
    console.error('Error updating product variant:', err)
  } finally {
    isUpdating.value = isUpdating.value.filter(id => id !== variant.id)
  }
}

// Toggle collapse state for products
const toggleProductsCollapse = () => {
  isProductsCollapsed.value = !isProductsCollapsed.value
}

// Toggle collapse state for product variants
const toggleProductVariantsCollapse = () => {
  isProductVariantsCollapsed.value = !isProductVariantsCollapsed.value
}

// Fetch collections, facets, product option groups, products, and product variants on component mount
onMounted(async () => {
  await Promise.all([fetchCollections(), fetchFacets(), fetchProductOptionGroups(), fetchProducts(), fetchProductVariants()])
})
</script>

<style scoped>
.i18n-zh-page {
  margin-top: 2rem;
}

/* Facet Values table column adjustments */
:deep(.overflow-x-auto table.min-w-full) {

  /* Facet Value column - first column */
  th:nth-child(1),
  td:nth-child(1) {
    width: 250px;
    max-width: 250px;
  }

  /* Code column - second column */
  th:nth-child(2),
  td:nth-child(2) {
    width: 150px;
    max-width: 150px;
  }
}
</style>