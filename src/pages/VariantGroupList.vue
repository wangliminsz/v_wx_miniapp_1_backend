<template>
  <div class="variant-group-list-section">
    <h2 class="text-3xl font-bold text-center mb-8 text-dark-300 drop-shadow-lg">Variants with Group</h2>

    <div v-if="loading" class="text-center py-10 text-gray-400">Loading variants...</div>

    <div v-else-if="error" class="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md mb-6">
      <h3 class="font-bold mb-2">An error occurred:</h3>
      <p class="text-sm">{{ error }}</p>
    </div>

    <template v-else>
      <!-- Info bar -->
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-3 text-sm">
          <span class="text-gray-400">{{ totalItems }} variants with price-by-layer</span>
          <span v-if="leakCount > 0"
            class="px-2 py-0.5 rounded bg-amber-900/40 border border-amber-500 text-amber-400 text-xs"
            :title="`${leakCount} of the ${items.length} variants on this page have an empty priceByLayer field. The backend b2bVariants resolver is leaking rows whose value was cleared. See console for the full payload.`">
            ⚠ {{ leakCount }} empty on this page
          </span>
        </div>
        <button @click="toggleSort" class="px-4 py-2 bg-gray-700 text-white rounded-md text-sm hover:bg-gray-600 transition-colors flex items-center gap-2">
          <span class="text-blue-300 font-bold">Name:</span>
          <svg v-if="sortOrder === 'asc'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
          </svg>
        </button>
      </div>

      <!-- Table -->
      <div v-if="displayedVariants.length" class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-dark-100 text-gray-400 text-sm uppercase tracking-wider">
              <!-- <th class="px-4 py-3 font-semibold">Product</th> -->
              <!-- <th class="px-4 py-3 font-semibold">SKU</th> -->
              <th class="px-4 py-3 font-semibold">Variant</th>
              <th class="px-4 py-3 font-semibold text-right">Price</th>
              <!-- <th class="px-4 py-3 font-semibold">Channels</th> -->
              <th class="px-4 py-3 font-semibold">Group Price</th>
              <th class="px-4 py-3 font-semibold">Tier</th>
              <th class="px-4 py-3 font-semibold">Tier-Channel</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="variant in displayedVariants" :key="variant.id" class="border-b border-dark-100 hover:bg-dark-200/50 transition-colors">
              <!-- <td class="px-4 py-3 text-gray-300">{{ variant.product?.name || '-' }}</td> -->
              <!-- <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ variant.sku }}</td> -->
              <td class="max-w-[140px] px-4 py-3 align-top">
                <template v-for="v in [variant]" :key="v.id">
                  <template v-if="splitVariantName(v.name).sku">
                    <div class="text-gray-500 font-mono text-xs leading-tight whitespace-nowrap">{{ splitVariantName(v.name).sku }}</div>
                    <div class="text-blue-300 font-mono text-xs leading-tight mt-0.5 whitespace-nowrap">{{ splitVariantName(v.name).name }}</div>
                  </template>
                  <div v-else class="text-blue-300 font-mono text-sm whitespace-nowrap">{{ v.name }}</div>
                </template>
              </td>
              <td class="max-w-[140px] w-[140px] px-4 py-3 text-gray-300 font-mono text-right align-top">{{ formatPrice(variant.price) }}</td>
              <!-- <td class="px-4 py-3 text-gray-400 text-xs align-top">{{ channelsForDisplay(variant.channels) }}</td> -->
              <td class="px-4 py-3 text-gray-300 max-w-2xl align-top">
                <button type="button" @click="openEditModal(variant, 'priceByLayer')"
                  class="w-full text-left hover:bg-dark-300/60 p-2 rounded transition-colors"
                  :title="`Click to edit priceByLayer`">
                  <pre v-if="formatCustomField(variant.customFields?.priceByLayer)"
                    class="font-mono text-xs whitespace-pre-wrap break-words m-0">{{ formatCustomField(variant.customFields?.priceByLayer) }}</pre>
                  <span v-else class="text-gray-600 text-xs italic">click to set</span>
                </button>
              </td>
              <td class="px-4 py-3 text-gray-300 max-w-2xl align-top">
                <button type="button" @click="openEditModal(variant, 'volumePrices')"
                  class="w-full text-left hover:bg-dark-300/60 p-2 rounded transition-colors"
                  :title="`Click to edit volumePrices`">
                  <pre v-if="formatCustomField(variant.customFields?.volumePrices)"
                    class="font-mono text-xs whitespace-pre-wrap break-words m-0">{{ formatCustomField(variant.customFields?.volumePrices) }}</pre>
                  <span v-else class="text-gray-600 text-xs italic">click to set</span>
                </button>
              </td>
              <td class="px-4 py-3 text-gray-300 max-w-2xl align-top">
                <button type="button" @click="openEditModal(variant, 'volumePricesPerChannel')"
                  class="w-full text-left hover:bg-dark-300/60 p-2 rounded transition-colors"
                  :title="`Click to edit volumePricesPerChannel`">
                  <pre v-if="formatCustomField(variant.customFields?.volumePricesPerChannel)"
                    class="font-mono text-xs whitespace-pre-wrap break-words m-0">{{ formatCustomField(variant.customFields?.volumePricesPerChannel) }}</pre>
                  <span v-else class="text-gray-600 text-xs italic">click to set</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center py-10 text-gray-500">No variants with price-by-layer found.</div>

      <!-- Edit custom-field modal. Click any of the three
           custom-field cells in the table to open it. Each
           field has its own format hint and example payload
           so the user knows exactly what JSON shape to
           provide. -->
      <div v-if="editModal.open" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="closeEditModal">
        <div class="bg-dark-200 rounded-lg shadow-xl border border-dark-100 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b border-dark-100">
            <h3 class="text-lg font-semibold text-dark-300">
              Edit <span class="text-blue-300 font-mono">{{ editModal.fieldName }}</span>
            </h3>
            <button @click="closeEditModal" class="text-gray-400 hover:text-white text-2xl leading-none">×</button>
          </div>

          <!-- Variant reference (which row is being edited) -->
          <div class="px-4 pt-3 pb-1 text-sm text-gray-400">
            Variant:
            <span class="text-blue-300 font-mono">{{ editModal.variant?.name }}</span>
            <span class="text-gray-500 ml-2">(id: {{ editModal.variant?.id }})</span>
          </div>

          <!-- Format hint per field -->
          <div v-if="editModal.fieldName === 'priceByLayer'" class="mx-4 mt-3 mb-2 bg-dark-100/50 border border-dark-100 rounded p-3 text-xs">
            <p class="font-semibold text-gray-300 mb-1">Format — 阶梯价格 (tier-based pricing):</p>
            <pre class="font-mono text-gray-400 whitespace-pre-wrap break-words m-0 leading-relaxed">
{
  "channel-token": [{"minQuantity": 1, "rate": 1.20}, {"minQuantity": 10, "rate": 1.10}, {"minQuantity": 20, "rate": 0.80}]
}

  - One entry per channel; the key is the channel's
    vendure-token (you can find it in the channel settings).
  - Each entry is an array of { minQuantity, rate } pairs,
    sorted by minQuantity ascending.
  - rate is a multiplier on the variant's base price
    (1.00 = no discount, 0.80 = 20% off, 1.20 = 20% markup).
  - To close a channel entirely, set its value to the
    string "close" (no volume pricing in that channel).
            </pre>
            <p class="mt-2 text-gray-500">Example (the same as the field's expected shape):</p>
            <pre class="font-mono text-blue-300/80 whitespace-pre-wrap break-words m-0 mt-1">{"channel-token": [{"minQuantity": 1,"rate": 1.2},{"minQuantity": 10,"rate": 1.1},{"minQuantity": 20,"rate": 0.8}]}</pre>
          </div>

          <div v-else-if="editModal.fieldName === 'volumePrices'" class="mx-4 mt-3 mb-2 bg-dark-100/50 border border-dark-100 rounded p-3 text-xs">
            <p class="font-semibold text-gray-300 mb-1">Format — 数量折扣 (volume discount):</p>
            <p class="text-gray-400">A single array of quantity/rate pairs applied to all channels:</p>
            <pre class="font-mono text-blue-300/80 whitespace-pre-wrap break-words m-0 mt-2">[
  {"minQuantity": 1, "rate": 1.10},
  {"minQuantity": 200, "rate": 1.00},
  {"minQuantity": 500, "rate": 0.90}
]</pre>
            <p class="mt-2 text-gray-500">Each entry sets a rate multiplier for orders with at least the given quantity. The first entry whose <code>minQuantity ≤ order quantity</code> is applied.</p>
          </div>

          <div v-else-if="editModal.fieldName === 'volumePricesPerChannel'" class="mx-4 mt-3 mb-2 bg-dark-100/50 border border-dark-100 rounded p-3 text-xs">
            <p class="font-semibold text-gray-300 mb-1">Format — 按频道的数量折扣 (per-channel volume discount):</p>
            <p class="text-gray-400">One entry per channel, with the channel's vendure-token as the key. Each value is either a list of quantity/rate pairs, or the string "close" to disable volume pricing in that channel.</p>
            <pre class="font-mono text-blue-300/80 whitespace-pre-wrap break-words m-0 mt-2">{
  "__default_channel__": "close",
  "channel_wang": [{"minQuantity": 1, "rate": 1.10}, {"minQuantity": 10, "rate": 0.95}]
}</pre>
            <p class="mt-2 text-gray-500">
              The keys must be valid <code>channel.token</code> values (look in the channel manager).
              Use the literal string <code>"close"</code> to close a channel.
            </p>
          </div>

          <!-- JSON editor textarea -->
          <div class="px-4 py-3">
            <label class="block text-sm text-gray-400 mb-1">Value (JSON)</label>
            <textarea v-model="editModal.value" rows="10"
              class="w-full px-3 py-2 bg-dark-100 text-white rounded border border-dark-100 focus:outline-none focus:border-secondary font-mono text-xs leading-relaxed"
              :class="editModal.error ? 'border-red-500' : ''"
              :placeholder="editModal.placeholder"
              spellcheck="false"></textarea>

            <!-- Per-field error (parse error, validation error) -->
            <div v-if="editModal.error" class="mt-2 text-red-400 text-xs font-mono whitespace-pre-wrap">
              {{ editModal.error }}
            </div>

            <!-- Save-time error (server rejection) -->
            <div v-if="editModal.saveError" class="mt-2 text-red-400 text-xs">
              Save failed: <span class="font-mono">{{ editModal.saveError }}</span>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between gap-2 p-4 border-t border-dark-100">
            <div class="flex items-center gap-2">
              <button type="button" @click="fillFromFormatHint" class="text-xs text-blue-300 hover:text-blue-200 underline">
                Insert example
              </button>
              <button type="button" @click="formatAndValidate" class="text-xs text-blue-300 hover:text-blue-200 underline">
                Format & validate
              </button>
            </div>
            <div class="flex items-center gap-2">
              <button @click="closeEditModal" class="px-4 py-2 bg-dark-100 text-white rounded-md text-sm hover:bg-dark-300 transition-colors">
                Cancel
              </button>
              <button @click="clearField" class="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500 transition-colors"
                title="Set this field to an empty string on the variant">
                Clear
              </button>
              <button @click="saveEdit" :disabled="editModal.saving"
                class="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-500 transition-colors disabled:opacity-50">
                <span v-if="editModal.saving">Saving…</span>
                <span v-else>Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pageCount > 1" class="flex items-center justify-center gap-3 mt-8">
        <button @click="firstPage" :disabled="currentPage === 1"
          class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">First</button>
        <button @click="prevPage" :disabled="currentPage === 1"
          class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">Previous</button>
        <div class="flex items-center gap-2">
          <button v-for="page in visiblePages" :key="page" @click="goToPage(page)" :class="['px-3 py-2 rounded-md transition-colors',
            currentPage === page ? 'bg-primary text-white' : 'bg-gray-600 text-white']">{{ page }}</button>
        </div>
        <span class="text-gray-300">Page {{ currentPage }} of {{ pageCount }}</span>
        <button @click="nextPage" :disabled="currentPage >= pageCount"
          class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">Next</button>
        <button @click="lastPage" :disabled="currentPage >= pageCount"
          class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">Last</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { getChannelTokenFromQuery } from '../utils/channelToken.js'
