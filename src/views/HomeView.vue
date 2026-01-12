<template>
  <DashboardLayout
    eyebrow="Budget"
    title="Overview"
    subtitle="Latest status for your budget. Everything in one place."
  >
    <template #actions>
      <p class="today-text">Today · {{ todayLabel }}</p>
      <div class="month-tabs">
        <div class="month-tabs__row">
          <span class="month-tabs__label">Year</span>
          <select v-model.number="selectedYear" class="month-tabs__select">
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
              @click="selectedMonth = month"
            >
              {{ month }}
            </button>
            <button
              type="button"
              class="month-tab month-tab--more"
              @click="showAllMonths = !showAllMonths"
            >
              {{ showAllMonths ? "Less" : "More" }}
            </button>
          </div>
        </div>
      </div>
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
import {
  getCurrentUser,
  listCategories,
  listEntries,
} from "../services/appwrite.js";
import {
  formatCurrency,
  loadPreferences,
  savingsRate,
} from "../services/currency.js";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const currentYear = new Date().getFullYear();
const selectedMonth = ref(months[new Date().getMonth()]);
const selectedYear = ref(currentYear);
const showAllMonths = ref(false);
const chartMode = ref("income");
const entries = ref([]);
const yearEntries = ref([]);
const userId = ref(null);
const categories = ref([]);
const today = new Date();
const years = computed(() => {
  const start = currentYear - 3;
  const end = currentYear + 3;
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
});

const visibleMonths = computed(() => {
  if (showAllMonths.value) return months;
  const currentIndex = new Date().getMonth();
  const upcoming = [];
  for (let i = 0; i < 4; i += 1) {
    const index = (currentIndex + i) % 12;
    upcoming.push(months[index]);
  }
  return upcoming;
});

const incomeTotal = computed(() => {
  if (entries.value.length === 0) return null;
  return entries.value
    .filter((entry) => entry.type === "income")
    .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
});

const expenseTotal = computed(() => {
  if (entries.value.length === 0) return null;
  return entries.value
    .filter((entry) => entry.type === "expense")
    .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
});

const balanceTotal = computed(() => {
  if (entries.value.length === 0) return null;
  return (incomeTotal.value ?? 0) - (expenseTotal.value ?? 0);
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

const remainingToPay = computed(() => {
  if (entries.value.length === 0) return null;
  const currentMonthName = months[today.getMonth()];
  const todayDay = today.getDate();
  const total = entries.value
    .filter((entry) => entry.type === "expense")
    .filter((entry) => Number.isFinite(entry.dueDay))
    .filter((entry) =>
      selectedMonth.value === currentMonthName ? entry.dueDay > todayDay : true
    )
    .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  return total;
});

const normalizeYear = (value) => {
  if (Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const matchesSelectedYear = (entry) => {
  const entryYear = normalizeYear(entry.year);
  if (Number.isFinite(entryYear)) return entryYear === selectedYear.value;
  return selectedYear.value === currentYear;
};

const loadEntries = async () => {
  try {
    const user = await getCurrentUser();
    userId.value = user?.$id ?? null;
    if (!userId.value) {
      entries.value = [];
      return;
    }
    const categoryResult = await listCategories(userId.value);
    categories.value = categoryResult.documents;
    const result = await listEntries(selectedMonth.value, userId.value);
    entries.value = result.documents.filter(matchesSelectedYear);
  } catch {
    entries.value = [];
  }
};

const loadYearEntries = async () => {
  try {
    const user = await getCurrentUser();
    userId.value = user?.$id ?? null;
    if (!userId.value) {
      yearEntries.value = [];
      return;
    }
    const results = await Promise.all(
      months.map((month) => listEntries(month, userId.value))
    );
    yearEntries.value = results
      .flatMap((result) => result.documents)
      .filter(matchesSelectedYear);
  } catch {
    yearEntries.value = [];
  }
};

watch([selectedMonth, selectedYear], loadEntries, { immediate: true });
watch(selectedYear, loadYearEntries, { immediate: true });
loadPreferences();

const categoryNameById = computed(() =>
  Object.fromEntries(categories.value.map((category) => [category.$id, category.name]))
);

const categoryColorById = computed(() =>
  Object.fromEntries(
    categories.value.map((category) => [category.$id, category.color])
  )
);

const expenseByCategory = computed(() => {
  const totals = {};
  entries.value.forEach((entry) => {
    if (entry.type !== "expense") return;
    const key = entry.categoryId || "uncategorized";
    const amount = Number(entry.amount) || 0;
    totals[key] = (totals[key] || 0) + amount;
  });
  const rows = Object.entries(totals).map(([id, amount]) => ({
    id,
    name: id === "uncategorized" ? "Uncategorized" : categoryNameById.value[id],
    color: categoryColorById.value[id] || "#7a6f63",
    amount,
  }));
  rows.sort((a, b) => b.amount - a.amount);
  return rows;
});

const maxCategoryAmount = computed(() =>
  Math.max(0, ...expenseByCategory.value.map((row) => row.amount))
);

const yearlyTotals = computed(() => {
  if (yearEntries.value.length === 0) return [];
  const totals = months.map((month) => {
    const amount = yearEntries.value
      .filter((entry) => entry.month === month)
      .filter((entry) => entry.type === chartMode.value)
      .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
    return { month, amount };
  });
  const hasValues = totals.some((row) => row.amount > 0);
  return hasValues ? totals : [];
});

const maxYearAmount = computed(() =>
  Math.max(0, ...yearlyTotals.value.map((row) => row.amount))
);

const todayLabel = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
}).format(new Date());
</script>
