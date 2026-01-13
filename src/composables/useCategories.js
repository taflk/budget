import { computed, ref } from "vue";
import { listCategories } from "../services/appwrite.js";

export const useCategories = () => {
  const categories = ref([]);
  const categoryError = ref("");

  const loadCategories = async (userId, options = {}) => {
    categoryError.value = "";
    if (!userId) {
      categories.value = [];
      return;
    }
    const result = await listCategories(userId);
    const mapper = options.mapCategory || ((category) => category);
    categories.value = result.documents.map(mapper);
  };

  const categoryNameById = computed(() =>
    Object.fromEntries(categories.value.map((category) => [category.$id, category.name]))
  );

  const categoryColorById = computed(() =>
    Object.fromEntries(categories.value.map((category) => [category.$id, category.color]))
  );

  return {
    categories,
    categoryError,
    loadCategories,
    categoryNameById,
    categoryColorById,
  };
};
