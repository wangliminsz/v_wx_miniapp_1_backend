<template>
  <div v-if="appReady" class="min-h-screen bg-dark-100">
    <div class="max-w-6xl mx-auto px-4 pt-16 pb-10">
      <h1 class="text-3xl font-bold text-center mb-8 text-dark-300 drop-shadow-lg">Admin Panel</h1>

      <div v-if="authStore.isAuthenticated" class="mb-4 bg-dark-200 p-4 rounded-md border border-dark-100">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <span class="text-gray-300">
              <span class="font-semibold text-blue-300">{{ authStore.user?.identifier }}</span>
              <span v-if="userRole !== 'viewer'"
                class="ml-2 px-2 py-0.5 bg-purple-600/40 text-purple-300 rounded text-xs font-bold">
                {{ userRole === 'superadmin' ? 'SuperAdmin' : userRole === 'channel_admin' ? 'Channel Admin' :
                'Delivery' }}
              </span>
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

          <!-- ═══ Delivery-admin nav: only Orders is shown ═══ -->
          <template v-if="showDeliveryOnlyNav">
            <router-link to="/orders" :class="NAV_BTN" activeClass="bg-primary">
              Orders
            </router-link>
          </template>

          <!-- ═══ Admin nav (superadmin + channel_admin) ═══ -->
          <template v-else-if="showAdminNav">
            <router-link to="/collections" :class="NAV_BTN" activeClass="bg-primary">
              Collections
            </router-link>

            <router-link to="/channels" :class="NAV_BTN" activeClass="bg-primary">
              Channels
            </router-link>

            <router-link to="/products/paginated" :class="NAV_BTN" activeClass="bg-primary">
              Product by Page
            </router-link>

            <router-link to="/variants" :class="NAV_BTN" activeClass="bg-primary">
              Variant List
            </router-link>

            <router-link to="/variants-with-group" v-if="isSuperAdmin" :class="NAV_BTN" activeClass="bg-primary">
              Variants with Group
            </router-link>

            <router-link to="/search" :class="NAV_BTN" activeClass="bg-primary">
              Search
            </router-link>
            <router-link to="/orders" :class="NAV_BTN" activeClass="bg-primary">
              Orders
            </router-link>
            <router-link to="/customers" :class="NAV_BTN" activeClass="bg-primary">
              Customers
            </router-link>
            <router-link to="/customer-groups" :class="NAV_BTN" activeClass="bg-primary">
              Customer Groups
            </router-link>

            <router-link to="/channels/clone" v-if="isSuperAdmin" :class="NAV_BTN" active-class="bg-primary">
              Clone Default
            </router-link>

            <router-link to="/clone-sub" v-if="isSuperAdmin" :class="NAV_BTN" active-class="bg-primary">
              Clone Channel
            </router-link>

            <router-link to="/import" :class="NAV_BTN" active-class="bg-primary">
              Import
            </router-link>

            <router-link to="/import/product" :class="NAV_BTN" active-class="bg-primary">
              Import Product
            </router-link>

            <router-link to="/i18n/zh" v-if="isSuperAdmin" :class="NAV_BTN" active-class="bg-primary">
              i18n(zh-cn)
            </router-link>

            <router-link to="/ral-colors" :class="NAV_BTN" active-class="bg-primary">
              Ral Colors
            </router-link>

            <router-link to="/copy-roles" v-if="isSuperAdmin" :class="NAV_BTN" activeClass="bg-primary">
              Copy Roles
            </router-link>

            <router-link to="/assets" :class="NAV_BTN" activeClass="bg-primary">
              Assets
            </router-link>


            <label :class="[
              NAV_BTN,
              'flex items-center gap-2',
              {
                'cursor-pointer': !uploadingAssets,
                'opacity-50 cursor-not-allowed pointer-events-none': uploadingAssets
              }
            ]">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16V8m0 0l-4 4m4-4l4 4" />
              </svg>
              {{ uploadingAssets ? 'Uploading...' : 'Upload' }}
              <input type="file" class="hidden" multiple :disabled="uploadingAssets" @change="handleAssetFilesSelect" />
            </label>



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
          </template>

          <!-- ═══ Viewer (no recognised role): no nav buttons at all ═══ -->

        </nav>
      </div>

      <div v-if="authCode" class="mb-6 bg-green-900/30 border border-green-600 p-4 rounded-md relative">
        <button @click="authCode = ''"
          class="absolute top-2 right-2 text-green-300 hover:text-green-100 text-lg leading-none">&times;</button>
        <p class="text-green-300 font-bold text-lg">Auth Code: {{ authCode }}</p>
        <p v-if="authCodeChannel" class="text-green-400 text-sm mt-1">Channel: {{ authCodeChannel }}</p>
      </div>
      <div v-if="authCodeError" class="mb-6 bg-red-900/30 border border-red-500 p-4 rounded-md relative">
        <button @click="authCodeError = ''"
          class="absolute top-2 right-2 text-red-400 hover:text-red-200 text-lg leading-none">&times;</button>
        <p class="text-red-400">{{ authCodeError }}</p>
      </div>

      <div v-if="assetUploadMessage" class="mb-6 border p-4 rounded-md relative"
        :class="assetUploadOk ? 'bg-green-900/30 border-green-600' : 'bg-red-900/30 border-red-500'">
        <button @click="assetUploadMessage = ''" class="absolute top-2 right-2 text-lg leading-none"
          :class="assetUploadOk ? 'text-green-300 hover:text-green-100' : 'text-red-400 hover:text-red-200'">&times;</button>
        <p :class="assetUploadOk ? 'text-green-300' : 'text-red-400'">{{ assetUploadMessage }}</p>
      </div>

      <router-view></router-view>
    </div>

    <!-- Back-to-top floating button. Visible only after the user
         scrolls past 1 full viewport height (so it never covers
         content on short pages). Smooth-scrolls back to the top
         and is keyboard-focusable. Lives in App.vue so it's on
         every page automatically. -->
    <button v-show="showBackToTop" @click="scrollToTop" aria-label="Back to top" title="Back to top"
      class="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-300">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
        stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  </div>
  <div v-else class="min-h-screen bg-dark-100 flex items-center justify-center">
    <p class="text-gray-400">Loading...</p>
  </div>