import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'

const authStore = useAuthStore()

const totalItems = ref(0)
const items = ref([])
const loading = ref(false)
const error = ref('')
const sortOrder = ref('asc')
const currentPage = ref(1)
const pageSize = 30

// Edit-custom-field modal state.
// `open` is a single boolean (only one modal at a time).
// `variant` is the row being edited (read-only after open).
// `fieldName` is the custom-field name (one of:
//   'priceByLayer' | 'volumePrices' | 'volumePricesPerChannel').
// `value` is the JSON string the user is editing.
// `error` is a per-field parse/validation error (e.g. bad JSON).
// `saveError` is a server-side rejection error (set on failed save).
// `saving` is a flag shown in the Save button while the
//   `updateProductVariant` mutation is in flight.
// `placeholder` is the textarea's placeholder text.
const editModal = ref({
  open: false,
  variant: null,
  fieldName: '',
  value: '',
  error: '',
  saveError: '',
  saving: false,
  placeholder: ''
})

// Example payloads used both as the inline "Format & validate"
// hint AND as the values pre-filled by "Insert example".
// These mirror exactly the JSON shape the user showed.
const FORMAT_EXAMPLES = {
  priceByLayer: {
    '__default_channel__': 'close',
    'channel_wang': [
      { minQuantity: 1, rate: 1.20 },
      { minQuantity: 10, rate: 1.10 },
      { minQuantity: 20, rate: 0.80 }
    ]
  },
  volumePrices: [
    { minQuantity: 1, rate: 1.10 },
    { minQuantity: 200, rate: 1.00 },
    { minQuantity: 500, rate: 0.90 }
  ],
  volumePricesPerChannel: {
    '__default_channel__': 'close',
    'channel_wang': [
      { minQuantity: 1, rate: 1.10 },
      { minQuantity: 10, rate: 0.95 }
    ]
  }
}

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

