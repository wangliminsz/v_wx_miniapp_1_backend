<template>
  <div class="max-w-5xl mx-auto py-6">
    <h1 class="text-2xl font-bold text-gray-200 mb-2">Copy Roles</h1>
    <p class="text-sm text-gray-400 mb-6">
      Super admin only. Copy a role's permissions (and optionally its channel associations)
      from a source role to a destination role. Use with care — destination's permissions
      will be overwritten.
    </p>

    <!-- Error / success banner -->
    <div v-if="pageError" class="mb-4 bg-red-900/30 border border-red-500 text-red-400 p-3 rounded-md text-sm">
      {{ pageError }}
    </div>
    <div v-if="successMessage" class="mb-4 bg-green-900/30 border border-green-500 text-green-300 p-3 rounded-md text-sm">
      {{ successMessage }}
    </div>

    <!-- Step 1 & 2: source + destination selectors -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <!-- Source -->
      <div class="bg-dark-200 p-4 rounded-md border border-dark-100">
        <label class="block text-xs uppercase tracking-wider text-gray-500 mb-2">
          Source role <span class="text-red-400">*</span>
        </label>
        <select v-model="sourceId" @change="onSourceOrDestChange"
          class="w-full px-3 py-2 bg-dark-300 text-white rounded-md border border-dark-100 text-sm">
          <option value="">-- select source --</option>
          <option v-for="r in roles" :key="r.id" :value="r.id"
            :disabled="r.id === destId">
            {{ r.code }} ({{ r.permissions.length }} perms, {{ r.channels.length }} channels)
          </option>
        </select>
        <div v-if="sourceRole" class="mt-3 text-xs text-gray-400">
          <div class="text-gray-500">Description:</div>
          <div class="text-gray-300">{{ sourceRole.description || '—' }}</div>
        </div>
      </div>

      <!-- Destination -->
      <div class="bg-dark-200 p-4 rounded-md border border-dark-100">
        <label class="block text-xs uppercase tracking-wider text-gray-500 mb-2">
          Destination role <span class="text-red-400">*</span>
        </label>
        <select v-model="destId" @change="onSourceOrDestChange"
          class="w-full px-3 py-2 bg-dark-300 text-white rounded-md border border-dark-100 text-sm">
          <option value="">-- select destination --</option>
          <option v-for="r in roles" :key="r.id" :value="r.id"
            :disabled="r.id === sourceId">
            {{ r.code }} ({{ r.permissions.length }} perms, {{ r.channels.length }} channels)
          </option>
        </select>
        <div v-if="destRole" class="mt-3 text-xs text-gray-400">
          <div class="text-gray-500">Description:</div>
          <div class="text-gray-300">{{ destRole.description || '—' }}</div>
        </div>
      </div>
    </div>

    <!-- Options: also copy channels -->
    <div class="bg-dark-200 p-4 rounded-md border border-dark-100 mb-6">
      <label class="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
        <input type="checkbox" v-model="copyChannels" class="w-4 h-4" />
        Also copy channel associations
        <span class="text-xs text-gray-500">
          (overwrites destination's channel list with the source's channel list)
        </span>
      </label>
    </div>

    <!-- Step 3: diff review -->
    <div v-if="sourceRole && destRole" class="bg-dark-200 p-4 rounded-md border border-dark-100 mb-6">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Review the change
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <!-- Will be added -->
        <div>
          <div class="text-xs uppercase tracking-wider text-blue-300 mb-2">
            ➕ Will be added to destination
            <span class="ml-1 text-blue-200 font-mono">{{ toAdd.length }}</span>
          </div>
          <div class="bg-blue-900/20 border border-blue-700/40 rounded p-2 max-h-60 overflow-y-auto">
            <div v-if="toAdd.length === 0" class="text-xs text-gray-500 italic">none</div>
            <div v-for="p in toAdd" :key="p" class="font-mono text-xs text-blue-200 px-1 py-0.5">
              {{ p }}
            </div>
          </div>
        </div>

        <!-- Will be removed -->
        <div>
          <div class="text-xs uppercase tracking-wider text-red-300 mb-2">
            ➖ Will be removed from destination
            <span class="ml-1 text-red-200 font-mono">{{ toRemove.length }}</span>
          </div>
          <div class="bg-red-900/20 border border-red-700/40 rounded p-2 max-h-60 overflow-y-auto">
            <div v-if="toRemove.length === 0" class="text-xs text-gray-500 italic">none</div>
            <div v-for="p in toRemove" :key="p" class="font-mono text-xs text-red-200 px-1 py-0.5">
              {{ p }}
            </div>
          </div>
        </div>

        <!-- Unchanged -->
        <div>
          <div class="text-xs uppercase tracking-wider text-green-300 mb-2">
            ✅ Already in both (unchanged)
            <span class="ml-1 text-green-200 font-mono">{{ toKeep.length }}</span>
          </div>
          <div class="bg-green-900/20 border border-green-700/40 rounded p-2 max-h-60 overflow-y-auto">
            <div v-if="toKeep.length === 0" class="text-xs text-gray-500 italic">none</div>
            <div v-for="p in toKeep" :key="p" class="font-mono text-xs text-green-200 px-1 py-0.5">
              {{ p }}
            </div>
          </div>
        </div>
      </div>

      <!-- Channel diff -->
      <div v-if="copyChannels" class="mt-4 pt-4 border-t border-dark-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <div class="text-xs uppercase tracking-wider text-blue-300 mb-2">
            ➕ Channels to add to destination
            <span class="ml-1 text-blue-200 font-mono">{{ channelsToAdd.length }}</span>
          </div>
          <div class="bg-blue-900/20 border border-blue-700/40 rounded p-2">
            <div v-if="channelsToAdd.length === 0" class="text-xs text-gray-500 italic">none</div>
            <div v-for="c in channelsToAdd" :key="c.id" class="text-xs text-blue-200 font-mono">
              {{ c.code }}
            </div>
          </div>
        </div>
        <div>
          <div class="text-xs uppercase tracking-wider text-red-300 mb-2">
            ➖ Channels to remove from destination
            <span class="ml-1 text-red-200 font-mono">{{ channelsToRemove.length }}</span>
          </div>
          <div class="bg-red-900/20 border border-red-700/40 rounded p-2">
            <div v-if="channelsToRemove.length === 0" class="text-xs text-gray-500 italic">none</div>
            <div v-for="c in channelsToRemove" :key="c.id" class="text-xs text-red-200 font-mono">
              {{ c.code }}
            </div>
          </div>
        </div>
      </div>

      <!-- Action -->
      <div class="mt-4 pt-4 border-t border-dark-100 flex items-center justify-between">
        <div class="text-xs text-gray-500">
          <div v-if="toAdd.length === 0 && toRemove.length === 0 && (!copyChannels || (channelsToAdd.length === 0 && channelsToRemove.length === 0))"
            class="text-green-400">
            ✓ Source and destination are already identical — nothing to copy.
          </div>
        </div>
        <button @click="applyCopy" :disabled="!canCopy || saving"
          class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {{ saving ? 'Copying…' : (copyChannels ? 'Copy permissions + channels' : 'Copy permissions') }}
        </button>
      </div>
    </div>

    <!-- Loading / empty -->
    <div v-else-if="loading" class="text-center text-gray-400 py-10">Loading roles…</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const roles = ref([])
