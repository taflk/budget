<template>
  <div v-if="categories.length" class="category-legend">
    <template v-for="category in categories" :key="category.$id">
      <button
        v-if="selectable"
        type="button"
        class="category-pill category-pill--button"
        :class="{ 'category-pill--active': isSelected(category.$id) }"
        @click="emit('toggle', category.$id)"
      >
        <span class="category-dot" :style="{ background: category.color }" />
        {{ category.name }}
      </button>
      <span v-else class="category-pill">
        <span class="category-dot" :style="{ background: category.color }" />
        {{ category.name }}
      </span>
    </template>
    <button
      v-if="selectable && selected.length"
      type="button"
      class="category-pill category-pill--clear"
      @click="emit('clear')"
    >
      Clear
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  categories: { type: Array, default: () => [] },
  selected: { type: Array, default: () => [] },
  selectable: { type: Boolean, default: false },
});

const emit = defineEmits(["toggle", "clear"]);

const isSelected = (categoryId) => props.selected.includes(categoryId);
</script>

<style scoped>
.category-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  color: #5f564c;
  font-size: var(--font-sm);
}

.category-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.category-pill--button {
  border: 1px solid rgba(24, 19, 10, 0.12);
  background: #ffffff;
  color: #4f473e;
  padding: 6px 10px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  font: inherit;
}

.category-pill--active {
  border-color: #2c6e63;
  color: #2c6e63;
  box-shadow: 0 0 0 2px rgba(44, 110, 99, 0.15);
}

.category-pill--clear {
  border: 1px dashed rgba(24, 19, 10, 0.2);
  background: transparent;
  color: #7a6f63;
  border-radius: var(--radius-pill);
  cursor: pointer;
}

.category-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}
</style>
