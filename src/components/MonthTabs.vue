<template>
  <div class="month-tabs">
    <div class="month-tabs__row">
      <span class="month-tabs__label">Year</span>
      <select
        class="month-tabs__select"
        :value="selectedYear"
        @change="onYearChange"
      >
        <option v-for="year in years" :key="year" :value="year">
          {{ year }}
        </option>
      </select>
    </div>
    <div class="month-tabs__row">
      <span class="month-tabs__label">Month</span>
      <div class="month-tabs__buttons">
        <button
          v-for="month in visibleMonths"
          :key="month"
          type="button"
          class="month-tab"
          :class="{ 'month-tab--active': selectedMonth === month }"
          @click="emit('update:selected-month', month)"
        >
          {{ month }}
        </button>
        <button
          type="button"
          class="month-tab month-tab--more"
          @click="emit('toggle-show-all')"
        >
          {{ showAll ? "Less" : "More" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  years: { type: Array, required: true },
  selectedYear: { type: Number, required: true },
  visibleMonths: { type: Array, required: true },
  selectedMonth: { type: String, required: true },
  showAll: { type: Boolean, default: false },
});

const emit = defineEmits([
  "update:selected-year",
  "update:selected-month",
  "toggle-show-all",
]);

const onYearChange = (event) => {
  const value = Number(event.target.value);
  emit("update:selected-year", value);
};
</script>

<style scoped>
.month-tabs {
  display: grid;
  gap: 10px;
}

.month-tabs__row {
  display: grid;
  gap: 8px;
}

.month-tabs__label {
  font-size: var(--font-xs);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #7a6f63;
  font-weight: 600;
}

.month-tabs__select {
  border: 1px solid rgba(24, 19, 10, 0.18);
  background: #ffffff;
  color: #4f473e;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
  font-weight: 600;
  font-family: inherit;
}

.month-tabs__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
