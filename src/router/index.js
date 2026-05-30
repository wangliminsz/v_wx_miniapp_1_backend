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

const routes = [
  {
    path: '/',
    name: 'ProductList',
    component: ProductList,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/search',
    name: 'Search',
    component: SearchPage,
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
  
  if (requiresAuth && !authStore.token) {
    // Redirect to login if trying to access protected route without auth
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router
