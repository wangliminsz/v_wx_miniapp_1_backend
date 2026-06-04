<template>
  <div v-if="appReady" class="min-h-screen bg-dark-100">
    <div class="max-w-6xl mx-auto px-4 pt-16 pb-10">
      <h1 class="text-3xl font-bold text-center mb-8 text-dark-300 drop-shadow-lg">Admin Panel</h1>

      <div v-if="authStore.isAuthenticated" class="mb-4 bg-dark-200 p-4 rounded-md border border-dark-100">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <span class="text-gray-300">
              <span class="font-semibold text-blue-300">{{ authStore.user?.identifier }}</span>
              <span v-if="isSuperAdmin" class="ml-2 px-2 py-0.5 bg-purple-600/40 text-purple-300 rounded text-xs font-bold">SuperAdmin</span>
            </span>
            <span v-if="channelName" class="px-3 py-1 bg-yellow-600/30 text-yellow-300 rounded-full text-sm">
              Channel: {{ channelName }}
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

      <div v-if="authStore.isAuthenticated" class="mb-6 bg-dark-200 p-4 rounded-md border border-dark-100">
        <nav class="flex flex-wrap gap-4">
          <router-link to="/products/paginated" class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors"
            activeClass="bg-primary">
            Product by Page
          </router-link>
          <router-link to="/variants-with-group" class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors"
            activeClass="bg-primary">
            Variants with Group
          </router-link>
          <router-link to="/search" class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors"
            activeClass="bg-primary">
            Search
          </router-link>
          <router-link to="/orders" class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors"
            activeClass="bg-primary">
            Orders
          </router-link>
          <router-link to="/customers" class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors"
            activeClass="bg-primary">
            Customers
          </router-link>
          <router-link to="/customer-groups" class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors"
            activeClass="bg-primary">
            Customer Groups
          </router-link>
         
          <router-link to="/channels/clone"
            v-if="isSuperAdmin"
            class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors"
            active-class="bg-primary">
            Clone Channel
          </router-link>



          <router-link to="/import" v-if="isSuperAdmin"
            class="px-4 py-2 bg-gray-600 text-white rounded-md  transition-colors"
            active-class="bg-primary">
            Import
          </router-link>

          <router-link to="/import/product" v-if="isSuperAdmin"
            class="px-4 py-2 bg-gray-600 text-white rounded-md  transition-colors"
            active-class="bg-primary">
            Import Product
          </router-link>


          <router-link to="/i18n/zh" v-if="isSuperAdmin"
            class="px-4 py-2 bg-gray-600 text-white rounded-md  transition-colors"
            active-class="bg-primary">
            i18n(zh-cn)
          </router-link>


           <button @click="generateAuthCode"
            class="px-4 py-2 bg-green-600 text-white rounded-md transition-colors hover:bg-green-500"
            :disabled="generatingCode">
            {{ generatingCode ? 'Generating...' : 'Auth Code' }}
          </button>
          <select v-if="isSuperAdmin" v-model="selectedAuthChannel"
            class="px-3 py-2 bg-dark-300 text-white rounded-md border border-dark-100 text-sm">
            <option v-for="ch in authStore.channels" :key="ch.code" :value="ch.code">
              {{ ch.code }}
            </option>
          </select>



        </nav>
      </div>

      <div v-if="authCode" class="mb-6 bg-green-900/30 border border-green-600 p-4 rounded-md relative">
        <button @click="authCode = ''" class="absolute top-2 right-2 text-green-300 hover:text-green-100 text-lg leading-none">&times;</button>
        <p class="text-green-300 font-bold text-lg">Auth Code: {{ authCode }}</p>
        <p v-if="authCodeChannel" class="text-green-400 text-sm mt-1">Channel: {{ authCodeChannel }}</p>
      </div>
      <div v-if="authCodeError" class="mb-6 bg-red-900/30 border border-red-500 p-4 rounded-md relative">
        <button @click="authCodeError = ''" class="absolute top-2 right-2 text-red-400 hover:text-red-200 text-lg leading-none">&times;</button>
        <p class="text-red-400">{{ authCodeError }}</p>
      </div>

      <router-view></router-view>
    </div>
  </div>
  <div v-else class="min-h-screen bg-dark-100 flex items-center justify-center">
    <p class="text-gray-400">Loading...</p>
  </div>
