<template>
  <div v-if="loading" class="text-center py-10 text-gray-400">Loading customer...</div>

  <div v-else-if="error" class="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md mb-6">
    <h3 class="font-bold mb-2">An error occurred:</h3>
    <p class="text-sm">{{ error }}</p>
  </div>

  <div v-else-if="customer" class="customer-detail-section">
    <router-link to="/customers" class="text-blue-400 hover:text-blue-300 mb-4 inline-block">&larr; Back to Customers</router-link>

    <div class="flex items-center justify-between mb-6 bg-dark-200 p-4 rounded-md border border-dark-100">
      <div class="flex items-center gap-4">
        <h2 class="text-2xl font-bold text-dark-300">{{ customer.firstName }} {{ customer.lastName }}</h2>
        <span class="text-gray-400 font-mono text-sm">#{{ customer.id }}</span>
      </div>
      <div class="text-right text-sm text-gray-400">
        <div>Created: {{ formatDate(customer.createdAt) }}</div>
        <div v-if="customer.groups?.length" class="mt-1 flex gap-1 justify-end">
          <span v-for="g in customer.groups" :key="g.id" class="px-2 py-0.5 bg-blue-900/40 text-blue-300 rounded-full text-xs">{{ g.name }}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-dark-200 p-4 rounded-md border border-dark-100">
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Account Info</h3>
        <div class="text-gray-300 space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-gray-500">Title</span><span>{{ customer.title || '-' }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">First Name</span><span>{{ customer.firstName }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Last Name</span><span>{{ customer.lastName }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Email</span><span class="text-blue-300">{{ customer.emailAddress }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Phone</span><span>{{ customer.phoneNumber || '-' }}</span></div>
        </div>
      </div>

      <div class="bg-dark-200 p-4 rounded-md border border-dark-100">
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">User Account</h3>
        <div v-if="customer.user" class="text-gray-300 space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-gray-500">Identifier</span><span>{{ customer.user.identifier }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Verified</span>
            <span :class="customer.user.verified ? 'text-green-400' : 'text-yellow-400'">{{ customer.user.verified ? 'Yes' : 'No' }}</span>
          </div>
          <div class="flex justify-between"><span class="text-gray-500">Roles</span>
            <span>{{ customer.user.roles?.map(r => r.code).join(', ') || '-' }}</span>
          </div>
        </div>
        <div v-else class="text-gray-500 text-sm italic">No user account</div>
      </div>
    </div>

    <div class="mb-6 bg-dark-200 p-4 rounded-md border border-dark-100">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">Custom Fields</h3>
        <button v-if="!editingCustom" @click="startEditCustom" class="px-3 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-500 transition-colors">Edit</button>
      </div>

      <div v-if="!editingCustom" class="text-gray-300 space-y-2 text-sm">
        <div class="flex justify-between"><span class="text-gray-500">Company Info</span><span class="max-w-md text-right whitespace-pre-wrap">{{ customer.customFields?.companyInfo || '-' }}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">Invoice Info</span><span class="max-w-md text-right whitespace-pre-wrap">{{ customer.customFields?.invoiceInfo || '-' }}</span></div>
      </div>

      <div v-else class="space-y-3">
        <div>
          <label class="block text-gray-500 text-xs mb-1">Company Info</label>
          <textarea v-model="editCompanyInfo" rows="3" class="w-full px-3 py-2 bg-dark-100 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary text-sm font-mono resize-y"></textarea>
        </div>
        <div>
          <label class="block text-gray-500 text-xs mb-1">Invoice Info</label>
          <textarea v-model="editInvoiceInfo" rows="3" class="w-full px-3 py-2 bg-dark-100 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary text-sm font-mono resize-y"></textarea>
        </div>
        <div class="flex gap-2 justify-end">
          <button @click="cancelEditCustom" class="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500 transition-colors">Cancel</button>
          <button @click="saveCustom" :disabled="savingCustom" class="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500 transition-colors disabled:opacity-50">{{ savingCustom ? 'Saving...' : 'Save' }}</button>
        </div>
        <div v-if="saveError" class="text-red-400 text-sm">{{ saveError }}</div>
      </div>
    </div>

    <div class="mb-6 bg-dark-200 p-4 rounded-md border border-dark-100">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">Addresses ({{ customer.addresses?.length || 0 }})</h3>
        <button v-if="!addressFormVisible" @click="startAddAddress" class="px-3 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-500 transition-colors">Add Address</button>
      </div>

      <div v-if="addressFormVisible" class="bg-dark-100/50 p-4 rounded-md border border-dark-100 mb-3">
        <h4 class="text-sm font-semibold text-gray-400 mb-3">{{ editingAddressId ? 'Edit Address' : 'New Address' }}</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <label class="block text-gray-500 text-xs mb-1">Full Name</label>
            <input v-model="addrForm.fullName" class="w-full px-3 py-2 bg-dark-100 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary" />
          </div>
          <div>
            <label class="block text-gray-500 text-xs mb-1">Company</label>
            <input v-model="addrForm.company" class="w-full px-3 py-2 bg-dark-100 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-gray-500 text-xs mb-1">Street Line 1 *</label>
            <input v-model="addrForm.streetLine1" class="w-full px-3 py-2 bg-dark-100 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-gray-500 text-xs mb-1">Street Line 2</label>
            <input v-model="addrForm.streetLine2" class="w-full px-3 py-2 bg-dark-100 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary" />
          </div>
          <div>
            <label class="block text-gray-500 text-xs mb-1">City</label>
            <input v-model="addrForm.city" class="w-full px-3 py-2 bg-dark-100 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary" />
          </div>
          <div>
            <label class="block text-gray-500 text-xs mb-1">Province</label>
            <input v-model="addrForm.province" class="w-full px-3 py-2 bg-dark-100 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary" />
          </div>
          <div>
            <label class="block text-gray-500 text-xs mb-1">Postal Code</label>
            <input v-model="addrForm.postalCode" class="w-full px-3 py-2 bg-dark-100 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary" />
          </div>
          <div>
            <label class="block text-gray-500 text-xs mb-1">Country *</label>
            <select v-model="addrForm.countryCode" class="w-full px-3 py-2 bg-dark-100 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary">
              <option value="" disabled>Select country</option>
              <option v-for="c in countries" :key="c.id" :value="c.code">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-500 text-xs mb-1">Phone Number</label>
            <input v-model="addrForm.phoneNumber" class="w-full px-3 py-2 bg-dark-100 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary" />
          </div>
          <div class="flex items-center gap-6">
            <label class="flex items-center gap-2 text-gray-400 cursor-pointer">
              <input type="checkbox" v-model="addrForm.defaultShippingAddress" class="rounded bg-dark-100 border-dark-100" />
              Default Shipping
            </label>
            <label class="flex items-center gap-2 text-gray-400 cursor-pointer">
              <input type="checkbox" v-model="addrForm.defaultBillingAddress" class="rounded bg-dark-100 border-dark-100" />
              Default Billing
            </label>
          </div>
        </div>
        <div class="flex gap-2 justify-end mt-4">
          <button @click="cancelAddressForm" class="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500 transition-colors">Cancel</button>
          <button @click="saveAddress" :disabled="savingAddress" class="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500 transition-colors disabled:opacity-50">{{ savingAddress ? 'Saving...' : 'Save' }}</button>
        </div>
        <div v-if="addressSaveError" class="text-red-400 text-sm mt-2">{{ addressSaveError }}</div>
      </div>

      <div v-if="customer.addresses?.length" class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div v-for="addr in customer.addresses" :key="addr.id" class="bg-dark-100/50 p-3 rounded-md border border-dark-100 text-sm text-gray-300 relative">
          <div class="flex items-center gap-2 mb-2">
            <span v-if="addr.defaultShippingAddress" class="px-2 py-0.5 bg-green-900/40 text-green-300 rounded-full text-xs">Default Shipping</span>
            <span v-if="addr.defaultBillingAddress" class="px-2 py-0.5 bg-blue-900/40 text-blue-300 rounded-full text-xs">Default Billing</span>
            <div class="ml-auto flex gap-1">
              <button @click="startEditAddress(addr)" class="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-500 transition-colors">Edit</button>
              <button @click="confirmDeleteAddress(addr)" class="px-2 py-1 bg-red-700 text-white rounded text-xs hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
          <p v-if="addr.fullName" class="font-medium">{{ addr.fullName }}</p>
          <p v-if="addr.company">{{ addr.company }}</p>
          <p>{{ addr.streetLine1 }}</p>
          <p v-if="addr.streetLine2">{{ addr.streetLine2 }}</p>
          <p>{{ [addr.city, addr.province, addr.postalCode].filter(Boolean).join(', ') }}</p>
          <p>{{ addr.country?.name || addr.country || '' }}</p>
          <p v-if="addr.phoneNumber" class="text-gray-500">{{ addr.phoneNumber }}</p>
        </div>
      </div>
      <div v-else-if="!addressFormVisible" class="text-gray-500 text-sm italic">No addresses</div>
    </div>

    <div class="mb-6 bg-dark-200 p-4 rounded-md border border-dark-100">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Orders ({{ customer.orders?.totalItems || 0 }})</h3>
      <div v-if="customer.orders?.items?.length" class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-dark-100 text-gray-500 text-xs uppercase tracking-wider">
              <th class="px-3 py-2 font-semibold">Code</th>
              <th class="px-3 py-2 font-semibold">State</th>
              <th class="px-3 py-2 font-semibold">Total</th>
              <th class="px-3 py-2 font-semibold">Placed</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in customer.orders.items" :key="o.id" class="border-b border-dark-100 text-sm text-gray-300 hover:bg-dark-100/50 transition-colors cursor-pointer" @click="goToOrder(o.id)">
              <td class="px-3 py-2 text-blue-300 font-mono">{{ o.code }}</td>
              <td class="px-3 py-2"><span :class="stateClass(o.state)" class="px-2 py-0.5 rounded-full text-xs font-semibold">{{ o.state }}</span></td>
              <td class="px-3 py-2 font-mono">{{ formatPrice(o.totalWithTax) }}</td>
              <td class="px-3 py-2 text-gray-500 text-xs">{{ formatDate(o.orderPlacedAt || o.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="text-gray-500 text-sm italic">No orders</div>
    </div>

    <div v-if="customer.history?.items?.length" class="bg-dark-200 p-4 rounded-md border border-dark-100">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">History</h3>
      <div class="space-y-3">
        <div v-for="entry in customer.history.items" :key="entry.id" class="relative pl-6 border-l-2 border-dark-100 pb-3 last:pb-0">
          <div class="absolute -left-1.5 top-1 w-2.5 h-2.5 rounded-full bg-dark-100"></div>
          <p class="text-xs text-gray-500">{{ formatDate(entry.createdAt) }}</p>
          <p class="text-sm font-medium text-gray-200">{{ formatHistoryType(entry.type) }}</p>
          <p v-if="entry.data?.note" class="text-sm text-gray-400 italic mt-1">{{ entry.data.note }}</p>
          <div v-if="historyDataSummary(entry)" class="text-xs text-gray-500 mt-1 space-y-0.5">
            <p v-for="(line, i) in historyDataSummary(entry)" :key="i">{{ line }}</p>
          </div>
          <p v-if="entry.administrator" class="text-xs text-gray-600 mt-1">by {{ entry.administrator.firstName }} {{ entry.administrator.lastName }}</p>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-10 text-gray-500">Customer not found.</div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { getChannelTokenFromQuery } from '../utils/channelToken.js'
import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const customer = ref(null)
const loading = ref(false)
const error = ref('')

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

const GET_CUSTOMER_QUERY = gql`
  query GetCustomer($id: ID!) {
    customer(id: $id) {
      id
      createdAt
      updatedAt
      title
      firstName
      lastName
      phoneNumber
      emailAddress
      groups {
        id
        name
      }
      user {
        id
        identifier
        verified
        roles {
          id
          code
          description
        }
      }
      customFields {
        companyInfo
        invoiceInfo
      }
      addresses {
        id
        fullName
        company
        streetLine1
        streetLine2
        city
        province
        postalCode
        country {
          id
          name
          code
        }
        phoneNumber
        defaultShippingAddress
        defaultBillingAddress
      }
      orders(options: { take: 10, sort: { createdAt: DESC } }) {
        totalItems
        items {
          id
          code
          state
          totalWithTax
          currencyCode
          createdAt
          orderPlacedAt
        }
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

const COUNTRIES_QUERY = gql`
  query GetCountries {
    countries(options: { take: 300 }) {
      items {
        id
        code
        name
        enabled
      }
    }
  }
`

const editingCustom = ref(false)
const editCompanyInfo = ref('')
const editInvoiceInfo = ref('')
const savingCustom = ref(false)
const saveError = ref('')

const UPDATE_CUSTOMER_MUTATION = gql`
  mutation UpdateCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      ... on Customer {
        id
        customFields {
          companyInfo
          invoiceInfo
        }
      }
      ... on EmailAddressConflictError {
        errorCode
        message
      }
    }
  }
`

const startEditCustom = () => {
  editCompanyInfo.value = customer.value.customFields?.companyInfo || ''
  editInvoiceInfo.value = customer.value.customFields?.invoiceInfo || ''
  saveError.value = ''
  editingCustom.value = true
}

const cancelEditCustom = () => {
  editingCustom.value = false
  saveError.value = ''
}

const saveCustom = async () => {
  savingCustom.value = true
  saveError.value = ''
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    const { data } = await apolloClient.mutate({
      mutation: UPDATE_CUSTOMER_MUTATION,
      variables: {
        input: {
          id: customer.value.id,
          customFields: {
            companyInfo: editCompanyInfo.value,
            invoiceInfo: editInvoiceInfo.value,
          }
        }
      },
      fetchPolicy: 'network-only'
    })
    if (data.updateCustomer?.errorCode) {
      saveError.value = data.updateCustomer.message
    } else {
      customer.value = { ...customer.value, customFields: { companyInfo: editCompanyInfo.value, invoiceInfo: editInvoiceInfo.value } }
      editingCustom.value = false
    }
  } catch (err) {
    console.error('Failed to update customer:', err)
    saveError.value = err.message || 'Failed to save'
  } finally {
    savingCustom.value = false
  }
}

const CREATE_ADDRESS_MUTATION = gql`
  mutation CreateAddress($customerId: ID!, $input: CreateAddressInput!) {
    createCustomerAddress(customerId: $customerId, input: $input) {
      id
      fullName
      company
      streetLine1
      streetLine2
      city
      province
      postalCode
      country {
        id
        name
        code
      }
      phoneNumber
      defaultShippingAddress
      defaultBillingAddress
    }
  }
`

const UPDATE_ADDRESS_MUTATION = gql`
  mutation UpdateAddress($input: UpdateAddressInput!) {
    updateCustomerAddress(input: $input) {
      id
      fullName
      company
      streetLine1
      streetLine2
      city
      province
      postalCode
      country {
        id
        name
        code
      }
      phoneNumber
      defaultShippingAddress
      defaultBillingAddress
    }
  }
`

const DELETE_ADDRESS_MUTATION = gql`
  mutation DeleteAddress($id: ID!) {
    deleteCustomerAddress(id: $id) {
      success
    }
  }
`

const countries = ref([])
const addressFormVisible = ref(false)
const editingAddressId = ref(null)
const savingAddress = ref(false)
const addressSaveError = ref('')

const defaultAddrForm = {
  fullName: '',
  company: '',
  streetLine1: '',
  streetLine2: '',
  city: '',
  province: '',
  postalCode: '',
  countryCode: '',
  phoneNumber: '',
  defaultShippingAddress: false,
  defaultBillingAddress: false,
}

const addrForm = reactive({ ...defaultAddrForm })

const resetAddrForm = () => {
  Object.assign(addrForm, defaultAddrForm)
}

const startAddAddress = () => {
  editingAddressId.value = null
  resetAddrForm()
  addressSaveError.value = ''
  addressFormVisible.value = true
}

const startEditAddress = (addr) => {
  editingAddressId.value = addr.id
  addrForm.fullName = addr.fullName || ''
  addrForm.company = addr.company || ''
  addrForm.streetLine1 = addr.streetLine1 || ''
  addrForm.streetLine2 = addr.streetLine2 || ''
  addrForm.city = addr.city || ''
  addrForm.province = addr.province || ''
  addrForm.postalCode = addr.postalCode || ''
  addrForm.countryCode = addr.country?.code || ''
  addrForm.phoneNumber = addr.phoneNumber || ''
  addrForm.defaultShippingAddress = addr.defaultShippingAddress || false
  addrForm.defaultBillingAddress = addr.defaultBillingAddress || false
  addressSaveError.value = ''
  addressFormVisible.value = true
}

const cancelAddressForm = () => {
  addressFormVisible.value = false
  editingAddressId.value = null
  addressSaveError.value = ''
}

const saveAddress = async () => {
  if (!addrForm.streetLine1) {
    addressSaveError.value = 'Street Line 1 is required'
    return
  }
  if (!addrForm.countryCode) {
    addressSaveError.value = 'Country is required'
    return
  }
  savingAddress.value = true
  addressSaveError.value = ''
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    const input = {
      fullName: addrForm.fullName,
      company: addrForm.company,
      streetLine1: addrForm.streetLine1,
      streetLine2: addrForm.streetLine2,
      city: addrForm.city,
      province: addrForm.province,
      postalCode: addrForm.postalCode,
      countryCode: addrForm.countryCode,
      phoneNumber: addrForm.phoneNumber,
      defaultShippingAddress: addrForm.defaultShippingAddress,
      defaultBillingAddress: addrForm.defaultBillingAddress,
    }
    if (editingAddressId.value) {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_ADDRESS_MUTATION,
        variables: { input: { id: editingAddressId.value, ...input } },
        fetchPolicy: 'network-only'
      })
      const updated = data.updateCustomerAddress
      customer.value = {
        ...customer.value,
        addresses: customer.value.addresses.map(a => a.id === updated.id ? updated : a)
      }
    } else {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_ADDRESS_MUTATION,
        variables: { customerId: customer.value.id, input },
        fetchPolicy: 'network-only'
      })
      const created = data.createCustomerAddress
      customer.value = {
        ...customer.value,
        addresses: [...(customer.value.addresses || []), created]
      }
    }
    addressFormVisible.value = false
    editingAddressId.value = null
  } catch (err) {
    console.error('Failed to save address:', err)
    addressSaveError.value = err.message || 'Failed to save address'
  } finally {
    savingAddress.value = false
  }
}

const confirmDeleteAddress = async (addr) => {
  if (!confirm(`Delete address "${addr.streetLine1}"?`)) return
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    await apolloClient.mutate({
      mutation: DELETE_ADDRESS_MUTATION,
      variables: { id: addr.id },
      fetchPolicy: 'network-only'
    })
    customer.value = {
      ...customer.value,
      addresses: customer.value.addresses.filter(a => a.id !== addr.id)
    }
  } catch (err) {
    console.error('Failed to delete address:', err)
  }
}

const fetchCountries = async () => {
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    const { data } = await apolloClient.query({
      query: COUNTRIES_QUERY,
      fetchPolicy: 'network-only'
    })
    countries.value = data.countries.items.filter(c => c.enabled)
  } catch (err) {
    console.error('Failed to fetch countries:', err)
  }
}

const fetchCustomer = async () => {
  loading.value = true
  error.value = ''
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    const { data } = await apolloClient.query({
      query: GET_CUSTOMER_QUERY,
      variables: { id: route.params.customerId },
      fetchPolicy: 'network-only'
    })
    customer.value = data.customer
  } catch (err) {
    console.error('Failed to fetch customer:', err)
    error.value = err.message || 'Failed to load customer'
  } finally {
    loading.value = false
  }
}

const goToOrder = (orderId) => {
  router.push(`/orders/${orderId}`)
}

const formatHistoryType = (type) => {
  const labels = {
    CUSTOMER_REGISTERED: 'Customer Registered',
    CUSTOMER_VERIFIED: 'Email Verified',
    CUSTOMER_DETAIL_UPDATED: 'Details Updated',
    CUSTOMER_ADDRESS_CREATED: 'Address Created',
    CUSTOMER_ADDRESS_UPDATED: 'Address Updated',
    CUSTOMER_ADDRESS_DELETED: 'Address Deleted',
    CUSTOMER_PASSWORD_UPDATED: 'Password Updated',
    CUSTOMER_PASSWORD_RESET_REQUESTED: 'Password Reset Requested',
    CUSTOMER_PASSWORD_RESET_VERIFIED: 'Password Reset Verified',
    CUSTOMER_EMAIL_UPDATE_REQUESTED: 'Email Change Requested',
    CUSTOMER_ADDED_TO_GROUP: 'Added to Group',
    CUSTOMER_REMOVED_FROM_GROUP: 'Removed from Group',
    NOTE: 'Note',
  }
  return labels[type] || type
}

const historyDataSummary = (entry) => {
  const data = entry.data
  if (!data) return null
  const lines = []
  if (data.strategy) {
    lines.push(`Strategy: ${data.strategy}`)
  }
  if (data.oldEmailAddress || data.newEmailAddress) {
    if (data.oldEmailAddress) lines.push(`From: ${data.oldEmailAddress}`)
    if (data.newEmailAddress) lines.push(`To: ${data.newEmailAddress}`)
  }
  if (data.groupName) {
    lines.push(`Group: ${data.groupName}`)
  }
  if (data.input) {
    const changed = Object.entries(data.input).filter(([, v]) => v != null)
    if (changed.length) {
      lines.push(`Changed: ${changed.map(([k, v]) => `${k} = ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(', ')}`)
    }
  }
  if (data.address) {
    const addr = data.address
    const parts = [addr.streetLine1, addr.city, addr.province, addr.postalCode].filter(Boolean)
    if (parts.length) lines.push(`Address: ${parts.join(', ')}`)
  }
  return lines.length ? lines : null
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

onMounted(() => {
  fetchCustomer()
  fetchCountries()
})
</script>
