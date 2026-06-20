import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Lazy load components
const ProductList = () => import('../components/ProductList.vue')
const SearchPage = () => import('../pages/SearchPage.vue')
const ChannelClone = () => import('../pages/ChannelClone.vue')
const CloneSub = () => import('../pages/CloneSub.vue')
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
const CollectionsList = () => import('../pages/CollectionsList.vue')
const AssetsList = () => import('../pages/AssetsList.vue')
const VariantList = () => import('../pages/VariantList.vue')
const ChannelList = () => import('../pages/ChannelList.vue')
const ChannelEdit = () => import('../pages/ChannelEdit.vue')
const CopyRoles = () => import('../pages/CopyRoles.vue')

const routes = [
  {
    path: '/',
    // Role-aware default landing page:
    //   superadmin / channel_admin / viewer → /collections
    //   admin_for_delivery                  → /orders
    // The redirect runs *after* the role guard, so by the time it
    // runs the auth store already has the user's role.
    redirect: () => {
      const authStore = useAuthStore()
      return authStore.homeRoute()
    }
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
    path: '/collections',
    name: 'CollectionsList',
    component: CollectionsList,
    meta: { requiresAuth: true }
  },

  {
    path: '/channels',
    name: 'ChannelList',
    component: ChannelList,
    meta: { requiresAuth: true }
  },

  {
    path: '/channels/:channelId',
    name: 'ChannelEdit',
    component: ChannelEdit,
    meta: { requiresAuth: true }
  },

  {
    path: '/copy-roles',
    name: 'CopyRoles',
    component: CopyRoles,
    meta: { requiresAuth: true }
  },

  {
    path: '/assets',
    name: 'AssetsList',
    component: AssetsList,
    meta: { requiresAuth: true }
  },

  {
    path: '/variants',
    name: 'VariantList',
    component: VariantList,
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
    path: '/clone-sub',
    name: 'CloneSub',
    component: CloneSub,
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

// Default channel applied when a URL has no `?channel=` query string.
// `blank_channel` is the Vendure-defined "no-op" channel in this project.
const DEFAULT_CHANNEL = 'blank_channel'

// Navigation guard — runs on EVERY navigation (initial load, redirect,
// <router-link> click, router.push, browser back/forward, etc.).
//
// Channel resolution priority for `to.query.channel`:
//   1. Explicit `?channel=X` on the destination URL wins (user
//      intentionally chose a channel by typing/pasting the URL).
//   2. Otherwise inherit the channel from the previous URL
//      (so navigating Collections → Variants keeps the channel).
//   3. Otherwise fall back to DEFAULT_CHANNEL.
//
// If the resolved channel isn't already on the URL, we force-navigate
// with it appended so the address bar always shows `?channel=...`.
// `replace: true` keeps the back button clean.
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  // ── 1. Channel propagation (existing logic) ─────────────────────
  const incoming = to.query.channel
  const inherited = from.query.channel
  const effective = incoming || inherited || DEFAULT_CHANNEL

  if (incoming !== effective) {
    next({ ...to, query: { ...to.query, channel: effective }, replace: true })
    return
  }

  // ── 2. Auth gate ─────────────────────────────────────────────────
  if (requiresAuth && !authStore.token) {
    // Redirect to login if trying to access protected route without
    // auth, preserving query params (including ?channel=...).
    next({ name: 'Login', query: to.query })
    return
  }

  // ── 3. Role-based access gate ────────────────────────────────────
  // admin_for_delivery is restricted to /orders and /orders/:id.
  // Any other navigation is bounced to the orders list.
  if (requiresAuth && authStore.userRole === 'admin_for_delivery') {
    if (!to.path.startsWith('/orders')) {
      next({ name: 'Orders', query: to.query, replace: true })
      return
    }
  }

  // ── 4. Login page is forbidden when already authenticated ────────
  // (Prevents a logged-in delivery admin from being sent to the
  // login page by a stale redirect.)
  if (to.name === 'Login' && authStore.token) {
    next({ path: authStore.homeRoute(), query: to.query, replace: true })
    return
  }

  next()
})

export default router
