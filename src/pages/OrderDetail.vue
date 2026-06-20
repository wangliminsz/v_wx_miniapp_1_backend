<template>
  <div v-if="loading" class="text-center py-10 text-gray-400">Loading order...</div>

  <div v-else-if="error" class="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md mb-6">
    <h3 class="font-bold mb-2">An error occurred:</h3>
    <p class="text-sm">{{ error }}</p>
  </div>

  <div v-else-if="order" class="order-detail-section">
    <!-- Back link -->
    <router-link to="/orders" class="text-blue-400 hover:text-blue-300 mb-4 inline-block">&larr; Back to
      Orders</router-link>

    <!-- Order header -->
    <div class="flex items-center justify-between mb-6 bg-dark-200 p-4 rounded-md border border-dark-100">
      <div class="flex items-center gap-4">
        <h2 class="text-2xl font-bold text-dark-300">Order {{ order.code }}</h2>
        <span :class="stateClass(order.state)" class="px-3 py-1 rounded-full text-xs font-semibold">{{ order.state
        }}</span>
      </div>


      <div class="text-right text-sm text-gray-400">
        <div>Placed: {{ formatDate(order.orderPlacedAt || order.createdAt) }}</div>
        <div v-if="headerChannelCodes(order)">Channel: {{ headerChannelCodes(order) }}</div>
      </div>


      <div class="flex items-center gap-2">
        <!-- Order-level actions (affect the whole order). -->
        <button v-if="canCancel && !isDeliveryAdmin" @click="openCancelModal"
          class="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-500 transition-colors">
          Cancel Order
        </button>
      </div>





    </div>

    <!-- Info cards: Customer + Addresses + Payment + Fulfillment -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <!-- Customer -->
      <div class="bg-dark-200 p-4 rounded-md border border-dark-100">
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Customer</h3>
        <div v-if="order.customer" class="text-gray-300 space-y-1 text-sm">
          <p v-if="order.customer.customFields?.companyInfo" class="text-base font-semibold text-blue-300">
            {{ order.customer.customFields.companyInfo }}
          </p>
          <p><span class="text-gray-500">Name:</span> {{ order.customer.firstName }} {{ order.customer.lastName }}</p>
          <!-- <p><span class="text-gray-500">Email:</span> {{ order.customer.emailAddress }}</p> -->
          <p><span class="text-gray-500">Phone:</span> {{ order.customer.phoneNumber || '-' }}</p>
        </div>
        <div v-else class="text-gray-500 text-sm">No customer info</div>
      </div>

      <!-- Shipping Address -->
      <div class="bg-dark-200 p-4 rounded-md border border-dark-100">
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Shipping Address</h3>
        <div v-if="order.shippingAddress" class="text-gray-300 space-y-1 text-sm">
          <p v-if="order.shippingAddress.fullName">{{ order.shippingAddress.fullName }}</p>
          <p v-if="order.shippingAddress.company">{{ order.shippingAddress.company }}</p>
          <p>{{ order.shippingAddress.streetLine1 }}</p>
          <p v-if="order.shippingAddress.streetLine2">{{ order.shippingAddress.streetLine2 }}</p>
          <p>{{ [order.shippingAddress.city, order.shippingAddress.province,
          order.shippingAddress.postalCode].filter(Boolean).join(', ') }}</p>
          <p>{{ order.shippingAddress.country }}</p>
          <p v-if="order.shippingAddress.phoneNumber">{{ order.shippingAddress.phoneNumber }}</p>
        </div>
        <div v-else class="text-gray-500 text-sm">No shipping address</div>
      </div>

      <!-- Payment -->
      <div v-if="!isDeliveryAdmin" class="bg-dark-200 p-4 rounded-md border border-dark-100">
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment</h3>
        <div v-if="order.payments && order.payments.length" class="space-y-3">
          <div v-for="payment in order.payments" :key="payment.id"
            class="text-gray-300 text-sm border-b border-dark-100 pb-2 last:border-0 last:pb-0">
            <div class="flex items-center justify-between">
              <span class="font-medium">{{ payment.method }}</span>
              <div class="flex items-center gap-2">
                <span :class="stateClass(payment.state)" class="px-2 py-0.5 rounded-full text-xs font-semibold">{{
                  payment.state }}</span>
                <button v-if="payment.state === 'Authorized'" @click="settlePayment(payment.id)"
                  class="px-2 py-0.5 bg-green-600 text-white rounded text-xs hover:bg-green-500 transition-colors"
                  :disabled="settlingPaymentId === payment.id">
                  {{ settlingPaymentId === payment.id ? '...' : 'Settle' }}
                </button>
              </div>
            </div>
            <p class="text-gray-500">Amount: {{ formatPrice(payment.amount) }}</p>
            <p v-if="payment.transactionId" class="text-gray-500 text-xs font-mono">TX: {{ payment.transactionId }}</p>
            <p v-if="payment.errorMessage" class="text-red-400 text-xs">{{ payment.errorMessage }}</p>
          </div>
        </div>
        <div v-else class="text-gray-500 text-sm">No payments</div>
      </div>


      <!-- Billing Address -->
      <div v-if="!isDeliveryAdmin" class="bg-dark-200 p-4 rounded-md border border-dark-100">
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Billing Address</h3>
        <div v-if="order.billingAddress" class="text-gray-300 space-y-1 text-sm">
          <p v-if="order.billingAddress.fullName">{{ order.billingAddress.fullName }}</p>
          <p v-if="order.billingAddress.company">{{ order.billingAddress.company }}</p>
          <p>{{ order.billingAddress.streetLine1 }}</p>
          <p v-if="order.billingAddress.streetLine2">{{ order.billingAddress.streetLine2 }}</p>
          <p>{{ [order.billingAddress.city, order.billingAddress.province,
          order.billingAddress.postalCode].filter(Boolean).join(', ') }}</p>
          <p>{{ order.billingAddress.country }}</p>
          <p v-if="order.billingAddress.phoneNumber">{{ order.billingAddress.phoneNumber }}</p>
        </div>
        <div v-else class="text-gray-500 text-sm">No billing address</div>
      </div>


    </div>



    <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -->



    <!-- Order lines table -->
    <div class="mb-6 bg-dark-200 p-4 rounded-md border border-dark-100">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Order Lines ({{ order.lines.length
      }})</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-dark-100 text-gray-500 text-xs uppercase tracking-wider">
              <th class="px-3 py-2 font-semibold">Product</th>
              <th class="px-3 py-2 font-semibold">SKU</th>
              <th v-if="!isDeliveryAdmin" class="px-3 py-2 font-semibold text-right">Unit Price</th>
              <th class="px-3 py-2 font-semibold text-right">Qty</th>
              <th v-if="!isDeliveryAdmin" class="px-3 py-2 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="line in order.lines" :key="line.id" class="border-b border-dark-100 text-sm text-gray-300">
              <td class="px-3 py-2">
                <div class="flex items-center gap-2">
                  <img v-if="line.featuredAsset?.preview" :src="line.featuredAsset.preview"
                    class="w-10 h-10 object-cover rounded" />
                  <div v-else
                    class="w-10 h-10 bg-dark-100 rounded flex items-center justify-center text-xs text-gray-500">No img
                  </div>
                  <span>{{ line.productVariant?.name || '-' }}</span>
                </div>
              </td>
              <td class="px-3 py-2 text-gray-500 font-mono text-xs">{{ line.productVariant?.sku || '-' }}</td>
              <td v-if="!isDeliveryAdmin" class="px-3 py-2 text-right font-mono">{{ formatPrice(line.unitPriceWithTax)
                }}</td>
              <td class="px-3 py-2 text-right">{{ line.quantity }}</td>
              <td v-if="!isDeliveryAdmin" class="px-3 py-2 text-right font-mono">{{ formatPrice(line.linePriceWithTax)
                }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Order totals -->
    <div v-if="!isDeliveryAdmin" class="mb-6 bg-dark-200 p-4 rounded-md border border-dark-100">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Totals</h3>
      <div class="space-y-1 text-sm max-w-xs ml-auto">
        <div class="flex justify-between text-gray-400">
          <span>Subtotal</span>
          <span class="font-mono">{{ formatPrice(order.subTotalWithTax) }}</span>
        </div>
        <div class="flex justify-between text-gray-400">
          <span>Shipping</span>
          <span class="font-mono">{{ formatPrice(order.shippingWithTax) }}</span>
        </div>
        <div v-if="order.couponCodes?.length" class="flex justify-between text-yellow-400">
          <span>Coupon: {{ order.couponCodes.join(', ') }}</span>
        </div>
        <div class="flex justify-between text-white font-bold text-base border-t border-dark-100 pt-1 mt-1">
          <span>Total</span>
          <span class="font-mono">{{ formatPrice(order.totalWithTax) }}</span>
        </div>
      </div>
    </div>

    <!-- Customer Message -->
    <div class="mb-6 bg-dark-200 p-4 rounded-md border border-dark-100">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Customer Message</h3>
      <p v-if="order.customFields?.customerMessage" class="text-gray-300 text-sm whitespace-pre-wrap">{{
        order.customFields.customerMessage }}</p>
      <p v-else class="text-gray-500 text-sm italic">No customer message</p>
    </div>




    <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -->


    <!-- Fulfillment section header + action bar. Only the
         "Fulfill Order" button lives here (it's a fulfillment-
         level action). Order-level actions like "Cancel Order"
         stay in the order header above. -->
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-xl font-bold text-gray-200">Fulfillment</h2>
      <div class="flex items-center gap-2">
        <button v-if="canFulfill" @click="openFulfillModal"
          class="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-500 transition-colors">
          Fulfill Order
        </button>
      </div>
    </div>


    <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -->



    <!-- Fulfillment -->
    <div class="mb-6 bg-dark-200 p-4 rounded-md border border-dark-100">
      <div v-if="sortedFulfillments.length" class="space-y-4">
        <div v-for="f in sortedFulfillments" :key="f.id"
          class="text-gray-300 text-sm border-b border-dark-100 pb-3 last:border-0 last:pb-0">
          <!-- Header row: method + state + transition buttons -->
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-base">{{ f.method || '-' }}</span>
            <div class="flex items-center gap-2">
              <span :class="stateClass(f.state)" class="px-2 py-0.5 rounded-full text-xs font-semibold">{{ f.state
              }}</span>
              <button v-for="ns in f.nextStates" :key="ns" @click="transitionFulfillment(f.id, ns)" :class="['px-2 py-0.5 rounded text-xs transition-colors',
                ns === 'Shipped' ? 'bg-purple-600 hover:bg-purple-500' :
                  ns === 'Delivered' ? 'bg-green-700 hover:bg-green-600' :
                    ns === 'Cancelled' ? 'bg-gray-600 hover:bg-red-500' :
                      'bg-gray-600 hover:bg-gray-500'
              ]" :disabled="transitFulfillmentId === f.id">
                {{ transitFulfillmentId === f.id ? '...' : ns }}
              </button>
            </div>
          </div>

          <!-- Detail fields: ID / Method / State / Tracking / Created -->
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            <div class="flex gap-2">
              <dt class="text-gray-500 w-24 shrink-0">Fulfillment ID</dt>
              <dd class="text-gray-200 font-mono">{{ fulfillmentId(f) }}</dd>
            </div>
            <div class="flex gap-2">
              <dt class="text-gray-500 w-24 shrink-0">Method</dt>
              <dd class="text-gray-200">{{ f.method || '-' }}</dd>
            </div>
            <div class="flex gap-2">
              <dt class="text-gray-500 w-24 shrink-0">State</dt>
              <dd class="text-gray-200">{{ f.state }}</dd>
            </div>
            <div class="flex gap-2">
              <dt class="text-gray-500 w-24 shrink-0">Tracking code</dt>
              <dd class="text-gray-200 font-mono">{{ f.trackingCode || '-' }}</dd>
            </div>
            <div class="flex gap-2">
              <dt class="text-gray-500 w-24 shrink-0">Created</dt>
              <dd class="text-gray-200">{{ formatDate(f.createdAt) }}</dd>
            </div>
          </dl>

          <!-- Delivery docs (the fulfillDocs custom-field images
               uploaded via the Fulfill Order modal). Clicking
               a thumbnail opens the full image in a new tab. -->
          <div v-if="f.customFields?.fulfillDocs" class="mt-3 border-t border-dark-100 pt-3">
            <div class="flex items-center justify-between mb-2">
              <h5 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Delivery doc
              </h5>
              <span class="text-[10px] text-gray-500">click to open full image</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <a :href="f.customFields.fulfillDocs.source || f.customFields.fulfillDocs.preview" target="_blank"
                rel="noopener noreferrer"
                class="group relative w-20 h-20 rounded overflow-hidden bg-dark-100 border border-dark-100 hover:border-blue-400 transition-colors"
                :title="`${f.customFields.fulfillDocs.name} (id ${f.customFields.fulfillDocs.id})`">
                <img :src="f.customFields.fulfillDocs.preview || f.customFields.fulfillDocs.source"
                  :alt="f.customFields.fulfillDocs.name" class="w-full h-full object-cover" />
                <span
                  class="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[9px] px-1 truncate font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                  :title="`Asset ID: ${f.customFields.fulfillDocs.id}`">
                  {{ f.customFields.fulfillDocs.id }}
                </span>
              </a>
            </div>
          </div>

          <!-- Fulfilled items (collapsible) -->
          <div v-if="f.lines?.length" class="mt-3 border-t border-dark-100 pt-2">
            <button @click="toggleFulfillmentItems(f.id)"
              class="w-full flex items-center justify-between text-sm text-gray-300 hover:text-white">
              <span class="font-medium">Fulfilled items ({{ totalFulfillmentQty(f) }})</span>
              <span class="text-gray-500 text-xs">{{ expandedFulfillmentIds[f.id] ? '▾' : '▸' }}</span>
            </button>
            <div v-if="expandedFulfillmentIds[f.id]" class="mt-2 space-y-2 pl-2">
              <div v-for="line in f.lines" :key="line.orderLineId" class="border border-dark-100 rounded-md p-2">
                <p class="text-gray-200">{{ line.orderLine?.productVariant?.name || '-' }}</p>
                <p class="text-xs text-gray-500">
                  <span class="text-gray-400">Qty:</span> {{ line.quantity }}
                  <span v-if="line.orderLine?.productVariant?.sku" class="ml-2">
                    <span class="text-gray-400">SKU:</span>
                    <span class="font-mono">{{ line.orderLine.productVariant.sku }}</span>
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-gray-500 text-sm italic">No Fulfill Info</div>
    </div>



    <!-- History timeline -->
    <div v-if="!isDeliveryAdmin && order.history?.items?.length"
      class="bg-dark-200 p-4 rounded-md border border-dark-100">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">History</h3>
      <div class="space-y-3">
        <div v-for="entry in order.history.items" :key="entry.id"
          class="relative pl-6 border-l-2 border-dark-100 pb-3 last:pb-0">
          <div class="absolute -left-1.5 top-1 w-2.5 h-2.5 rounded-full bg-dark-100"></div>
          <p class="text-xs text-gray-500">{{ formatDate(entry.createdAt) }}</p>
          <p class="text-sm text-gray-300">
            <template v-for="(part, idx) in formatHistoryEntry(entry)" :key="idx">
              <span v-if="part.state" :class="stateClass(part.state)"
                class="px-1.5 py-0.5 rounded text-xs font-semibold mx-0.5">{{ part.state }}</span>
              <span v-else>{{ part.text }}</span>
            </template>
          </p>
          <p v-if="entry.administrator" class="text-xs text-gray-500">by {{ entry.administrator.firstName }} {{
            entry.administrator.lastName }}</p>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-10 text-gray-500">Order not found.</div>

  <!-- Fulfill Order Modal -->
  <div v-if="showFulfillModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
    @click.self="showFulfillModal = false">
    <div class="bg-dark-200 rounded-lg border border-dark-100 p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
      <div class="flex items-start justify-between mb-1">
        <h3 class="text-xl font-bold text-gray-200">Fulfill Order {{ order?.code }}</h3>
        <button @click="closeFulfillModal" class="text-gray-500 hover:text-gray-300 text-2xl leading-none"
          aria-label="Close">×</button>
      </div>
      <p class="text-sm text-gray-400 mb-4">Select quantities to fulfill and configure the fulfillment handler</p>

      <!-- Order lines section -->
      <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Order lines</h4>
      <div class="space-y-2 mb-4">
        <div v-for="line in order?.lines || []" :key="line.id"
          class="flex items-center justify-between bg-dark-300 p-3 rounded-md">
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-200 truncate">{{ line.productVariant?.name }}</p>
            <p class="text-xs text-gray-500">SKU: {{ line.productVariant?.sku }}</p>
            <p class="text-xs text-gray-500">
              {{ availableToFulfill(line) }} of {{ line.quantity }} available to fulfill
            </p>
          </div>
          <div class="flex items-center gap-2 ml-4">
            <span class="text-xs text-gray-400">Quantity</span>
            <input type="number" v-model.number="fulfillQuantities[line.id]" :max="availableToFulfill(line)" min="0"
              class="w-20 px-2 py-1 bg-dark-100 text-white rounded border border-dark-100 text-sm text-center" />
          </div>
        </div>
      </div>

      <!-- Fulfillment handler section (matches Vendure's UI) -->
      <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Fulfillment handler</h4>
      <div class="bg-dark-300 p-4 rounded-md mb-4">
        <p class="text-sm text-gray-200">Manually enter fulfillment details</p>
        <p class="text-xs text-gray-500 mb-3 font-mono">manual-fulfillment</p>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm text-gray-400 mb-1">method</label>
            <input v-model="fulfillMethod" type="text" placeholder="e.g. 顺丰，跨越，中通，德邦 ..."
              class="w-full px-3 py-2 bg-dark-100 text-white rounded border border-dark-100 focus:outline-none focus:border-secondary text-sm" />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">trackingCode</label>
            <input v-model="fulfillTrackingCode" type="text" placeholder="e.g. 物流号码"
              class="w-full px-3 py-2 bg-dark-100 text-white rounded border border-dark-100 focus:outline-none focus:border-secondary text-sm" />
          </div>
        </div>

        <!-- Auto-ship checkbox. By default checked, so most
             fulfillments skip the Pending state and go straight
             to Shipped — no need for the admin to click the
             "Shipped" button manually afterwards. Uncheck if
             you need to keep the fulfillment in Pending (e.g.
             for warehouse-pickup workflows). -->
        <label class="mt-4 flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
          <input type="checkbox" v-model="autoShipAfterFulfill"
            class="w-4 h-4 rounded border-dark-100 bg-dark-100 text-blue-500 focus:ring-blue-400 focus:ring-offset-0 cursor-pointer" />
          <span>
            Mark as
            <span class="text-blue-300 font-semibold">Shipped</span>
            immediately
          </span>
          <span class="text-xs text-gray-500">(skip Pending state)</span>
        </label>
      </div>

      <!-- Delivery notice (optional). Lets the admin attach
           images to the fulfillment's `fulfillDocs` custom field
           (relation → Asset, list: false). Uploads the asset
           first via `createAssets`, then a follow-up
           `updateFulfillment` mutation attaches the IDs. -->
      <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
        <span>Delivery notice (optional)</span>
        <!-- Live indicator so the user can see whether a
             doc is queued for the attach step. -->
        <span v-if="uploadedDoc" class="text-xs text-blue-300 font-mono normal-case">
          📎 1 doc queued
        </span>
      </h4>
      <div class="bg-dark-300 p-4 rounded-md mb-4">
        <p class="text-xs text-gray-500 mb-3">
          Upload one image of the delivery notice (e.g. signed receipt, photo of the package). It will be attached to
          the
          fulfillment as the
          <code class="text-gray-300">fulfillDocs</code> custom field.
        </p>

        <input ref="docsFileInput" type="file" accept="image/*" class="hidden" @change="onDocsFileSelected" />

        <div class="flex flex-wrap gap-2">
          <!-- Single uploaded image. Since `fulfillDocs` is
               `list: false`, only one image is allowed; the
               upload button is hidden once one is queued. -->
          <div v-if="uploadedDoc"
            class="relative w-20 h-20 bg-dark-100 rounded overflow-hidden group border border-dark-100">
            <img :src="uploadedDoc.preview || uploadedDoc.source" :alt="uploadedDoc.name"
              class="w-full h-full object-cover" />
            <button type="button" @click="removeUploadedDoc"
              class="absolute top-0 right-0 bg-red-600 text-white text-xs leading-none px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              :title="`Remove ${uploadedDoc.name}`">×</button>
            <div class="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] px-1 truncate font-mono"
              :title="`Asset ID: ${uploadedDoc.id}`">
              {{ uploadedDoc.id }}
            </div>
          </div>

          <!-- In-flight upload spinner -->
          <div v-if="uploadingDocs"
            class="w-20 h-20 bg-dark-100 rounded flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-500">
            <svg class="w-5 h-5 animate-spin mb-1" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span class="text-[10px]">Uploading</span>
          </div>

          <!-- Upload button (only visible when no doc is queued) -->
          <button v-if="!uploadedDoc && !uploadingDocs" type="button" @click="triggerDocsFilePicker"
            class="w-20 h-20 bg-dark-100 hover:bg-dark-200 border border-dashed border-gray-500 hover:border-gray-300 rounded flex flex-col items-center justify-center text-gray-400 hover:text-gray-200 transition-colors">
            <span class="text-2xl leading-none">+</span>
            <span class="text-[10px] mt-1">Upload</span>
          </button>
        </div>
      </div>

      <!-- Per-modal error (shown here so the user doesn't have to
           scroll to the top of the page to see what went wrong). -->
      <div v-if="fulfillError" class="mb-4 bg-red-900/30 border border-red-500 text-red-400 p-3 rounded-md text-sm">
        {{ fulfillError }}
      </div>

      <div class="flex justify-end gap-3">
        <button @click="closeFulfillModal"
          class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">
          Cancel
        </button>
        <button @click="submitFulfillment" :disabled="fulfilling"
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-400 transition-colors disabled:opacity-50">
          {{ fulfilling ? 'Fulfilling...' : 'Fulfill order' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Cancel Order Modal -->
  <div v-if="showCancelModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
    @click.self="closeCancelModal">
    <div class="bg-dark-200 rounded-lg border border-dark-100 p-6 w-full max-w-lg">
      <h3 class="text-xl font-bold text-gray-200 mb-2">Cancel Order {{ order?.code }}</h3>
      <p class="text-sm text-gray-400 mb-4">
        This will cancel the entire order regardless of its current state. This action cannot be undone.
      </p>

      <div class="mb-4">
        <label class="block text-sm text-gray-400 mb-1">Reason (optional)</label>
        <textarea v-model="cancelReason" rows="3" placeholder="e.g. customer requested cancellation, out of stock..."
          class="w-full px-4 py-2 bg-dark-300 text-white rounded-md border border-dark-100 focus:outline-none focus:border-secondary text-sm"></textarea>
      </div>

      <div class="mb-4">
        <label class="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" v-model="cancelShipping"
            class="rounded border-dark-100 bg-dark-300 text-red-600 focus:ring-red-500" />
          Also cancel shipping charges
        </label>
      </div>

      <div v-if="cancelError" class="mb-4 bg-red-900/30 border border-red-500 text-red-400 p-3 rounded-md text-sm">
        {{ cancelError }}
      </div>

      <div class="flex justify-end gap-3">
        <button @click="closeCancelModal" :disabled="cancelling"
          class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50">Close</button>
        <button @click="submitCancel" :disabled="cancelling"
          class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors disabled:opacity-50">
          {{ cancelling ? 'Cancelling...' : 'Cancel Order' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { getChannelTokenFromQuery } from '../utils/channelToken.js'
import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'

const route = useRoute()
const authStore = useAuthStore()
// Delivery admins are restricted on the Order Detail page too.
// They see order state, lines, addresses, customer, fulfillments —
// but NOT Payment, Totals, or History (the three sections that
// expose financial / audit-trail data they don't need to see).
const isDeliveryAdmin = computed(() => authStore.userRole === 'admin_for_delivery')

const order = ref(null)
const loading = ref(false)
const error = ref('')
const settlingPaymentId = ref(null)

const showFulfillModal = ref(false)
const fulfillQuantities = ref({})
const fulfillMethod = ref('')
const fulfillTrackingCode = ref('')
// When true (default), the new fulfillment is automatically
// transitioned to the `Shipped` state immediately after
// creation — saves the admin from having to click the
// "Shipped" pill manually. Set to false if the workflow
// needs the fulfillment to stay in `Pending` (e.g. for
// warehouse-pickup-then-ship flows).
const autoShipAfterFulfill = ref(true)
// Per-modal error (shown inside the modal, not the page-level
// error banner, so the user sees the failure without having to
// scroll to the top of the page).
const fulfillError = ref('')

// Whether the order can be cancelled (i.e. is in a non-terminal
// state). Mirrors Vendure's official admin UI, which shows the
// Cancel Order button in any active state.
//
// Terminal states (no cancel allowed):
//   Cancelled         — already cancelled
//   Delivered         — fully delivered
//   Expired           — order expired before payment
const canCancel = computed(() => {
  const o = order.value
  if (!o) return false
  if (o.state === 'Cancelled' || o.state === 'Delivered' || o.state === 'Expired') return false
  return true
})

// Whether the order can be re-fulfilled as long as it's still in a
// "more to ship" state — i.e. the order has at least one
// order line that hasn't been fully fulfilled yet. This
// mirrors Vendure's official admin UI, which keeps the
// Fulfill Order button visible in all the partial states.
//
// Order state machine (Vendure 3.6):
//   PaymentAuthorized  — payment authorized, no fulfillment yet
//   Authorized         — legacy alias
//   PaymentSettled     — fully paid, no fulfillment yet
//   PartiallyFulfilled — at least one fulfillment, more line qty remaining
//   InProgress         — legacy alias for PartiallyFulfilled
//   PartiallyShipped   — at least one shipped fulfillment, more line qty remaining
//   PartiallyDelivered — at least one delivered fulfillment, more line qty remaining
//
// Plus the special case where every existing fulfillment has
// been cancelled (so the admin can re-fulfill after a cancel
// + re-add) — this works in any order state.
const canFulfill = computed(() => {
  const o = order.value
  if (!o) return false
  if (o.state === 'PaymentAuthorized' ||
    o.state === 'PaymentSettled' ||
    o.state === 'PartiallyFulfilled' ||
    o.state === 'PartiallyShipped' ||
    o.state === 'PartiallyDelivered' ||
    o.state === 'Authorized' ||
    o.state === 'InProgress') {
    return true
  }
  if (o.fulfillments?.length > 0 &&
    o.fulfillments.every(f => f.state === 'Cancelled')) {
    return true
  }
  return false
})

// Fulfillments shown in the Fulfillment card, sorted by
// `createdAt` descending so the newest fulfillment is on top
// (matches the order in which the admin created them, and
// matches the typical "most recent first" reading flow).
const sortedFulfillments = computed(() => {
  const list = order.value?.fulfillments
  if (!list?.length) return []
  return [...list].sort((a, b) => {
    const ta = new Date(a.createdAt).getTime()
    const tb = new Date(b.createdAt).getTime()
    return tb - ta   // newest first
  })
})

// =============================================================
// Delivery notice upload state
// =============================================================
const docsFileInput = ref(null)
const uploadingDocs = ref(false)
// Single object (or null) holding the queued delivery-notice
// image, since the `fulfillDocs` custom field is `list: false`:
//   { id, name, source, preview }
//     id      — Vendure asset id (set after createAssets returns)
//     preview — blob: URL for the local preview, falls back to
//               `source` from the server (asset.preview) if the
//               blob URL has been revoked.
const uploadedDoc = ref(null)

const triggerDocsFilePicker = () => {
  docsFileInput.value?.click()
}

const removeUploadedDoc = () => {
  if (uploadedDoc.value?.preview?.startsWith('blob:')) {
    URL.revokeObjectURL(uploadedDoc.value.preview)
  }
  uploadedDoc.value = null
}

// Reset all upload state (called when the modal opens / closes).
const resetDocs = () => {
  if (uploadedDoc.value?.preview?.startsWith('blob:')) {
    URL.revokeObjectURL(uploadedDoc.value.preview)
  }
  uploadedDoc.value = null
  if (docsFileInput.value) docsFileInput.value.value = ''
}

// Upload a single file as a Vendure Asset using the standard
// graphql-multipart-request-spec FormData layout. Returns the
// new Asset (or throws an Error with a friendly message).
//
// NOTE: Vendure's `CreateAssetInput` only accepts `file` and
// `customFields` at the top level — the asset `name` is derived
// from the uploaded file. Sending a `name` field produces the
// "Field 'name' is not defined by type 'CreateAssetInput'" error.
const uploadSingleAsset = async (file) => {
  const operations = JSON.stringify({
    query: `mutation UploadAsset($input: [CreateAssetInput!]!) {
      createAssets(input: $input) {
        ... on Asset { id name source preview mimeType width height fileSize }
        ... on MimeTypeError { errorCode message }
      }
    }`,
    variables: {
      input: [{ file: null }]
    }
  })
  const map = JSON.stringify({ '0': ['variables.input.0.file'] })
  const form = new FormData()
  form.append('operations', operations)
  form.append('map', map)
  form.append('0', file)

  const token = authStore.token
  const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null

  const res = await fetch(import.meta.env.VITE_VENDURE_ADMIN_API_URL, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(channelToken ? { 'vendure-token': channelToken } : {})
    },
    body: form
  })
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors[0].message)
  const result = json.data?.createAssets?.[0]
  if (result?.errorCode) throw new Error(result.message || result.errorCode)
  if (!result?.id) throw new Error('Upload returned no asset id')
  return result
}

const onDocsFileSelected = async (e) => {
  // Take only the first file — the `fulfillDocs` custom
  // field is `list: false` and can hold a single image.
  const file = e.target.files?.[0]
  if (!file) return
  uploadingDocs.value = true
  fulfillError.value = ''
  try {
    // If a previous doc was queued, revoke its blob URL
    // first so we don't leak memory.
    if (uploadedDoc.value?.preview?.startsWith('blob:')) {
      URL.revokeObjectURL(uploadedDoc.value.preview)
    }
    const asset = await uploadSingleAsset(file)
    uploadedDoc.value = {
      id: asset.id,
      name: asset.name || file.name,
      source: asset.preview || asset.source,
      preview: URL.createObjectURL(file)
    }
    console.log('[OrderDetail] uploaded doc:', { id: asset.id, name: asset.name })
  } catch (err) {
    console.error('Failed to upload delivery notice:', err)
    fulfillError.value = err.message || 'Failed to upload delivery notice'
  } finally {
    uploadingDocs.value = false
    if (e.target) e.target.value = ''
  }
}

// After the fulfillment is created, attach the uploaded asset
// ids to the fulfillment's `fulfillDocs` custom field. This
// requires an `updateFulfillment` mutation on the backend
// (Vendure's stock admin API doesn't expose one by default —
// add a custom resolver if your schema doesn't have it).
//
// Returns { ok, error } so the caller can show a visible
// warning when the attach step fails (instead of silently
// closing the modal and making the user think the image was
// attached when it actually wasn't).
// Your plugin's `updateFulfillment` mutation is typed to
// always return a `Fulfillment` (no union with `ErrorResult`),
// so the query must NOT spread `... on ErrorResult` —
// GraphQL will reject the entire query with
// "Fragment cannot be spread here as objects of type
// 'Fulfillment' can never be of type 'ErrorResult'".
const UPDATE_FULFILLMENT_MUTATION = gql`
  mutation UpdateFulfillment($input: CustomUpdateFulfillmentInput!) {
    updateFulfillment(input: $input) {
      id
      nextStates
      customFields { fulfillDocs { id name preview source mimeType } }
    }
  }
`

const attachDocsToFulfillment = async (fulfillmentId) => {
  if (!fulfillmentId || !uploadedDoc.value) return { ok: true }

  // Build the payload. Note: the `fulfillDocs` field is
  // `list: false`, so we send a single ID, not an array.
  const payload = {
    id: fulfillmentId,
    customFields: {
      fulfillDocs: uploadedDoc.value.id
    }
  }

  const apolloClient = createApolloClient(
    authStore.token,
    getChannelTokenFromQuery() || authStore.activeChannel?.token || null
  )
  try {
    const { data } = await apolloClient.mutate({
      mutation: UPDATE_FULFILLMENT_MUTATION,
      variables: { input: payload }
    })
    const response = data?.updateFulfillment
    if (!response) {
      return { ok: false, error: 'updateFulfillment returned no data' }
    }
    const returnedId = response?.customFields?.fulfillDocs?.id || null
    console.log(`[OrderDetail] delivery doc ${uploadedDoc.value.id} attached to fulfillment ${fulfillmentId}`)
    if (!returnedId) {
      console.warn(`[OrderDetail] backend readback shows no fulfillDocs for fulfillment ${fulfillmentId}`)
    }
    return { ok: true }
  } catch (err) {
    // Extract the actual server-side error message so the
    // user sees the real reason instead of a generic
    // "Network error: 400 Bad Request".
    const networkResult = err.networkError?.result
    const graphQLErrors = err.graphQLErrors || []
    const serverMessage =
      networkResult?.message ||
      networkResult?.error ||
      (Array.isArray(networkResult?.errors) && networkResult.errors[0]?.message) ||
      graphQLErrors[0]?.message ||
      err.message ||
      String(err) ||
      'updateFulfillment mutation failed'
    console.warn('[OrderDetail] updateFulfillment FAILED:', serverMessage)
    return { ok: false, error: serverMessage }
  }
}

const fulfilling = ref(false)
const transitFulfillmentId = ref(null)

const showCancelModal = ref(false)
const cancelReason = ref('')
const cancelShipping = ref(true)
const cancelling = ref(false)
const cancelError = ref('')

const expandedFulfillmentIds = ref({})

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

const GET_ORDER_QUERY = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      code
      state
      active
      createdAt
      updatedAt
      orderPlacedAt
      currencyCode
      subTotal
      subTotalWithTax
      shipping
      shippingWithTax
      total
      totalWithTax
      couponCodes
      customer {
        id
        firstName
        lastName
        emailAddress
        phoneNumber
        customFields {
          companyInfo
        }
      }
      shippingAddress {
        fullName
        company
        streetLine1
        streetLine2
        city
        province
        postalCode
        country
        phoneNumber
      }
      billingAddress {
        fullName
        company
        streetLine1
        streetLine2
        city
        province
        postalCode
        country
        phoneNumber
      }
      payments {
        id
        method
        amount
        state
        transactionId
        errorMessage
        metadata
      }
      fulfillments {
        id
        createdAt
        method
        trackingCode
        state
        nextStates
        customFields {
          fulfillDocs {
            id
            name
            preview
            source
          }
        }
        lines {
          quantity
          orderLine {
            id
            productVariant {
              id
              name
              sku
            }
          }
        }
      }
      lines {
        id
        quantity
        unitPrice
        unitPriceWithTax
        linePrice
        linePriceWithTax
        discountedLinePrice
        discountedLinePriceWithTax
        featuredAsset {
          id
          preview
          source
        }
        productVariant {
          id
          name
          sku
          featuredAsset {
            id
            preview
          }
        }
      }
      customFields {
        customerMessage
      }
      channels {
        id
        code
        token
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

const fetchOrder = async () => {
  loading.value = true
  error.value = ''
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    const { data } = await apolloClient.query({
      query: GET_ORDER_QUERY,
      variables: { id: route.params.orderId },
      fetchPolicy: 'network-only'
    })
    order.value = data.order
  } catch (err) {
    console.error('Failed to fetch order:', err)
    error.value = err.message || 'Failed to load order'
  } finally {
    loading.value = false
  }
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

const headerChannelCodes = (o) => {
  if (!o?.channels || o.channels.length === 0) return ''
  const codes = o.channels
    .map(c => c.code)
    .filter(code => code !== '__default_channel__')
  return codes.length ? codes.join(', ') : ''
}

// Format a HistoryEntry into an array of { text } / { state } parts,
// similar to the detail rows in the Vendure admin UI
// (e.g. "Fulfillment #8 from Shipped to Delivered").
const parseHistoryData = (raw) => {
  if (raw == null) return {}
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch (_) { return {} }
  }
  return raw
}

const formatHistoryEntry = (entry) => {
  const data = parseHistoryData(entry.data)
  const parts = []
  const push = (val) => {
    if (val != null && val !== '') parts.push({ text: String(val) })
  }
  const pushState = (s) => {
    if (s != null && s !== '') parts.push({ state: String(s) })
  }

  switch (entry.type) {
    case 'ORDER_STATE_TRANSITION':
      push('Order transitioned from ')
      pushState(data.from)
      push(' to ')
      pushState(data.to)
      break
    case 'ORDER_FULFILLMENT_TRANSITION':
      push(`Fulfillment #${data.fulfillmentId ?? ''} from `)
      pushState(data.from)
      push(' to ')
      pushState(data.to)
      break
    case 'ORDER_FULFILLMENT':
      push(`Fulfillment #${data.fulfillmentId ?? ''} created`)
      break
    case 'ORDER_PAYMENT_TRANSITION':
      push(`Payment #${data.paymentId ?? ''} from `)
      pushState(data.from)
      push(' to ')
      pushState(data.to)
      break
    case 'ORDER_REFUND_TRANSITION':
      push(`Refund #${data.refundId ?? ''} from `)
      pushState(data.from)
      push(' to ')
      pushState(data.to)
      break
    case 'ORDER_CANCELLATION':
      push('Order cancelled')
      if (data.reason) {
        push(` (${data.cancellationType || 'reason'}: ${data.reason})`)
      } else if (data.cancellationType) {
        push(` (${data.cancellationType})`)
      }
      break
    case 'ORDER_NOTE':
      push(data.note ? `Note: ${data.note}` : 'Note added')
      break
    case 'ORDER_COUPON_APPLIED':
      push(`Coupon ${data.couponCode || ''} applied`)
      break
    case 'ORDER_COUPON_REMOVED':
      push(`Coupon ${data.couponCode || ''} removed`)
      break
    case 'ORDER_MODIFIED':
      push('Order modified')
      break
    case 'ORDER_CUSTOMER_UPDATED':
      push('Customer updated')
      break
    case 'CUSTOMER_NOTE':
      push(data.note ? `Customer note: ${data.note}` : 'Customer note added')
      break
    default:
      // Fallback: humanize the type and show note if any
      push(entry.type ? entry.type.replace(/_/g, ' ').toLowerCase() : 'History entry')
      if (data.note) push(`: ${data.note}`)
  }

  if (parts.length === 0) parts.push({ text: entry.type || 'History entry' })
  return parts
}

const SETTLE_PAYMENT_MUTATION = gql`
  mutation SettlePayment($id: ID!) {
    settlePayment(id: $id) {
      ... on Payment {
        id
        state
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

const settlePayment = async (paymentId) => {
  settlingPaymentId.value = paymentId
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    const { data } = await apolloClient.mutate({
      mutation: SETTLE_PAYMENT_MUTATION,
      variables: { id: paymentId }
    })
    if (data?.settlePayment?.message) {
      error.value = data.settlePayment.message
    } else {
      fetchOrder()
    }
  } catch (err) {
    console.error('Failed to settle payment:', err)
    error.value = err.message || 'Failed to settle payment'
  } finally {
    settlingPaymentId.value = null
  }
}

// How many units of this line are still un-fulfilled? Used both
// for the per-line label in the modal ("X of Y available to
// fulfill") and for the input's max attribute. Returns
// `line.quantity` (the full amount) when there are no
// fulfillments yet.
const availableToFulfill = (line) => {
  if (!line.fulfillments || line.fulfillments.length === 0) {
    return line.quantity
  }
  const fulfilled = line.fulfillments.reduce((sum, f) => {
    // Cancelled fulfillments don't count against the available
    // quantity.
    if (f.state === 'Cancelled') return sum
    return sum + f.quantity
  }, 0)
  return Math.max(0, line.quantity - fulfilled)
}

const openFulfillModal = () => {
  const qty = {}
  for (const line of order.value?.lines || []) {
    qty[line.id] = availableToFulfill(line)
  }
  fulfillQuantities.value = qty
  fulfillMethod.value = ''
  fulfillTrackingCode.value = ''
  fulfillError.value = ''
  resetDocs()
  showFulfillModal.value = true
}

const closeFulfillModal = () => {
  showFulfillModal.value = false
  fulfillMethod.value = ''
  fulfillTrackingCode.value = ''
  fulfillQuantities.value = {}
  fulfillError.value = ''
  resetDocs()
}

const ADD_FULFILLMENT_MUTATION = gql`
  mutation AddFulfillmentToOrder($input: FulfillOrderInput!) {
    addFulfillmentToOrder(input: $input) {
      ... on Fulfillment {
        id
        state
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

const submitFulfillment = async () => {
  fulfillError.value = ''

  // Build the lines array, filtering out zero quantities and
  // clamping any value that exceeds the available amount. The
  // `<input :max>` already enforces this in the UI, but a power
  // user could still type a larger number, so we clamp again
  // here as defense-in-depth.
  const lines = []
  for (const line of order.value?.lines || []) {
    const requested = Number(fulfillQuantities.value[line.id] || 0)
    if (requested <= 0) continue
    const available = availableToFulfill(line)
    if (requested > available) {
      fulfillError.value = `Quantity for "${line.productVariant?.name || line.id}" exceeds available (${available}).`
      return
    }
    lines.push({ orderLineId: line.id, quantity: requested })
  }

  if (lines.length === 0) {
    fulfillError.value = 'Please enter a quantity for at least one order line.'
    return
  }

  fulfilling.value = true
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    const args = []
    if (fulfillMethod.value) {
      args.push({ name: 'method', value: fulfillMethod.value })
    }
    if (fulfillTrackingCode.value) {
      args.push({ name: 'trackingCode', value: fulfillTrackingCode.value })
    }
    const { data } = await apolloClient.mutate({
      mutation: ADD_FULFILLMENT_MUTATION,
      variables: {
        input: {
          lines,
          handler: { code: 'manual-fulfillment', arguments: args }
        }
      }
    })
    if (data?.addFulfillmentToOrder?.message) {
      // Server returned an ErrorResult (e.g. insufficient stock,
      // invalid state). Show it inside the modal so the user
      // doesn't lose context.
      fulfillError.value = data.addFulfillmentToOrder.message
    } else {
      // Fulfillment was created. If the admin attached any
      // delivery-notice images, push them into the
      // `fulfillDocs` custom field via a follow-up mutation.
      // This requires an `updateFulfillment` resolver on
      // the backend — see the helper above for details.
      const newFulfillmentId = data?.addFulfillmentToOrder?.id
      let attachWarning = ''

      // Step 2: optionally auto-transition Pending → Shipped.
      // The checkbox `autoShipAfterFulfill` is checked by default
      // — admins rarely want a fulfillment to sit in Pending,
      // so we move it forward automatically. We reuse the
      // existing `transitionFulfillment` function that backs
      // the clickable Pending/Shipped/Delivered/Cancelled
      // pills in the Fulfillment card, so there's only one
      // code path for state transitions.
      let shipWarning = ''
      if (newFulfillmentId && autoShipAfterFulfill.value) {
        try {
          await transitionFulfillment(newFulfillmentId, 'Shipped')
          console.log(`[OrderDetail] fulfillment ${newFulfillmentId} transitioned to Shipped`)
        } catch (err) {
          shipWarning = `Fulfillment #${newFulfillmentId} was created in Pending, but could not be auto-shipped: ${err.message || err}. Click "Shipped" manually.`
        }
      }

      if (newFulfillmentId && uploadedDoc.value) {
        const result = await attachDocsToFulfillment(newFulfillmentId)
        if (!result.ok) {
          // Keep the modal open so the user can see the warning.
          attachWarning =
            `Fulfillment #${newFulfillmentId} was created, but the ` +
            `uploaded delivery docs could not be attached: ${result.error}. ` +
            `Add an 'updateFulfillment' mutation to your backend, then try again.`
        }
      }
      closeFulfillModal()
      // Surface any non-blocking warnings on the page-level
      // error banner (which is shown after the modal closes).
      if (attachWarning) {
        error.value = attachWarning
      } else if (shipWarning) {
        error.value = shipWarning
      } else {
        error.value = ''
      }
      fetchOrder()
    }
  } catch (err) {
    console.error('Failed to fulfill order:', err)
    fulfillError.value = err.message || 'Failed to fulfill order'
  } finally {
    fulfilling.value = false
  }
}

const TRANSITION_FULFILLMENT_MUTATION = gql`
  mutation TransitionFulfillmentToState($id: ID!, $state: String!) {
    transitionFulfillmentToState(id: $id, state: $state) {
      ... on Fulfillment {
        id
        state
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

const transitionFulfillment = async (id, state) => {
  transitFulfillmentId.value = id
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    const { data } = await apolloClient.mutate({
      mutation: TRANSITION_FULFILLMENT_MUTATION,
      variables: { id, state }
    })
    if (data?.transitionFulfillmentToState?.message) {
      error.value = data.transitionFulfillmentToState.message
    }
    fetchOrder()
  } catch (err) {
    console.error('Failed to transition fulfillment:', err)
    error.value = err.message || 'Failed to transition fulfillment'
  } finally {
    transitFulfillmentId.value = null
  }
}

const fulfillmentId = (f) => {
  // Vendure uses a numeric sequence for Fulfillment IDs ("Fulfillment #9").
  // We can derive the numeric portion by stripping the GraphQL node id prefix.
  if (f.id == null) return '-'
  const m = String(f.id).match(/(\d+)$/)
  return m ? m[1] : f.id
}

const totalFulfillmentQty = (f) => {
  if (!f.lines || f.lines.length === 0) return 0
  return f.lines.reduce((sum, l) => sum + (l.quantity || 0), 0)
}

const toggleFulfillmentItems = (id) => {
  expandedFulfillmentIds.value[id] = !expandedFulfillmentIds.value[id]
}

const openCancelModal = () => {
  cancelReason.value = ''
  cancelShipping.value = true
  cancelError.value = ''
  showCancelModal.value = true
}

const closeCancelModal = () => {
  if (cancelling.value) return
  showCancelModal.value = false
  cancelReason.value = ''
  cancelError.value = ''
}

const CANCEL_ORDER_MUTATION = gql`
  mutation CancelOrder($input: CancelOrderInput!) {
    cancelOrder(input: $input) {
      ... on Order {
        id
        state
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

const submitCancel = async () => {
  if (!order.value?.id) return
  cancelling.value = true
  cancelError.value = ''
  try {
    const channelToken = getChannelTokenFromQuery() || authStore.activeChannel?.token || null
    const apolloClient = createApolloClient(authStore.token, channelToken)
    const input = { orderId: order.value.id, cancelShipping: cancelShipping.value }
    if (cancelReason.value.trim()) {
      input.reason = cancelReason.value.trim()
    }
    const { data } = await apolloClient.mutate({
      mutation: CANCEL_ORDER_MUTATION,
      variables: { input }
    })
    const result = data?.cancelOrder
    if (result?.errorCode || result?.message) {
      cancelError.value = result.message || result.errorCode
    } else {
      showCancelModal.value = false
      cancelReason.value = ''
      await fetchOrder()
    }
  } catch (err) {
    console.error('Failed to cancel order:', err)
    cancelError.value = err.message || 'Failed to cancel order'
  } finally {
    cancelling.value = false
  }
}

onMounted(() => {
  fetchOrder()
})
</script>
