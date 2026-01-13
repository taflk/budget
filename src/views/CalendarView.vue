<template>
  <DashboardLayout
    eyebrow="Budget"
    title="Calendar"
    subtitle="See when bills should be paid."
  >
    <template #actions>
      <CategoryLegend :categories="categories" />
    </template>

    <div class="calendar">
      <div class="calendar__header">
        <div class="calendar__title-row">
          <p class="calendar__title">{{ monthLabel }}</p>
          <p class="calendar__subtitle">{{ year }}</p>
        </div>
        <div class="calendar-actions">
          <BaseButton
            variant="ghost"
            type="button"
            class="button--small"
            @click="goPrevious"
          >
            Previous
          </BaseButton>
          <BaseButton
            variant="ghost"
            type="button"
            class="button--small"
            @click="goNext"
          >
            Next
          </BaseButton>
        </div>
      </div>

      <div class="calendar__grid calendar__grid--weekdays">
        <span v-for="day in weekdays" :key="day" class="calendar__weekday">
          {{ day }}
        </span>
      </div>

      <div class="calendar__grid">
        <div
          v-for="cell in calendarCells"
          :key="cell.key"
          class="calendar__cell"
          :class="{
            'calendar__cell--empty': cell.isEmpty,
            'calendar__cell--today': cell.isToday,
          }"
          @click="cell.isEmpty ? null : openDayModal(cell)"
        >
          <span v-if="!cell.isEmpty" class="calendar__day">
            {{ cell.day }}
          </span>
          <div
            v-if="!cell.isEmpty && billsByDay[cell.day]?.length"
            class="calendar__items"
          >
            <span
              v-for="color in billDots[cell.day]"
              :key="`${cell.day}-${color}`"
              class="calendar__dot"
              :style="{ background: color }"
            />
            <span
              v-if="billDots[cell.day].length < billsByDay[cell.day].length"
              class="calendar__more"
            >
              +{{ billsByDay[cell.day].length - billDots[cell.day].length }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <BaseModal
      v-if="isModalOpen"
      title="Bills due"
      scroll-body
      @close="closeModal"
    >
      <p class="modal__hint">Selected date: {{ selectedLabel }}</p>
      <div v-if="selectedBills.length === 0" class="empty-state">
        <p>No bills due on this date.</p>
      </div>
      <EntryList v-else>
        <EntryCard v-for="bill in selectedBills" :key="bill.$id">
          <template #title>{{ bill.name }}</template>
          <template #meta>
            {{ formatCurrency(bill.amount) }} ·
            {{ bill.month }}
            <span v-if="bill.categoryId">
              ·
              {{ categoryNameById[bill.categoryId] || "Uncategorized" }}
            </span>
          </template>
        </EntryCard>
      </EntryList>
    </BaseModal>
  </DashboardLayout>
</template>

<script setup>
import { ref, watch } from "vue";
import BaseButton from "../components/BaseButton.vue";
import BaseModal from "../components/BaseModal.vue";
import CategoryLegend from "../components/CategoryLegend.vue";
import DashboardLayout from "../components/DashboardLayout.vue";
import EntryCard from "../components/EntryCard.vue";
import EntryList from "../components/EntryList.vue";
import { useCalendarData } from "../composables/useCalendarData.js";
import { useCategories } from "../composables/useCategories.js";
import { useMonths } from "../composables/useMonths.js";
import { usePreferences } from "../composables/usePreferences.js";
import { useUser } from "../composables/useUser.js";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const { months } = useMonths();
const { userId, loadUser } = useUser();
const { categories, loadCategories, categoryColorById } = useCategories();
const { formatCurrency, loadPreferences } = usePreferences();

const today = new Date();
const monthIndex = ref(today.getMonth());
const year = ref(today.getFullYear());
const isModalOpen = ref(false);
const selectedDay = ref(null);

const {
  monthLabel,
  calendarCells,
  billsByDay,
  billDots,
  selectedLabel,
  selectedBills,
  loadBills,
} = useCalendarData({
  months,
  monthIndex,
  year,
  selectedDay,
  userId,
  loadUser,
  loadCategories,
  categoryColorById,
});

const goPrevious = () => {
  if (monthIndex.value === 0) {
    monthIndex.value = 11;
    year.value -= 1;
    return;
  }
  monthIndex.value -= 1;
};

const goNext = () => {
  if (monthIndex.value === 11) {
    monthIndex.value = 0;
    year.value += 1;
    return;
  }
  monthIndex.value += 1;
};

const openDayModal = (cell) => {
  selectedDay.value = cell.day;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedDay.value = null;
};

watch([monthIndex, year], loadBills, { immediate: true });
loadPreferences();
</script>

<style scoped>
.calendar {
  display: grid;
  gap: 16px;
}

.calendar__header {
  display: grid;
  gap: 8px;
}

.calendar__title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.calendar__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.calendar__subtitle {
  margin: 0;
  font-size: 14px;
  color: #7a6f63;
}

.calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}

.calendar__grid--weekdays {
  gap: 4px;
}

.calendar__weekday {
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.16em;
  color: #7a6f63;
}

.calendar__cell {
  min-height: 72px;
  border-radius: var(--radius-sm);
  background: #fbfaf7;
  border: 1px solid rgba(24, 19, 10, 0.08);
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  cursor: pointer;
}

.calendar__cell--empty {
  background: transparent;
  border-color: transparent;
  cursor: default;
}

.calendar__cell--today {
  border-color: #2c6e63;
}

.calendar__day {
  font-size: var(--font-sm);
  font-weight: 600;
  color: #1f1d1a;
}

.calendar__items {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  width: 100%;
}

.calendar__more {
  margin: 0;
  font-size: 11px;
  color: #7a6f63;
}

.calendar__dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-pill);
}

.calendar-actions {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  justify-content: flex-end;
}
</style>
