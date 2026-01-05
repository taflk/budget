<template>
  <DashboardLayout
    eyebrow="Budget"
    title="Calendar"
    subtitle="See when bills should be paid."
  >
    <template #actions>
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

    <div v-if="isModalOpen" class="modal-backdrop" @click.self="closeModal">
      <div class="modal" role="dialog" aria-modal="true">
        <header class="modal__header">
          <h2>Bills due</h2>
          <button class="modal__close" type="button" @click="closeModal">
            Close
          </button>
        </header>
        <div class="modal__body modal__body--scroll">
          <p class="modal__hint">Selected date: {{ selectedLabel }}</p>
          <div v-if="selectedBills.length === 0" class="empty-state">
            <p>No bills due on this date.</p>
          </div>
          <div v-else class="entry-list">
            <div
              v-for="bill in selectedBills"
              :key="bill.$id"
              class="entry-card"
            >
              <div>
                <p class="entry-title">{{ bill.name }}</p>
                <p class="entry-meta">
                  {{ formatCurrency(bill.amount) }} ·
                  {{ bill.month }}
                  <span v-if="bill.categoryId">
                    ·
                    {{ categoryNameById[bill.categoryId] || "Uncategorized" }}
                  </span>
                </p>
              </div>
            </div>
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
import { getCurrentUser, listCategories, listEntries } from "../services/appwrite.js";
import { formatCurrency, loadPreferences } from "../services/currency.js";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
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

const today = new Date();
const monthIndex = ref(today.getMonth());
const year = ref(today.getFullYear());
const isModalOpen = ref(false);
const selectedDay = ref(null);
const entries = ref([]);
const userId = ref(null);
const categories = ref([]);

const monthLabel = computed(() => months[monthIndex.value]);

const daysInMonth = computed(
  () => new Date(year.value, monthIndex.value + 1, 0).getDate()
);

const firstWeekdayIndex = computed(() => {
  const weekday = new Date(year.value, monthIndex.value, 1).getDay();
  return weekday === 0 ? 6 : weekday - 1;
});

const calendarCells = computed(() => {
  const cells = [];
  const totalCells = firstWeekdayIndex.value + daysInMonth.value;
  const totalSlots = Math.ceil(totalCells / 7) * 7;

  for (let i = 0; i < totalSlots; i += 1) {
    const day = i - firstWeekdayIndex.value + 1;
    const isEmpty = day < 1 || day > daysInMonth.value;
    const isToday =
      !isEmpty &&
      day === today.getDate() &&
      year.value === today.getFullYear() &&
      monthIndex.value === today.getMonth();

    cells.push({
      key: `${year.value}-${monthIndex.value}-${i}`,
      day,
      isEmpty,
      isToday,
    });
  }

  return cells;
});

const monthName = computed(() => months[monthIndex.value]);

const billsByDay = computed(() => {
  const map = {};
  entries.value.forEach((entry) => {
    if (entry.type !== "expense") return;
    if (!Number.isFinite(entry.dueDay)) return;
    const day = entry.dueDay;
    if (!map[day]) map[day] = [];
    map[day].push(entry);
  });
  return map;
});

const categoryColorById = computed(() =>
  Object.fromEntries(
    categories.value.map((category) => [category.$id, category.color])
  )
);

const categoryNameById = computed(() =>
  Object.fromEntries(
    categories.value.map((category) => [category.$id, category.name])
  )
);

const billDots = computed(() => {
  const dots = {};
  Object.entries(billsByDay.value).forEach(([day, bills]) => {
    const colors = bills
      .map((bill) => categoryColorById.value[bill.categoryId] || "#c9c1b5")
      .filter((value, index, self) => self.indexOf(value) === index);
    dots[day] = colors.slice(0, 4);
  });
  return dots;
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

const selectedLabel = computed(() => {
  if (!selectedDay.value) return "";
  return `${monthLabel.value} ${selectedDay.value}, ${year.value}`;
});

const selectedBills = computed(() => {
  if (!selectedDay.value) return [];
  return billsByDay.value[selectedDay.value] ?? [];
});

const loadBills = async () => {
  try {
    const user = await getCurrentUser();
    userId.value = user?.$id ?? null;
    if (!userId.value) {
      entries.value = [];
      return;
    }
    const categoryResult = await listCategories(userId.value);
    categories.value = categoryResult.documents;
    const result = await listEntries(monthName.value, userId.value);
    entries.value = result.documents;
  } catch {
    entries.value = [];
  }
};

watch([monthIndex, year], loadBills, { immediate: true });
loadPreferences();
</script>