const loading = ref(false)
const saving = ref(false)
const pageError = ref('')
const successMessage = ref('')

const sourceId = ref('')
const destId = ref('')
const copyChannels = ref(false)

const sourceRole = computed(() => roles.value.find(r => r.id === sourceId.value) || null)
const destRole = computed(() => roles.value.find(r => r.id === destId.value) || null)

const sourcePerms = computed(() => (sourceRole.value?.permissions || []).slice().sort())
const destPerms = computed(() => (destRole.value?.permissions || []).slice().sort())

// Diff semantics, defined by the copy direction (source → destination):
//   toAdd     — source perms that are NOT in destination, will be ADDED to dest
//   toRemove  — dest perms that are NOT in source, will be REMOVED from dest
//   toKeep    — perms already in both, unchanged
const toAdd = computed(() => {
  const d = new Set(destPerms.value)
  return sourcePerms.value.filter(p => !d.has(p))
})
const toRemove = computed(() => {
  const s = new Set(sourcePerms.value)
  return destPerms.value.filter(p => !s.has(p))
})
const toKeep = computed(() => {
  const s = new Set(sourcePerms.value)
  return destPerms.value.filter(p => s.has(p))
})

const sourceChannels = computed(() => sourceRole.value?.channels || [])
const destChannels = computed(() => destRole.value?.channels || [])
const channelsToAdd = computed(() => {
  const dIds = new Set(destChannels.value.map(c => c.id))
  return sourceChannels.value.filter(c => !dIds.has(c.id))
})
const channelsToRemove = computed(() => {
  const sIds = new Set(sourceChannels.value.map(c => c.id))
  return destChannels.value.filter(c => !sIds.has(c.id))
})