</template>

<script setup>
import { useAuthStore } from './stores/auth.js'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { initializeChannelToken, getCachedChannelName, getChannelTokenFromQuery } from './utils/channelToken.js'

const authStore = useAuthStore()
const appReady = ref(false)
const channelName = ref('')
// ── Role-based access control ───────────────────────────────────────
// The resolved role string is exposed by the auth store as
// `authStore.userRole` (see stores/auth.js). Possible values:
//   'superadmin'         — full access
//   'channel_admin'      — full nav, but no superadmin-only items
//   'admin_for_delivery' — only Orders
//   'viewer'             — no recognised role (sees nothing)
//
// We expose reactive wrappers for the template so we don't have to
// keep two definitions in sync.
const userRole = computed(() => authStore.userRole)
const isSuperAdminRole = computed(() => userRole.value === 'superadmin')
const isChannelAdmin = computed(() => userRole.value === 'channel_admin')
const isDeliveryAdmin = computed(() => userRole.value === 'admin_for_delivery')
const isSuperAdmin = computed(() => authStore.isSuperAdmin)
// Show all admin nav buttons (superadmin + channel_admin). Delivery
// admins see only Orders; viewers see nothing.
const showAdminNav = computed(() => isSuperAdminRole.value || isChannelAdmin.value)
// Show only the Orders nav button. Used for delivery admins.
const showDeliveryOnlyNav = computed(() => isDeliveryAdmin.value)
// Reusable classes for nav buttons (kept here so the template stays
// readable).
const NAV_BTN = 'px-4 py-2 bg-gray-600 text-white rounded-md transition-colors'
const selectedAuthChannel = ref('')
const authCode = ref('')
const authCodeChannel = ref('')
const authCodeError = ref('')
const generatingCode = ref(false)
const uploadingAssets = ref(false)
const assetUploadMessage = ref('')
const assetUploadOk = ref(true)

// ── Back-to-top button ──────────────────────────────────────────────
// Visible only after scrolling past one full viewport height
// (window.innerHeight). Re-evaluated on scroll and on resize so
// rotating a tablet or resizing the window keeps the threshold right.
const showBackToTop = ref(false)
const onScrollOrResize = () => {
  showBackToTop.value = window.scrollY > window.innerHeight
}
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleLogout = () => {
  authStore.logout()
}

