import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Lazy load components
const ProductList = () => import('../components/ProductList.vue')
const SearchPage = () => import('../pages/SearchPage.vue')
const ChannelClone = () => import('../pages/ChannelClone.vue')
const ImportPage = () => import('../pages/ImportPage.vue')
const ImportProductPage = () => import('../pages/ImportProductPage.vue')
const I18nZhPage = () => import('../pages/I18nZhPage.vue')
const ManageVariants = () => import('../pages/ManageVariants.vue')
const LoginPage = () => import('../pages/LoginPage.vue')
const PaginatedProductList = () => import('../pages/PaginatedProductList.vue')
const OrderList = () => import('../pages/OrderList.vue')
const OrderDetail = () => import('../pages/OrderDetail.vue')
const CustomerList = () => import('../pages/CustomerList.vue')
const CustomerDetail = () => import('../pages/CustomerDetail.vue')
const CustomerGroupList = () => import('../pages/CustomerGroupList.vue')
const VariantGroupList = () => import('../pages/VariantGroupList.vue')
const RalColors = () => import('../pages/RalColors.vue')

const routes = [
  {
    path: '/',
    redirect: '/products/paginated'
  },
  {
    path: '/products/paginated',
    name: 'PaginatedProductList',
    component: PaginatedProductList,
    meta: { requiresAuth: true }
  },
  {
    path: '/variants-with-group',
    name: 'VariantGroupList',
    component: VariantGroupList,
    meta: { requiresAuth: true }
  },
  {
    path: '/ral-colors',
    name: 'RalColors',
    component: RalColors,
    meta: { requiresAuth: true }
  },

  {
    path: '/orders',
    name: 'OrderList',
    component: OrderList,
    meta: { requiresAuth: true }
  },
  {
    path: '/orders/:orderId',
    name: 'OrderDetail',
    component: OrderDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/customers',
    name: 'CustomerList',
    component: CustomerList,
    meta: { requiresAuth: true }
  },
  {
    path: '/customers/:customerId',
    name: 'CustomerDetail',
    component: CustomerDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/customer-groups',
    name: 'CustomerGroupList',
    component: CustomerGroupList,
    meta: { requiresAuth: true }
  },

  {
    path: '/search',
    name: 'Search',
    component: SearchPage,
    meta: { requiresAuth: true }
  },

  // {
  //   path: '/products/paginated',
  //   name: 'PaginatedProductList',
  //   component: PaginatedProductList,
  //   meta: {
  //     requiresAuth: true
  //   }
  // },


  {
    path: '/products',
    name: 'ProductList',
    component: ProductList,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/channels/clone',
    name: 'ChannelClone',
    component: ChannelClone,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/import',
    name: 'Import',
    component: ImportPage,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/import/product',
    name: 'ImportProduct',
    component: ImportProductPage,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/i18n/zh',
    name: 'I18nZh',
    component: I18nZhPage,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/products/:productId/variants',
    name: 'ManageVariants',
    component: ManageVariants,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for protected routes
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  // Preserve channel query param across all navigations
  if (from.query.channel && !to.query.channel) {
    next({ ...to, query: { ...to.query, channel: from.query.channel } })
    return
  }

  if (requiresAuth && !authStore.token) {
    // Redirect to login if trying to access protected route without auth, preserving query params!
    next({ name: 'Login', query: to.query })
  } else {
    next()
  }
})

export default router
