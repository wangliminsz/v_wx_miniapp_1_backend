<template>
  <div v-if="loading" class="text-center py-10 text-gray-400">Loading order...</div>

  <div v-else-if="error" class="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md mb-6">
    <h3 class="font-bold mb-2">An error occurred:</h3>
    <p class="text-sm">{{ error }}</p>
  </div>

  <div v-else-if="order" class="order-detail-section">
    <!-- Back link -->
    <router-link to="/orders" class="text-blue-400 hover:text-blue-300 mb-4 inline-block">&larr; Back to
      Orders</router-link>

    <!-- Order header -->
    <div class="flex items-center justify-between mb-6 bg-dark-200 p-4 rounded-md border border-dark-100">
      <div class="flex items-center gap-4">
        <h2 class="text-2xl font-bold text-dark-300">Order {{ order.code }}</h2>
        <span :class="stateClass(order.state)" class="px-3 py-1 rounded-full text-xs font-semibold">{{ order.state
          }}</span>
      </div>
      <div class="text-right text-sm text-gray-400">
        <div>Placed: {{ formatDate(order.orderPlacedAt || order.createdAt) }}</div>
        <div v-if="headerChannelCodes(order)">Channel: {{ headerChannelCodes(order) }}</div>
      </div>
      <div class="flex items-center gap-2">
        <button v-if="order.state === 'PaymentSettled' || (order.fulfillments?.length > 0 && order.fulfillments.every(f => f.state === 'Cancelled'))" @click="openFulfillModal"
          class="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-500 transition-colors">
          Fulfill Order
        </button>
        <button v-if="order.state !== 'Cancelled'" @click="openCancelModal"
          class="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-500 transition-colors">
          Cancel Order
        </button>
      </div>
    </div>

    <!-- Info cards: Customer + Addresses + Payment + Fulfillment -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <!-- Customer -->
      <div class="bg-dark-200 p-4 rounded-md border border-dark-100">
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Customer</h3>
        <div v-if="order.customer" class="text-gray-300 space-y-1 text-sm">
          <p><span class="text-gray-500">Name:</span> {{ order.customer.firstName }} {{ order.customer.lastName }}</p>
          <p><span class="text-gray-500">Email:</span> {{ order.customer.emailAddress }}</p>
          <p><span class="text-gray-500">Phone:</span> {{ order.customer.phoneNumber || '-' }}</p>
        </div>
        <div v-else class="text-gray-500 text-sm">No customer info</div>
      </div>

      <!-- Shipping Address -->
      <div class="bg-dark-200 p-4 rounded-md border border-dark-100">
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Shipping Address</h3>
        <div v-if="order.shippingAddress" class="text-gray-300 space-y-1 text-sm">
          <p v-if="order.shippingAddress.fullName">{{ order.shippingAddress.fullName }}</p>
          <p v-if="order.shippingAddress.company">{{ order.shippingAddress.company }}</p>
          <p>{{ order.shippingAddress.streetLine1 }}</p>
          <p v-if="order.shippingAddress.streetLine2">{{ order.shippingAddress.streetLine2 }}</p>
          <p>{{ [order.shippingAddress.city, order.shippingAddress.province,
          order.shippingAddress.postalCode].filter(Boolean).join(', ') }}</p>
          <p>{{ order.shippingAddress.country }}</p>
          <p v-if="order.shippingAddress.phoneNumber">{{ order.shippingAddress.phoneNumber }}</p>
        </div>
        <div v-else class="text-gray-500 text-sm">No shipping address</div>
      </div>

      <!-- Payment -->
      <div class="bg-dark-200 p-4 rounded-md border border-dark-100">
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment</h3>
        <div v-if="order.payments && order.payments.length" class="space-y-3">
          <div v-for="payment in order.payments" :key="payment.id"
            class="text-gray-300 text-sm border-b border-dark-100 pb-2 last:border-0 last:pb-0">
            <div class="flex items-center justify-between">
              <span class="font-medium">{{ payment.method }}</span>
              <div class="flex items-center gap-2">
                <span :class="stateClass(payment.state)" class="px-2 py-0.5 rounded-full text-xs font-semibold">{{
                  payment.state }}</span>
                <button v-if="payment.state === 'Authorized'" @click="settlePayment(payment.id)"
                  class="px-2 py-0.5 bg-green-600 text-white rounded text-xs hover:bg-green-500 transition-colors"
                  :disabled="settlingPaymentId === payment.id">
                  {{ settlingPaymentId === payment.id ? '...' : 'Settle' }}
                </button>
              </div>
            </div>
            <p class="text-gray-500">Amount: {{ formatPrice(payment.amount) }}</p>
            <p v-if="payment.transactionId" class="text-gray-500 text-xs font-mono">TX: {{ payment.transactionId }}</p>
            <p v-if="payment.errorMessage" class="text-red-400 text-xs">{{ payment.errorMessage }}</p>
          </div>
        </div>
        <div v-else class="text-gray-500 text-sm">No payments</div>
      </div>


      <!-- Billing Address -->
      <div class="bg-dark-200 p-4 rounded-md border border-dark-100">
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Billing Address</h3>
        <div v-if="order.billingAddress" class="text-gray-300 space-y-1 text-sm">
          <p v-if="order.billingAddress.fullName">{{ order.billingAddress.fullName }}</p>
          <p v-if="order.billingAddress.company">{{ order.billingAddress.company }}</p>
          <p>{{ order.billingAddress.streetLine1 }}</p>
          <p v-if="order.billingAddress.streetLine2">{{ order.billingAddress.streetLine2 }}</p>
          <p>{{ [order.billingAddress.city, order.billingAddress.province,
          order.billingAddress.postalCode].filter(Boolean).join(', ') }}</p>
          <p>{{ order.billingAddress.country }}</p>
          <p v-if="order.billingAddress.phoneNumber">{{ order.billingAddress.phoneNumber }}</p>
        </div>
        <div v-else class="text-gray-500 text-sm">No billing address</div>
      </div>


    </div>

    <!-- Fulfillment -->
    <div class="mb-6 bg-dark-200 p-4 rounded-md border border-dark-100">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Fulfillment</h3>
      <div v-if="order.fulfillments && order.fulfillments.length" class="space-y-4">
        <div v-for="f in order.fulfillments" :key="f.id"
          class="text-gray-300 text-sm border-b border-dark-100 pb-3 last:border-0 last:pb-0">
          <!-- Header row: method + state + transition buttons -->
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-base">{{ f.method || '-' }}</span>
            <div class="flex items-center gap-2">
              <span :class="stateClass(f.state)" class="px-2 py-0.5 rounded-full text-xs font-semibold">{{ f.state
                }}</span>
              <button v-for="ns in f.nextStates" :key="ns" @click="transitionFulfillment(f.id, ns)"
                :class="['px-2 py-0.5 rounded text-xs transition-colors',
                  ns === 'Shipped' ? 'bg-purple-600 hover:bg-purple-500' :
                  ns === 'Delivered' ? 'bg-green-700 hover:bg-green-600' :
                  ns === 'Cancelled' ? 'bg-gray-600 hover:bg-red-500' :
                  'bg-gray-600 hover:bg-gray-500'
                ]" :disabled="transitFulfillmentId === f.id">
                {{ transitFulfillmentId === f.id ? '...' : ns }}
              </button>
            </div>
          </div>

          <!-- Detail fields: ID / Method / State / Tracking / Created -->
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            <div class="flex gap-2">
              <dt class="text-gray-500 w-24 shrink-0">Fulfillment ID</dt>
              <dd class="text-gray-200 font-mono">{{ fulfillmentId(f) }}</dd>
            </div>
            <div class="flex gap-2">
              <dt class="text-gray-500 w-24 shrink-0">Method</dt>
              <dd class="text-gray-200">{{ f.method || '-' }}</dd>
            </div>
            <div class="flex gap-2">
              <dt class="text-gray-500 w-24 shrink-0">State</dt>
              <dd class="text-gray-200">{{ f.state }}</dd>
            </div>
            <div class="flex gap-2">
              <dt class="text-gray-500 w-24 shrink-0">Tracking code</dt>
              <dd class="text-gray-200 font-mono">{{ f.trackingCode || '-' }}</dd>
            </div>
            <div class="flex gap-2">
              <dt class="text-gray-500 w-24 shrink-0">Created</dt>
              <dd class="text-gray-200">{{ formatDate(f.createdAt) }}</dd>
            </div>
          </dl>

          <!-- Fulfilled items (collapsible) -->
          <div v-if="f.lines?.length" class="mt-3 border-t border-dark-100 pt-2">
            <button @click="toggleFulfillmentItems(f.id)"
              class="w-full flex items-center justify-between text-sm text-gray-300 hover:text-white">
              <span class="font-medium">Fulfilled items ({{ totalFulfillmentQty(f) }})</span>
              <span class="text-gray-500 text-xs">{{ expandedFulfillmentIds[f.id] ? '▾' : '▸' }}</span>
            </button>
            <div v-if="expandedFulfillmentIds[f.id]" class="mt-2 space-y-2 pl-2">
              <div v-for="line in f.lines" :key="line.orderLineId"
                class="border border-dark-100 rounded-md p-2">
                <p class="text-gray-200">{{ line.orderLine?.productVariant?.name || '-' }}</p>
                <p class="text-xs text-gray-500">
                  <span class="text-gray-400">Qty:</span> {{ line.quantity }}
                  <span v-if="line.orderLine?.productVariant?.sku" class="ml-2">
                    <span class="text-gray-400">SKU:</span>
                    <span class="font-mono">{{ line.orderLine.productVariant.sku }}</span>
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-gray-500 text-sm italic">No Fulfill Info</div>
    </div>

    <!-- Order lines table -->
    <div class="mb-6 bg-dark-200 p-4 rounded-md border border-dark-100">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Order Lines ({{ order.lines.length
        }})</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-dark-100 text-gray-500 text-xs uppercase tracking-wider">
              <th class="px-3 py-2 font-semibold">Product</th>
              <th class="px-3 py-2 font-semibold">SKU</th>
              <th class="px-3 py-2 font-semibold text-right">Unit Price</th>
              <th class="px-3 py-2 font-semibold text-right">Qty</th>
              <th class="px-3 py-2 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="line in order.lines" :key="line.id" class="border-b border-dark-100 text-sm text-gray-300">
              <td class="px-3 py-2">
                <div class="flex items-center gap-2">
                  <img v-if="line.featuredAsset?.preview" :src="line.featuredAsset.preview"
                    class="w-10 h-10 object-cover rounded" />
                  <div v-else
                    class="w-10 h-10 bg-dark-100 rounded flex items-center justify-center text-xs text-gray-500">No img
                  </div>
                  <span>{{ line.productVariant?.name || '-' }}</span>
                </div>
              </td>
              <td class="px-3 py-2 text-gray-500 font-mono text-xs">{{ line.productVariant?.sku || '-' }}</td>
              <td class="px-3 py-2 text-right font-mono">{{ formatPrice(line.unitPriceWithTax) }}</td>
              <td class="px-3 py-2 text-right">{{ line.quantity }}</td>
              <td class="px-3 py-2 text-right font-mono">{{ formatPrice(line.linePriceWithTax) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Order totals -->
    <div class="mb-6 bg-dark-200 p-4 rounded-md border border-dark-100">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Totals</h3>
      <div class="space-y-1 text-sm max-w-xs ml-auto">
        <div class="flex justify-between text-gray-400">
          <span>Subtotal</span>
          <span class="font-mono">{{ formatPrice(order.subTotalWithTax) }}</span>
        </div>
        <div class="flex justify-between text-gray-400">
          <span>Shipping</span>
          <span class="font-mono">{{ formatPrice(order.shippingWithTax) }}</span>
        </div>
        <div v-if="order.couponCodes?.length" class="flex justify-between text-yellow-400">
          <span>Coupon: {{ order.couponCodes.join(', ') }}</span>
        </div>
        <div class="flex justify-between text-white font-bold text-base border-t border-dark-100 pt-1 mt-1">
          <span>Total</span>
          <span class="font-mono">{{ formatPrice(order.totalWithTax) }}</span>
        </div>
      </div>
    </div>

    <!-- Customer Message -->
    <div class="mb-6 bg-dark-200 p-4 rounded-md border border-dark-100">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Customer Message</h3>
      <p v-if="order.customFields?.customerMessage" class="text-gray-300 text-sm whitespace-pre-wrap">{{ order.customFields.customerMessage }}</p>
      <p v-else class="text-gray-500 text-sm italic">No customer message</p>
    </div>

    <!-- History timeline -->
    <div v-if="order.history?.items?.length" class="bg-dark-200 p-4 rounded-md border border-dark-100">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">History</h3>
      <div class="space-y-3">
        <div v-for="entry in order.history.items" :key="entry.id"
          class="relative pl-6 border-l-2 border-dark-100 pb-3 last:pb-0">
          <div class="absolute -left-1.5 top-1 w-2.5 h-2.5 rounded-full bg-dark-100"></div>
          <p class="text-xs text-gray-500">{{ formatDate(entry.createdAt) }}</p>
          <p class="text-sm text-gray-300">
            <template v-for="(part, idx) in formatHistoryEntry(entry)" :key="idx">
              <span v-if="part.state" :class="stateClass(part.state)"
                class="px-1.5 py-0.5 rounded text-xs font-semibold mx-0.5">{{ part.state }}</span>
              <span v-else>{{ part.text }}</span>
            </template>
          </p>
          <p v-if="entry.administrator" class="text-xs text-gray-500">by {{ entry.administrator.firstName }} {{
            entry.administrator.lastName }}</p>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-10 text-gray-500">Order not found.</div>

  <!-- Fulfill Order Modal -->
  <div v-if="showFulfillModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click.self="showFulfillModal = false">
    <div class="bg-dark-200 rounded-lg border border-dark-100 p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
      <h3 class="text-xl font-bold text-gray-200 mb-4">Fulfill Order {{ order?.code }}</h3>

      <div class="space-y-3 mb-4">
        <div v-for="line in order?.lines || []" :key="line.id"
          class="flex items-center justify-between bg-dark-300 p-3 rounded-md">
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-300 truncate">{{ line.productVariant?.name }}</p>
            <p class="text-xs text-gray-500">SKU: {{ line.productVariant?.sku }}</p>
          </div>
          <div class="flex items-center gap-2 ml-4">
            <span class="text-xs text-gray-400">Qty:</span>
            <input type="number" v-model.number="fulfillQuantities[line.id]"
              :max="line.quantity" min="0"
              class="w-16 px-2 py-1 bg-dark-100 text-white rounded border border-dark-100 text-sm text-center" />
            <span class="text-xs text-gray-500">/ {{ line.quantity }}</span>
          </div>
        </div>
      </div>

      <div class="mb-4">
        <label class="block text-sm text-gray-400 mb-1">Method (optional)</label>
        <input v-model="fulfillMethod" type="text" placeholder="e.g. 顺丰，跨越，中通，德邦 ..."
          class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary text-sm" />
      </div>

      <div class="mb-4">
        <label class="block text-sm text-gray-400 mb-1">Tracking Code (optional)</label>
        <input v-model="fulfillTrackingCode" type="text" placeholder="e.g. 物流号码"
          class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary text-sm" />
      </div>

      <div class="flex justify-end gap-3">
        <button @click="closeFulfillModal" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">Cancel</button>
        <button @click="submitFulfillment" :disabled="fulfilling"
          class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors disabled:opacity-50">
          {{ fulfilling ? 'Fulfilling...' : 'Fulfill' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Cancel Order Modal -->
  <div v-if="showCancelModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click.self="closeCancelModal">
    <div class="bg-dark-200 rounded-lg border border-dark-100 p-6 w-full max-w-lg">
      <h3 class="text-xl font-bold text-gray-200 mb-2">Cancel Order {{ order?.code }}</h3>
      <p class="text-sm text-gray-400 mb-4">
        This will cancel the entire order regardless of its current state. This action cannot be undone.
      </p>

      <div class="mb-4">
        <label class="block text-sm text-gray-400 mb-1">Reason (optional)</label>
        <textarea v-model="cancelReason" rows="3" placeholder="e.g. customer requested cancellation, out of stock..."
          class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary text-sm"></textarea>
      </div>

      <div class="mb-4">
        <label class="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" v-model="cancelShipping" class="rounded border-dark-100 bg-dark-300 text-red-600 focus:ring-red-500" />
          Also cancel shipping charges
        </label>
      </div>

      <div v-if="cancelError" class="mb-4 bg-red-900/30 border border-red-500 text-red-400 p-3 rounded-md text-sm">
        {{ cancelError }}
      </div>

      <div class="flex justify-end gap-3">
        <button @click="closeCancelModal" :disabled="cancelling"
          class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50">Close</button>
        <button @click="submitCancel" :disabled="cancelling"
          class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors disabled:opacity-50">
          {{ cancelling ? 'Cancelling...' : 'Cancel Order' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { getChannelTokenFromQuery } from '../utils/channelToken.js'
import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'

const route = useRoute()
const authStore = useAuthStore()

const order = ref(null)
const loading = ref(false)
const error = ref('')
const settlingPaymentId = ref(null)

const showFulfillModal = ref(false)
const fulfillQuantities = ref({})
const fulfillMethod = ref('')
const fulfillTrackingCode = ref('')
const fulfilling = ref(false)
const transitFulfillmentId = ref(null)

const showCancelModal = ref(false)
const cancelReason = ref('')
const cancelShipping = ref(true)
const cancelling = ref(false)
const cancelError = ref('')

const expandedFulfillmentIds = ref({})

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

const GET_ORDER_QUERY = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      code
      state
      active
      createdAt
      updatedAt
      orderPlacedAt
      currencyCode
      subTotal
      subTotalWithTax
      shipping
      shippingWithTax
      total
      totalWithTax
      couponCodes
      customer {
        id
        firstName
        lastName
        emailAddress
        phoneNumber
      }
      shippingAddress {
        fullName
        company
        streetLine1
        streetLine2
        city
        province
        postalCode
        country
        phoneNumber
      }
      billingAddress {
        fullName
        company
        streetLine1
        streetLine2
        city
        province
        postalCode
        country
        phoneNumber
      }
      payments {
        id
        method
        amount
        state
        transactionId
        errorMessage
        metadata
      }
      fulfillments {
        id
        createdAt
        method
        trackingCode
        state
        nextStates
        lines {
          quantity
          orderLine {
            id
            productVariant {
              id
              name
              sku
            }
          }
        }
      }
      lines {
        id
        quantity
        unitPrice
        unitPriceWithTax
        linePrice
        linePriceWithTax
        discountedLinePrice
        discountedLinePriceWithTax
        featuredAsset {
          id
          preview
          source
        }
        productVariant {
          id
          name
          sku
          featuredAsset {
            id
            preview
          }
        }
      }
      customFields {
        customerMessage
      }
      channels {
        id
        code
        token
      }
      history(options: { take: 50, sort: { createdAt: DESC } }) {
        items {
          id
          createdAt
          type
          data
          administrator {
            id
            firstName
            lastName
          }
        }
        totalItems
      }
    }
  }
`

const fetchOrder = async () => {
  loading.value = true
  error.value = ''
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    const { data } = await apolloClient.query({
      query: GET_ORDER_QUERY,
      variables: { id: route.params.orderId },
      fetchPolicy: 'network-only'
    })
    order.value = data.order
  } catch (err) {
    console.error('Failed to fetch order:', err)
    error.value = err.message || 'Failed to load order'
  } finally {
    loading.value = false
  }
}

const stateClass = (state) => {
  const map = {
    'AddingItems': 'bg-yellow-600/30 text-yellow-300',
    'ArrangingPayment': 'bg-orange-600/30 text-orange-300',
    'PaymentAuthorized': 'bg-blue-600/30 text-blue-300',
    'PaymentSettled': 'bg-green-600/30 text-green-300',
    'PartiallyShipped': 'bg-indigo-600/30 text-indigo-300',
    'Shipped': 'bg-purple-600/30 text-purple-300',
    'PartiallyDelivered': 'bg-cyan-600/30 text-cyan-300',
    'Delivered': 'bg-green-700/30 text-green-400',
    'Modifying': 'bg-pink-600/30 text-pink-300',
    'Cancelled': 'bg-red-600/30 text-red-300',
    'Authorized': 'bg-blue-600/30 text-blue-300',
    'Settled': 'bg-green-600/30 text-green-300',
  }
  return map[state] || 'bg-gray-600/30 text-gray-300'
}

const formatPrice = (value) => {
  if (value == null) return '-'
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(value / 100)
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const headerChannelCodes = (o) => {
  if (!o?.channels || o.channels.length === 0) return ''
  const codes = o.channels
    .map(c => c.code)
    .filter(code => code !== '__default_channel__')
  return codes.length ? codes.join(', ') : ''
}

// Format a HistoryEntry into an array of { text } / { state } parts,
// similar to the detail rows in the Vendure admin UI
// (e.g. "Fulfillment #8 from Shipped to Delivered").
const parseHistoryData = (raw) => {
  if (raw == null) return {}
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch (_) { return {} }
  }
  return raw
}

const formatHistoryEntry = (entry) => {
  const data = parseHistoryData(entry.data)
  const parts = []
  const push = (val) => {
    if (val != null && val !== '') parts.push({ text: String(val) })
  }
  const pushState = (s) => {
    if (s != null && s !== '') parts.push({ state: String(s) })
  }

  switch (entry.type) {
    case 'ORDER_STATE_TRANSITION':
      push('Order transitioned from ')
      pushState(data.from)
      push(' to ')
      pushState(data.to)
      break
    case 'ORDER_FULFILLMENT_TRANSITION':
      push(`Fulfillment #${data.fulfillmentId ?? ''} from `)
      pushState(data.from)
      push(' to ')
      pushState(data.to)
      break
    case 'ORDER_FULFILLMENT':
      push(`Fulfillment #${data.fulfillmentId ?? ''} created`)
      break
    case 'ORDER_PAYMENT_TRANSITION':
      push(`Payment #${data.paymentId ?? ''} from `)
      pushState(data.from)
      push(' to ')
      pushState(data.to)
      break
    case 'ORDER_REFUND_TRANSITION':
      push(`Refund #${data.refundId ?? ''} from `)
      pushState(data.from)
      push(' to ')
      pushState(data.to)
      break
    case 'ORDER_CANCELLATION':
      push('Order cancelled')
      if (data.reason) {
        push(` (${data.cancellationType || 'reason'}: ${data.reason})`)
      } else if (data.cancellationType) {
        push(` (${data.cancellationType})`)
      }
      break
    case 'ORDER_NOTE':
      push(data.note ? `Note: ${data.note}` : 'Note added')
      break
    case 'ORDER_COUPON_APPLIED':
      push(`Coupon ${data.couponCode || ''} applied`)
      break
    case 'ORDER_COUPON_REMOVED':
      push(`Coupon ${data.couponCode || ''} removed`)
      break
    case 'ORDER_MODIFIED':
      push('Order modified')
      break
    case 'ORDER_CUSTOMER_UPDATED':
      push('Customer updated')
      break
    case 'CUSTOMER_NOTE':
      push(data.note ? `Customer note: ${data.note}` : 'Customer note added')
      break
    default:
      // Fallback: humanize the type and show note if any
      push(entry.type ? entry.type.replace(/_/g, ' ').toLowerCase() : 'History entry')
      if (data.note) push(`: ${data.note}`)
  }

  if (parts.length === 0) parts.push({ text: entry.type || 'History entry' })
  return parts
}

const SETTLE_PAYMENT_MUTATION = gql`
  mutation SettlePayment($id: ID!) {
    settlePayment(id: $id) {
      ... on Payment {
        id
        state
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

const settlePayment = async (paymentId) => {
  settlingPaymentId.value = paymentId
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    const { data } = await apolloClient.mutate({
      mutation: SETTLE_PAYMENT_MUTATION,
      variables: { id: paymentId }
    })
    if (data?.settlePayment?.message) {
      error.value = data.settlePayment.message
    } else {
      fetchOrder()
    }
  } catch (err) {
    console.error('Failed to settle payment:', err)
    error.value = err.message || 'Failed to settle payment'
  } finally {
    settlingPaymentId.value = null
  }
}

const openFulfillModal = () => {
  const qty = {}
  for (const line of order.value?.lines || []) {
    qty[line.id] = line.quantity
  }
  fulfillQuantities.value = qty
  fulfillMethod.value = ''
  fulfillTrackingCode.value = ''
  showFulfillModal.value = true
}

const closeFulfillModal = () => {
  showFulfillModal.value = false
  fulfillMethod.value = ''
  fulfillTrackingCode.value = ''
  fulfillQuantities.value = {}
}

const ADD_FULFILLMENT_MUTATION = gql`
  mutation AddFulfillmentToOrder($input: FulfillOrderInput!) {
    addFulfillmentToOrder(input: $input) {
      ... on Fulfillment {
        id
        state
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

const submitFulfillment = async () => {
  const lines = Object.entries(fulfillQuantities.value)
    .filter(([_, qty]) => qty > 0)
    .map(([id, qty]) => ({ orderLineId: id, quantity: qty }))

  if (lines.length === 0) return

  fulfilling.value = true
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    const args = []
    if (fulfillMethod.value) {
      args.push({ name: 'method', value: fulfillMethod.value })
    }
    if (fulfillTrackingCode.value) {
      args.push({ name: 'trackingCode', value: fulfillTrackingCode.value })
    }
    const { data } = await apolloClient.mutate({
      mutation: ADD_FULFILLMENT_MUTATION,
      variables: {
        input: {
          lines,
          handler: { code: 'manual-fulfillment', arguments: args }
        }
      }
    })
    if (data?.addFulfillmentToOrder?.message) {
      error.value = data.addFulfillmentToOrder.message
    } else {
      closeFulfillModal()
      fetchOrder()
    }
  } catch (err) {
    console.error('Failed to fulfill order:', err)
    error.value = err.message || 'Failed to fulfill order'
  } finally {
    fulfilling.value = false
  }
}

const TRANSITION_FULFILLMENT_MUTATION = gql`
  mutation TransitionFulfillmentToState($id: ID!, $state: String!) {
    transitionFulfillmentToState(id: $id, state: $state) {
      ... on Fulfillment {
        id
        state
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

const transitionFulfillment = async (id, state) => {
  transitFulfillmentId.value = id
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    const { data } = await apolloClient.mutate({
      mutation: TRANSITION_FULFILLMENT_MUTATION,
      variables: { id, state }
    })
    if (data?.transitionFulfillmentToState?.message) {
      error.value = data.transitionFulfillmentToState.message
    }
    fetchOrder()
  } catch (err) {
    console.error('Failed to transition fulfillment:', err)
    error.value = err.message || 'Failed to transition fulfillment'
  } finally {
    transitFulfillmentId.value = null
  }
}

const fulfillmentId = (f) => {
  // Vendure uses a numeric sequence for Fulfillment IDs ("Fulfillment #9").
  // We can derive the numeric portion by stripping the GraphQL node id prefix.
  if (f.id == null) return '-'
  const m = String(f.id).match(/(\d+)$/)
  return m ? m[1] : f.id
}

const totalFulfillmentQty = (f) => {
  if (!f.lines || f.lines.length === 0) return 0
  return f.lines.reduce((sum, l) => sum + (l.quantity || 0), 0)
}

const toggleFulfillmentItems = (id) => {
  expandedFulfillmentIds.value[id] = !expandedFulfillmentIds.value[id]
}

const openCancelModal = () => {
  cancelReason.value = ''
  cancelShipping.value = true
  cancelError.value = ''
  showCancelModal.value = true
}

const closeCancelModal = () => {
  if (cancelling.value) return
  showCancelModal.value = false
  cancelReason.value = ''
  cancelError.value = ''
}

const CANCEL_ORDER_MUTATION = gql`
  mutation CancelOrder($input: CancelOrderInput!) {
    cancelOrder(input: $input) {
      ... on Order {
        id
        state
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

const submitCancel = async () => {
  if (!order.value?.id) return
  cancelling.value = true
  cancelError.value = ''
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    const input = { orderId: order.value.id, cancelShipping: cancelShipping.value }
    if (cancelReason.value.trim()) {
      input.reason = cancelReason.value.trim()
    }
    const { data } = await apolloClient.mutate({
      mutation: CANCEL_ORDER_MUTATION,
      variables: { input }
    })
    const result = data?.cancelOrder
    if (result?.errorCode || result?.message) {
      cancelError.value = result.message || result.errorCode
    } else {
      showCancelModal.value = false
      cancelReason.value = ''
      await fetchOrder()
    }
  } catch (err) {
    console.error('Failed to cancel order:', err)
    cancelError.value = err.message || 'Failed to cancel order'
  } finally {
    cancelling.value = false
  }
}

onMounted(() => {
  fetchOrder()
})
</script>
