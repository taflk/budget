import { ref } from "vue";
import { getPrefs, updatePrefs } from "./appwrite.js";

export const currency = ref("NOK");
export const savingsRate = ref(20);
export const showDecimals = ref(false);

export const loadPreferences = async () => {
  try {
    const prefs = await getPrefs();
    if (prefs?.currency) currency.value = prefs.currency;
    if (typeof prefs?.savingsRate === "number") {
      savingsRate.value = prefs.savingsRate;
    }
    if (typeof prefs?.showDecimals === "boolean") {
      showDecimals.value = prefs.showDecimals;
    }
  } catch {
    // Ignore and use defaults.
  }
};

export const savePreferences = async () => {
  const normalized = Number.isNaN(Number(savingsRate.value))
    ? 20
    : Number(savingsRate.value);
  savingsRate.value = normalized;
  await updatePrefs({
    currency: currency.value,
    savingsRate: normalized,
    showDecimals: showDecimals.value,
  });
};

export const formatCurrency = (value) => {
  if (value === null || value === undefined) return "---";
  const amount = Number(value);
  if (Number.isNaN(amount)) return "---";
  const fractionDigits = showDecimals.value ? 2 : 0;
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: currency.value,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
};
