<template>
  <div class="bg-dark-200 p-4 rounded-md border border-dark-100">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-white">RAL Color Cards</h2>
      <div class="flex items-center gap-3">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by No. / Name / Hex / RGB..."
          class="px-3 py-2 bg-dark-300 text-white rounded-md border border-dark-100 text-sm w-72 focus:outline-none focus:border-blue-500"
        />
        <span class="text-gray-400 text-sm">{{ filteredColors.length }} / {{ colors.length }}</span>
      </div>
    </div>

    <div v-if="loading" class="text-gray-400 text-center py-8">Loading...</div>
    <div v-else-if="error" class="text-red-400 text-center py-8">{{ error }}</div>
    <div v-else-if="filteredColors.length === 0" class="text-gray-500 text-center py-8 italic">
      No colors match "{{ searchQuery }}"
    </div>
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      <div
        v-for="c in filteredColors"
        :key="c.id"
        class="bg-dark-300 rounded-md border border-dark-100 overflow-hidden hover:border-blue-500 transition-colors"
      >
        <div
          class="h-24 w-full flex items-end p-2"
          :style="{ backgroundColor: c.hex }"
        >
          <span
            class="font-mono text-xs px-1.5 py-0.5 rounded"
            :class="textColorClass(c.hex)"
          >
            {{ c.hex }}
          </span>
        </div>
        <div class="p-3 space-y-1">
          <p class="text-white font-semibold text-sm truncate" :title="c.colorName">
            {{ c.colorName }}
          </p>
          <p class="text-blue-300 font-mono text-xs">RAL {{ c.colorNo }}</p>
          <p class="text-gray-400 text-xs font-mono">RGB {{ c.rgb }}</p>
          <div class="flex items-center gap-1.5 pt-1">
            <span
              v-if="c.hasRecipe"
              class="text-[10px] px-1.5 py-0.5 rounded bg-green-700/40 text-green-300"
            >
              Recipe
            </span>
            <span
              class="text-[10px] px-1.5 py-0.5 rounded bg-blue-700/40 text-blue-300"
            >
              {{ c.brandName }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const colors = ref([])
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')

// Parse "R G B" string from the data file
const rgbString = (rgb) => {
  if (!rgb) return null
  return rgb
}

const textColorClass = (hex) => {
  if (!hex) return 'text-white'
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  // Use perceived luminance to pick contrasting text color
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? 'text-gray-900 bg-white/70' : 'text-white bg-black/40'
}

const filteredColors = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return colors.value
  return colors.value.filter(c => {
    return (
      (c.colorNo || '').toLowerCase().includes(q) ||
      (c.colorName || '').toLowerCase().includes(q) ||
      (c.hex || '').toLowerCase().includes(q) ||
      (c.rgb || '').toLowerCase().includes(q)
    )
  })
})

onMounted(async () => {
  try {
    const res = await fetch('/ral_colors.txt')
    if (!res.ok) throw new Error(`Failed to load ral_colors.txt: ${res.status}`)
    const data = await res.json()
    colors.value = data
  } catch (e) {
    error.value = e.message || 'Failed to load colors'
  } finally {
    loading.value = false
  }
})
</script>
