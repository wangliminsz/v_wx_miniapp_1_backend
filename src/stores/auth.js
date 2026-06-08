import { defineStore } from 'pinia'
import router from '../router/index.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('auth_token') || null,
    isAuthenticated: !!localStorage.getItem('auth_token'),
    user: null,
    channels: [],
    activeChannel: null,
    isSuperAdmin: false,
    loading: false,
    error: null
  }),
  
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'auth_token',
        storage: localStorage,
        paths: ['token', 'isAuthenticated', 'activeChannel']
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