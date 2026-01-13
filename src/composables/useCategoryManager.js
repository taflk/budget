import { ref } from "vue";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../services/appwrite.js";

export const useCategoryManager = () => {
  const categories = ref([]);
  const categoryError = ref("");
  const normalizeCategoryName = (value) => (value || "").trim().toLowerCase();

  const normalizeHex = (value) => {
    const raw = value.trim().replace(/^#/, "");
    if (!/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(raw)) return null;
    const expanded =
      raw.length === 3
        ? raw
            .split("")
            .map((ch) => `${ch}${ch}`)
            .join("")
        : raw;
    return `#${expanded.toUpperCase()}`;
  };

  const applyHexInput = (category) => {
    categoryError.value = "";
    const normalized = normalizeHex(category.hexInput || category.color || "");
    if (!normalized) {
      category.hexInput = category.color;
      categoryError.value = "Enter a valid hex color (e.g. #2C6E63).";
      return null;
    }
    category.color = normalized;
    category.hexInput = normalized;
    return normalized;
  };

  const syncHexWithColor = (category) => {
    category.hexInput = normalizeHex(category.color) || category.color;
  };

  const loadCategories = async (userId) => {
    categoryError.value = "";
    if (!userId) {
      categories.value = [];
      return;
    }
    try {
      const result = await listCategories(userId);
      categories.value = result.documents.map((category) => ({
        ...category,
        hexInput: category.color,
      }));
    } catch (error) {
      categoryError.value = error?.message || "Could not load categories.";
    }
  };

  const createCategoryForUser = async (userId, data) => {
    categoryError.value = "";
    if (!userId) return null;
    const created = await createCategory({ ...data, userId }, userId);
    return { ...created, hexInput: created.color };
  };

  const updateCategoryForUser = async (categoryId, data) => {
    categoryError.value = "";
    await updateCategory(categoryId, data);
  };

  const deleteCategoryForUser = async (categoryId) => {
    categoryError.value = "";
    await deleteCategory(categoryId);
  };

  const addDefaultCategories = async (userId, defaults) => {
    categoryError.value = "";
    if (!userId) return;
    let existingCategories = categories.value;
    if (existingCategories.length === 0) {
      try {
        const result = await listCategories(userId);
        existingCategories = result.documents;
        categories.value = result.documents.map((category) => ({
          ...category,
          hexInput: category.color,
        }));
      } catch (error) {
        categoryError.value = error?.message || "Could not load categories.";
        return;
      }
    }
    const existing = new Set(
      existingCategories
        .map((category) => normalizeCategoryName(category.name))
        .filter(Boolean)
    );
    const created = [];
    for (const category of defaults) {
      const key = normalizeCategoryName(category.name);
      if (!key || existing.has(key)) continue;
      const result = await createCategory({ ...category, userId }, userId);
      created.push({ ...result, hexInput: result.color });
      existing.add(key);
    }
    if (created.length > 0) {
      categories.value = [...categories.value, ...created].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }
  };

  return {
    categories,
    categoryError,
    loadCategories,
    createCategoryForUser,
    updateCategoryForUser,
    deleteCategoryForUser,
    addDefaultCategories,
    applyHexInput,
    syncHexWithColor,
  };
};
