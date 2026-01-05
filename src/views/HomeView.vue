<template>
  <DashboardLayout
    eyebrow="Budget"
    title="Overview"
    subtitle="Latest status for your budget. Everything in one place."
  >
    <template #actions>
      <p class="today-text">Today · {{ todayLabel }}</p>
      <div class="month-tabs">
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

    <div class="chart">
      <div class="chart__header">
        <p class="stat-label">Expenses by category</p>
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

const selectedMonth = ref(months[new Date().getMonth()]);
const showAllMonths = ref(false);
const entries = ref([]);
const userId = ref(null);
const categories = ref([]);
const today = new Date();

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
    entries.value = result.documents;
  } catch {
    entries.value = [];
  }
};

watch(selectedMonth, loadEntries, { immediate: true });
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

const todayLabel = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
}).format(new Date());
</script>
