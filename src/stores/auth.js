import { defineStore } from 'pinia'
import router from '../router/index.js'

// Three recognised roles. The first match in ROLE_PRIORITY wins, so
// a superadmin who also has 'admin_for_delivery' is treated as a
// superadmin. `__super_admin_role__` (Vendure's internal superadmin
// role) is mapped to the 'superadmin' string by the me-query handler
// via `state.isSuperAdmin`.
const ROLE_PRIORITY = ['channel_admin', 'admin_for_delivery']

export const useAuthStore = defineStore('auth', {
  state: () => {
    // Restore as much as we can synchronously from localStorage.
    // The route guard runs *before* App.vue's onMounted, so the
    // auth store needs to know the user's role immediately when
    // the SPA boots. We can't wait for the `me` query — the user
    // may be reloading directly on a restricted page.
    const raw = localStorage.getItem('auth_token')
    let cached = { isSuperAdmin: false, userRoles: [] }
    if (raw) {
      try {
        cached = JSON.parse(raw)
      } catch (_) {
        // localStorage was corrupted or from a different schema;
        // fall back to defaults.
      }
    }
    return {
      token: raw,
      isAuthenticated: !!raw,
      user: null,
      channels: [],
      activeChannel: null,
      isSuperAdmin: !!cached.isSuperAdmin,
      // Codes of the user's Vendure roles (e.g. ['superadmin'],
      // ['admin_xinyk']). Populated from the `me { roles { code } }`
      // query and restored from localStorage on reload. Declared
      // up-front so Pinia's reactive proxy can track it; assigning
      // to a non-declared field at runtime causes the
      // "Cannot read properties of null (reading 'flags')" HMR
      // error.
      userRoles: Array.isArray(cached.userRoles) ? cached.userRoles : [],
      loading: false,
      error: null
    }
  },

  getters: {
    // The single source of truth for "what kind of user is this?"
    // Read by both App.vue (to render the nav) and the route guard
    // (to decide whether to allow a navigation).
    //
    // Returns one of:
    //   'superadmin'         — me.isSuperAdmin === true
    //   'admin_for_delivery' — userRoles contains 'admin_for_delivery'
    //   'channel_admin'      — user has ANY other role (custom
    //                          per-channel codes like 'admin_xinyk'
    //                          fall into this bucket by default)
    //   'viewer'             — no roles at all
    //
    // Note: we check `admin_for_delivery` BEFORE the generic
    // channel_admin fallback, because a user can technically hold
    // both a delivery role and a channel-admin role. The delivery
    // restriction is more restrictive so it wins.
    userRole: (state) => {
      if (state.isSuperAdmin) return 'superadmin'
      if (state.userRoles.length === 0) return 'viewer'
      if (state.userRoles.includes('admin_for_delivery')) return 'admin_for_delivery'
      return 'channel_admin'
    },
    // Convenience: the default landing page for this user.
    homeRoute: (state) => () => {
      if (state.isSuperAdmin) return '/collections'
      if (state.userRoles.length === 0) return '/collections'
      if (state.userRoles.includes('admin_for_delivery')) return '/orders'
      return '/collections'
    }
  },
  
  persist: {
    enabled: true,
    strategies: [
      {
        // Persist the auth token + the resolved role. The role is
        // persisted (not just the token) because the route guard
        // runs *before* App.vue's onMounted can re-fetch `me` —
        // on page reload we need the role available synchronously
        // so the guard can decide whether to allow `/collections`,
        // redirect a delivery admin away from it, etc.
        key: 'auth_token',
        storage: localStorage,
        paths: ['token', 'isAuthenticated', 'activeChannel', 'isSuperAdmin', 'userRoles']
      }
    ]
  },

  actions: {
    async login(username, password) {
      this.loading = true
      this.error = null

      const API_URL = import.meta.env.VITE_VENDURE_ADMIN_API_URL;
      
      try {
        console.log('✅ Login attempt with username:', username, 'and password:', password ? '[REDACTED]' : 'undefined');
        
        // Make actual API call to Vendure admin API
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: `mutation Login { 
              authenticate(input: { native: { username: "${username}", password: "${password}" } }) { 
                ... on CurrentUser { 
                  id 
                  identifier
                } 
              } 
            }`
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.errors?.[0]?.message || `Login failed with status ${response.status}`);
        }
        
        // Extract token from response headers
        const token = response.headers.get('vendure-auth-token');
        
        if (!token) {
          throw new Error('No token found in response headers');
        }
        
        // Parse response body to get user information
        const data = await response.json();
        if (data.data?.authenticate) {
          this.user = data.data.authenticate;
        }
        
        // Update state
        this.token = token;
        this.isAuthenticated = true;
        
        // Store token in localStorage for persistence
        localStorage.setItem('auth_token', token);
        
        // Fetch user's channels and active channel
        await this.fetchUserChannels();
        
        console.log('\n✅ Login successful! Token received from Vendure API.');
        return true;
      } catch (error) {
        console.error('\n🔥 Login error:', error);
        this.error = error.message;
        return false;
      } finally {
        this.loading = false;
      }
    },
    
    async fetchUserChannels() {
      if (!this.token) return;
      
      const API_URL = import.meta.env.VITE_VENDURE_ADMIN_API_URL;
      
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          body: JSON.stringify({
            query: `query GetActiveChannelAndChannels {
              activeChannel {
                id
                code
                token
                currencyCode
              }
              channels(options: { take: 100 }) {
                items {
                  id
                  code
                  token
                  currencyCode
                }
              }
            }`
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            this.channels = data.data.channels?.items || [];
            if (data.data.activeChannel) {
              this.activeChannel = data.data.activeChannel;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user channels:', error);
      }
    },
    
    setActiveChannel(channel) {
      this.activeChannel = channel;
    },
    
    logout() {
      // Clear state
      this.token = null;
      this.isAuthenticated = false;
      this.user = null;
      this.channels = [];
      this.activeChannel = null;
      
      // Remove token from localStorage
      localStorage.removeItem('auth_token');
      
      // Redirect to login page
      router.push({ name: 'Login' });
    }
  }
})