const GET_B2B_VARIANTS = gql`
  query GetB2BVariants($options: ProductVariantListOptions) {
    b2bVariants(options: $options) {
      totalItems
      items {
        id
        name
        sku
        price
        customFields {
          priceByLayer
          volumePrices
          volumePricesPerChannel
        }
        product {
          id
          name
        }
        channels {
          id
          code
          token
        }
      }
    }
  }
`

const pageCount = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)))

const displayedVariants = computed(() => items.value)

// Count of variants on the current page whose BOTH `priceByLayer`
// AND `volumePrices` fields are empty/null but are still being
// returned by the b2bVariants resolver. Shown as a warning pill
// in the info bar so the bug is visible at a glance.
//
// Rows where only one field is empty are intentional: the user
// fills in volume prices in one field, tier prices in the other.
// Only rows where BOTH are empty are "leaked".
const leakCount = computed(() => {
  let n = 0
  for (const v of items.value) {
    const pbl = v.customFields?.priceByLayer
    const vp = v.customFields?.volumePrices
    const isEmpty = (x) =>
      x == null || x === '' ||
      (Array.isArray(x) && x.length === 0) ||
      (typeof x === 'object' && x && Object.keys(x).length === 0)
    if (isEmpty(pbl) && isEmpty(vp)) n++
  }
  return n
})

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(pageCount.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const fetchVariants = async () => {
  loading.value = true
  error.value = ''
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    console.log('channelToken----------------------->', channelToken)

    const apolloClient = createApolloClient(authStore.token, channelToken)
    const skip = (currentPage.value - 1) * pageSize
    const { data } = await apolloClient.query({
      query: GET_B2B_VARIANTS,
      variables: {
        options: {
          take: pageSize,
          skip,
          sort: { name: sortOrder.value === 'asc' ? 'ASC' : 'DESC' }
        }
      },
      fetchPolicy: 'network-only'
    })
    totalItems.value = data.b2bVariants.totalItems || 0
    items.value = data.b2bVariants.items || []

    // =============================================================
    // DIAGNOSTIC: surface the raw backend response so we can see
    // exactly which variants are leaking through b2bVariants even
    // though their priceByLayer is now empty.
    //
    // Likely root cause: the b2bVariants resolver on the Vendure
    // backend uses a denormalized "hasPriceByLayer" boolean
    // (computed at write time) that is set to TRUE the first
    // time priceByLayer is filled, but never reset to FALSE
    // when the value is later cleared. So the WHERE clause
    // `hasPriceByLayer = true` matches "leaked" rows whose
    // priceByLayer is now null/''/[].
    //
    // The diagnostics below will tell you:
    //   1. How many items the page has.
    //   2. How many of those have a "truthy" priceByLayer.
    //   3. How many are "leaked" (empty/null but still listed).
    //   4. The full data of each leaked row so you can see the
    //      raw server response and confirm the bug is server-side.
    // =============================================================
    const all = data.b2bVariants.items || []
    const leaked = []
    const filled = []
    for (const v of all) {
      const pbl = v.customFields?.priceByLayer
      const isEmpty = pbl == null || pbl === '' ||
        (Array.isArray(pbl) && pbl.length === 0) ||
        (typeof pbl === 'object' && pbl && Object.keys(pbl).length === 0)
      if (isEmpty) {
        leaked.push(v)
      } else {
        filled.push(v)
      }
    }
    if (leaked.length > 0) {
      console.warn(
        `[VariantGroupList] LEAKED ROWS: ${leaked.length} of ${all.length} variants ` +
        `in b2bVariants response have empty priceByLayer. The backend resolver is ` +
        `returning rows that should be filtered out.`
      )
      console.warn('[VariantGroupList] full leaked row data (for backend bug investigation):', leaked)
    }
    console.log(
      `[VariantGroupList] page=${currentPage.value} total=${totalItems.value} ` +
      `shown=${all.length} filled=${filled.length} leaked=${leaked.length}`
    )
  } catch (err) {
    console.error('Failed to fetch variants:', err)
    error.value = err.message || 'Failed to load variants'
  } finally {
    loading.value = false
  }
}

