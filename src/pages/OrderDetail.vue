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
              <th class="px-3 py-2 font-semibold text-right">Qty</th>
              <th class="px-3 py-2 font-semibold text-right">COA</th>
              <!-- 🆕 随货样板 (sample plates) column. Mirrors the
                   data already shown in the Fulfilled items block
                   below — same source (`OrderLine.customFields.samplePlate`).
                   Only renders a value when the line has been
                   attached to a fulfillment that recorded sample
                   plates; otherwise shows "—" to keep the column
                   visually consistent. -->
              <th class="px-3 py-2 font-semibold text-right">随货样板</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="line in order.lines" :key="line.id">
              <tr class="border-b border-dark-100 text-sm text-gray-300">
                <td class="px-3 py-2">
                  <div class="flex items-center gap-2">
                    <img v-if="line.featuredAsset?.preview" :src="line.featuredAsset.preview"
                      class="w-10 h-10 object-cover rounded" />
                    <div v-else
                      class="w-10 h-10 bg-dark-100 rounded flex items-center justify-center text-xs text-gray-500">No
                      img
                    </div>
                    <span>{{ line.productVariant?.name || '-' }}</span>
                  </div>
                </td>
                <td class="px-3 py-2 text-right">{{ line.quantity }}</td>
                <!-- 🆕 COA column: shows the per-line PDF / image
                     attachment. Uses the same `getFileIcon` helper
                     as the product page (PaginatedProductList.vue)
                     for proper file-type icons (PDF, DOC, XLS,
                     etc.). Real image previews are used for
                     JPG/PNG/etc. files; SVG icons for everything
                     else.
                     - File-type icon (or image preview for images)
                     - File name (truncated if long)
                     - Click to open in a new tab -->
                <td class="px-3 py-2 text-right">
                  <a v-if="line.customFields?.orderLinePdfs?.id"
                    :href="line.customFields.orderLinePdfs.source || line.customFields.orderLinePdfs.preview"
                    target="_blank" rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 group max-w-[260px] hover:opacity-90"
                    :title="`${line.customFields.orderLinePdfs.name} (id ${line.customFields.orderLinePdfs.id}) — click to open`">
                    <!-- File-type icon (e.g. PDF.svg, WORD.svg) if
                         the file is not an image. Falls back to
                         the actual image preview for JPG/PNG/etc. -->
                    <template v-if="getFileIcon(line.customFields.orderLinePdfs.name)">
                      <img :src="`/file_icons/${getFileIcon(line.customFields.orderLinePdfs.name)}`"
                        :alt="line.customFields.orderLinePdfs.name" class="w-7 h-7 object-contain shrink-0" />
                    </template>
                    <template v-else>
                      <img :src="line.customFields.orderLinePdfs.preview" :alt="line.customFields.orderLinePdfs.name"
                        class="w-9 h-9 object-cover rounded border border-blue-700/40 shrink-0" />
                    </template>
                    <span class="text-xs text-blue-300 group-hover:text-blue-200 truncate text-left">
                      {{ line.customFields.orderLinePdfs.name }}
                    </span>
                  </a>
                  <span v-else class="text-gray-600 text-xs">—</span>
                </td>
                <!-- 🆕 随货样板 (sample plates) cell. Reads
                     `line.customFields.samplePlate` (set by the
                     Fulfill Order modal). Amber badge matches the
                     styling in the Fulfilled items block below
                     so the two are visually linked. When the value
                     is 0 / unset we render "—" to keep the column
                     visually balanced. -->
                <td class="px-3 py-2 text-right">
                  <span v-if="(line.customFields?.samplePlate || 0) > 0"
                    class="inline-flex items-center gap-1 text-xs font-medium text-amber-300 bg-amber-900/30 border border-amber-700/40 rounded-full px-2 py-0.5 font-mono"
                    :title="`样品板数 (随货样板) — number of sample plates included`">
                    <span aria-hidden="true">🪧</span>
                    <span>{{ line.customFields.samplePlate }}</span>
                  </span>
                  <span v-else class="text-gray-600 text-xs">—</span>
                </td>
              </tr>
              <!-- Surcharge (开机费 / 起批费) sub-row, shown only when
                 the Order has a surcharge whose description contains
                 this line's SKU in square brackets
                 priceWithTax is in cents (same unit as unitPriceWithTax). -->
              <tr v-if="!isDeliveryAdmin && (getLineSurchargeValue(line) || 0) > 0"
                class="border-b border-dark-100 bg-dark-300/30 text-xs">
                <td colspan="3" class="px-3 py-1.5 pl-12 text-amber-400 italic">
                  <span class="text-gray-500 not-italic">↳</span>
                  {{ getLineSurchargeLabel(line) || 'Surcharge（附加费）' }}
                </td>
                <td class="px-3 py-1.5 text-right font-mono text-amber-300">
                  + {{ formatPrice(getLineSurchargeValue(line)) }}
                </td>
              </tr>
            </template>
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
      <div v-if="sortedFulfillments.length" class="space-y-10">
        <div v-for="f in sortedFulfillments" :key="f.id"
          class="text-gray-300 text-sm pb-4 mb-4 border-b border-gray-700 last:border-b-0 last:mb-0 last:pb-0">
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

          <!-- 🆕 Delivery PDF (the fulfillPdfs custom-field file
               uploaded via the Fulfill Order modal). Mirrors
               the orderLinePdfs display pattern in the Fulfilled
               items block below: shows a file-type icon (PDF.svg,
               WORD.svg, …) for non-image files, or the real image
               preview for JPG/PNG/etc. The full file name and
               "click to open" hint make the link obvious. -->
          <div v-if="f.customFields?.fulfillPdfs" class="mt-3 border-t border-dark-100 pt-3">
            <div class="flex items-center justify-between mb-2">
              <h5 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Delivery PDF
              </h5>
              <span class="text-[10px] text-gray-500">click to open</span>
            </div>
            <a :href="f.customFields.fulfillPdfs.source || f.customFields.fulfillPdfs.preview" target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 group max-w-[300px] hover:opacity-90 bg-dark-100 rounded px-2 py-1.5 border border-dark-100 hover:border-blue-400 transition-colors"
              :title="`${f.customFields.fulfillPdfs.name} (id ${f.customFields.fulfillPdfs.id}) — click to open`">
              <template v-if="getFileIcon(f.customFields.fulfillPdfs.name)">
                <img :src="`/file_icons/${getFileIcon(f.customFields.fulfillPdfs.name)}`"
                  :alt="f.customFields.fulfillPdfs.name" class="w-7 h-7 object-contain shrink-0" />
              </template>
              <template v-else>
                <img :src="f.customFields.fulfillPdfs.preview || f.customFields.fulfillPdfs.source"
                  :alt="f.customFields.fulfillPdfs.name"
                  class="w-7 h-7 object-cover rounded border border-blue-700/40 shrink-0" />
              </template>
              <div class="min-w-0 flex-1">
                <div class="text-[10px] uppercase tracking-wider text-blue-400/70">Attached file</div>
                <div class="text-xs text-blue-200 group-hover:text-blue-100 truncate">
                  {{ f.customFields.fulfillPdfs.name }}
                </div>
              </div>
              <span class="text-[9px] text-gray-500 font-mono shrink-0"
                :title="`Asset ID: ${f.customFields.fulfillPdfs.id}`">
                #{{ f.customFields.fulfillPdfs.id }}
              </span>
            </a>
          </div>

          <div class="mt-5"></div>

          <!-- Fulfilled items (collapsible) -->
          <div v-if="f.lines?.length" class="mt-3 border-t border-dark-100 pt-2">
            <button @click="toggleFulfillmentItems(f.id)"
              class="w-full flex items-center justify-between text-sm text-gray-300 hover:text-white">
              <span class="font-medium flex items-center gap-2 flex-wrap">
                <span>Fulfilled items ({{ totalFulfillmentQty(f) }})</span>
                <!-- 🟠 Option A: sample-plate badge -->
                <span v-if="totalSamplePlates(f) > 0"
                  class="inline-flex items-center gap-1 text-xs font-medium text-amber-300 bg-amber-900/30 border border-amber-700/40 rounded-full px-2 py-0.5"
                  :title="`Total sample plates recorded for this fulfillment across all lines`">
                  <span aria-hidden="true">🪧</span>
                  <span>{{ totalSamplePlates(f) }} 随货样板</span>
                </span>
              </span>
              <span class="text-gray-500 text-xs">{{ expandedFulfillmentIds[f.id] ? '▾' : '▸' }}</span>
            </button>
            <div v-if="expandedFulfillmentIds[f.id]" class="mt-2 space-y-2 pl-2">
              <div v-for="line in f.lines" :key="line.orderLineId" class="border border-dark-100 rounded-md p-2">

                <div class="flex mb-4 gap-4">

                  <p class="text-gray-200">{{ line.orderLine?.productVariant?.name || '-' }}</p>
                  <p class="text-xs text-gray-500">
                    <span class="text-gray-400">Qty:</span> {{ line.quantity }}
                  </p>

                  <p v-if="(line.orderLine?.customFields?.samplePlate || 0) > 0" class="text-xs text-amber-400">
                    <span class="text-amber-500/70 mr-2">随货样板:</span>
                    <span class="font-mono text-amber-300">{{ line.orderLine.customFields.samplePlate }}</span>
                  </p>

                </div>
    

                <!-- <span v-if="line.orderLine?.productVariant?.sku" class="ml-2">
                  <span class="text-gray-400">SKU:</span>
                  <span class="font-mono">{{ line.orderLine.productVariant.sku }}</span>
                </span> -->


                <!-- 🔑 samplePlate (样品板数) display. Read from
                     the underlying OrderLine's JSON customFields
                     blob. Only shown when the value is set to a
                     positive integer (0 means "no sample plates",
                     which is the default). Amber color matches
                     the Fulfill Order modal's input styling so
                     the two are visually linked. -->

                <!-- 🔑 orderLinePdfs (per-line PDF / image attachment)
                     display. Uses the same `getFileIcon` helper as
                     the product page (PaginatedProductList.vue)
                     for proper file-type icons (PDF.svg, WORD.svg,
                     etc.) on non-image files. Image files use
                     the real preview thumbnail.
                     - File-type icon (or image preview for images)
                     - "ATTACHED FILE" label + file name
                     - Click to open in a new tab -->
                <a v-if="line.orderLine?.customFields?.orderLinePdfs?.id"
                  :href="line.orderLine.customFields.orderLinePdfs.source || line.orderLine.customFields.orderLinePdfs.preview"
                  target="_blank" rel="noopener noreferrer"
                  class="flex items-center gap-2 mt-1.5 max-w-[280px] group hover:bg-blue-900/20 rounded px-1.5 py-1 transition"
                  :title="`${line.orderLine.customFields.orderLinePdfs.name} (id ${line.orderLine.customFields.orderLinePdfs.id}) — click to open`">
                  <template v-if="getFileIcon(line.orderLine.customFields.orderLinePdfs.name)">
                    <img :src="`/file_icons/${getFileIcon(line.orderLine.customFields.orderLinePdfs.name)}`"
                      :alt="line.orderLine.customFields.orderLinePdfs.name" class="w-9 h-9 object-contain shrink-0" />
                  </template>
                  <template v-else>
                    <img :src="line.orderLine.customFields.orderLinePdfs.preview"
                      :alt="line.orderLine.customFields.orderLinePdfs.name"
                      class="w-9 h-9 object-cover rounded border border-blue-700/40 shrink-0" />
                  </template>
                  <div class="min-w-0 flex-1">
                    <div class="text-[10px] uppercase tracking-wider text-blue-400/70">Attached file</div>
                    <div class="text-xs text-blue-200 group-hover:text-blue-100 truncate">
                      {{ line.orderLine.customFields.orderLinePdfs.name }}
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>


          <div class="mb-10"></div>



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
        <h3 class="text-xl font-bold text-gray-200">Fulfill Order</h3>
        <!-- {{ order?.code }} -->
        <button @click="closeFulfillModal" class="text-gray-500 hover:text-gray-300 text-2xl leading-none"
          aria-label="Close">×</button>
      </div>
      <!-- <p class="text-sm text-gray-400 mb-4">Select quantities to fulfill and configure the fulfillment handler</p> -->

      <!-- Order lines section -->
      <!-- <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Order lines</h4> -->
      <div class="mt-6"></div>
      <div class="space-y-2 mb-4">
        <div v-for="line in order?.lines || []" :key="line.id">

          <div class="flex flex-row items-center justify-between bg-dark-300 p-3 rounded-md">
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-200 truncate">{{ line.productVariant?.name }}</p>
              <!-- <p class="text-xs text-gray-500">SKU: {{ line.productVariant?.sku }}</p> -->
              <p class="text-xs text-gray-500">
                {{ availableToFulfill(line) }} of {{ line.quantity }} available to fulfill
              </p>
            </div>

            <div class="flex items-center gap-3 ml-4">
              <div class="flex items-center gap-1">
                <span class="text-xs text-gray-400 mr-2">Qty</span>
                <input type="number" v-model.number="fulfillQuantities[line.id]" :max="availableToFulfill(line)" min="0"
                  class="w-20 px-2 py-1 bg-dark-100 text-white rounded border border-dark-100 text-sm text-center" />
              </div>
            </div>
          </div>

          <div class="flex flex-row items-center justify-between bg-dark-300 p-3 rounded-md gap-3 flex-wrap">

            <!-- 🆕 Per-line PDF upload (OrderLine.customFields.orderLinePdfs).
                 The hidden file input is declared ONCE outside the
                 v-for (just above the `fulfillDocs` input, see line
                 ~576), so `linePdfFileInput` is a single DOM
                 element — NOT an array. We tag which line is being
                 uploaded via `pendingLinePdfLineId`. The thumbnail
                 + name show the current state (either pre-filled
                 from the server, or just uploaded). -->
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <button v-if="!fulfillLinePdfs[line.id] && !uploadingLinePdfs" type="button"
                @click="triggerLinePdfPicker(line.id)"
                class="text-xs px-2 py-1 bg-dark-100 hover:bg-dark-200 text-gray-300 rounded border border-dark-100 inline-flex items-center gap-1"
                title="Upload a PDF or other document for this line">
                <span aria-hidden="true">📎</span>
                <span>上传 PDF</span>
              </button>
              <div v-else-if="fulfillLinePdfs[line.id]" class="flex items-center gap-2 min-w-0">
                <a :href="fulfillLinePdfs[line.id].preview || fulfillLinePdfs[line.id].source" target="_blank"
                  rel="noopener noreferrer"
                  class="text-xs text-blue-300 hover:text-blue-200 truncate max-w-[180px] inline-flex items-center gap-1"
                  :title="`${fulfillLinePdfs[line.id].name} (id ${fulfillLinePdfs[line.id].id})`">
                  <span aria-hidden="true">📄</span>
                  <span class="truncate">{{ fulfillLinePdfs[line.id].name }}</span>
                </a>
                <button type="button" @click="removeLinePdf(line.id)" class="text-xs text-red-400 hover:text-red-300"
                  title="Remove this PDF">
                  ✕
                </button>
              </div>
              <span v-if="uploadingLinePdfs && pendingLinePdfLineId === line.id" class="text-xs text-gray-400">
                上传中…
              </span>
              <span v-if="linePdfUploadError && pendingLinePdfLineId === line.id" class="text-xs text-red-400">
                {{ linePdfUploadError }}
              </span>
            </div>

            <div class="flex items-center gap-1">
              <span class="text-xs text-gray-400 mr-2"
                title="样品板数 — number of sample plates included in this fulfillment">随货样板</span>
              <input type="number" v-model.number="fulfillSamplePlates[line.id]" min="0" placeholder="0"
                class="w-20 px-2 py-1 bg-dark-100 text-white rounded border border-dark-100 text-sm text-center"
                :title="`Current: ${line.customFields?.samplePlate ?? 0} (from OrderLine.customFields.samplePlate)`" />
            </div>

          </div>



          <div>

          </div>


        </div>
      </div>

      <!-- Fulfillment handler section (matches Vendure's UI) -->
      <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Fulfillment handler</h4>
      <div class="bg-dark-300 p-4 rounded-md mb-4">
        <p class="text-sm text-gray-200">Manually enter fulfillment details</p>
        <!-- <p class="text-xs text-gray-500 mb-3 font-mono">manual-fulfillment</p> -->
        <div class="mt-4"></div>
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
        <!-- Live indicator so the user can see whether any
             doc or PDF is queued for the attach step. -->
        <span v-if="uploadedDoc" class="text-xs text-blue-300 font-mono normal-case">
          📎 1 doc queued
        </span>
        <span v-else-if="uploadedPdfDoc" class="text-xs text-blue-300 font-mono normal-case">
          📄 1 PDF queued
        </span>
      </h4>
      <div class="bg-dark-300 p-4 rounded-md mb-4">
        <!-- <p class="text-xs text-gray-500 mb-3">
          Upload one image of the delivery notice (e.g. signed receipt, photo of the package). It will be attached to
          the
          fulfillment as the
          <code class="text-gray-300">fulfillDocs</code> custom field.
        </p> -->

        <input ref="docsFileInput" type="file" accept="image/*" class="hidden" @change="onDocsFileSelected" />

        <!-- 🆕 Hidden file input for the per-fulfillment PDF
             upload (`fulfillPdfs` custom field). Declared once
             outside any v-for (so the ref is a single DOM
             element, not an array). -->
        <input ref="pdfDocsFileInput" type="file" accept="application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          class="hidden" @change="onPdfDocsFileSelected" />

        <!-- 🆕 Shared hidden file input for per-line PDF uploads.
             Same pattern as `docsFileInput` above: declared once
             outside the v-for (so it's a single ref, not an
             array), and we tag which line is being uploaded via
             `pendingLinePdfLineId`. -->
        <input ref="linePdfFileInput" type="file" accept="application/pdf,image/*,.pdf,.doc,.docx,.xls,.xlsx"
          class="hidden" @change="onLinePdfFileSelected" />

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

        <!-- 🆕 Delivery PDF (fulfillPdfs custom field). Mirrors
             the fulfillDocs block above, but for a single
             PDF/document file. Uses the same `getFileIcon`
             helper as the product page so non-image files
             (PDF, DOC, XLS, …) display with a proper file-type
             icon instead of a broken image. -->
        <div class="mt-4 pt-4 border-t border-dark-100">
          <div class="flex items-center justify-between mb-2">
            <h5 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Delivery PDF
            </h5>
            <span v-if="uploadedPdfDoc" class="text-[10px] text-blue-300 font-mono">
              📄 1 PDF queued
            </span>
          </div>
          <div class="flex flex-wrap gap-2">
            <!-- Single queued PDF. Display strategy:
                 - For images (JPG/PNG/…): use the asset's
                   actual preview (the user uploaded an image,
                   even though the field name says "PDF").
                 - For all other file types: show the file-type
                   icon (PDF.svg, WORD.svg, EXCEL.svg, …) so
                   the thumbnail is meaningful. -->
            <div v-if="uploadedPdfDoc"
              class="relative w-20 h-20 bg-dark-100 rounded overflow-hidden group border border-dark-100 flex items-center justify-center">
              <template v-if="getFileIcon(uploadedPdfDoc.name) === null">
                <img :src="uploadedPdfDoc.preview || uploadedPdfDoc.source" :alt="uploadedPdfDoc.name"
                  class="w-full h-full object-cover" />
              </template>
              <template v-else>
                <img :src="`/file_icons/${getFileIcon(uploadedPdfDoc.name)}`" :alt="uploadedPdfDoc.name"
                  class="w-12 h-12 object-contain" />
              </template>
              <button type="button" @click="removeUploadedPdfDoc"
                class="absolute top-0 right-0 bg-red-600 text-white text-xs leading-none px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                :title="`Remove ${uploadedPdfDoc.name}`">×</button>
              <div class="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] px-1 truncate font-mono"
                :title="`Asset ID: ${uploadedPdfDoc.id} — ${uploadedPdfDoc.name}`">
                {{ uploadedPdfDoc.id }}
              </div>
            </div>

            <!-- In-flight upload spinner -->
            <div v-if="uploadingPdfDocs"
              class="w-20 h-20 bg-dark-100 rounded flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-500">
              <svg class="w-5 h-5 animate-spin mb-1" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              <span class="text-[10px]">Uploading</span>
            </div>

            <!-- Upload button (only visible when no PDF is queued) -->
            <button v-if="!uploadedPdfDoc && !uploadingPdfDocs" type="button" @click="triggerPdfDocsFilePicker"
              class="w-20 h-20 bg-dark-100 hover:bg-dark-200 border border-dashed border-gray-500 hover:border-gray-300 rounded flex flex-col items-center justify-center text-gray-400 hover:text-gray-200 transition-colors"
              title="Upload a PDF or document">
              <span class="text-2xl leading-none">+</span>
              <span class="text-[10px] mt-1">PDF</span>
            </button>
          </div>
          <p v-if="uploadedPdfDoc" class="text-[10px] text-gray-500 mt-1 truncate" :title="uploadedPdfDoc.name">
            {{ uploadedPdfDoc.name }}
          </p>
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
// 🔑 samplePlate (样品板) per line for the Fulfill Order modal.
// Keyed by `line.id` (same shape as `fulfillQuantities`). Populated
// when the modal opens from the existing
// `OrderLine.customFields.samplePlate` value (or 0 if unset).
// On fulfill, lines with samplePlate > 0 are persisted back to
// the orderLine via `adjustOrderLine` (which can update
// customFields in the same mutation that adjusts quantity).
const fulfillSamplePlates = ref({})
// 🆕 Per-line PDF (orderLinePdfs) for the Fulfill Order modal.
// Keyed by `line.id`. Each entry is an Asset object (or null):
//   { id, name, source, preview, mimeType }
//     id      — Vendure asset id (set after createAssets returns)
//     preview — blob: URL for the local preview, falls back to
//               the server's `source` URL after the blob is
//               revoked (e.g. on modal close).
// Mirrors the existing `fulfillSamplePlates` shape. The
// `orderLinePdfs` custom field on OrderLine is `list: false`,
// so each line holds at most one PDF.
const fulfillLinePdfs = ref({})
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

// 🆕 Per-fulfillment PDF upload state (parallels `uploadedDoc`).
// The `fulfillPdfs` custom field is also `list: false`, so
// we hold at most one queued file at a time. The file input
// is shared (one hidden <input> in the DOM) and we use the
// `accept` attribute to filter for PDFs (and similar docs).
const pdfDocsFileInput = ref(null)
const uploadingPdfDocs = ref(false)
const uploadedPdfDoc = ref(null)

const triggerDocsFilePicker = () => {
  docsFileInput.value?.click()
}

const triggerPdfDocsFilePicker = () => {
  pdfDocsFileInput.value?.click()
}

const removeUploadedDoc = () => {
  if (uploadedDoc.value?.preview?.startsWith('blob:')) {
    URL.revokeObjectURL(uploadedDoc.value.preview)
  }
  uploadedDoc.value = null
}

const removeUploadedPdfDoc = () => {
  if (uploadedPdfDoc.value?.preview?.startsWith('blob:')) {
    URL.revokeObjectURL(uploadedPdfDoc.value.preview)
  }
  uploadedPdfDoc.value = null
}

// Reset all upload state (called when the modal opens / closes).
const resetDocs = () => {
  if (uploadedDoc.value?.preview?.startsWith('blob:')) {
    URL.revokeObjectURL(uploadedDoc.value.preview)
  }
  uploadedDoc.value = null
  if (docsFileInput.value) docsFileInput.value.value = ''

  // 🆕 Also clear the per-fulfillment PDF state
  if (uploadedPdfDoc.value?.preview?.startsWith('blob:')) {
    URL.revokeObjectURL(uploadedPdfDoc.value.preview)
  }
  uploadedPdfDoc.value = null
  if (pdfDocsFileInput.value) pdfDocsFileInput.value.value = ''
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

// 🆕 Per-fulfillment PDF upload handler (parallels
// `onDocsFileSelected` for the image doc).
// - Accepts PDFs and similar docs (DOC, XLS, etc.)
// - Stores the file in `uploadedPdfDoc` with a blob: URL
//   for the local preview
// - The actual attach to the fulfillment happens later in
//   `attachDocsToFulfillment` when the user clicks Fulfill.
const onPdfDocsFileSelected = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  uploadingPdfDocs.value = true
  fulfillError.value = ''
  try {
    // Revoke any prior blob URL to avoid memory leak
    if (uploadedPdfDoc.value?.preview?.startsWith('blob:')) {
      URL.revokeObjectURL(uploadedPdfDoc.value.preview)
    }
    const asset = await uploadSingleAsset(file)
    uploadedPdfDoc.value = {
      id: asset.id,
      name: asset.name || file.name,
      source: asset.preview || asset.source,
      preview: URL.createObjectURL(file)
    }
    console.log('[OrderDetail] uploaded fulfillPdfs:', { id: asset.id, name: asset.name })
  } catch (err) {
    console.error('Failed to upload delivery PDF:', err)
    fulfillError.value = err.message || 'Failed to upload delivery PDF'
  } finally {
    uploadingPdfDocs.value = false
    if (e.target) e.target.value = ''
  }
}

// =============================================================
// Per-line PDF upload (OrderLine.customFields.orderLinePdfs)
// =============================================================
// Mirrors the existing per-fulfillment `fulfillDocs` upload
// state (`uploadedDoc`, `docsFileInput`, `onDocsFileSelected`)
// but applied per-orderLine in the Fulfill Order modal. Each
// line gets its own file picker and a thumbnail preview.
//
// `orderLinePdfs` is `list: false` so each line holds at most
// one PDF. The file input is shared (one hidden <input> in the
// DOM), and we tag which line is being uploaded via the
// transient `pendingLinePdfLineId` ref.
const linePdfFileInput = ref(null)
const uploadingLinePdfs = ref(false)
const linePdfUploadError = ref('')
const pendingLinePdfLineId = ref(null)

// Pre-fill existing PDF (from `OrderLine.customFields.orderLinePdfs`)
// when the modal opens, so the user can see what's already
// attached. Same defensive reading as `totalSamplePlates` — the
// Apollo response is frozen, so we walk the object carefully.
const buildLinePdfPrefill = (order) => {
  const map = {}
  for (const line of order?.lines || []) {
    if (line.customFields?.orderLinePdfs?.id) {
      map[line.id] = {
        id: line.customFields.orderLinePdfs.id,
        name: line.customFields.orderLinePdfs.name,
        source: line.customFields.orderLinePdfs.source,
        preview: line.customFields.orderLinePdfs.preview || line.customFields.orderLinePdfs.source,
        mimeType: line.customFields.orderLinePdfs.mimeType
      }
    }
  }
  return map
}

const triggerLinePdfPicker = (lineId) => {
  pendingLinePdfLineId.value = lineId
  linePdfFileInput.value?.click()
}

const removeLinePdf = (lineId) => {
  const current = fulfillLinePdfs.value[lineId]
  if (current?.preview?.startsWith('blob:')) {
    URL.revokeObjectURL(current.preview)
  }
  // Use a fresh object assignment (Vue 3 reactivity-safe)
  const next = { ...fulfillLinePdfs.value }
  delete next[lineId]
  fulfillLinePdfs.value = next
}

const resetLinePdfs = () => {
  for (const id of Object.keys(fulfillLinePdfs.value)) {
    const entry = fulfillLinePdfs.value[id]
    if (entry?.preview?.startsWith('blob:')) {
      URL.revokeObjectURL(entry.preview)
    }
  }
  fulfillLinePdfs.value = {}
  pendingLinePdfLineId.value = null
  linePdfUploadError.value = ''
  if (linePdfFileInput.value) linePdfFileInput.value.value = ''
}

const onLinePdfFileSelected = async (e) => {
  const file = e.target.files?.[0]
  const lineId = pendingLinePdfLineId.value
  if (!file || !lineId) return

  // Accept PDFs (and any file type, since `orderLinePdfs` is
  // for "any asset", not just PDFs). We could restrict to
  // `application/pdf` only, but admins sometimes need to
  // attach a delivery contract or a sample drawing, so we
  // accept any file type.
  uploadingLinePdfs.value = true
  linePdfUploadError.value = ''
  try {
    // If a previous PDF was queued for this line, revoke its
    // blob URL to avoid a memory leak.
    const prev = fulfillLinePdfs.value[lineId]
    if (prev?.preview?.startsWith('blob:')) {
      URL.revokeObjectURL(prev.preview)
    }
    const asset = await uploadSingleAsset(file)
    fulfillLinePdfs.value = {
      ...fulfillLinePdfs.value,
      [lineId]: {
        id: asset.id,
        name: asset.name || file.name,
        source: asset.preview || asset.source,
        // For PDFs, the server's `preview` is the asset icon,
        // not the PDF itself. We use a blob URL for the file
        // so the user can click and open the actual PDF in a
        // new tab. After the modal closes (and the blob URL is
        // revoked), the display falls back to the server's
        // `source` URL (the actual PDF download link).
        preview: URL.createObjectURL(file),
        mimeType: asset.mimeType || file.type
      }
    }
    console.log(`[OrderDetail] uploaded PDF for line ${lineId}:`, { id: asset.id, name: asset.name })
  } catch (err) {
    console.error('Failed to upload per-line PDF:', err)
    linePdfUploadError.value = err.message || 'Failed to upload PDF'
  } finally {
    uploadingLinePdfs.value = false
    if (e.target) e.target.value = ''
    pendingLinePdfLineId.value = null
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
      customFields {
        fulfillDocs {
          id
          name
          preview
          source
          mimeType
        }
        fulfillPdfs {
          id
          name
          preview
          source
          mimeType
        }
      }
    }
  }
`

const attachDocsToFulfillment = async (fulfillmentId) => {
  if (!fulfillmentId) return { ok: true }
  // Skip the mutation entirely if neither doc is queued —
  // saves a network call when the user didn't upload anything.
  if (!uploadedDoc.value && !uploadedPdfDoc.value) return { ok: true }

  // Build the payload. Both `fulfillDocs` and `fulfillPdfs`
  // are `list: false`, so we send single IDs, not arrays.
  // Only include the fields the user actually uploaded.
  const customFields = {}
  if (uploadedDoc.value) customFields.fulfillDocs = uploadedDoc.value.id
  if (uploadedPdfDoc.value) customFields.fulfillPdfs = uploadedPdfDoc.value.id

  const payload = {
    id: fulfillmentId,
    customFields
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
    if (uploadedDoc.value) {
      const returnedId = response?.customFields?.fulfillDocs?.id || null
      console.log(`[OrderDetail] delivery doc ${uploadedDoc.value.id} attached to fulfillment ${fulfillmentId}`)
      if (!returnedId) {
        console.warn(`[OrderDetail] backend readback shows no fulfillDocs for fulfillment ${fulfillmentId}`)
      }
    }
    if (uploadedPdfDoc.value) {
      const returnedId = response?.customFields?.fulfillPdfs?.id || null
      console.log(`[OrderDetail] delivery PDF ${uploadedPdfDoc.value.id} attached to fulfillment ${fulfillmentId}`)
      if (!returnedId) {
        console.warn(`[OrderDetail] backend readback shows no fulfillPdfs for fulfillment ${fulfillmentId}`)
      }
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
          fulfillPdfs {
            id
            name
            preview
            source
            mimeType
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
            customFields {
              samplePlate
              orderLinePdfs {
                id
                name
                preview
                source
                mimeType
              }
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
        customFields {
          samplePlate
          orderLinePdfs {
            id
            name
            preview
            source
            mimeType
          }
        }
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
      # 🔑 surcharges (开机费 / 起批费 / 其它动态加价) 来自 Order.surcharges

      surcharges {
        id
        description
        priceWithTax
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

// Reads the order line's `subcharge` custom field and returns it
// in cents (the same unit as formatPrice expects). Returns 0 if
// the field is missing, null, undefined, or zero. The check `> 0`
// in the template is what hides the sub-row when there's no
// surcharge. If your Vendure field has a different name, change
// `subcharge` here and in the GraphQL query at the same time.
const getSubchargeValue = (line) => {
  const v = line?.customFields?.subcharge
  if (v == null || v === '' || v === 0) return 0
  const n = Number(v)
  if (Number.isNaN(n)) return 0
  // The custom field is configured as an int / float in cents
  // (same as unitPrice). If your field is in whole units
  // instead, multiply by 100 here.
  return Math.round(n)
}

// 🔑 Reads the order line's matching surcharge (e.g. 开机费 / 起批费)
// from `order.surcharges` by matching the SKU inside the surcharge's
// description string. and the frontend parses
// it out with /\[([^\]]+)\]/.
const getSurchargeForLine = (line) => {
  const surcharges = order.value?.surcharges || []
  if (!surcharges.length) return null
  const lineSku = line?.productVariant?.sku
  if (!lineSku) return null
  for (const s of surcharges) {
    if (!s.description) continue
    if (s.description.indexOf(`[${lineSku}]`) !== -1) return s
  }
  return null
}

// Convenience: just the numeric value (in cents) for the line's
// surcharge. Returns 0 if no surcharge applies to this line.
const getLineSurchargeValue = (line) => {
  const s = getSurchargeForLine(line)
  if (!s) return 0
  return Math.round(Number(s.priceWithTax) || 0)
}

// Convenience: the surcharge's description, with the "[SKU] ..."
// part stripped out for cleaner display.
const getLineSurchargeLabel = (line) => {
  const s = getSurchargeForLine(line)
  if (!s?.description) return ''
  // Take the part of the description before the first "[" — that's
  // the user-friendly label (e.g. "小额开机费 ", "起批量费 ").
  const m = s.description.match(/^(]^[（]+)/)
  return m ? m[1].trim() : s.description
}
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  // return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
}

// 🆕 File-type icon helper. Maps a filename to one of the
// SVG icons in `/public/file_icons/` (same set used by
// `PaginatedProductList.vue` for product-level techDocs).
// - Returns `null` for image files (JPG/PNG/etc.) so the
//   caller can fall back to the actual image preview.
// - Returns the matching SVG name for known types (PDF, DOC,
//   XLS, etc.).
// - Returns `'TXT.svg'` as the fallback for unknown types.
const getFileIcon = (filename) => {
  if (!filename) return null
  const ext = filename.toLowerCase().split('.').pop()

  const iconMap = {
    pdf: 'PDF.svg',
    doc: 'WORD.svg',
    docx: 'WORD.svg',
    txt: 'TXT.svg',
    xls: 'EXCEL.svg',
    xlsx: 'XLSX.svg',
    ppt: 'PPTX.svg',
    pptx: 'PPTX.svg',
    jpg: 'JPG.svg',
    jpeg: 'JPEG.svg',
    png: 'PNG.svg',
    zip: 'ZIP.svg',
    html: 'HTML.svg',
    mp4: 'MP4.svg'
  }

  // For image files, return null so the caller shows the
  // real preview (the SVG icon wouldn't be useful here).
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
  if (imageExts.includes(ext)) return null

  return iconMap[ext] || 'TXT.svg'
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
  // 🔑 samplePlate pre-fill: read each line's existing
  // `customFields.samplePlate` value (which is on the
  // OrderLine's JSON customFields blob) and use it as the
  // starting value for the modal's samplePlate input. Lines
  // that don't have the field set start at 0.
  const samplePlates = {}
  for (const line of order.value?.lines || []) {
    qty[line.id] = availableToFulfill(line)
    samplePlates[line.id] = Number(line?.customFields?.samplePlate) || 0
  }
  fulfillQuantities.value = qty
  fulfillSamplePlates.value = samplePlates
  // 🆕 Pre-fill the per-line PDFs from the order's existing
  // `customFields.orderLinePdfs` so the user can see what's
  // already attached, and replace it if needed.
  fulfillLinePdfs.value = buildLinePdfPrefill(order.value)
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
  fulfillSamplePlates.value = {}
  // 🆕 Reset per-line PDFs (releases blob URLs to prevent
  // memory leaks; resets state for next open).
  resetLinePdfs()
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

// 🔑 Persists `OrderLine.customFields.samplePlate` (样品板数)
// AND `OrderLine.customFields.orderLinePdfs` (per-line PDF).
// Vendure 3.6.3's stock admin API has NO `updateOrderLine` or
// `adjustOrderLine` mutation, and `OrderLineInput` (used by
// `modifyOrder` and `addFulfillmentToOrder`) does not accept
// `customFields`. So we call a custom backend mutation
// `updateOrderLineCustomFields` exposed by the
// `UpdateOrderLineCustomFieldsPlugin` (see
// `dist-del/update-order-line-custom-fields.plugin.ts`).
//
// The mutation signature is `updateOrderLineCustomFields(input: UpdateOrderLineCustomFieldsInput!)` —
// ONE flat input argument, NOT separate `id` / `samplePlate` /
// `orderLinePdfs` arguments on the field. The GraphQL error
//   "Unknown argument 'id' on field 'Mutation.updateOrderLineCustomFields'"
//   "Field 'updateOrderLineCustomFields' argument 'input' of type 'UpdateOrderLineCustomFieldsInput!' is required, but it was not provided"
// confirms this. We pass all the fields nested under `input`.
//
// The input type itself is FLAT — each custom field is a
// top-level field on the input, NOT nested in a `customFields`
// object. So we send:
//   { input: { id, samplePlate?, orderLinePdfs? } }
// with whichever fields actually need updating. The backend's
// `UpdateOrderLineCustomFieldsInput` should declare these
// fields as optional (nullable) so a request can update just
// one of them without re-sending the others.
//
// IMPORTANT: the custom plugin's resolver returns plain
// `OrderLine` (not `OrderLine | ErrorResult`). On failure it
// throws via @nestjs/graphql exceptions (ForbiddenError,
// EntityNotFoundException) which surface as HTTP 400 + a
// top-level `errors[]` array — they are NOT delivered as an
// `ErrorResult` inside the response data. So we must NOT
// spread `... on ErrorResult { ... }` here.
const UPDATE_ORDER_LINE_SAMPLE_PLATE = gql`
  mutation UpdateOrderLineSamplePlate($input: UpdateOrderLineCustomFieldsInput!) {
    updateOrderLineCustomFields(input: $input) {
      id
      customFields {
        samplePlate
        orderLinePdfs {
          id
          name
          preview
          source
          mimeType
        }
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

    // 🔑 Persist samplePlate (样品板数) and orderLinePdfs
    // (per-line PDF) BEFORE creating the fulfillment. This way
    // the Fulfillment's lines already reference the updated
    // OrderLine when the request lands.
    //
    // The list is built from the per-line `fulfillSamplePlates`
    // and `fulfillLinePdfs` state. A line is included if EITHER:
    //   - samplePlate > 0 (the user entered a new value), OR
    //   - fulfillLinePdfs[lineId] is set (the user uploaded a PDF)
    // The actual mutation in the loop decides which fields to
    // send (only changed fields), so re-sending the same
    // samplePlate as currently in the DB is harmless — but
    // skipping unchanged lines is faster.
    const samplePlateUpdates = (order.value?.lines || [])
      .map(line => {
        const newSamplePlate = Number(fulfillSamplePlates.value[line.id] || 0)
        const newPdfId = fulfillLinePdfs.value[line.id]?.id || null
        return {
          orderLineId: line.id,
          samplePlate: newSamplePlate,
          orderLinePdfs: newPdfId
        }
      })
      .filter(u => u.samplePlate > 0 || u.orderLinePdfs)

    if (samplePlateUpdates.length > 0) {
      // 🔍 DEBUG: full picture of what's about to be sent
      console.group('[OrderDetail] Pushing samplePlate/PDF updates')
      console.log('  Updates to send (', samplePlateUpdates.length, '):')
      samplePlateUpdates.forEach((u, i) => {
        console.log(`    [${i}] lineId=${u.orderLineId} samplePlate=${u.samplePlate} orderLinePdfs=${u.orderLinePdfs}`)
      })
      console.log('  State refs at this moment:')
      console.log('    fulfillSamplePlates =', JSON.parse(JSON.stringify(fulfillSamplePlates.value)))
      console.log('    fulfillLinePdfs (only IDs):')
      Object.entries(fulfillLinePdfs.value).forEach(([lineId, asset]) => {
        console.log(`      lineId=${lineId} assetId=${asset?.id} name=${asset?.name} preview=${!!asset?.preview}`)
      })
      console.groupEnd()

      // Sequential to keep error attribution clean (if one
      // fails, the others can still succeed). Could be parallel
      // with Promise.all, but failures get harder to report.
      for (const upd of samplePlateUpdates) {
        // Build the input object conditionally — only include
        // fields that actually have a value, so the backend's
        // optional `Int` / `ID` types accept the request. If
        // a line has neither a new samplePlate nor a new PDF,
        // skip the mutation entirely (saves a network call).
        const newSamplePlate = Number(fulfillSamplePlates.value[upd.orderLineId] || 0)
        const newPdfId = fulfillLinePdfs.value[upd.orderLineId]?.id || null

        // The input is FLAT (not nested under `customFields`).
        // The mutation's argument signature is
        // `updateOrderLineCustomFields(input: UpdateOrderLineCustomFieldsInput!)`,
        // so we wrap everything under `input` and pass the
        // whole object as a single variable.
        const input = { id: upd.orderLineId }
        if (newSamplePlate > 0) input.samplePlate = newSamplePlate
        if (newPdfId) input.orderLinePdfs = newPdfId

        // Skip if nothing to update (defensive — should be
        // filtered by the build above, but just in case)
        if (Object.keys(input).length === 1) {
          console.log(`[OrderDetail] skip line ${upd.orderLineId}: nothing to update`)
          continue
        }

        // 🔍 DEBUG: per-line request
        console.group(`[OrderDetail] → updateOrderLineCustomFields for line ${upd.orderLineId}`)
        console.log('  variables.input =', JSON.parse(JSON.stringify(input)))
        console.log('  has samplePlate?', 'samplePlate' in input, '(value =', input.samplePlate, ')')
        console.log('  has orderLinePdfs?', 'orderLinePdfs' in input, '(value =', input.orderLinePdfs, ')')

        const { data: updateData, errors: updateErrors } = await apolloClient.mutate({
          mutation: UPDATE_ORDER_LINE_SAMPLE_PLATE,
          variables: { input }
        })

        // 🔍 DEBUG: per-line response
        console.log('  response.data =', JSON.parse(JSON.stringify(updateData)))
        console.log('  response.errors =', updateErrors)
        if (updateData?.updateOrderLineCustomFields) {
          const cf = updateData.updateOrderLineCustomFields.customFields
          console.log('  customFields returned by server:')
          console.log('    samplePlate =', cf?.samplePlate)
          console.log('    orderLinePdfs =', cf?.orderLinePdfs)
        }
        console.groupEnd()

        // The custom plugin throws exceptions on failure
        // (ForbiddenError, EntityNotFoundException), which
        // Apollo surfaces in `updateErrors` (a top-level
        // `errors[]` array, NOT as an ErrorResult in the data).
        // Success path: `data.updateOrderLineCustomFields` is
        // a plain OrderLine.
        if (updateErrors && updateErrors.length > 0) {
          const errMsg = updateErrors[0]?.message || 'unknown error'
          console.warn(
            `[OrderDetail] samplePlate/PDF update failed for line ${upd.orderLineId}:`,
            updateErrors[0]
          )
          fulfillError.value = `Failed to save samplePlate/PDF for one line: ${errMsg}`
          // Continue with the fulfillment creation regardless
        } else if (updateData?.updateOrderLineCustomFields?.customFields) {
          // The Apollo response is deeply frozen by Vue 3's
          // reactivity system — see the long comment in the
          // previous turn about why we can't do in-place
          // mutations. We just log the result and rely on the
          // `fetchOrder()` at the end of `submitFulfillment`
          // to refresh the data from the DB.
          console.log(
            `[OrderDetail] samplePlate/PDF updated for line ${upd.orderLineId}:`,
            updateData.updateOrderLineCustomFields
          )
        }
      }
    } else {
      console.log('[OrderDetail] no samplePlate/PDF updates to send (all lines have 0 samplePlate and no PDF)')
    }

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

      if (newFulfillmentId && (uploadedDoc.value || uploadedPdfDoc.value)) {
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

// Sums the `OrderLine.customFields.samplePlate` for every line
// in a fulfillment. Returns 0 when no line has a value (e.g. no
// sample plates were recorded, or the customField is missing
// on the response). Used by the Fulfilled items header badge
// (Option A) so the user can see the total at a glance without
// expanding the section.
//
// Same defensive `?.` chain as `getLineSurchargeValue` — the
// Apollo response is frozen, so we must read defensively at
// every level. `Number(...) || 0` coerces null/undefined/
// empty string to 0, so the badge only shows for actual
// non-zero totals.
const totalSamplePlates = (f) => {
  if (!f.lines || f.lines.length === 0) return 0
  return f.lines.reduce((sum, l) => {
    const v = l.orderLine?.customFields?.samplePlate
    return sum + (Number(v) || 0)
  }, 0)
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
