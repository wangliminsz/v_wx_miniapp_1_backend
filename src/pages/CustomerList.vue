<template>
  <div class="customer-list-section">
    <h2 class="text-3xl font-bold text-center mb-8 text-dark-300 drop-shadow-lg">Customers</h2>

    <div v-if="loading && !customers.length" class="text-center py-10 text-gray-400">Loading customers...</div>

    <div v-else-if="error" class="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md mb-6">
      <h3 class="font-bold mb-2">An error occurred:</h3>
      <p class="text-sm">{{ error }}</p>
    </div>

    <template v-else>
      <!-- Search bar -->
      <div class="mb-6 flex items-center gap-4">
        <div class="relative flex-1 max-w-md">
          <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="Search customers..."
            class="w-full px-4 py-2 pl-10 bg-dark-200 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors text-sm" />
          <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <div class="flex items-center gap-2 ml-auto">
          <span class="text-sm text-gray-400">{{ totalItems }} customers</span>
        </div>
      </div>

      <!-- Customers table -->
      <div v-if="customers.length" class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-dark-100 text-gray-400 text-sm uppercase tracking-wider">
              <th class="px-4 py-3 font-semibold">Code</th>
              <th class="px-4 py-3 font-semibold">Name</th>
              <th class="px-4 py-3 font-semibold">Email</th>
              <th v-if="authStore.isSuperAdmin" class="px-4 py-3 font-semibold">Channel</th>
              <th class="px-4 py-3 font-semibold">Orders</th>
              <th class="px-4 py-3 font-semibold">Groups</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="customer in customers" :key="customer.id" @click="$router.push(`/customers/${customer.id}`)"
              class="border-b border-dark-100 hover:bg-dark-200/50 transition-colors cursor-pointer">
              <td class="px-4 py-3 text-blue-300 font-mono text-sm">{{ customer.id }}</td>
              <td class="px-4 py-3 text-gray-300">{{ customer.firstName }} {{ customer.lastName }}</td>
              <td class="px-4 py-3 text-gray-400">{{ customer.emailAddress }}</td>
              <td v-if="authStore.isSuperAdmin" class="px-4 py-3 text-gray-300 text-sm font-mono">{{ channelCodes(customer) }}</td>
              <td class="px-4 py-3 text-gray-300">{{ customer.orders?.totalItems ?? 0 }}</td>
              <td class="px-4 py-3 text-gray-300 text-sm">{{ customer.groups?.map(g => g.name).join(', ') || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center py-10 text-gray-500">No customers found.</div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-3 mt-8">
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
          Page {{ currentPage }} of {{ totalPages }}
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

const customers = ref([])
const loading = ref(false)
const error = ref('')
const totalItems = ref(0)
const currentPage = ref(1)
const pageSize = Number(import.meta.env.VITE_VENDURE_PRODUCT_PAGE_NUMBER || 20)
const searchQuery = ref('')
let searchTimeout = null

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

const GET_CUSTOMERS_QUERY = gql`
  query GetCustomers($take: Int!, $skip: Int!, $filter: CustomerFilterParameter) {
    customers(options: { take: $take, skip: $skip, sort: { createdAt: DESC }, filter: $filter, filterOperator: OR }) {
      items {
        id
        createdAt
        firstName
        lastName
        emailAddress
        phoneNumber
        orders {
          totalItems
        }
        groups {
          id
          name
        }
        channels {
          id
          code
        }
      }
      totalItems
    }
  }
`

const fetchCustomers = async () => {
  loading.value = true
  error.value = ''
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    const filter = searchQuery.value
      ? { firstName: { contains: searchQuery.value }, lastName: { contains: searchQuery.value }, emailAddress: { contains: searchQuery.value } }
      : undefined
    const { data } = await apolloClient.query({
      query: GET_CUSTOMERS_QUERY,
      variables: {
        take: pageSize,
        skip: (currentPage.value - 1) * pageSize,
        filter
      },
      fetchPolicy: 'network-only'
    })
    customers.value = data.customers.items
    totalItems.value = data.customers.totalItems
  } catch (err) {
    console.error('Failed to fetch customers:', err)
    error.value = err.message || 'Failed to load customers'
  } finally {
    loading.value = false
  }
}

const onSearchInput = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchCustomers()
  }, 400)
}

const goToPage = (page) => {
  if (page !== currentPage.value) {
    currentPage.value = page
    fetchCustomers()
  }
}

const firstPage = () => goToPage(1)
const prevPage = () => goToPage(Math.max(1, currentPage.value - 1))
const nextPage = () => goToPage(Math.min(totalPages.value, currentPage.value + 1))
const lastPage = () => goToPage(totalPages.value)

const channelCodes = (customer) => {
  if (!customer.channels || customer.channels.length === 0) return '-'
  const codes = customer.channels
    .map(c => c.code)
    .filter(code => code !== '__default_channel__')
  return codes.length ? codes.join(', ') : '-'
}

onMounted(() => {
  fetchCustomers()
})
</script>