const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  currentPage.value = 1
  fetchVariants()
}

const goToPage = (page) => {
  currentPage.value = page
  fetchVariants()
}
const firstPage = () => goToPage(1)
const prevPage = () => goToPage(Math.max(1, currentPage.value - 1))
const nextPage = () => goToPage(Math.min(pageCount.value, currentPage.value + 1))
const lastPage = () => goToPage(pageCount.value)

const formatPrice = (value) => {
  if (value == null) return '-'
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(value / 100)
}

// Pretty-print a customField value. The backend stores these as
// raw JSON strings (e.g. '{"group_1": 1000, "group_2": 6000}').
// Returns null when the value is empty so the cell renders blank
// rather than showing an ugly '""' or '[]'. The returned string
// is rendered inside a <pre> with whitespace-pre-wrap, so the
// newlines and indentation are preserved.
const formatCustomField = (value) => {
  if (value == null || value === '') return null
  if (Array.isArray(value) && value.length === 0) return null
  if (typeof value === 'object' && Object.keys(value).length === 0) return null
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return JSON.stringify(parsed, null, 2)
  } catch {
    return String(value)
  }
}

// Split a variant name like "[HA1401B-S19-018] 蓝色砂纹聚酯型粉末涂料"
// into two parts: the [SKU] token and the remaining Chinese /
// human-readable name. Used to render the cell on two lines with
// the `]` as the natural line break.
const splitVariantName = (full) => {
  if (!full) return { sku: '', name: '' }
  const m = full.match(/^(\[[^\]]+\])\s*(.*)$/s)
  if (!m) return { sku: '', name: full }
  return { sku: m[1], name: m[2] }
}

