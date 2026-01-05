<template>
  <DashboardLayout
    eyebrow="Budget"
    title="Budget"
    subtitle="Plan your yearly budget."
  >
    <template #actions>
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
      <div class="action-row action-row--spread action-row--ruled">
        <div class="action-row">
          <BaseButton
            variant="primary"
            type="button"
            class="button--small"
            @click="openNewEntry"
          >
            New entry
          </BaseButton>
          <BaseButton
            variant="ghost"
            type="button"
            class="button--small"
            @click="openCopyMonth"
          >
            Copy month
          </BaseButton>
          <BaseButton
            variant="ghost"
            type="button"
            class="button--small"
            @click="openClearMonth"
          >
            Clear month
          </BaseButton>
        </div>
        <div class="summary-inline">
          Income {{ formatCurrency(incomeTotal) }} · Expenses
          {{ formatCurrency(expenseTotal) }} · Balance
          {{ formatCurrency(balanceTotal) }}
        </div>
      </div>
      <div v-if="categories.length" class="category-legend">
        <span
          v-for="category in categories"
          :key="category.$id"
          class="category-pill"
        >
          <span
            class="category-dot"
            :style="{ background: category.color }"
          />
          {{ category.name }}
        </span>
      </div>
    </template>
    <p v-if="errorMessage" class="form__error">{{ errorMessage }}</p>
    <p v-if="isLoading" class="loading-text">Loading...</p>
    <div v-if="entries.length === 0" class="empty-state">
      <p>No entries for {{ selectedMonth }}.</p>
    </div>
    <div v-else class="entry-list">
      <div
        v-for="entry in sortedEntries"
        :key="entry.$id"
        class="entry-card"
        :style="entryCardStyle(entry)"
      >
        <div>
          <p class="entry-title">{{ entry.name }}</p>
          <p class="entry-meta">
            {{ entry.type === "income" ? "Income" : "Expense" }} ·
            {{ entry.month }}
            <span v-if="entry.categoryId">
              ·
              {{ categoryNameById[entry.categoryId] || "Uncategorized" }}
            </span>
          </p>
        </div>
        <div class="entry-actions">
          <p class="entry-amount">
            {{ formatCurrency(entry.amount) }}
          </p>
          <div class="entry-buttons">
            <button
              type="button"
              class="entry-button entry-button--icon"
              aria-label="Edit entry"
              @click="onEdit(entry)"
            >
              <svg
                class="entry-icon"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                />
              </svg>
            </button>
            <button
              type="button"
              class="entry-button entry-button--icon entry-button--danger"
              aria-label="Delete entry"
              @click="onDeletePrompt(entry)"
            >
              <svg
                class="entry-icon"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isModalOpen" class="modal-backdrop" @click.self="closeModal">
      <div class="modal" role="dialog" aria-modal="true">
        <header class="modal__header">
          <h2>{{ isEditing ? "Edit entry" : "New entry" }}</h2>
          <button class="modal__close" type="button" @click="closeModal">
            Close
          </button>
        </header>
        <div class="modal__body">
          <div class="modal__toggle">
            <button
              type="button"
              class="toggle-button"
              :class="{ 'toggle-button--active': entryType === 'income' }"
              @click="entryType = 'income'"
            >
              Income
            </button>
            <button
              type="button"
              class="toggle-button"
              :class="{ 'toggle-button--active': entryType === 'expense' }"
              @click="entryType = 'expense'"
            >
              Expense
            </button>
          </div>
          <div class="modal__form">
            <label class="field">
              <span>Name</span>
              <input
                v-model="entryName"
                type="text"
                placeholder="Salary, Rent, Groceries"
              />
            </label>
            <label class="field">
              <span>Amount</span>
              <input
                v-model="amount"
                type="number"
                inputmode="decimal"
                placeholder="0"
              />
            </label>
            <label v-if="entryType === 'expense'" class="field">
              <span>Due day (1-31)</span>
              <input
                v-model.number="dueDay"
                type="number"
                min="1"
                max="31"
                step="1"
                placeholder="1"
              />
            </label>
            <label v-if="entryType === 'expense'" class="field">
              <span>Category</span>
              <select v-model="selectedCategoryId">
                <option value="">Uncategorized</option>
                <option
                  v-for="category in categories"
                  :key="category.$id"
                  :value="category.$id"
                >
                  {{ category.name }}
                </option>
              </select>
            </label>
            <BaseButton variant="primary" type="button" @click="onSaveEntry">
              {{ isEditing ? "Save" : "Add" }}
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="isDeleteOpen"
      class="modal-backdrop"
      @click.self="closeDeleteModal"
    >
      <div class="modal modal--compact" role="dialog" aria-modal="true">
        <header class="modal__header">
          <h2>Delete entry</h2>
          <button class="modal__close" type="button" @click="closeDeleteModal">
            Close
          </button>
        </header>
        <div class="modal__body">
          <p>Do you really want to delete?</p>
          <div class="action-row">
            <BaseButton variant="ghost" type="button" @click="closeDeleteModal">
              No
            </BaseButton>
            <BaseButton variant="primary" type="button" @click="confirmDelete">
              Yes
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="isCopyOpen"
      class="modal-backdrop"
      @click.self="closeCopyModal"
    >
      <div class="modal modal--compact" role="dialog" aria-modal="true">
        <header class="modal__header">
          <h2>Copy month</h2>
          <button class="modal__close" type="button" @click="closeCopyModal">
            Close
          </button>
        </header>
        <div class="modal__body">
          <p>Choose a month to copy from.</p>
          <div class="month-tabs__buttons">
            <button
              v-for="month in months"
              :key="month"
              type="button"
              class="month-tab"
              :class="{ 'month-tab--active': copySourceMonth === month }"
              @click="copySourceMonth = month"
            >
              {{ month }}
            </button>
          </div>
          <div class="action-row">
            <BaseButton variant="ghost" type="button" @click="closeCopyModal">
              Cancel
            </BaseButton>
            <BaseButton variant="primary" type="button" @click="onCopyMonth">
              Copy
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="isClearOpen"
      class="modal-backdrop"
      @click.self="closeClearModal"
    >
      <div class="modal modal--compact" role="dialog" aria-modal="true">
        <header class="modal__header">
          <h2>Clear month</h2>
          <button class="modal__close" type="button" @click="closeClearModal">
            Close
          </button>
        </header>
        <div class="modal__body">
          <p>Are you sure you want to delete all entries?</p>
          <div class="action-row">
            <BaseButton variant="ghost" type="button" @click="closeClearModal">
              No
            </BaseButton>
            <BaseButton variant="primary" type="button" @click="confirmClearMonth">
              Yes
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import BaseButton from "../components/BaseButton.vue";
import DashboardLayout from "../components/DashboardLayout.vue";
import { formatCurrency, loadPreferences } from "../services/currency.js";
import { listCategories } from "../services/appwrite.js";
import {
  createEntry,
  deleteEntry,
  getCurrentUser,
  listEntries,
  updateEntry,
} from "../services/appwrite.js";

