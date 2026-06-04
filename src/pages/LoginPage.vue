<template>
  <div class="login-page pt-8 mt-8">
    <div class="login-container">
      <!-- <h1 class="text-2xl font-semibold text-gray-300 mb-6">Vendure Export Tool</h1> -->
      
      <!-- Login form -->
      <div class="bg-dark-200 p-6 rounded-md border border-dark-100">
        <h2 class="text-xl font-bold text-blue-300 mb-4">Login</h2>
        
        <!-- Channel info display -->
        <div class="mb-4 p-3 bg-yellow-900/30 border border-yellow-600 rounded-md">
          <p class="text-sm text-yellow-300"><strong>Current Channel:</strong></p>
          <p v-if="currentChannelName" class="text-sm text-yellow-200 font-mono mt-1">
            Channel: {{ currentChannelName }} <br>
            Token: {{ currentChannelToken }}
          </p>
          <p v-else class="text-sm text-yellow-200 font-mono mt-1">
            Token: {{ currentChannelToken }}
          </p>
        </div>
        
        <!-- Error message -->
        <div v-if="error" class="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md mb-4">
          <p class="text-sm">{{ error }}</p>
        </div>
        
        <form @submit.prevent="handleLogin">
          <div class="mb-4">
            <label for="username" class="block text-sm font-medium text-gray-300 mb-2">Username:</label>
            <input 
              type="text" 
              id="username" 
              v-model="username" 
              placeholder="Enter username" 
              class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors"
              required
            >
          </div>
          
          <div class="mb-6">
            <label for="password" class="block text-sm font-medium text-gray-300 mb-2">Password:</label>
            <input 
              type="password" 
              id="password" 
              v-model="password" 
              placeholder="Enter password" 
              class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors"
              required
            >
          </div>
          
          <button 
            type="submit" 
            :disabled="isLoggingIn"
            class="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isLoggingIn ? 'Logging in...' : 'Login' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getCachedChannelName, getChannelTokenFromQuery } from '../utils/channelToken.js'

const router = useRouter()
const authStore = useAuthStore()

// sessionStorage.removeItem('cached_channel_token')

const currentChannelName = getCachedChannelName()
const currentChannelToken = getChannelTokenFromQuery()

// Form state
const username = ref('')
const password = ref('')
const error = ref('')
const isLoggingIn = ref(false)

// Handle login
const handleLogin = async () => {
  isLoggingIn.value = true
  error.value = ''
  
  try {
    await authStore.login(username.value, password.value)
    // Redirect to product list on success
    router.push('/')
  } catch (err) {
    error.value = err.message
  } finally {
    isLoggingIn.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  /* align-items: center; */
  padding: 1rem;
}

.login-container {
  width: 100%;
  max-width: 400px;
}
</style>