// Upload one file to Vendure's admin `createAssets` mutation via the
// graphql-multipart-request-spec form-data shape. Returns the created
// Asset, or throws with the server's error message.
const uploadOneAsset = async (file, channelToken = null) => {
  const formData = new FormData()
  const operations = {
    query: `mutation CreateAssets($input: [CreateAssetInput!]!) {
      createAssets(input: $input) {
        ... on Asset { id name preview source fileSize mimeType }
        ... on MimeTypeError { errorCode message fileName }
      }
    }`,
    variables: { input: [{ file: null }] },
  }
  formData.append('operations', JSON.stringify(operations))
  formData.append('map', JSON.stringify({ '0': ['variables.input.0.file'] }))
  formData.append('0', file)

  const headers = {}
  if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`
  if (channelToken) headers['vendure-token'] = channelToken

  const apiUrl = import.meta.env.VITE_VENDURE_ADMIN_API_URL || import.meta.env.VITE_VENDURE_URL
  const response = await fetch(apiUrl, { method: 'POST', headers, body: formData })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP ${response.status}: ${text}`)
  }
  const json = await response.json()
  if (json.errors?.length) throw new Error(json.errors[0].message)
  const result = json.data?.createAssets?.[0]
  if (!result) throw new Error('Empty response from server')
  if (result.errorCode) throw new Error(`${result.fileName}: ${result.message}`)
  return result
}

const handleAssetFilesSelect = async (e) => {
  const files = Array.from(e.target.files || [])
  if (files.length === 0) return
  e.target.value = '' // allow re-selecting the same file later

  uploadingAssets.value = true
  assetUploadMessage.value = ''
  let ok = 0
  const failed = []
  try {
    const params = new URLSearchParams(window.location.search)
    let channelToken = params.get('vendure-token') || null
    if (!channelToken && authStore.activeChannel) channelToken = authStore.activeChannel.token

    for (const file of files) {
      try {
        await uploadOneAsset(file, channelToken)
        ok += 1
      } catch (err) {
        failed.push(`${file.name}: ${err.message}`)
      }
    }
    if (failed.length === 0) {
      assetUploadMessage.value = `Uploaded ${ok} asset${ok === 1 ? '' : 's'} successfully.`
      assetUploadOk.value = true
    } else {
      assetUploadMessage.value =
        `Uploaded ${ok} of ${files.length}. Failed: ${failed.join('; ')}`
      assetUploadOk.value = false
    }
  } finally {
    uploadingAssets.value = false
  }
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
      // Use `me.isSuperAdmin` directly — much simpler and more
      // reliable than walking `activeAdministrator.user.roles`
      // looking for `__super_admin_role__`.
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({
          query: `query CheckCurrentUser {
            me {
              id
              identifier
              isSuperAdmin
              channels { id code }
              roles { id code description }
            }
          }`
        })
      })
      const data = await response.json()
      const me = data.data?.me
      if (me) {
        // Vendure's `me.isSuperAdmin` is the authoritative superadmin
        // flag (corresponds to the internal __super_admin_role__).
        // We also store the user's custom role codes. The auth
        // store's `userRole` getter derives the resolved role
        // string from these two fields, so the rest of the app
        // (template, route guard) just reads authStore.userRole.
        authStore.isSuperAdmin = !!me.isSuperAdmin
        const codes = (me.roles || []).map(r => r.code)
        authStore.userRoles = codes
        // eslint-disable-next-line no-console
        console.log('[App] me.identifier =', me.identifier,
          ', isSuperAdmin =', me.isSuperAdmin,
          ', roles =', codes,
          ', resolved role =', authStore.userRole)
      } else {
        // eslint-disable-next-line no-console
        console.warn('[App] /me query returned no data:', data)
      }
    } catch (e) {
      console.error('Failed to check admin role:', e)
    }
  }

  appReady.value = true

  // Back-to-top: install scroll + resize listeners. `passive: true`
  // hints the browser that we won't preventDefault, which lets it
  // optimize scroll handling on mobile.
  window.addEventListener('scroll', onScrollOrResize, { passive: true })
  window.addEventListener('resize', onScrollOrResize)
  onScrollOrResize()  // sync initial state in case the page is already scrolled
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScrollOrResize)
  window.removeEventListener('resize', onScrollOrResize)
})
</script>
