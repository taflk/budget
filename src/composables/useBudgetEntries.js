import { computed, ref } from "vue";
import {
  createEntry,
  deleteEntry,
  listEntries,
  updateEntry,
} from "../services/appwrite.js";

export const useBudgetEntries = ({
  months,
  currentYear,
  selectedMonth,
  selectedYear,
  userId,
  loadUser,
  categories,
  loadCategories,
  categoryNameById,
  categoryColorById,
}) => {
  const entries = ref([]);
  const isLoading = ref(false);
  const errorMessage = ref("");
  const selectedCategoryFilters = ref([]);
  const hasMigratedYears = ref(false);
  const isMigratingYears = ref(false);

  const incomeCategoryId = computed(() => {
    const found = categories.value.find(
      (category) => category.name.toLowerCase() === "income"
    );
    return found?.$id ?? "";
  });

  const uncategorizedId = computed(() => {
    const found = categories.value.find(
      (category) => category.name.toLowerCase() === "uncategorized"
    );
    return found?.$id ?? "";
  });

  const matchesSelectedYear = (entry) =>
    (entry.year ?? currentYear) === selectedYear.value;

  const migrateMissingYears = async () => {
    if (hasMigratedYears.value || isMigratingYears.value) return;
    isMigratingYears.value = true;
    try {
      await loadUser();
      if (!userId.value) return;
      await loadCategories(userId.value);
      const uncategorized = categories.value.find(
        (category) => category.name.toLowerCase() === "uncategorized"
      );
      const income = categories.value.find(
        (category) => category.name.toLowerCase() === "income"
      );
      const uncategorizedIdLocal = uncategorized?.$id ?? "";
      const incomeIdLocal = income?.$id ?? "";
      const updates = [];
      for (const month of months) {
        const result = await listEntries(month, userId.value);
        for (const entry of result.documents) {
          if (entry.year) continue;
          const createdAt = entry.$createdAt || entry.createdAt;
          const year = createdAt ? new Date(createdAt).getFullYear() : null;
          if (!Number.isFinite(year)) continue;
          const fallbackCategoryId =
            entry.type === "income"
              ? incomeIdLocal || uncategorizedIdLocal
              : uncategorizedIdLocal || incomeIdLocal;
          const categoryId = entry.categoryId || fallbackCategoryId;
          if (!categoryId) continue;
          updates.push(updateEntry(entry.$id, { year, categoryId }));
        }
      }
      if (updates.length) {
        await Promise.all(updates);
      }
      hasMigratedYears.value = true;
    } catch (error) {
      errorMessage.value =
        error?.message || "Could not migrate entries to include year.";
    } finally {
      isMigratingYears.value = false;
    }
  };

  const loadEntries = async () => {
    errorMessage.value = "";
    isLoading.value = true;
    try {
      await migrateMissingYears();
      await loadUser();
      if (!userId.value) {
        entries.value = [];
        return;
      }
      await loadCategories(userId.value);
      const result = await listEntries(selectedMonth.value, userId.value);
      entries.value = result.documents.filter(matchesSelectedYear);
    } catch (error) {
      errorMessage.value = error?.message || "Could not load entries.";
    } finally {
      isLoading.value = false;
    }
  };

  const saveEntry = async ({ payload, editingId }) => {
    errorMessage.value = "";
    await loadUser();
    if (!userId.value) return false;
    try {
      if (editingId) {
        const updated = await updateEntry(editingId, payload);
        entries.value = entries.value.map((item) =>
          item.$id === updated.$id ? updated : item
        );
      } else {
        const created = await createEntry(payload, userId.value);
        entries.value.unshift(created);
      }
      return true;
    } catch (error) {
      errorMessage.value = error?.message || "Could not save entry.";
      return false;
    }
  };

  const deleteEntryById = async (documentId) => {
    if (!documentId) return false;
    try {
      await deleteEntry(documentId);
      entries.value = entries.value.filter((item) => item.$id !== documentId);
      return true;
    } catch (error) {
      errorMessage.value = error?.message || "Could not delete entry.";
      return false;
    }
  };

  const copyMonth = async (sourceMonth) => {
    if (!sourceMonth) return false;
    errorMessage.value = "";
    try {
      await loadUser();
      if (!userId.value) return false;
      const source = await listEntries(sourceMonth, userId.value);
      const tasks = source.documents
        .filter(matchesSelectedYear)
        .map((entry) =>
          createEntry(
            {
              name: entry.name,
              amount: entry.amount,
              type: entry.type,
              month: selectedMonth.value,
              year: selectedYear.value,
              userId: userId.value,
              dueDay: entry.dueDay ?? null,
              categoryId: entry.categoryId ?? uncategorizedId.value,
            },
            userId.value
          )
        );
      await Promise.all(tasks);
      await loadEntries();
      return true;
    } catch (error) {
      errorMessage.value = error?.message || "Could not copy month.";
      return false;
    }
  };

  const clearMonth = async () => {
    errorMessage.value = "";
    try {
      await loadUser();
      if (!userId.value) return false;
      const result = await listEntries(selectedMonth.value, userId.value);
      const tasks = result.documents
        .filter(matchesSelectedYear)
        .map((entry) => deleteEntry(entry.$id));
      await Promise.all(tasks);
      await loadEntries();
      return true;
    } catch (error) {
      errorMessage.value = error?.message || "Could not clear month.";
      return false;
    }
  };

  const filteredEntries = computed(() => {
    if (!selectedCategoryFilters.value.length) return entries.value;
    return entries.value.filter((entry) =>
      selectedCategoryFilters.value.includes(entry.categoryId)
    );
  });

  const incomeTotal = computed(() =>
    entries.value
      .filter((entry) => entry.type === "income")
      .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0)
  );

  const expenseTotal = computed(() =>
    entries.value
      .filter((entry) => entry.type === "expense")
      .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0)
  );

  const balanceTotal = computed(
    () => (incomeTotal.value ?? 0) - (expenseTotal.value ?? 0)
  );

  const filteredTotal = computed(() =>
    filteredEntries.value.reduce((sum, entry) => {
      const amount = Number(entry.amount) || 0;
      return entry.type === "expense" ? sum - amount : sum + amount;
    }, 0)
  );

  const entryCardStyle = (entry) => {
    if (entry.type === "income") {
      return { background: "#2c6e631f" };
    }
    const name = categoryNameById.value[entry.categoryId];
    if (!entry.categoryId || name?.toLowerCase() === "uncategorized") {
      return null;
    }
    return { background: `${categoryColorById.value[entry.categoryId]}1f` };
  };

  const sortedEntries = computed(() => {
    const priority = { income: 0, expense: 1 };
    const nameById = Object.fromEntries(
      categories.value.map((category) => [category.$id, category.name])
    );
    return [...filteredEntries.value].sort((a, b) => {
      const typeDiff = (priority[a.type] ?? 2) - (priority[b.type] ?? 2);
      if (typeDiff !== 0) return typeDiff;
      const aCategory = nameById[a.categoryId] || "Uncategorized";
      const bCategory = nameById[b.categoryId] || "Uncategorized";
      const categoryDiff = aCategory.localeCompare(bCategory);
      if (categoryDiff !== 0) return categoryDiff;
      return a.name.localeCompare(b.name);
    });
  });

  const toggleCategoryFilter = (categoryId) => {
    const next = new Set(selectedCategoryFilters.value);
    if (next.has(categoryId)) {
      next.delete(categoryId);
    } else {
      next.add(categoryId);
    }
    selectedCategoryFilters.value = [...next];
  };

  const clearCategoryFilters = () => {
    selectedCategoryFilters.value = [];
  };

  return {
    entries,
    isLoading,
    errorMessage,
    selectedCategoryFilters,
    incomeCategoryId,
    uncategorizedId,
    loadEntries,
    saveEntry,
    deleteEntryById,
    copyMonth,
    clearMonth,
    filteredEntries,
    sortedEntries,
    incomeTotal,
    expenseTotal,
    balanceTotal,
    filteredTotal,
    entryCardStyle,
    toggleCategoryFilter,
    clearCategoryFilters,
  };
};
