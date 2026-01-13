<template>
  <DashboardLayout
    eyebrow="Budget"
    title="Overview"
    subtitle="Latest status for your budget. Everything in one place."
  >
    <template #actions>
      <p class="today-text">Today · {{ todayLabel }}</p>
      <MonthTabs
        :years="years"
        :selected-year="selectedYear"
        :visible-months="visibleMonths"
        :selected-month="selectedMonth"
        :show-all="showAllMonths"
        @update:selected-year="selectedYear = $event"
        @update:selected-month="selectedMonth = $event"
        @toggle-show-all="showAllMonths = !showAllMonths"
      />
    </template>

    <div class="stats stats--wide">
      <div class="stat-card">
        <p class="stat-label">Income</p>
        <p class="stat-value">{{ formatCurrency(incomeTotal) }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Expenses</p>
        <p class="stat-value">{{ formatCurrency(expenseTotal) }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Balance</p>
        <p class="stat-value">{{ formatCurrency(balanceTotal) }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Remaining to pay</p>
        <p class="stat-value">{{ formatCurrency(remainingToPay) }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Amount to save</p>
        <p class="stat-value">{{ formatCurrency(recommendedSaving) }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Balance after saving</p>
        <p class="stat-value">{{ formatCurrency(balanceAfterSaving) }}</p>
      </div>
    </div>

    <!-- <div class="summary">
      <div class="stat-card stat-card--summary">
        <p class="stat-label">Recommended saving</p>
        <p class="stat-value">{{ formatCurrency(recommendedSaving) }}</p>
      </div>
    </div> -->

    <div class="chart chart--ruled">
      <div class="chart__header">
        <p class="stat-label">
          Expenses · {{ selectedMonth }} · {{ selectedYear }} by category
        </p>
        <div></div>
      </div>
      <div v-if="expenseByCategory.length === 0" class="empty-state">
        <p>No expenses for this month.</p>
      </div>
      <div v-else class="chart__rows">
        <div
          v-for="row in expenseByCategory"
          :key="row.id"
          class="chart__row"
        >
          <div class="chart__label">
            <span
              class="category-dot"
              :style="{ background: row.color }"
            />
            <span>{{ row.name }}</span>
          </div>
          <div class="chart__bar">
            <span
              class="chart__fill"
              :style="{
                width: `${(row.amount / maxCategoryAmount) * 100}%`,
                background: row.color,
              }"
            />
          </div>
          <span class="chart__value">{{ formatCurrency(row.amount) }}</span>
        </div>
      </div>
    </div>

    <div class="chart">
      <div class="chart__header">
        <p class="stat-label">Monthly totals · {{ selectedYear }}</p>
        <div class="chart-toggle">
          <button
            type="button"
            class="month-tab chart-toggle__button"
            :class="{ 'month-tab--active': chartMode === 'income' }"
            @click="chartMode = 'income'"
          >
            Income
          </button>
          <button
            type="button"
            class="month-tab chart-toggle__button"
            :class="{ 'month-tab--active': chartMode === 'expense' }"
            @click="chartMode = 'expense'"
          >
            Expenses
          </button>
        </div>
      </div>
      <div v-if="yearlyTotals.length === 0" class="empty-state">
        <p>No entries for {{ selectedYear }}.</p>
      </div>
      <div v-else class="chart__rows">
        <div
          v-for="row in yearlyTotals"
          :key="row.month"
          class="chart__row"
        >
          <div class="chart__label">
            <span>{{ row.month }}</span>
          </div>
          <div class="chart__bar">
            <span
              class="chart__fill"
              :style="{
                width: `${(row.amount / maxYearAmount) * 100}%`,
                background: chartMode === 'income' ? '#2c6e63' : '#b24a3b',
              }"
            />
          </div>
          <span class="chart__value">{{ formatCurrency(row.amount) }}</span>
        </div>
      </div>
    </div>

    <!-- <div class="activity panel__section">
      <p class="activity__title">Recent activity</p>
      <ul>
        <li>Groceries · kr 520</li>
        <li>Transport · kr 160</li>
        <li>Savings · kr 1 500</li>
        <li>Subscription · kr 99</li>
      </ul>
    </div> -->
  </DashboardLayout>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import DashboardLayout from "../components/DashboardLayout.vue";
import MonthTabs from "../components/MonthTabs.vue";
import { useDashboardData } from "../composables/useDashboardData.js";
import { useCategories } from "../composables/useCategories.js";
import { useMonths } from "../composables/useMonths.js";
import { usePreferences } from "../composables/usePreferences.js";
import { useUser } from "../composables/useUser.js";

const { months, currentYear, selectedMonth, selectedYear, showAllMonths, years, visibleMonths } =
  useMonths();
const { userId, loadUser } = useUser();
const { loadCategories, categoryNameById, categoryColorById } = useCategories();
const { formatCurrency, loadPreferences, savingsRate } = usePreferences();

const chartMode = ref("income");
const {
  loadEntries,
  loadYearEntries,
  incomeTotal,
  expenseTotal,
  balanceTotal,
  remainingToPay,
  expenseByCategory,
  maxCategoryAmount,
  yearlyTotals,
  maxYearAmount,
} = useDashboardData({
  months,
  currentYear,
  selectedMonth,
  selectedYear,
  chartMode,
  userId,
  loadUser,
  loadCategories,
  categoryNameById,
  categoryColorById,
});

const recommendedSaving = computed(() => {
  if (balanceTotal.value === null) return null;
  if (balanceTotal.value <= 0) return 0;
  return (balanceTotal.value * savingsRate.value) / 100;
});

const balanceAfterSaving = computed(() => {
  if (balanceTotal.value === null) return null;
  return (balanceTotal.value ?? 0) - (recommendedSaving.value ?? 0);
});

watch([selectedMonth, selectedYear], loadEntries, { immediate: true });
watch(selectedYear, loadYearEntries, { immediate: true });
loadPreferences();

const todayLabel = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
}).format(new Date());
</script>

<style scoped>
.today-text {
  margin: 0;
  font-size: var(--font-sm);
  color: #7a6f63;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.stats {
  display: grid;
  gap: 16px;
  margin-bottom: 20px;
}

.stats--wide {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.summary {
  margin-bottom: 20px;
}

.stat-card--summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chart {
  display: grid;
  gap: 12px;
  margin-bottom: 20px;
}

.chart--ruled {
  padding: 18px 0;
  border-top: 1px solid rgba(24, 19, 10, 0.12);
  border-bottom: 1px solid rgba(24, 19, 10, 0.12);
  margin: 18px 0 24px;
}

.chart__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chart-toggle {
  display: inline-flex;
  gap: 8px;
}

.chart__rows {
  display: grid;
  gap: 10px;
}

.chart__row {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(120px, 2fr) 120px;
  align-items: center;
  gap: 12px;
}

.chart__label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #4f473e;
  font-size: var(--font-sm);
}

.chart__bar {
  height: 10px;
  background: rgba(24, 19, 10, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.chart__fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  opacity: 0.45;
}

.chart__value {
  font-size: var(--font-sm);
  color: #4f473e;
  text-align: right;
}

.stat-card {
  padding: 16px;
  border-radius: var(--radius-card);
  background: #fbfaf7;
  border: 1px solid rgba(24, 19, 10, 0.08);
}

.stat-label {
  margin: 0 0 6px;
  font-size: var(--font-sm);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #7a6f63;
}

.stat-value {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.panel__section {
  padding-top: 12px;
}

.activity {
  margin-bottom: 20px;
}

.activity__title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: #4f473e;
}

.activity ul {
  margin: 0;
  padding-left: 18px;
  color: #5f564c;
}

.activity li + li {
  margin-top: 6px;
}

@media (max-width: 768px) {
  .chart__row {
    grid-template-columns: 1fr;
    gap: 8px;
    align-items: start;
  }

  .chart__bar {
    width: 100%;
  }

  .chart__value {
    text-align: left;
  }

  .chart-toggle {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}
</style>