</template>

<script setup>
import { useAuthStore } from './stores/auth.js'
import { ref, onMounted } from 'vue'
import { initializeChannelToken, getCachedChannelName, getChannelTokenFromQuery } from './utils/channelToken.js'

const authStore = useAuthStore()
const appReady = ref(false)
const channelName = ref('')
const isSuperAdmin = ref(false)
const selectedAuthChannel = ref('')
const authCode = ref('')
const authCodeChannel = ref('')
const authCodeError = ref('')
const generatingCode = ref(false)

const handleLogout = () => {
  authStore.logout()
}

const generateAuthCode = async () => {
  generatingCode.value = true
  authCode.value = ''
  authCodeError.value = ''

  if (!authStore.activeChannel) {
    await authStore.fetchUserChannels()
  }

  const params = new URLSearchParams(window.location.search)
  let channelCode
  let channelToken

  if (isSuperAdmin.value && selectedAuthChannel.value) {
    channelCode = selectedAuthChannel.value
    const found = authStore.channels.find(c => c.code === channelCode)
    channelToken = found?.token || getChannelTokenFromQuery()
  } else {
    channelCode = params.get('channel') || authStore.activeChannel?.code || getCachedChannelName()
    channelToken = getChannelTokenFromQuery()
  }
  authCodeChannel.value = channelCode || ''

  if (!channelCode) {
    authCodeError.value = 'No channel code available'
    generatingCode.value = false
    return
  }

  const API_URL = import.meta.env.VITE_VENDURE_ADMIN_API_URL || import.meta.env.VITE_VENDURE_URL

  // console.log('channelCode ++++++++++++++++++++++++++++>>>>>>>>>>>>>>>>', channelCode)
  // console.log('channelToken ++++++++++++++++++++++++++++>>>>>>>>>>>>>>>>', channelToken)
  // console.log('API URL ++++++++++++++++++++++++++++>>>>>>>>>>>>>>>>', API_URL)

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`,
        'vendure-token': channelToken || ''
      },
      body: JSON.stringify({
        query: `mutation GenerateRegisterCode {
          generateRegisterCode(channelCode: "${channelCode}") {
            id
            code
            channel_code
            status
            openid
          }
        }`
      })
    })

    const data = await response.json()
    if (data.errors) {
      authCodeError.value = data.errors[0]?.message || 'Failed to generate auth code'
      return
    }

    authCode.value = data.data?.generateRegisterCode?.code || 'No code returned'
  } catch (e) {
    authCodeError.value = e.message
  } finally {
    generatingCode.value = false
  }
}

onMounted(async () => {
  await initializeChannelToken()
  channelName.value = getCachedChannelName() || ''
  if (authStore.isAuthenticated && authStore.token && authStore.channels.length === 0) {
    await authStore.fetchUserChannels()
  }

  if (authStore.isAuthenticated && authStore.token) {
    const API_URL = import.meta.env.VITE_VENDURE_ADMIN_API_URL || import.meta.env.VITE_VENDURE_URL
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({
          query: `query {
            activeAdministrator {
              user {
                roles {
                  code
                }
              }
            }
          }`
        })
      })
      const data = await response.json()
      if (data.data?.activeAdministrator) {
        console.log('isSuperAdmin ----------> 0604 data.data----->', data.data)
        const roles = data.data.activeAdministrator.user.roles
        isSuperAdmin.value = roles.some(r => r.code === '__super_admin_role__')
        console.log('isSuperAdmin ----------> 0604 isSuperAdmin----->', isSuperAdmin)
      }
    } catch (e) {
      console.error('Failed to check admin role:', e)
    }
  }

  appReady.value = true
})
</script>
