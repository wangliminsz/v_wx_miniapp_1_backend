// --- Step 1: Add State Management for the Export Logic ---

// An array to hold the IDs of the selected products.
// The `v-model` on the checkboxes will automatically manage this array.
const selectedProductIds = ref([]);

// A flag to know when an export is in progress, to disable the button.
const isExporting = ref(false);

// A ref to hold any error messages from the export process.
const exportError = ref(null);


// --- Step 2: The Export Function ---

async function exportSelectedProducts() {
  // Clear any previous errors and set the loading state
  exportError.value = null;
  isExporting.value = true;

  try {
    // We need to get the authentication token to authorize the request.
    const authToken = localStorage.getItem('vendure-auth-token');
    if (!authToken) {
      throw new Error('You are not logged in. Cannot export products.');
    }

    // This is a REST call using `fetch`, not a GraphQL call.
    const response = await fetch('http://192.168.0.53:3000/product-export/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      // The body is a JSON string of the selected product IDs array.
      body: JSON.stringify(selectedProductIds.value),
    });

    // Check if the server responded with an error (e.g., 500 Internal Server Error)
    if (!response.ok) {
      // Try to get a meaningful error message from the server response
      const errorData = await response.json().catch(() => ({ message: 'Server returned an unreadable error.' }));
      throw new Error(errorData.message || `Server responded with status ${response.status}`);
    }

    // If the request was successful, the server sends back the CSV file.
    // We need to get the filename from the 'Content-Disposition' header.
    const header = response.headers.get('Content-Disposition');
    const parts = header.split(';');
    const filename = parts[1].split('=')[1].replace(/"/g, ''); // Clean up the filename

    // Get the response body as a "blob" (a file-like object)
    const blob = await response.blob();

    // Trigger the browser download
    await downloadBlob(blob, filename);

  } catch (err) {
    console.error('Export failed:', err);
    exportError.value = err.message;
  } finally {
    // Reset the loading state
    isExporting.value = false;
  }
}

// --- Step 3: The Download Helper Function ---

// This utility function takes a blob and a filename and creates a
// temporary link to trigger a download in the browser.
async function downloadBlob(blob, fileName) {
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.setAttribute('hidden', 'true');
a.href = blobUrl;
  a.download = fileName;
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(blobUrl);
}

</script>