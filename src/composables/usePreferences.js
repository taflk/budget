import {
  currency,
  loadPreferences,
  savePreferences,
  savingsRate,
  showDecimals,
  formatCurrency,
} from "../services/currency.js";

export const usePreferences = () => ({
  currency,
  savingsRate,
  showDecimals,
  loadPreferences,
  savePreferences,
  formatCurrency,
});