// Filter the channels for display. Hides __default_channel__
// since it's the implicit default, and falls back to '-' when
// the variant has no channels or only the default.
const channelsForDisplay = (channels) => {
  if (!channels?.length) return '-'
  const codes = channels
    .map(c => c.code)
    .filter(code => code && code !== '__default_channel__')
  return codes.length ? codes.join(', ') : '-'
}

// =============================================================
// Edit-custom-field modal logic
// =============================================================

// Open the modal for a given variant + field.
// If the variant already has a value for the field, the
// textarea is pre-filled with pretty-printed JSON.
const openEditModal = (variant, fieldName) => {
  if (!variant) return
  const existing = variant.customFields?.[fieldName]
  let initial = ''
  if (existing != null && existing !== '') {
    try {
      const parsed = typeof existing === 'string' ? JSON.parse(existing) : existing
      initial = JSON.stringify(parsed, null, 2)
    } catch {
      initial = String(existing)
    }
  }
  editModal.value = {
    open: true,
    variant,
    fieldName,
    value: initial,
    error: '',
    saveError: '',
    saving: false,
    placeholder: FORMAT_EXAMPLES[fieldName]
      ? JSON.stringify(FORMAT_EXAMPLES[fieldName], null, 2)
      : 'Enter JSON value…'
  }
}

const closeEditModal = () => {
  editModal.value.open = false
  editModal.value.error = ''
  editModal.value.saveError = ''
  editModal.value.saving = false
}

// Pre-fill the textarea with the example payload for the
// current field. Replaces whatever the user typed — useful
// when starting from a blank variant.
const fillFromFormatHint = () => {
  const example = FORMAT_EXAMPLES[editModal.value.fieldName]
  if (example) {
    editModal.value.value = JSON.stringify(example, null, 2)
    editModal.value.error = ''
  }
}