const isModalOpen = ref(false);
const entryType = ref("income");
const amount = ref("");
const entryName = ref("");
const dueDay = ref(null);
const editingId = ref(null);
const isDeleteOpen = ref(false);
const deleteTargetId = ref(null);
const isCopyOpen = ref(false);
const copySourceMonth = ref("");
const isClearOpen = ref(false);
const userId = ref(null);
const isLoading = ref(false);
const errorMessage = ref("");
const categories = ref([]);
const selectedCategoryId = ref("");
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

const closeModal = () => {
  isModalOpen.value = false;
  resetForm();
};

const entries = ref([]);

const resetForm = () => {
  entryType.value = "income";
  amount.value = "";
  entryName.value = "";
  dueDay.value = null;
  selectedCategoryId.value = incomeCategoryId.value || uncategorizedId.value;
  editingId.value = null;
};

const openNewEntry = () => {
  resetForm();
  isModalOpen.value = true;
};

const onSaveEntry = async () => {
  const trimmedAmount = amount.value.toString().trim();
  if (!trimmedAmount) return;
  const numericAmount = Number.parseFloat(trimmedAmount);
  if (Number.isNaN(numericAmount)) return;
  const trimmedName = entryName.value.trim() || "Untitled";
  errorMessage.value = "";
  if (!userId.value) {
    const user = await getCurrentUser();
    userId.value = user?.$id ?? null;
  }
  if (!userId.value) return;
  const payload = {
    type: entryType.value,
    amount: numericAmount,
    name: trimmedName,
    month: selectedMonth.value,
    userId: userId.value,
    dueDay:
      entryType.value === "expense" && Number.isFinite(dueDay.value)
        ? dueDay.value
        : null,
    categoryId: selectedCategoryId.value || uncategorizedId.value,
  };
  try {
    if (editingId.value) {
      const updated = await updateEntry(editingId.value, payload);
      entries.value = entries.value.map((item) =>
        item.$id === updated.$id ? updated : item
      );
    } else {
      const created = await createEntry(payload, userId.value);
      entries.value.unshift(created);
    }
    closeModal();
    resetForm();
  } catch (error) {
    errorMessage.value = error?.message || "Could not save entry.";
  }
};

const isEditing = computed(() => Boolean(editingId.value));

