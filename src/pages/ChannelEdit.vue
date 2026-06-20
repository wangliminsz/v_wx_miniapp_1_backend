<template>
  <!-- Loading / error / not found states -->
  <div v-if="loading" class="text-center py-10 text-gray-400">Loading channel…</div>

  <div v-else-if="loadError" class="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md mb-6">
    <h3 class="font-bold mb-2">Failed to load channel:</h3>
    <p class="text-sm">{{ loadError }}</p>
  </div>

  <div v-else-if="!channel" class="text-center text-gray-500 py-10">
    Channel not found.
  </div>

  <div v-else>
    <!-- Back link -->
    <router-link to="/channels" class="text-blue-400 hover:text-blue-300 mb-4 inline-block">
      &larr; Back to Channels
    </router-link>

    <!-- Channel header card (read-only summary) -->
    <div class="mb-6 bg-dark-200 p-4 rounded-md border border-dark-100">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-4">
          <h2 class="text-2xl font-bold text-dark-300 font-mono">{{ channel.code }}</h2>
          <span class="text-gray-400 font-mono text-sm">#{{ channel.id }}</span>
          <span v-if="channel.isDefault"
            class="px-2 py-0.5 bg-yellow-600/30 text-yellow-300 rounded text-xs">Default</span>
        </div>
        <div class="text-right text-sm text-gray-400">
          <div>Currency: <span class="font-mono text-gray-300">{{ channel.currencyCode || '—' }}</span></div>
          <div v-if="channel.token" class="text-xs text-gray-500 font-mono mt-1">
            Token: {{ channel.token.slice(0, 20) }}…
          </div>
        </div>
      </div>
    </div>

    <!-- Permission warning: detail fetch failed, custom fields may not show current values -->
    <div v-if="!detailLoaded"
      class="mb-6 bg-amber-900/20 border border-amber-700/50 text-amber-200 p-3 rounded-md text-xs">
      <div class="font-semibold mb-1">⚠️ Current values could not be loaded</div>
      <div>
        Your role has <code class="px-1 py-0.5 rounded bg-amber-900/40">Update Channel</code> but not
        <code class="px-1 py-0.5 rounded bg-amber-900/40">Read Channel</code>, so the detail fetch
        was rejected and the current values for the custom fields cannot be displayed.
      </div>
      <div class="mt-2 text-amber-300">
        The form below still works — you can type new values and click <strong>Save</strong>.
        Save uses <code class="px-1 py-0.5 rounded bg-amber-900/40">Update Channel</code>, which is granted.
      </div>
      <div class="mt-2 text-amber-300">
        To see the current values, ask a super admin to grant your role the
        <code class="px-1 py-0.5 rounded bg-amber-900/40">Read Channel</code> permission
        (Vendure admin → Settings → Roles & Permissions → your role → check <em>Read Channel</em>),
        then <strong>log out and log back in</strong> so the auth token picks up the new permission.
      </div>
    </div>

    <!-- Edit form card -->
    <!-- Once you tell me what fields to expose, this card is where they go.
         The card already wires up: editable mode toggle, save/cancel buttons,
         and a save-error banner. Just add the input fields inside. -->
    <div class="mb-6 bg-dark-200 p-4 rounded-md border border-dark-100">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">Edit Channel (设为 0 则无开机费)</h3>
        <button v-if="!editing" @click="startEdit" :disabled="!canEdit"
          class="px-3 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          Edit
        </button>
        <div v-else class="flex gap-2">
          <button @click="cancelEdit" :disabled="saving"
            class="px-3 py-1 bg-gray-600 text-white rounded-md text-xs hover:bg-gray-500 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button @click="save" :disabled="saving"
            class="px-3 py-1 bg-green-600 text-white rounded-md text-xs hover:bg-green-500 transition-colors disabled:opacity-50">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>

      <!-- Read-only summary when not editing -->
      <div v-if="!editing" class="text-gray-300 space-y-2 text-sm">
        <div class="flex justify-between border-b border-dark-100 pb-1">
          <span class="text-gray-500">订货数量低于(kg)</span>
          <span class="font-mono">{{ channel.customFields?.minOrderAmountForSetupFee ?? '—' }}</span>
        </div>
        <div class="flex justify-between border-b border-dark-100 pb-1">
          <span class="text-gray-500">开机费(分)</span>
          <span class="font-mono">{{ channel.customFields?.setupFeeAmount ?? '—' }}</span>
        </div>
      </div>

      <!-- Editable form when in edit mode -->
      <div v-else class="space-y-3">
        <div>
          <label class="block text-gray-500 text-xs mb-1">minOrderAmountForSetupFee</label>
          <input v-model.number="editMinOrderAmount" type="number" min="0"
            class="w-full px-3 py-2 bg-dark-100 text-white rounded-md border border-dark-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        <div>
          <label class="block text-gray-500 text-xs mb-1">setupFeeAmount</label>
          <input v-model.number="editSetupFeeAmount" type="number" min="0"
            class="w-full px-3 py-2 bg-dark-100 text-white rounded-md border border-dark-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
      </div>

      <!-- Save error -->
      <div v-if="saveError" class="mt-3 text-red-400 text-sm">{{ saveError }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const authStore = useAuthStore()
const route = useRoute()

// ── State ───────────────────────────────────────────────────────────
const channel = ref(null)
const loading = ref(false)
const loadError = ref('')
const editing = ref(false)
const saving = ref(false)
const saveError = ref('')
// True when the full Channel (with customFields) has been loaded from the
// admin `channel(id)` query. False when only list-level data (id/code/token)
// is available, which happens when the user's role lacks `ReadChannel`.
// Drives the amber permission-warning badge in the header area.
const detailLoaded = ref(false)

// Editable form values. Initialised from the channel's custom fields
// when the user enters edit mode (see startEdit).
const editMinOrderAmount = ref(0)
const editSetupFeeAmount = ref(0)

// Per-role edit permission: only super admin and channel admin can edit.
// Channel admin can only edit their own channel (handled by the backend
// permission check on the updateChannel mutation, but we also gate the
// button on the frontend to give a cleaner UX).
const canEdit = computed(() => {
  if (!channel.value) return false
  const role = authStore.userRole
  if (role === 'superadmin') return true
  if (role === 'channel_admin') {
    // Channel admin can edit the channel they have access to. We check
    // the active channel first (set when the user picks one in the
    // header), and fall back to matching against the channel's own id
    // (since channel admins usually have only one accessible channel
    // and the auth store's activeChannel may be unset).
    const activeId = authStore.activeChannel?.id
    if (activeId) {
      return activeId === channel.value.id
    }
    // Fallback: a channel admin is allowed to edit any channel they
    // can see on this page (i.e. it was returned by me.channels).
    // The backend will still reject with `Forbidden` if they try to
    // edit a channel they don't have UpdateChannel for, so this
    // fallback is safe.
    return true
  }
  return false
})

// ── Data load ───────────────────────────────────────────────────────
// Role-aware lookup:
//   superadmin     → use the global `channels` query (all channels on the server)
//   channel_admin  → use the `me.channels` query (only the user's accessible channels)
//
// Vendure doesn't expose a single-channel query by ID in the admin API without
// a custom resolver, so we look up the channel by id or code from a list.
// The list source must respect the user's role, or the lookup will fail
// for channel admins (the global `channels` query returns 0 rows for them).
const fetchAccessibleChannels = async () => {
  if (authStore.isSuperAdmin) {
    if (authStore.channels.length === 0) {
      await authStore.fetchUserChannels()
    }
    return authStore.channels || []
  }
  // Non-super-admin: use me.channels which respects per-role access.
  // me.channels returns CurrentUserChannel (no customFields), so the
  // read-only summary will show "—" for the custom fields. The edit
  // form will be pre-filled with 0 until a future query exposes them.
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
  // Mark the system default channel for the pill in the header card
  return meChannels.map(ch => ({
    ...ch,
    isDefault: ch.code === '__default_channel__'
  }))
}

const loadChannel = async () => {
  const id = route.params.channelId
  loading.value = true
  loadError.value = ''
  channel.value = null
  try {
    const accessibleChannels = await fetchAccessibleChannels()
    // Match by either id or code — the URL may use either
    const found = accessibleChannels.find(c =>
      String(c.id) === String(id) || c.code === id
    )
    if (!found) {
      loadError.value = `No channel with id/code "${id}" accessible to your account.`
      return
    }
    // Vendure's Channel type has no isDefault field — the system default
    // channel is identified by the literal code `__default_channel__`.
    // Start with the list-level data so we always have at least id/code/token
    // even if the detail fetch is denied.
    channel.value = {
      id: found.id,
      code: found.code,
      token: found.token,
      isDefault: found.code === '__default_channel__',
      customFields: {}  // will be populated by the detail fetch below
    }
    // The list query only has id/code/token. Try to fetch the full Channel
    // (with customFields) via the admin `channel(id)` query. This requires
    // the `ReadChannel` permission; channel admins sometimes have
    // `UpdateChannel` but not `ReadChannel`, in which case the detail fetch
    // fails. In that case we fall back to the list-level data above, which
    // means the form starts with 0s for the custom fields but Save still
    // works because `UpdateChannel` is granted.
    try {
      const API_URL = import.meta.env.VITE_VENDURE_ADMIN_API_URL || import.meta.env.VITE_VENDURE_URL
      const tokenPreview = authStore.token
        ? `${authStore.token.slice(0, 20)}…(${authStore.token.length} chars)`
        : 'MISSING'
      // Vendure-token resolution order:
      //   1. authStore.activeChannel.token (set when user picks a channel in the header)
      //   2. The token of the channel we're about to query (channel_admin users
      //      typically have only one accessible channel, so we can safely use it)
      //   3. NONE (default to __default_channel__ context — usually wrong for non-super)
      // Without a vendure-token, the request is processed in __default_channel__
      // context, and channel(id: 3) for a channel the user doesn't have access to
      // in that context will return "not authorized".
      const channelToken = authStore.activeChannel?.token || found.token
      const channelTokenPreview = channelToken
        ? `${channelToken.slice(0, 20)}…(${channelToken.length} chars)`
        : 'NONE'
      console.group('[ChannelEdit] detail fetch DEBUG')
      console.log('  API URL            =', API_URL)
      console.log('  is admin URL?      =', API_URL?.includes('admin-api'))
      console.log('  Auth token         =', tokenPreview)
      console.log('  vendure-token      =', channelTokenPreview, '(source:', authStore.activeChannel?.token ? 'activeChannel' : 'found.token', ')')
      console.log('  userRole           =', authStore.userRole)
      console.log('  isSuperAdmin       =', authStore.isSuperAdmin)
      console.log('  activeChannel.code =', authStore.activeChannel?.code)
      console.log('  activeChannel.id   =', authStore.activeChannel?.id)
      console.log('  accessibleCh count =', accessibleChannels.length)
      console.log('  found              =', found)
      console.log('  querying for id    =', found.id)
      console.groupEnd()
      const detailResponse = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`,
          ...(channelToken ? { 'vendure-token': channelToken } : {})
        },
        body: JSON.stringify({
          query: `query GetChannelDetail($id: ID!) {
            channel(id: $id) {
              id
              code
              token
              currencyCode
              defaultCurrencyCode
              customFields {
                minOrderAmountForSetupFee
                setupFeeAmount
              }
            }
          }`,
          variables: { id: found.id }
        })
      })
      const detailData = await detailResponse.json()
      console.log('[ChannelEdit] detail fetch response status =', detailResponse.status)
      console.log('[ChannelEdit] detail fetch response body   =', detailData)
      if (!detailData.errors && detailData.data?.channel) {
        const detail = detailData.data.channel
        channel.value = {
          ...channel.value,
          ...detail,
          // Re-compute isDefault since the detail response doesn't include it
          isDefault: detail.code === '__default_channel__',
          customFields: {
            ...channel.value.customFields,
            ...(detail.customFields || {})
          }
        }
        // Detail fetch succeeded — custom fields are now visible
        detailLoaded.value = true
      } else if (detailData.errors) {
        // Detail fetch was rejected (e.g. ReadChannel permission denied).
        // Log for debugging; the UI will show the amber warning.
        console.warn('[ChannelEdit] detail fetch returned errors:', detailData.errors)
        detailLoaded.value = false
      }
      // If response is unexpected shape, leave detailLoaded as its initial false
    } catch (detailErr) {
      // Network or other error on the detail fetch — keep the list-level
      // data. Save will still work because the user has UpdateChannel.
      console.warn('[ChannelEdit] detail fetch failed, using list data:', detailErr)
      detailLoaded.value = false
    }
  } catch (e) {
    loadError.value = e.message || 'Failed to load channel'
  } finally {
    loading.value = false
  }
}

// Reload if the route param changes (e.g. user navigates from one
// edit page directly to another via the back/forward buttons).
watch(() => route.params.channelId, () => {
  editing.value = false
  loadChannel()
})

onMounted(loadChannel)

// ── Edit lifecycle ──────────────────────────────────────────────────
const startEdit = () => {
  // Pre-fill the form from the loaded channel's custom fields.
  // Use ?? 0 so a missing/null value becomes 0 (a safe default for
  // numeric fields). If the value is explicitly 0, that stays 0.
  editMinOrderAmount.value = channel.value?.customFields?.minOrderAmountForSetupFee ?? 0
  editSetupFeeAmount.value = channel.value?.customFields?.setupFeeAmount ?? 0
  editing.value = true
  saveError.value = ''
}
const cancelEdit = () => {
  editing.value = false
  saveError.value = ''
}
const save = async () => {
  if (!channel.value) return
  saving.value = true
  saveError.value = ''
  try {
    const API_URL = import.meta.env.VITE_VENDURE_ADMIN_API_URL || import.meta.env.VITE_VENDURE_URL
    // Same vendure-token fallback as the detail fetch — see loadChannel
    // for the full rationale. Without a channel context, the updateChannel
    // mutation runs in __default_channel__ context and may be rejected
    // for a channel_admin who doesn't have access to the default channel.
    const channelToken = authStore.activeChannel?.token || channel.value.token
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`,
        ...(channelToken ? { 'vendure-token': channelToken } : {})
      },
      body: JSON.stringify({
        query: `mutation UpdateChannel($input: UpdateChannelInput!) {
          updateChannel(input: $input) {
            ... on Channel {
              id
              code
              customFields {
                minOrderAmountForSetupFee
                setupFeeAmount
              }
            }
            ... on ErrorResult { errorCode message }
          }
        }`,
        variables: {
          input: {
            id: channel.value.id,
            customFields: {
              minOrderAmountForSetupFee: Number(editMinOrderAmount.value),
              setupFeeAmount: Number(editSetupFeeAmount.value)
            }
          }
        }
      })
    })
    const data = await response.json()
    if (data.errors) {
      throw new Error(data.errors[0]?.message || 'Failed to save channel')
    }
    const result = data.data?.updateChannel
    if (!result) {
      throw new Error('Empty response from server')
    }
    if (result.errorCode) {
      throw new Error(`${result.errorCode}: ${result.message || 'Save failed'}`)
    }
    // Merge the saved customFields into the local channel object so the
    // read-only summary updates without a full re-fetch.
    channel.value = {
      ...channel.value,
      customFields: {
        ...channel.value.customFields,
        ...result.customFields
      }
    }
    editing.value = false
  } catch (e) {
    saveError.value = e.message || 'Failed to save channel'
  } finally {
    saving.value = false
  }
}
</script>