// Parse the current textarea content and pretty-print it.
// Also runs shape validation per field (e.g. priceByLayer
// must be an object, volumePrices must be an array).
const formatAndValidate = () => {
  const raw = (editModal.value.value || '').trim()
  if (!raw) {
    editModal.value.error = 'Value is empty (use the "Clear" button to set to "").'
    return
  }
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    editModal.value.error = `Not valid JSON: ${e.message}`
    return
  }
  // Field-specific shape validation
  if (editModal.value.fieldName === 'priceByLayer' &&
    (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null)) {
    editModal.value.error = 'priceByLayer must be a JSON object whose keys are channel tokens and values are arrays of {minQuantity, rate} pairs (or the string "close").'
    return
  }
  if (editModal.value.fieldName === 'volumePrices' && !Array.isArray(parsed)) {
    editModal.value.error = 'volumePrices must be a JSON array of {minQuantity, rate} pairs.'
    return
  }
  if (editModal.value.fieldName === 'volumePricesPerChannel' &&
    (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null)) {
    editModal.value.error = 'volumePricesPerChannel must be a JSON object whose keys are channel tokens and values are arrays of {minQuantity, rate} pairs (or the string "close").'
    return
  }
  // Valid: pretty-print back into the textarea
  editModal.value.value = JSON.stringify(parsed, null, 2)
  editModal.value.error = ''
}

// Vendure's stock updateProductVariant mutation. The input
// shape accepts `customFields: ProductVariantCustomFieldsInput`
// which contains all custom fields for the variant. We
// spread the existing customFields so the update doesn't
// accidentally wipe any other field on the variant.
const UPDATE_VARIANT_MUTATION = gql`
  mutation UpdateVariant($input: UpdateProductVariantInput!) {
    updateProductVariant(input: $input) {
      id
      customFields {
        priceByLayer
        volumePrices
        volumePricesPerChannel
      }
    }
  }
`

// Save the current modal value back to the variant.
// Validates JSON, then sends the mutation. On success, closes
// the modal and updates the row's customFields locally so
// the table re-renders without a full re-fetch.
const saveEdit = async () => {
  const m = editModal.value
  if (!m.variant || !m.fieldName) return
  // Re-validate before save
  const raw = (m.value || '').trim()
  let parsed
  if (raw === '') {
    parsed = null
  } else {
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      m.error = `Cannot save: not valid JSON — ${e.message}`
      return
    }
  }
  m.saving = true
  m.saveError = ''
  m.error = ''
  try {
    const apolloClient = createApolloClient(
      authStore.token,
      getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    )
    // Build the new customFields object. We MUST preserve any
    // other custom fields on the variant that aren't being edited
    // here (e.g. techDocs, internal notes, etc.). Spreading
    // the existing customFields first and then overriding only
    // the field being edited achieves that.
    const existing = m.variant.customFields || {}
    const newCustomFields = {
      ...existing,
      [m.fieldName]: parsed === null ? '' : JSON.stringify(parsed)
    }
    const { data } = await apolloClient.mutate({
      mutation: UPDATE_VARIANT_MUTATION,
      variables: {
        input: {
          id: m.variant.id,
          customFields: newCustomFields
        }
      }
    })
    const returned = data?.updateProductVariant?.customFields
    if (data?.updateProductVariant?.errorCode) {
      m.saveError = data.updateProductVariant.message
      return
    }
    if (!returned) {
      m.saveError = 'Server returned no customFields in the response.'
      return
    }
    // Update the row locally so the table re-renders without
    // a full re-fetch of the whole page.
    m.variant.customFields = returned
    // If the new value is empty/null, re-evaluate the leak
    // count (it might have gone up if BOTH fields are now
    // empty on this row).
    if (returned.priceByLayer == null || returned.priceByLayer === '') {
      // no-op; the leak count is computed on render
    }
    console.log(`[VariantGroupList] saved ${m.fieldName} on variant ${m.variant.id}`)
    closeEditModal()
  } catch (err) {
    // Extract the actual server-side message (Apollo's
    // default is just "Network error: 400")
    const networkResult = err.networkError?.result
    const graphQLErrors = err.graphQLErrors || []
    m.saveError =
      networkResult?.message ||
      (Array.isArray(networkResult?.errors) && networkResult.errors[0]?.message) ||
      graphQLErrors[0]?.message ||
      err.message ||
      String(err) ||
      'Save failed'
    console.error('[VariantGroupList] saveEdit FAILED:', m.saveError)
  } finally {
    m.saving = false
  }
}

// Clear the field entirely (saves an empty string).
const clearField = async () => {
  editModal.value.value = ''
  await saveEdit()
}

onMounted(() => {
  fetchVariants()
})
</script>
