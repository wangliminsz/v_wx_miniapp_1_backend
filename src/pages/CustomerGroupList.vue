<template>
  <div class="customer-group-list-section">
    <h2 class="text-3xl font-bold text-center mb-8 text-dark-300 drop-shadow-lg">Customer Groups</h2>

    <div v-if="loading && !groups.length" class="text-center py-10 text-gray-400">Loading groups...</div>

    <div v-else-if="error" class="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md mb-6">
      <h3 class="font-bold mb-2">An error occurred:</h3>
      <p class="text-sm">{{ error }}</p>
    </div>

    <template v-else>
      <div class="mb-6 flex items-center gap-4">
        <div class="relative flex-1 max-w-md">
          <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="Search groups..."
            class="w-full px-4 py-2 pl-10 bg-dark-200 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/50 transition-colors text-sm" />
          <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <button @click="openCreateModal"
          class="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500 transition-colors">
          + New Group
        </button>
        <div class="flex items-center gap-2 ml-auto">
          <span class="text-sm text-gray-400">{{ totalItems }} groups</span>
        </div>
      </div>

      <div v-if="groups.length" class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-dark-100 text-gray-400 text-sm uppercase tracking-wider">
              <th class="px-4 py-3 font-semibold">ID</th>
              <th class="px-4 py-3 font-semibold">Name</th>
              <th class="px-4 py-3 font-semibold">Customers</th>
              <th class="px-4 py-3 font-semibold">Created At</th>
              <th class="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="group in groups" :key="group.id"
              class="border-b border-dark-100 hover:bg-dark-200/50 transition-colors cursor-pointer"
              @click="openGroupDetail(group)">
              <td class="px-4 py-3 text-blue-300 font-mono text-sm">{{ group.id }}</td>
              <td class="px-4 py-3 text-gray-300 font-medium">{{ group.name }}</td>
              <td class="px-4 py-3 text-gray-300">{{ group.customers?.totalItems ?? 0 }}</td>
              <td class="px-4 py-3 text-gray-400 text-sm">{{ formatDate(group.createdAt) }}</td>
              <td class="px-4 py-3">
                <div class="flex gap-2" @click.stop>
                  <button @click="openEditModal(group)" class="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500 transition-colors">Edit</button>
                  <button @click="confirmDelete(group)" class="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-500 transition-colors">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center py-10 text-gray-500">No groups found.</div>

      <div v-if="totalPages > 1" class="flex items-center justify-center gap-3 mt-8">
        <button @click="firstPage" :disabled="currentPage === 1"
          class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">First</button>
        <button @click="prevPage" :disabled="currentPage === 1"
          class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">Previous</button>
        <div class="flex items-center gap-2">
          <button v-for="page in visiblePages" :key="page" @click="goToPage(page)" :class="['px-3 py-2 rounded-md transition-colors',
            currentPage === page ? 'bg-primary text-white' : 'bg-gray-600 text-white']">{{ page }}</button>
        </div>
        <span class="text-gray-300">Page {{ currentPage }} of {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage >= totalPages"
          class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">Next</button>
        <button @click="lastPage" :disabled="currentPage >= totalPages"
          class="px-4 py-2 bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">Last</button>
      </div>
    </template>

    <!-- Create/Edit Group Modal -->
    <div v-if="showGroupModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click.self="closeGroupModal">
      <div class="bg-dark-200 rounded-lg border border-dark-100 p-6 w-full max-w-md">
        <h3 class="text-xl font-bold text-gray-200 mb-4">{{ editingGroup ? 'Edit Group' : 'New Group' }}</h3>
        <div class="mb-4">
          <label class="block text-sm text-gray-400 mb-1">Group Name</label>
          <input v-model="groupFormName" type="text" placeholder="Enter group name"
            class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary" />
        </div>
        <div class="flex justify-end gap-3">
          <button @click="closeGroupModal" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">Cancel</button>
          <button @click="saveGroup" :disabled="savingGroup" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors disabled:opacity-50">
            {{ savingGroup ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click.self="showDeleteModal = false">
      <div class="bg-dark-200 rounded-lg border border-dark-100 p-6 w-full max-w-sm">
        <h3 class="text-xl font-bold text-red-400 mb-2">Delete Group</h3>
        <p class="text-gray-300 mb-4">Are you sure you want to delete <strong>{{ deletingGroup?.name }}</strong>?</p>
        <div class="flex justify-end gap-3">
          <button @click="showDeleteModal = false" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">Cancel</button>
          <button @click="deleteGroup" :disabled="savingGroup" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors disabled:opacity-50">
            {{ savingGroup ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Group Detail Modal (view members) -->
    <div v-if="showDetailModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click.self="closeDetailModal">
      <div class="bg-dark-200 rounded-lg border border-dark-100 p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-200">Group: {{ detailGroup?.name }}</h3>
          <button @click="closeDetailModal" class="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div class="mb-4 flex gap-2">
          <button @click="openAddCustomersModal" class="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-500 transition-colors">+ Add Customers</button>
          <button @click="fetchGroupCustomers" class="px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-500 transition-colors" :disabled="loadingCustomers">Refresh</button>
          <span class="text-sm text-gray-400 ml-auto self-center">{{ detailTotalItems }} customers</span>
        </div>

        <div v-if="loadingCustomers" class="text-center py-6 text-gray-400">Loading customers...</div>
        <div v-else-if="groupCustomers.length === 0" class="text-center py-6 text-gray-500">No customers in this group.</div>
        <table v-else class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-dark-100 text-gray-400 text-sm uppercase tracking-wider">
              <th class="px-3 py-2 font-semibold">Code</th>
              <th class="px-3 py-2 font-semibold">Name</th>
              <th class="px-3 py-2 font-semibold">Email</th>
              <th class="px-3 py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="customer in groupCustomers" :key="customer.id" class="border-b border-dark-100">
              <td class="px-3 py-2 text-blue-300 font-mono text-sm">{{ customer.id }}</td>
              <td class="px-3 py-2 text-gray-300 text-sm">{{ customer.firstName }} {{ customer.lastName }}</td>
              <td class="px-3 py-2 text-gray-400 text-sm">{{ customer.emailAddress }}</td>
              <td class="px-3 py-2">
                <button @click="removeCustomer(customer)" class="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-500 transition-colors">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="detailTotalPages > 1" class="flex items-center justify-center gap-2 mt-4">
          <button @click="detailPage--; fetchGroupCustomers()" :disabled="detailPage === 1" class="px-3 py-1 bg-gray-600 text-white rounded text-xs disabled:opacity-50">Prev</button>
          <span class="text-gray-400 text-xs">Page {{ detailPage }} of {{ detailTotalPages }}</span>
          <button @click="detailPage++; fetchGroupCustomers()" :disabled="detailPage >= detailTotalPages" class="px-3 py-1 bg-gray-600 text-white rounded text-xs disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>

    <!-- Add Customers Modal -->
    <div v-if="showAddCustomersModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click.self="showAddCustomersModal = false">
      <div class="bg-dark-200 rounded-lg border border-dark-100 p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-200">Add Customers to {{ detailGroup?.name }}</h3>
          <button @click="showAddCustomersModal = false" class="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div class="mb-4">
          <input v-model="customerSearchQuery" @input="onCustomerSearchInput" type="text" placeholder="Search customers..."
            class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary text-sm" />
        </div>

        <div v-if="loadingAvailableCustomers" class="text-center py-4 text-gray-400">Loading...</div>
        <div v-else-if="availableCustomers.length === 0" class="text-center py-4 text-gray-500">No customers found.</div>
        <div v-else class="space-y-1 max-h-60 overflow-y-auto mb-4">
          <label v-for="customer in availableCustomers" :key="customer.id"
            class="flex items-center gap-3 px-3 py-2 rounded hover:bg-dark-300 cursor-pointer">
            <input type="checkbox" :value="customer.id" v-model="selectedCustomerIds"
              class="rounded bg-dark-300 border-dark-100 text-blue-600" />
            <span class="text-gray-300 text-sm">{{ customer.firstName }} {{ customer.lastName }}</span>
            <span class="text-gray-500 text-xs ml-auto">{{ customer.emailAddress }}</span>
          </label>
        </div>

        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-400">{{ selectedCustomerIds.length }} selected</span>
          <div class="flex gap-3">
            <button @click="showAddCustomersModal = false" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">Cancel</button>
            <button @click="addCustomersToGroup" :disabled="savingGroup || selectedCustomerIds.length === 0"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50">
              {{ savingGroup ? 'Adding...' : `Add (${selectedCustomerIds.length})` }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { getChannelTokenFromQuery } from '../utils/channelToken.js'
import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'

const authStore = useAuthStore()

const groups = ref([])
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
  for (let i = start; i <= end; i++) pages.push(i)
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

const GET_GROUPS_QUERY = gql`
  query GetCustomerGroups($take: Int!, $skip: Int!, $filter: CustomerGroupFilterParameter) {
    customerGroups(options: { take: $take, skip: $skip, sort: { createdAt: DESC }, filter: $filter }) {
      items {
        id
        createdAt
        name
        customers {
          totalItems
        }
      }
      totalItems
    }
  }
`

const fetchGroups = async () => {
  loading.value = true
  error.value = ''
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    const filter = searchQuery.value
      ? { name: { contains: searchQuery.value } }
      : undefined
    const { data } = await apolloClient.query({
      query: GET_GROUPS_QUERY,
      variables: {
        take: pageSize,
        skip: (currentPage.value - 1) * pageSize,
        filter
      },
      fetchPolicy: 'network-only'
    })
    groups.value = data.customerGroups.items
    totalItems.value = data.customerGroups.totalItems
  } catch (err) {
    console.error('Failed to fetch groups:', err)
    error.value = err.message || 'Failed to load groups'
  } finally {
    loading.value = false
  }
}

const onSearchInput = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchGroups()
  }, 400)
}

const goToPage = (page) => {
  if (page !== currentPage.value) {
    currentPage.value = page
    fetchGroups()
  }
}

const firstPage = () => goToPage(1)
const prevPage = () => goToPage(Math.max(1, currentPage.value - 1))
const nextPage = () => goToPage(Math.min(totalPages.value, currentPage.value + 1))
const lastPage = () => goToPage(totalPages.value)

// Create / Edit
const showGroupModal = ref(false)
const editingGroup = ref(null)
const groupFormName = ref('')
const savingGroup = ref(false)

const openCreateModal = () => {
  editingGroup.value = null
  groupFormName.value = ''
  showGroupModal.value = true
}

const openEditModal = (group) => {
  editingGroup.value = group
  groupFormName.value = group.name
  showGroupModal.value = true
}

const closeGroupModal = () => {
  showGroupModal.value = false
  editingGroup.value = null
  groupFormName.value = ''
}

const CREATE_GROUP_MUTATION = gql`
  mutation CreateCustomerGroup($input: CreateCustomerGroupInput!) {
    createCustomerGroup(input: $input) {
      id
      name
    }
  }
`

const UPDATE_GROUP_MUTATION = gql`
  mutation UpdateCustomerGroup($input: UpdateCustomerGroupInput!) {
    updateCustomerGroup(input: $input) {
      id
      name
    }
  }
`

const saveGroup = async () => {
  if (!groupFormName.value.trim()) return
  savingGroup.value = true
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    if (editingGroup.value) {
      await apolloClient.mutate({
        mutation: UPDATE_GROUP_MUTATION,
        variables: { input: { id: editingGroup.value.id, name: groupFormName.value.trim() } }
      })
    } else {
      await apolloClient.mutate({
        mutation: CREATE_GROUP_MUTATION,
        variables: { input: { name: groupFormName.value.trim() } }
      })
    }
    closeGroupModal()
    fetchGroups()
  } catch (err) {
    console.error('Failed to save group:', err)
    error.value = err.message || 'Failed to save group'
  } finally {
    savingGroup.value = false
  }
}

// Delete
const showDeleteModal = ref(false)
const deletingGroup = ref(null)

const confirmDelete = (group) => {
  deletingGroup.value = group
  showDeleteModal.value = true
}

const DELETE_GROUP_MUTATION = gql`
  mutation DeleteCustomerGroup($id: ID!) {
    deleteCustomerGroup(id: $id) {
      result
      message
    }
  }
`

const deleteGroup = async () => {
  if (!deletingGroup.value) return
  savingGroup.value = true
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    await apolloClient.mutate({
      mutation: DELETE_GROUP_MUTATION,
      variables: { id: deletingGroup.value.id }
    })
    showDeleteModal.value = false
    deletingGroup.value = null
    fetchGroups()
  } catch (err) {
    console.error('Failed to delete group:', err)
    error.value = err.message || 'Failed to delete group'
  } finally {
    savingGroup.value = false
  }
}

