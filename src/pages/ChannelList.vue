<template>
  <div>
    <h2 class="text-2xl font-bold text-center mb-6 text-dark-300">Channels</h2>

    <!-- Role context banner: makes it obvious who can see what -->
    <div class="mb-4 p-3 bg-blue-900/20 border border-blue-700 rounded text-sm text-blue-300">
      <span class="font-semibold">You are signed in as:</span>
      <span class="ml-2 px-2 py-0.5 bg-blue-600/40 rounded text-xs font-bold">
        {{ roleLabel }}
      </span>
      <span class="ml-3 text-gray-400">{{ roleDescription }}</span>
    </div>

    <!-- Filter (superadmin only — channel_admin has nothing to filter) -->
    <div v-if="isSuperAdmin" class="mb-4 flex items-center gap-3">
      <label class="text-sm text-gray-400">Filter by code/name:</label>
      <input v-model="filter" type="text" placeholder="e.g. channel_xinyk"
        class="px-3 py-2 bg-dark-200 text-white rounded-md border border-dark-100 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <span class="text-xs text-gray-500">({{ visibleChannels.length }} of {{ channels.length }} shown)</span>
    </div>

    <!-- Empty / loading / error states -->
    <div v-if="loading" class="text-center text-gray-400 py-8">Loading channels…</div>
    <div v-else-if="error" class="bg-red-900/30 border border-red-500 p-4 rounded text-red-300">{{ error }}</div>
    <div v-else-if="visibleChannels.length === 0"
      class="text-center text-gray-500 py-8 border border-dashed border-dark-100 rounded">
      <p class="mb-2">No channels found.</p>
      <p v-if="isChannelAdmin" class="text-xs">
        Ask a super admin to grant your account access to a channel.
      </p>
    </div>

    <!-- Channels table -->
    <div v-else class="bg-dark-200 rounded-md border border-dark-100 overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-dark-300 text-gray-400 text-xs uppercase tracking-wider">
          <tr>
            <th class="px-4 py-3">Code</th>
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3">Currency</th>
            <th class="px-4 py-3">Default</th>
            <th class="px-4 py-3">Token</th>
            <!-- Action column only for channel_admin (super admin clicks the row) -->
            <th v-if="!isSuperAdmin" class="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ch in visibleChannels" :key="ch.id"
            :class="[
              'border-t border-dark-100 transition-colors',
              isSuperAdmin
                ? 'cursor-pointer hover:bg-dark-300/60'
                : 'hover:bg-dark-300/40'
            ]"
            @click="isSuperAdmin ? goToEdit(ch) : null">
            <td class="px-4 py-3 font-mono text-sm text-blue-300">{{ ch.code }}</td>
            <td class="px-4 py-3 text-gray-200">{{ ch.name || '—' }}</td>
            <td class="px-4 py-3 text-gray-300 font-mono text-sm">{{ ch.currencyCode || '—' }}</td>
            <td class="px-4 py-3">
              <span v-if="ch.isDefault" class="px-2 py-0.5 bg-yellow-600/30 text-yellow-300 rounded text-xs">Default</span>
              <span v-else class="text-gray-500 text-xs">—</span>
            </td>
            <td class="px-4 py-3 font-mono text-xs text-gray-400 max-w-md truncate" :title="ch.token">
              {{ ch.token ? ch.token.slice(0, 20) + '…' : '—' }}
            </td>
            <!-- Channel admin: explicit Edit button in its own column -->
            <td v-if="!isSuperAdmin" class="px-4 py-3 text-right">
              <button @click.stop="goToEdit(ch)"
                class="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500 transition-colors">
                Edit
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const authStore = useAuthStore()
const router = useRouter()

const channels = ref([])
const loading = ref(false)
const error = ref('')
const filter = ref('')

// ── Role detection ──────────────────────────────────────────────────
// Same flags as App.vue so behaviour stays consistent.
const isSuperAdmin = computed(() => authStore.isSuperAdmin)
const isChannelAdmin = computed(() => authStore.userRole === 'channel_admin')

const roleLabel = computed(() => {
  if (isSuperAdmin.value) return 'Super Admin'
  if (isChannelAdmin.value) return 'Channel Admin'
  return '—'
})
const roleDescription = computed(() => {
  if (isSuperAdmin.value) return 'Showing all channels on this server.'
  if (isChannelAdmin.value) return 'Showing only the channels your account has access to.'
  return ''
})

// ── Filtering ───────────────────────────────────────────────────────
// Super admin: optional text filter by code/name.
// Channel admin: no filter UI — they only ever see their own channels
//   (which the auth store already restricts via the /me query).
const visibleChannels = computed(() => {
  if (!isSuperAdmin.value) return channels.value
  const q = filter.value.trim().toLowerCase()
  if (!q) return channels.value
  return channels.value.filter(ch =>
    (ch.code || '').toLowerCase().includes(q) ||
    (ch.name || '').toLowerCase().includes(q)
  )
})

// ── Navigation ──────────────────────────────────────────────────────
// Super admin: clicking the row anywhere opens the edit page.
// Channel admin: clicking the explicit Edit button opens it.
const goToEdit = (ch) => {
  router.push({ name: 'ChannelEdit', params: { channelId: ch.id } })
}

// ── Data load ───────────────────────────────────────────────────────
// Role-aware data source:
//   superadmin     → use the global `channels` query (shows ALL channels on the server)
//   channel_admin  → use the `me.channels` query (shows only channels the user has access to)
//
// The previous implementation used `authStore.fetchUserChannels()` (the global
// `channels` query) for everyone, which returns 0 rows for channel_admins because
// Vendure's permission system only grants `ReadChannel` for all channels to super admins.
const loadChannels = async () => {
  loading.value = true
  error.value = ''
  try {
    if (isSuperAdmin.value) {
      // Super admin: fetch all channels via the global query (cached in the auth store)
      if (authStore.channels.length === 0) {
        await authStore.fetchUserChannels()
      }
      channels.value = authStore.channels || []
    } else {
      // Channel admin: fetch only the channels the user has access to via `me.channels`.
      // This is the query that respects per-role channel access in Vendure.
      const API_URL = import.meta.env.VITE_VENDURE_ADMIN_API_URL || import.meta.env.VITE_VENDURE_URL
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({
          query: `query GetMyChannels {
            me {
              channels {
                id
                code
                token
              }
            }
          }`
        })
      })
      const data = await response.json()
      if (data.errors) {
        throw new Error(data.errors[0]?.message || 'Failed to load channels')
      }
      const meChannels = data.data?.me?.channels || []
      // Mark the system default channel for the pill in the table
      channels.value = meChannels.map(ch => ({
        ...ch,
        isDefault: ch.code === '__default_channel__'
      }))
    }
  } catch (e) {
    error.value = e.message || 'Failed to load channels'
  } finally {
    loading.value = false
  }
}

onMounted(loadChannels)
</script>
