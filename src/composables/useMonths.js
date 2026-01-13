import { computed, ref } from "vue";

export const MONTHS = [
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

export const useMonths = (options = {}) => {
  const currentYear = new Date().getFullYear();
  const selectedMonth = ref(
    options.initialMonth ?? MONTHS[new Date().getMonth()]
  );
  const selectedYear = ref(options.initialYear ?? currentYear);
  const showAllMonths = ref(false);
  const startOffset = options.startOffset ?? -3;
  const endOffset = options.endOffset ?? 3;

  const years = computed(() => {
    const start = currentYear + startOffset;
    const end = currentYear + endOffset;
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  });

  const visibleMonths = computed(() => {
    if (showAllMonths.value) return MONTHS;
    const currentIndex = new Date().getMonth();
    const upcoming = [];
    for (let i = 0; i < 4; i += 1) {
      const index = (currentIndex + i) % 12;
      upcoming.push(MONTHS[index]);
    }
    return upcoming;
  });

  return {
    months: MONTHS,
    currentYear,
    selectedMonth,
    selectedYear,
    showAllMonths,
    years,
    visibleMonths,
  };
};