// Group Detail (view customers in group)
const showDetailModal = ref(false)
const detailGroup = ref(null)
const groupCustomers = ref([])
const loadingCustomers = ref(false)
const detailTotalItems = ref(0)
const detailPage = ref(1)
const detailPageSize = 10

const detailTotalPages = computed(() => Math.max(1, Math.ceil(detailTotalItems.value / detailPageSize)))

const GET_GROUP_CUSTOMERS_QUERY = gql`
  query GetGroupCustomers($id: ID!, $take: Int!, $skip: Int!) {
    customerGroup(id: $id) {
      id
      name
      customers(options: { take: $take, skip: $skip, sort: { createdAt: DESC } }) {
        items {
          id
          firstName
          lastName
          emailAddress
        }
        totalItems
      }
    }
  }
`

const openGroupDetail = async (group) => {
  detailGroup.value = group
  detailPage.value = 1
  showDetailModal.value = true
  await fetchGroupCustomers()
}

const closeDetailModal = () => {
  showDetailModal.value = false
  detailGroup.value = null
  groupCustomers.value = []
  showAddCustomersModal.value = false
}

const fetchGroupCustomers = async () => {
  if (!detailGroup.value) return
  loadingCustomers.value = true
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    const { data } = await apolloClient.query({
      query: GET_GROUP_CUSTOMERS_QUERY,
      variables: {
        id: detailGroup.value.id,
        take: detailPageSize,
        skip: (detailPage.value - 1) * detailPageSize
      },
      fetchPolicy: 'network-only'
    })
    groupCustomers.value = data.customerGroup.customers.items
    detailTotalItems.value = data.customerGroup.customers.totalItems
  } catch (err) {
    console.error('Failed to fetch group customers:', err)
  } finally {
    loadingCustomers.value = false
  }
}

