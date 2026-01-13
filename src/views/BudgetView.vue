<template>
  <DashboardLayout
    eyebrow="Budget"
    :title="`Budget - ${selectedYear}`"
    subtitle="Plan your yearly budget."
  >
    <template #actions>
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
      <CategoryLegend
        :categories="categories"
        :selected="selectedCategoryFilters"
        selectable
        @toggle="toggleCategoryFilter"
        @clear="clearCategoryFilters"
      />
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
    <EntryList v-else>
      <EntryCard
        v-for="entry in sortedEntries"
        :key="entry.$id"
        :style="entryCardStyle(entry)"
      >
        <template #title>{{ entry.name }}</template>
        <template #meta>
          {{ entry.type === "income" ? "Income" : "Expense" }} ·
          {{ entry.month }} {{ entry.year || selectedYear }}
          <span v-if="entry.categoryId">
            ·
            {{ categoryNameById[entry.categoryId] || "Uncategorized" }}
          </span>
        </template>
        <template #trailing>
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
        </template>
      </EntryCard>
    </EntryList>

    <BaseModal
      v-if="isModalOpen"
      :title="isEditing ? 'Edit entry' : 'New entry'"
      content-class="entry-modal"
      body-class="entry-modal__body"
      @close="closeModal"
    >
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
    </BaseModal>
    <BaseModal
      v-if="isDeleteOpen"
      title="Delete entry"
      compact
      @close="closeDeleteModal"
    >
      <p>Do you really want to delete?</p>
      <div class="action-row">
        <BaseButton variant="ghost" type="button" @click="closeDeleteModal">
          No
        </BaseButton>
        <BaseButton variant="primary" type="button" @click="confirmDelete">
          Yes
        </BaseButton>
      </div>
    </BaseModal>
    <BaseModal
      v-if="isCopyOpen"
      title="Copy month"
      compact
      @close="closeCopyModal"
    >
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
    </BaseModal>
    <BaseModal
      v-if="isClearOpen"
      title="Clear month"
      compact
      @close="closeClearModal"
    >
      <p>Are you sure you want to delete all entries?</p>
      <div class="action-row">
        <BaseButton variant="ghost" type="button" @click="closeClearModal">
          No
        </BaseButton>
        <BaseButton variant="primary" type="button" @click="confirmClearMonth">
          Yes
        </BaseButton>
      </div>
    </BaseModal>
    <BaseModal v-if="isTemplateOpen" title="Templates" @close="closeTemplateModal">
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
    </BaseModal>
    <BaseModal
      v-if="isTemplateConfirmOpen"
      :title="templateConfirmTitle"
      compact
      @close="closeTemplateConfirm"
    >
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
    </BaseModal>
  </DashboardLayout>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import BaseButton from "../components/BaseButton.vue";
import BaseModal from "../components/BaseModal.vue";
import CategoryLegend from "../components/CategoryLegend.vue";
import DashboardLayout from "../components/DashboardLayout.vue";
import EntryCard from "../components/EntryCard.vue";
import EntryList from "../components/EntryList.vue";
import MonthTabs from "../components/MonthTabs.vue";
import { useBudgetEntries } from "../composables/useBudgetEntries.js";
import { useBudgetTemplates } from "../composables/useBudgetTemplates.js";
import { useCategories } from "../composables/useCategories.js";
import { useMonths } from "../composables/useMonths.js";
import { usePreferences } from "../composables/usePreferences.js";
import { useUser } from "../composables/useUser.js";

const { months, currentYear, selectedMonth, selectedYear, showAllMonths, years, visibleMonths } =
  useMonths();
const { userId, loadUser } = useUser();
const { categories, loadCategories, categoryNameById, categoryColorById } = useCategories();
const { formatCurrency, loadPreferences } = usePreferences();
const {
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
} = useBudgetEntries({
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
});

