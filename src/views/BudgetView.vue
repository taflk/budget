<template>
  <DashboardLayout
    eyebrow="Budget"
    :title="`Budget - ${selectedYear}`"
    subtitle="Plan your yearly budget."
  >
    <template #actions>
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
            @click="openTemplateModal"
          >
            Templates
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
        <button
          v-for="category in categories"
          :key="category.$id"
          type="button"
          class="category-pill category-pill--button"
          :class="{ 'category-pill--active': isCategorySelected(category.$id) }"
          @click="toggleCategoryFilter(category.$id)"
        >
          <span
            class="category-dot"
            :style="{ background: category.color }"
          />
          {{ category.name }}
        </button>
        <button
          v-if="selectedCategoryFilters.length"
          type="button"
          class="category-pill category-pill--clear"
          @click="clearCategoryFilters"
        >
          Clear
        </button>
      </div>
      <p
        v-if="selectedCategoryFilters.length"
        class="category-legend-total"
      >
        Filter total: {{ formatCurrency(filteredTotal) }}
      </p>
    </template>
    <p v-if="errorMessage" class="form__error">{{ errorMessage }}</p>
    <p v-if="isLoading" class="loading-text">Loading...</p>
    <div v-if="filteredEntries.length === 0" class="empty-state">
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
            {{ entry.month }} {{ entry.year || selectedYear }}
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
      <div class="modal entry-modal" role="dialog" aria-modal="true">
        <header class="modal__header">
          <h2>{{ isEditing ? "Edit entry" : "New entry" }}</h2>
          <button class="modal__close" type="button" @click="closeModal">
            Close
          </button>
        </header>
        <div class="modal__body entry-modal__body">
          <div class="entry-scroll">
            <div ref="entryScrollBody" class="entry-scroll__body">
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
              </div>
            </div>
            <div v-if="showScrollHint" class="entry-scroll__hint">
              Scroll for more
            </div>
          </div>
          <div class="entry-modal__footer">
            <BaseButton
              variant="primary"
              type="button"
              class="entry-modal__submit"
              @click="onSaveEntry"
            >
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
    <div
      v-if="isTemplateOpen"
      class="modal-backdrop"
      @click.self="closeTemplateModal"
    >
      <div class="modal" role="dialog" aria-modal="true">
        <header class="modal__header">
          <h2>Templates</h2>
          <button class="modal__close" type="button" @click="closeTemplateModal">
            Close
          </button>
        </header>
        <div class="modal__body">
          <label class="field">
            <span>Template name</span>
            <input
              v-model="templateName"
              type="text"
              placeholder="Standard month"
            />
          </label>
          <p v-if="templateError" class="form__error">{{ templateError }}</p>
          <p v-if="templateSuccess" class="settings-hint">{{ templateSuccess }}</p>
          <div class="action-row">
            <BaseButton
              variant="primary"
              type="button"
              class="template-save-button"
              @click="onSaveTemplate"
            >
              Save current month
            </BaseButton>
          </div>
          <p class="modal__hint">
            Applying a template adds entries to the selected month.
          </p>
          <div v-if="templates.length" class="template-list">
            <div
              v-for="template in templates"
              :key="template.$id"
              class="template-row"
            >
              <div class="template-meta">
                <p class="template-name">{{ template.name }}</p>
                <p class="template-count">
                  {{ templateCount(template) }} entries
                </p>
              </div>
              <div class="entry-buttons">
                <button
                  type="button"
                  class="entry-button entry-button--secondary"
                  @click="openTemplateConfirm('apply', template)"
                >
                  Apply
                </button>
                <button
                  type="button"
                  class="entry-button entry-button--secondary entry-button--danger"
                  @click="openTemplateConfirm('delete', template)"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
          <p v-else class="settings-hint">No templates yet.</p>
        </div>
      </div>
    </div>
    <div
      v-if="isTemplateConfirmOpen"
      class="modal-backdrop"
      @click.self="closeTemplateConfirm"
    >
      <div class="modal modal--compact" role="dialog" aria-modal="true">
        <header class="modal__header">
          <h2>{{ templateConfirmTitle }}</h2>
          <button class="modal__close" type="button" @click="closeTemplateConfirm">
            Close
          </button>
        </header>
        <div class="modal__body">
          <p>{{ templateConfirmText }}</p>
          <div class="action-row">
            <BaseButton
              variant="ghost"
              type="button"
              @click="closeTemplateConfirm"
            >
              No
            </BaseButton>
            <BaseButton
              variant="primary"
              type="button"
              :disabled="isTemplateActioning"
              @click="confirmTemplateAction"
            >
              {{ templateConfirmActionLabel }}
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import BaseButton from "../components/BaseButton.vue";
import DashboardLayout from "../components/DashboardLayout.vue";
import { formatCurrency, loadPreferences } from "../services/currency.js";
import { listCategories } from "../services/appwrite.js";
import {
  createEntry,
  deleteEntry,
  getCurrentUser,
  listEntries,
  createTemplate,
  deleteTemplate,
  listTemplates,
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
const isTemplateOpen = ref(false);
const templates = ref([]);
const templateName = ref("");
const templateError = ref("");
const templateSuccess = ref("");
const isTemplateConfirmOpen = ref(false);
const templateAction = ref("");
const selectedTemplate = ref(null);
const isTemplateActioning = ref(false);
const userId = ref(null);
const isLoading = ref(false);
const errorMessage = ref("");
const entryScrollBody = ref(null);
const showScrollHint = ref(false);
let entryScrollObserver = null;
const categories = ref([]);
const selectedCategoryFilters = ref([]);
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
const currentYear = new Date().getFullYear();
const selectedMonth = ref(months[new Date().getMonth()]);
const selectedYear = ref(currentYear);
const showAllMonths = ref(false);
const hasMigratedYears = ref(false);
const isMigratingYears = ref(false);
const years = computed(() => {
  const start = currentYear - 3;
  const end = currentYear + 3;
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
});

const closeModal = () => {
  isModalOpen.value = false;
  resetForm();
};

const updateScrollHint = () => {
  if (!entryScrollBody.value) return;
  showScrollHint.value =
    entryScrollBody.value.scrollHeight >
    entryScrollBody.value.clientHeight + 1;
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
    year: selectedYear.value,
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

const matchesSelectedYear = (entry) =>
  (entry.year ?? currentYear) === selectedYear.value;

const migrateMissingYears = async () => {
  if (hasMigratedYears.value || isMigratingYears.value) return;
  isMigratingYears.value = true;
  try {
    const user = await getCurrentUser();
    userId.value = user?.$id ?? null;
    if (!userId.value) return;
    const categoryResult = await listCategories(userId.value);
    categories.value = categoryResult.documents;
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
          entry.type === "income" ? incomeIdLocal || uncategorizedIdLocal : uncategorizedIdLocal || incomeIdLocal;
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
    entries.value = result.documents.filter(matchesSelectedYear);
  } catch (error) {
    errorMessage.value = error?.message || "Could not load entries.";
  } finally {
    isLoading.value = false;
  }
};

watch([selectedMonth, selectedYear], loadEntries, { immediate: true });
loadPreferences();

watch([isModalOpen, entryType], async ([open]) => {
  if (!open) {
    showScrollHint.value = false;
    if (entryScrollObserver) {
      entryScrollObserver.disconnect();
      entryScrollObserver = null;
    }
    return;
  }
  await nextTick();
  updateScrollHint();
  if (entryScrollBody.value && window.ResizeObserver) {
    entryScrollObserver = new ResizeObserver(updateScrollHint);
    entryScrollObserver.observe(entryScrollBody.value);
  }
});

onBeforeUnmount(() => {
  if (entryScrollObserver) {
    entryScrollObserver.disconnect();
  }
});

watch(entryType, (value) => {
  if (editingId.value) return;
  if (value === "income") {
    selectedCategoryId.value = incomeCategoryId.value || uncategorizedId.value;
  } else {
    selectedCategoryId.value = uncategorizedId.value;
  }
});

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

const openTemplateModal = async () => {
  await loadTemplates();
  isTemplateOpen.value = true;
};

const closeTemplateModal = () => {
  isTemplateOpen.value = false;
  templateName.value = "";
  templateError.value = "";
  templateSuccess.value = "";
};

const loadTemplates = async () => {
  templateError.value = "";
  try {
    const user = await getCurrentUser();
    userId.value = user?.$id ?? null;
    if (!userId.value) {
      templates.value = [];
      return;
    }
    const result = await listTemplates(userId.value);
    templates.value = result.documents;
  } catch (error) {
    templateError.value = error?.message || "Could not load templates.";
  }
};

const normalizeTemplateEntries = () =>
  entries.value.map((entry) => ({
    name: entry.name,
    amount: entry.amount,
    type: entry.type,
    dueDay: entry.dueDay ?? null,
    categoryId: entry.categoryId ?? uncategorizedId.value,
  }));

const onSaveTemplate = async () => {
  templateError.value = "";
  templateSuccess.value = "";
  const trimmedName = templateName.value.trim();
  if (!trimmedName) {
    templateError.value = "Template name is required.";
    return;
  }
  if (!entries.value.length) {
    templateError.value = "Current month has no entries.";
    return;
  }
  try {
    const user = await getCurrentUser();
    userId.value = user?.$id ?? null;
    if (!userId.value) return;
    const payload = {
      name: trimmedName,
      userId: userId.value,
      data: JSON.stringify(normalizeTemplateEntries()),
    };
    await createTemplate(payload, userId.value);
    templateSuccess.value = "Template saved.";
    templateName.value = "";
    await loadTemplates();
  } catch (error) {
    templateError.value = error?.message || "Could not save template.";
  }
};

const parseTemplateData = (template) => {
  try {
    return JSON.parse(template.data || "[]");
  } catch {
    return [];
  }
};

const templateCount = (template) => parseTemplateData(template).length;

const onApplyTemplate = async (template) => {
  templateError.value = "";
  templateSuccess.value = "";
  try {
    const user = await getCurrentUser();
    userId.value = user?.$id ?? null;
    if (!userId.value) return;
    const items = parseTemplateData(template);
    const tasks = items.map((entry) =>
      createEntry(
        {
          name: entry.name || "Untitled",
          amount: Number(entry.amount) || 0,
          type: entry.type || "expense",
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
    templateSuccess.value = "Template applied.";
    await loadEntries();
  } catch (error) {
    templateError.value = error?.message || "Could not apply template.";
  }
};

const onDeleteTemplate = async (template) => {
  templateError.value = "";
  templateSuccess.value = "";
  try {
    await deleteTemplate(template.$id);
    templates.value = templates.value.filter((item) => item.$id !== template.$id);
    templateSuccess.value = "Template deleted.";
  } catch (error) {
    templateError.value = error?.message || "Could not delete template.";
  }
};

const openTemplateConfirm = (action, template) => {
  templateAction.value = action;
  selectedTemplate.value = template;
  isTemplateConfirmOpen.value = true;
};

const closeTemplateConfirm = () => {
  isTemplateConfirmOpen.value = false;
  templateAction.value = "";
  selectedTemplate.value = null;
};

const templateConfirmTitle = computed(() =>
  templateAction.value === "delete" ? "Delete template" : "Apply template"
);

const templateConfirmText = computed(() => {
  if (!selectedTemplate.value) return "";
  const name = selectedTemplate.value.name || "this template";
  return templateAction.value === "delete"
    ? `Are you sure you want to delete "${name}"?`
    : `Apply "${name}" to ${selectedMonth.value} ${selectedYear.value}?`;
});

const templateConfirmActionLabel = computed(() =>
  templateAction.value === "delete" ? "Delete" : "Apply"
);

const confirmTemplateAction = async () => {
  if (!selectedTemplate.value) return;
  isTemplateActioning.value = true;
  try {
    if (templateAction.value === "delete") {
      await onDeleteTemplate(selectedTemplate.value);
    } else {
      await onApplyTemplate(selectedTemplate.value);
    }
    closeTemplateConfirm();
  } finally {
    isTemplateActioning.value = false;
  }
};

const confirmClearMonth = async () => {
  errorMessage.value = "";
  try {
    const user = await getCurrentUser();
    userId.value = user?.$id ?? null;
    if (!userId.value) return;
    const result = await listEntries(selectedMonth.value, userId.value);
    const tasks = result.documents
      .filter(matchesSelectedYear)
      .map((entry) => deleteEntry(entry.$id));
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

const isCategorySelected = (categoryId) =>
  selectedCategoryFilters.value.includes(categoryId);
</script>
