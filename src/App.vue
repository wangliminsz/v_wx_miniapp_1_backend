<template>
  <div class="min-h-screen bg-dark-100">
    <div class="max-w-6xl mx-auto px-4 pt-16 pb-10">
      <!-- Header -->
      <h1 class="text-3xl font-bold text-center mb-8 text-dark-300 drop-shadow-lg">Vendure Admin Panel</h1>

      <!-- User info bar -->
      <div v-if="authStore.isAuthenticated" class="mb-4 bg-dark-200 p-4 rounded-md border border-dark-100">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <span class="text-gray-300">
              <span class="font-semibold text-blue-300">{{ authStore.user?.identifier }}</span>
            </span>
            <span v-if="authStore.activeChannel" class="px-3 py-1 bg-blue-600/30 text-blue-300 rounded-full text-sm">
              Channel: {{ authStore.activeChannel.code }} ({{ authStore.activeChannel.currencyCode }})
            </span>
          </div>
          <button @click="handleLogout"
            class="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-500 transition-colors">
            Logout
          </button>
        </div>
      </div>

      <!-- Navigation menu for authenticated users -->
      <div v-if="authStore.isAuthenticated" class="mb-6 bg-dark-200 p-4 rounded-md border border-dark-100">
        <nav class="flex flex-wrap gap-4">
          
          <router-link to="/" class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors"
            active-class="bg-primary">
            Search
          </router-link>

          <router-link to="/products" class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors"
            active-class="bg-primary">
            Product List
          </router-link>



          <!-- <router-link to="/channels/clone"
            v-if="authStore.channels.length > 1"
            class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors"
            active-class="bg-primary">
            Clone Channel
          </router-link> -->
          <!-- <router-link to="/import"
            class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors"
            active-class="bg-primary">
            Import
          </router-link> -->
          <!-- <router-link to="/import/product"
            class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors"
            active-class="bg-primary">
            Import Product
          </router-link> -->
          <!-- <router-link to="/i18n/zh"
            class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors"
            active-class="bg-primary">
            i18n(zh-cn)
          </router-link> -->
        </nav>
      </div>

      <!-- Router View - This is where all pages will be rendered -->
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from './stores/auth.js'
import { onMounted } from 'vue'

// Initialize auth store
const authStore = useAuthStore()

// Logout handler
const handleLogout = () => {
  authStore.logout()
}

// Fetch user channels on mount if authenticated
onMounted(() => {
  if (authStore.isAuthenticated && authStore.token && authStore.channels.length === 0) {
    authStore.fetchUserChannels()
  }
})
</script>