const {
  isTemplateOpen,
  templates,
  templateName,
  templateError,
  templateSuccess,
  isTemplateConfirmOpen,
  templateConfirmTitle,
  templateConfirmText,
  templateConfirmActionLabel,
  isTemplateActioning,
  openTemplateModal,
  closeTemplateModal,
  onSaveTemplate,
  templateCount,
  openTemplateConfirm,
  closeTemplateConfirm,
  confirmTemplateAction,
} = useBudgetTemplates({
  entries,
  selectedMonth,
  selectedYear,
  uncategorizedId,
  userId,
  loadUser,
  loadEntries,
});

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
const entryScrollBody = ref(null);
const showScrollHint = ref(false);
let entryScrollObserver = null;
const selectedCategoryId = ref("");
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
  const saved = await saveEntry({ payload, editingId: editingId.value });
  if (saved) {
    closeModal();
    resetForm();
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
  const deleted = await deleteEntryById(deleteTargetId.value);
  if (deleted) {
    closeDeleteModal();
  }
};

const loadEntriesAndDefaults = async () => {
  await loadEntries();
  if (!selectedCategoryId.value) {
    selectedCategoryId.value = incomeCategoryId.value || uncategorizedId.value;
  }
};

watch([selectedMonth, selectedYear], loadEntriesAndDefaults, { immediate: true });
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
  const copied = await copyMonth(copySourceMonth.value);
  if (copied) {
    closeCopyModal();
  }
};

const openClearMonth = () => {
  isClearOpen.value = true;
};

const closeClearModal = () => {
  isClearOpen.value = false;
};

const confirmClearMonth = async () => {
  const cleared = await clearMonth();
  if (cleared) {
    closeClearModal();
  }
};

const isCategorySelected = (categoryId) =>
  selectedCategoryFilters.value.includes(categoryId);
</script>

<style scoped>
:deep(.entry-modal) {
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

:deep(.entry-modal .modal__body) {
  flex: 1 1 auto;
  min-height: 0;
}

:deep(.modal__body.entry-modal__body) {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1 1 auto;
  min-height: 0;
}

:deep(.modal__body .month-tabs__buttons) {
  margin-bottom: 12px;
}

.entry-scroll {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
}

.entry-scroll__body {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 6px;
  padding-bottom: 24px;
}

.entry-scroll__hint {
  position: absolute;
  right: 8px;
  bottom: 4px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #7a6f63;
  pointer-events: none;
  padding-bottom: 2px;
}

.entry-modal__footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 6px;
}

.entry-modal__submit {
  padding: 12px 50px;
  font-size: var(--font-md);
}

.modal__form {
  display: grid;
  gap: 14px;
}

.modal__toggle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.toggle-button {
  border: 1px solid rgba(24, 19, 10, 0.18);
  background: #ffffff;
  color: #4f473e;
  padding: 10px 12px;
  border-radius: var(--radius-pill);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.toggle-button--active {
  background: #2c6e63;
  border-color: #2c6e63;
  color: #fdfaf4;
}

.template-save-button {
  margin: 8px 0;
}

.template-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.template-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(24, 19, 10, 0.1);
  background: #ffffff;
}

.template-meta {
  display: grid;
  gap: 2px;
}

.template-name {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f1d1a;
}

.template-count {
  margin: 0;
  font-size: var(--font-xs);
  color: #7a6f63;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.action-row--spread {
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.action-row--ruled {
  padding: 12px 0;
  border-top: 1px solid rgba(24, 19, 10, 0.1);
  border-bottom: 1px solid rgba(24, 19, 10, 0.1);
}

.summary-inline {
  font-size: var(--font-sm);
  color: #7a6f63;
  text-align: right;
  white-space: nowrap;
  margin-left: auto;
}

.category-legend-total {
  margin: 6px 0 0;
  font-size: var(--font-sm);
  color: #5f564c;
}

.month-tabs__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 768px) {
  .action-row--spread {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .summary-inline {
    text-align: left;
    white-space: normal;
  }
}
</style>