// Remove customer from group
const REMOVE_CUSTOMERS_MUTATION = gql`
  mutation RemoveCustomersFromGroup($customerGroupId: ID!, $customerIds: [ID!]!) {
    removeCustomersFromGroup(customerGroupId: $customerGroupId, customerIds: $customerIds) {
      id
      name
    }
  }
`

const removeCustomer = async (customer) => {
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    await apolloClient.mutate({
      mutation: REMOVE_CUSTOMERS_MUTATION,
      variables: { customerGroupId: detailGroup.value.id, customerIds: [customer.id] }
    })
    fetchGroupCustomers()
    fetchGroups()
  } catch (err) {
    console.error('Failed to remove customer:', err)
  }
}

// Add customers to group
const showAddCustomersModal = ref(false)
const availableCustomers = ref([])
const selectedCustomerIds = ref([])
const loadingAvailableCustomers = ref(false)
const customerSearchQuery = ref('')
let customerSearchTimeout = null

const GET_AVAILABLE_CUSTOMERS_QUERY = gql`
  query GetAvailableCustomers($take: Int!, $skip: Int!, $filter: CustomerFilterParameter) {
    customers(options: { take: $take, skip: $skip, sort: { createdAt: DESC }, filter: $filter }) {
      items {
        id
        firstName
        lastName
        emailAddress
      }
      totalItems
    }
  }
`

