import { computed, ref } from "vue";
import { listEntries } from "../services/appwrite.js";

export const useDashboardData = ({
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
}) => {
  const entries = ref([]);
  const yearEntries = ref([]);
  const today = new Date();

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
      await loadUser();
      if (!userId.value) {
        entries.value = [];
        return;
      }
      await loadCategories(userId.value);
      const result = await listEntries(selectedMonth.value, userId.value);
      entries.value = result.documents.filter(matchesSelectedYear);
    } catch {
      entries.value = [];
    }
  };

  const loadYearEntries = async () => {
    try {
      await loadUser();
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

  const remainingToPay = computed(() => {
    if (entries.value.length === 0) return null;
    const currentMonthName = months[today.getMonth()];
    const todayDay = today.getDate();
    return entries.value
      .filter((entry) => entry.type === "expense")
      .filter((entry) => Number.isFinite(entry.dueDay))
      .filter((entry) =>
        selectedMonth.value === currentMonthName ? entry.dueDay > todayDay : true
      )
      .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  });

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

  return {
    entries,
    yearEntries,
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
  };
};