const onEdit = (entry) => {
  entryType.value = entry.type;
  amount.value = entry.amount?.toString() ?? "";
  entryName.value = entry.name;
  dueDay.value = entry.dueDay ?? null;
  selectedCategoryId.value = entry.categoryId ?? "";
  editingId.value = entry.$id;
  isModalOpen.value = true;
};

const onDeletePrompt = (entry) => {
  deleteTargetId.value = entry.$id;
  isDeleteOpen.value = true;
};

const closeDeleteModal = () => {
  isDeleteOpen.value = false;
  deleteTargetId.value = null;
};

const confirmDelete = async () => {
  if (!deleteTargetId.value) return;
  try {
    await deleteEntry(deleteTargetId.value);
    entries.value = entries.value.filter(
      (item) => item.$id !== deleteTargetId.value
    );
    closeDeleteModal();
  } catch (error) {
    errorMessage.value = error?.message || "Could not delete entry.";
  }
};

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

const loadEntries = async () => {
  errorMessage.value = "";
  isLoading.value = true;
  try {
    const user = await getCurrentUser();
    userId.value = user?.$id ?? null;
    if (!userId.value) {
      entries.value = [];
      return;
    }
    const categoryResult = await listCategories(userId.value);
    categories.value = categoryResult.documents;
    if (!selectedCategoryId.value) {
      selectedCategoryId.value = incomeCategoryId.value || uncategorizedId.value;
    }
    const result = await listEntries(selectedMonth.value, userId.value);
    entries.value = result.documents;
  } catch (error) {
    errorMessage.value = error?.message || "Could not load entries.";
  } finally {
    isLoading.value = false;
  }
};

watch(selectedMonth, loadEntries, { immediate: true });
loadPreferences();

watch(entryType, (value) => {
  if (editingId.value) return;
  if (value === "income") {
    selectedCategoryId.value = incomeCategoryId.value || uncategorizedId.value;
  } else {
    selectedCategoryId.value = uncategorizedId.value;
  }
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

const categoryNameById = computed(() =>
  Object.fromEntries(
    categories.value.map((category) => [category.$id, category.name])
  )
);

const categoryColorById = computed(() =>
  Object.fromEntries(
    categories.value.map((category) => [category.$id, category.color])
  )
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

const openCopyMonth = () => {
  const currentIndex = months.indexOf(selectedMonth.value);
  const fallbackIndex = currentIndex > 0 ? currentIndex - 1 : months.length - 1;
  copySourceMonth.value = months[fallbackIndex];
  isCopyOpen.value = true;
};

const closeCopyModal = () => {
  isCopyOpen.value = false;
  copySourceMonth.value = "";
};

const onCopyMonth = async () => {
  if (!copySourceMonth.value) return;
  errorMessage.value = "";
  try {
    const user = await getCurrentUser();
    userId.value = user?.$id ?? null;
    if (!userId.value) return;
    const source = await listEntries(copySourceMonth.value, userId.value);
    const tasks = source.documents.map((entry) =>
      createEntry(
        {
          name: entry.name,
          amount: entry.amount,
          type: entry.type,
          month: selectedMonth.value,
          userId: userId.value,
          dueDay: entry.dueDay ?? null,
          categoryId: entry.categoryId ?? uncategorizedId.value,
        },
        userId.value
      )
    );
    await Promise.all(tasks);
    await loadEntries();
    closeCopyModal();
  } catch (error) {
    errorMessage.value = error?.message || "Could not copy month.";
  }
};

const openClearMonth = () => {
  isClearOpen.value = true;
};

const closeClearModal = () => {
  isClearOpen.value = false;
};

const confirmClearMonth = async () => {
  errorMessage.value = "";
  try {
    const user = await getCurrentUser();
    userId.value = user?.$id ?? null;
    if (!userId.value) return;
    const result = await listEntries(selectedMonth.value, userId.value);
    const tasks = result.documents.map((entry) => deleteEntry(entry.$id));
    await Promise.all(tasks);
    await loadEntries();
    closeClearModal();
  } catch (error) {
    errorMessage.value = error?.message || "Could not clear month.";
  }
};

const sortedEntries = computed(() => {
  const priority = { income: 0, expense: 1 };
  const nameById = Object.fromEntries(
    categories.value.map((category) => [category.$id, category.name])
  );
  return [...entries.value].sort((a, b) => {
    const typeDiff = (priority[a.type] ?? 2) - (priority[b.type] ?? 2);
    if (typeDiff !== 0) return typeDiff;
    const aCategory = nameById[a.categoryId] || "Uncategorized";
    const bCategory = nameById[b.categoryId] || "Uncategorized";
    const categoryDiff = aCategory.localeCompare(bCategory);
    if (categoryDiff !== 0) return categoryDiff;
    return a.name.localeCompare(b.name);
  });
});
</script>
