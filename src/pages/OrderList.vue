<template>
  <div class="order-list-section">
    <h2 class="text-3xl font-bold text-center mb-8 text-dark-300 drop-shadow-lg">Orders</h2>

    <div v-if="loading" class="text-center py-10 text-gray-400">Loading orders...</div>

    <div v-else-if="error" class="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md mb-6">
      <h3 class="font-bold mb-2">An error occurred:</h3>
      <p class="text-sm">{{ error }}</p>
    </div>

    <div v-else-if="orders.length > 0" class="mb-6">
      <!-- Pagination -->
      <div class="flex items-center justify-center gap-3 mb-6">
        <button @click="firstPage" :disabled="currentPage === 1"
          class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">
          First
        </button>
        <button @click="prevPage" :disabled="currentPage === 1"
          class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">
          Previous
        </button>
        <div class="flex items-center gap-2">
          <button v-for="page in visiblePages" :key="page" @click="goToPage(page)" :class="['px-3 py-2 rounded-md transition-colors',
            currentPage === page ? 'bg-primary text-white' : 'bg-gray-600 text-white']">
            {{ page }}
          </button>
        </div>
        <span class="text-gray-300">
          Page {{ currentPage }} of {{ totalPages }} ({{ totalItems }} orders)
        </span>
        <button @click="nextPage" :disabled="currentPage >= totalPages"
          class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">
          Next
        </button>
        <button @click="lastPage" :disabled="currentPage >= totalPages"
          class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">
          Last
        </button>
      </div>

      <!-- Orders table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-dark-100 text-gray-400 text-sm uppercase tracking-wider">
              <th class="px-4 py-3 font-semibold">ID</th>
              <th class="px-4 py-3 font-semibold">Code</th>
              <th class="px-4 py-3 font-semibold">State</th>
              <th class="px-4 py-3 font-semibold">Customer</th>
              <th class="px-4 py-3 font-semibold">Total</th>
              <th class="px-4 py-3 font-semibold">Shipping</th>
              <th class="px-4 py-3 font-semibold">Placed At</th>
              <th class="px-4 py-3 font-semibold">Lines</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id" class="border-b border-dark-100 hover:bg-dark-200/50 transition-colors">
              <td class="px-4 py-3 text-gray-300 font-mono text-xs">{{ order.id }}</td>
              <td class="px-4 py-3 text-blue-300 font-mono text-sm"><router-link :to="`/orders/${order.id}`" class="hover:underline">{{ order.code }}</router-link></td>
              <td class="px-4 py-3">
                <span :class="stateClass(order.state)" class="px-2 py-1 rounded-full text-xs font-semibold">
                  {{ order.state }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-300">
                {{ order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : '-' }}
              </td>
              <td class="px-4 py-3 text-gray-300 font-mono">
                {{ formatPrice(order.totalWithTax) }} {{ order.currencyCode }}
              </td>
              <td class="px-4 py-3 text-gray-300 text-sm">
                {{ shippingMethod(order) }}
              </td>
              <td class="px-4 py-3 text-gray-300 text-sm">
                {{ formatDate(order.orderPlacedAt || order.createdAt) }}
              </td>
              <td class="px-4 py-3 text-gray-300 text-sm">
                {{ order.lines.length }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="text-center py-10 text-gray-500">No orders found.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { getChannelTokenFromQuery } from '../utils/channelToken.js'
import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'

const authStore = useAuthStore()

const orders = ref([])
const loading = ref(false)
const error = ref('')
const totalItems = ref(0)
const currentPage = ref(1)
const pageSize = Number(import.meta.env.VITE_VENDURE_ORDER_PAGE_NUMBER || 20)

const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)))

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

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

const GET_ORDERS_QUERY = gql`
  query GetOrders($take: Int!, $skip: Int!) {
    orders(options: { take: $take, skip: $skip, sort: { createdAt: DESC } }) {
      items {
        id
        code
        state
        active
        createdAt
        updatedAt
        orderPlacedAt
        currencyCode
        totalWithTax
        customer {
          id
          firstName
          lastName
          emailAddress
        }
        lines {
          id
          quantity
        }
        shippingLines {
          shippingMethod {
            id
            code
            name
          }
        }
        channels {
          id
          code
          token
        }
      }
      totalItems
    }
  }
`

const fetchOrders = async () => {
  loading.value = true
  error.value = ''
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    const { data } = await apolloClient.query({
      query: GET_ORDERS_QUERY,
      variables: {
        take: pageSize,
        skip: (currentPage.value - 1) * pageSize
      },
      fetchPolicy: 'network-only'
    })
    orders.value = data.orders.items
    totalItems.value = data.orders.totalItems
  } catch (err) {
    console.error('Failed to fetch orders:', err)
    error.value = err.message || 'Failed to load orders'
  } finally {
    loading.value = false
  }
}

const goToPage = (page) => {
  if (page !== currentPage.value) {
    currentPage.value = page
    fetchOrders()
  }
}

const firstPage = () => goToPage(1)
const prevPage = () => goToPage(Math.max(1, currentPage.value - 1))
const nextPage = () => goToPage(Math.min(totalPages.value, currentPage.value + 1))
const lastPage = () => goToPage(totalPages.value)

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
  }
  return map[state] || 'bg-gray-600/30 text-gray-300'
}

const formatPrice = (value) => {
  if (value == null) return '-'
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(value / 100)
}

const shippingMethod = (order) => {
  if (!order.shippingLines || order.shippingLines.length === 0) return '-'
  return order.shippingLines.map(sl => sl.shippingMethod?.name || sl.shippingMethod?.code || '?').join(', ')
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  fetchOrders()
})
</script>