const openAddCustomersModal = async () => {
  selectedCustomerIds.value = []
  customerSearchQuery.value = ''
  showAddCustomersModal.value = true
  await fetchAvailableCustomers()
}

const fetchAvailableCustomers = async () => {
  loadingAvailableCustomers.value = true
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    const filter = customerSearchQuery.value
      ? { firstName: { contains: customerSearchQuery.value }, lastName: { contains: customerSearchQuery.value }, emailAddress: { contains: customerSearchQuery.value } }
      : undefined
    const { data } = await apolloClient.query({
      query: GET_AVAILABLE_CUSTOMERS_QUERY,
      variables: { take: 50, skip: 0, filter },
      fetchPolicy: 'network-only'
    })
    availableCustomers.value = data.customers.items
  } catch (err) {
    console.error('Failed to fetch available customers:', err)
  } finally {
    loadingAvailableCustomers.value = false
  }
}

const onCustomerSearchInput = () => {
  clearTimeout(customerSearchTimeout)
  customerSearchTimeout = setTimeout(fetchAvailableCustomers, 400)
}

const ADD_CUSTOMERS_MUTATION = gql`
  mutation AddCustomersToGroup($customerGroupId: ID!, $customerIds: [ID!]!) {
    addCustomersToGroup(customerGroupId: $customerGroupId, customerIds: $customerIds) {
      id
      name
    }
  }
`

const addCustomersToGroup = async () => {
  if (selectedCustomerIds.value.length === 0) return
  savingGroup.value = true
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    await apolloClient.mutate({
      mutation: ADD_CUSTOMERS_MUTATION,
      variables: { customerGroupId: detailGroup.value.id, customerIds: selectedCustomerIds.value }
    })
    showAddCustomersModal.value = false
    fetchGroupCustomers()
    fetchGroups()
  } catch (err) {
    console.error('Failed to add customers:', err)
  } finally {
    savingGroup.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString()
}

onMounted(() => {
  fetchGroups()
})
</script>
