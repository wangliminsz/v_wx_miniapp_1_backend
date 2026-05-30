<template>
  <div class="product-list">
    <h1>Product List</h1>

    <!-- Loading state -->
    <div v-if="loading">Loading products...</div>

    <!-- Error state -->
    <div v-else-if="error" class="error">
      <h2>An error occurred:</h2>
      <pre>{{ error.message }}</pre>
    </div>

    <!-- Success state -->
    <div v-else-if="result && result.products" class="grid">
      <div v-for="product in result.products.items" :key="product.id" class="card">
        <img
          :src="product.featuredAsset ? product.featuredAsset.preview + '?w=200&h=200' : '/placeholder.jpg'"
          :alt="product.name"
        />
        <div class="card-content">
          <h3>{{ product.name }}</h3>
          <p>ID: {{ product.id }}</p>
        </div>
      </div>
    </div>

    <!-- No results state -->
    <div v-else>No products found.</div>
  </div>
</template>

<script setup>
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';

// 1. Define the GraphQL query using gql
// This query fetches the first 10 products.
const GET_PRODUCTS_QUERY = gql`
  query GetProducts {
    products(options: { take: 10 }) {
      items {
        id
        name
        featuredAsset {
          id
          preview
        }
      }
    }
  }
`;

// 2. Use the 'useQuery' composable to execute the query
// It returns reactive variables for loading, error, and the result.
const { result, loading, error } = useQuery(GET_PRODUCTS_QUERY);

// 'result', 'loading', and 'error' are automatically updated by Apollo
// and can be used directly in the <template> section.
</script>

<style scoped>
.error {
  color: red;
  background-color: #ffe0e0;
  border: 1px solid red;
  padding: 1rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}
.card {
  border: 1px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}
.card-content {
  padding: 1rem;
}
</style>
