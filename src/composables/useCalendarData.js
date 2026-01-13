import { computed, ref } from "vue";
import { listEntries } from "../services/appwrite.js";

export const useCalendarData = ({
  months,
  monthIndex,
  year,
  selectedDay,
  userId,
  loadUser,
  loadCategories,
  categoryColorById,
}) => {
  const entries = ref([]);

  const monthLabel = computed(() => months[monthIndex.value]);
  const monthName = computed(() => months[monthIndex.value]);

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
    const today = new Date();

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
      await loadUser();
      if (!userId.value) {
        entries.value = [];
        return;
      }
      await loadCategories(userId.value);
      const result = await listEntries(monthName.value, userId.value);
      entries.value = result.documents;
    } catch {
      entries.value = [];
    }
  };

  return {
    entries,
    monthLabel,
    daysInMonth,
    firstWeekdayIndex,
    calendarCells,
    billsByDay,
    billDots,
    selectedLabel,
    selectedBills,
    loadBills,
  };
};
