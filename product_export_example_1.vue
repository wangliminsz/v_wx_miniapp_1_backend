ProductExport.vue

vue
<template>
  <div class="product-export">
    <h1>Standalone Product Exporter</h1>
    <p>Fetches all products and generates a CSV file directly in your browser.</p>

    <div class="export-controls">
      <button @click="exportProductsAsCsv" :disabled="isExporting">
        {{ isExporting ? 'Exporting...' : 'Export All Products to CSV' }}
      </button>
      <div v-if="exportError" class="error export-error">
        {{ exportError }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useApolloClient } from '@vue/apollo-composable';
import gql from 'graphql-tag';

// --- Step 1: The Comprehensive GraphQL Query ---
// This query fetches all necessary data for a detailed export.
// We get all variants for each product.
const PRODUCT_EXPORT_QUERY = gql`
  query ProductExportQuery {
    # We fetch up to 1000 products. For more, you would implement pagination.
    products(options: { take: 1000 }) {
      items {
        id
        name
        slug
        description
        featuredAsset {
          id
          name
          source
        }
        variants {
          id
          name
          sku
          priceWithTax
          currencyCode
        }
      }
    }
  }
`;

// State management for the export process
const isExporting = ref(false);
const exportError = ref(null);

// Get access to the Apollo Client instance to run a query manually
const { client } = useApolloClient();

// --- Step 2: The Main Export Function ---
async function exportProductsAsCsv() {
  isExporting.value = true;
  exportError.value = null;

  try {
    // Manually execute the GraphQL query
    const { data } = await client.query({
      query: PRODUCT_EXPORT_QUERY,
      // Use 'network-only' to ensure we get the freshest data
      fetchPolicy: 'network-only',
    });

    if (!data || !data.products) {
      throw new Error('No product data received from the API.');
    }

    // --- Step 3: Flatten the Data for the CSV ---
    // We transform the nested product/variant structure into a flat array.
    // Each object in the array will represent one row in the CSV.
    const flatData = [];
    data.products.items.forEach(product => {
      if (product.variants.length === 0) {
        // Handle products with no variants if necessary
        flatData.push({
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          productDescription: product.description,
          featuredAssetSource: product.featuredAsset?.source || '',
          variantId: '',
          variantName: '',
          variantSku: '',
          variantPriceWithTax: '',
          variantCurrencyCode: '',
        });
      } else {
        // Create a new row for each variant
        product.variants.forEach(variant => {
          flatData.push({
            productId: product.id,
            productName: product.name,
            productSlug: product.slug,
            productDescription: product.description,
            featuredAssetSource: product.featuredAsset?.source || '',
            variantId: variant.id,
            variantName: variant.name,
            variantSku: variant.sku,
            // Convert price from cents/minor units to a decimal format
            variantPriceWithTax: (variant.priceWithTax / 100).toFixed(2),
            variantCurrencyCode: variant.currencyCode,
          });
        });
      }
    });

    if (flatData.length === 0) {
      throw new Error('There are no products to export.');
    }

    // --- Step 4: Generate the CSV and Trigger Download ---
    const csvString = convertToCsv(flatData);
    downloadBlob(csvString, 'vendure-product-export.csv', 'text/csv;charset=utf-8;');

  } catch (err) {
    console.error('Export failed:', err);
    exportError.value = err.message;
  } finally {
    isExporting.value = false;
  }
}

// --- Step 5: Utility Functions for CSV Conversion and Download ---

function convertToCsv(data) {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',') + '\r\n';

  const rows = data.map(row => {
    return headers.map(header => {
      let cell = row[header];
      if (cell === null || cell === undefined) {
        cell = '';
      }
      // Escape double quotes and handle values with commas
      const cellString = cell.toString().replace(/"/g, '""');
      return `"${cellString}"`;
    }).join(',');
  });

  return headerRow + rows.join('\r\n');
}

function downloadBlob(content, fileName, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
</script>

<style scoped>
.product-export {
  padding: 2rem;
  font-family: sans-serif;
}
.export-controls button {
  font-size: 1.1rem;
  padding: 0.8rem 1.5rem;
  cursor: pointer;
}
.export-controls button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.export-error {
  margin-top: 1rem;
  color: red;
  background-color: #ffe0e0;
  border: 1px solid red;
  padding: 1rem;
}
</style>
How to Use This Component
Authentication: Make sure your Vue app has a valid vendure-auth-token in localStorage before you use this component. The apollo.js file we configured earlier will automatically handle sending the token.

Display the Component: Add <ProductExport /> to your main app view.

Click the Button: When you click the "Export All Products to CSV" button, the component will perform all the logic in the browser and trigger a download of the vendure-product-export.csv file.

This approach gives you full control, relies only on the official Vendure API, and completely bypasses the problematic custom REST endpoint from the plugin. It's a much more stable and understandable solution.