const canCopy = computed(() => {
  if (!sourceId.value || !destId.value) return false
  if (sourceId.value === destId.value) return false
  // Only the default roles (Super Admin, Customer) cannot be modified. The
  // backend's updateRole mutation will still reject with a server-side
  // error if a non-default role is also locked, but we let the server
  // decide that.
  return true
})

const fetchRoles = async () => {
  loading.value = true
  pageError.value = ''
  try {
    const API_URL = import.meta.env.VITE_VENDURE_ADMIN_API_URL || import.meta.env.VITE_VENDURE_URL
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        query: `query GetRoles {
          roles {
            items {
              id
              code
              description
              permissions
              channels { id code }
            }
            totalItems
          }
        }`
      })
    })
    const data = await response.json()
    if (data.errors) throw new Error(data.errors[0]?.message || 'Failed to load roles')
    roles.value = data.data?.roles?.items || []
  } catch (e) {
    pageError.value = e.message || 'Failed to load roles'
  } finally {
    loading.value = false
  }
}

const onSourceOrDestChange = () => {
  // Clear any prior success message when the user changes selection
  successMessage.value = ''
}

const applyCopy = async () => {
  if (!canCopy.value) return
  saving.value = true
  pageError.value = ''
  successMessage.value = ''
  try {
    const API_URL = import.meta.env.VITE_VENDURE_ADMIN_API_URL || import.meta.env.VITE_VENDURE_URL
    // Build the updateRole input. The Permission enum is sent as the
    // string names (e.g. "ReadChannel"). The destination's existing
    // permissions are replaced by the source's permissions array.
    const input = {
      id: destId.value,
      permissions: sourcePerms.value
    }
    if (copyChannels.value) {
      input.channelIds = sourceChannels.value.map(c => c.id)
    }
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        query: `mutation UpdateRole($input: UpdateRoleInput!) {
          updateRole(input: $input) {
            id
            code
            permissions
            channels { id code }
          }
        }`,
        variables: { input }
      })
    })
    const data = await response.json()
    if (data.errors) throw new Error(data.errors[0]?.message || 'Save failed')
    const result = data.data?.updateRole
    if (!result) throw new Error('Empty response from server')
    if (result.errorCode) {
      // Vendure 3.x's stock updateRole doesn't return ErrorResult, but if a
      // custom resolver extends it in the future, this check still works.
      throw new Error(`${result.errorCode}: ${result.message || 'Save failed'}`)
    }
    // Update local state
    const idx = roles.value.findIndex(r => r.id === result.id)
    if (idx !== -1) {
      roles.value[idx] = {
        ...roles.value[idx],
        permissions: result.permissions,
        channels: result.channels
      }
    }
    const totalChanges = toAdd.value.length + toRemove.value.length +
                         (copyChannels.value ? channelsToAdd.value.length + channelsToRemove.value.length : 0)
    successMessage.value = `✓ Copied ${sourcePerms.value.length} permissions to "${destRole.value.code}". Total changes: ${totalChanges}.`
  } catch (e) {
    pageError.value = e.message || 'Failed to copy role'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchRoles()
})
</script>
