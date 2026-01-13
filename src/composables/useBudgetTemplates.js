import { computed, ref } from "vue";
import {
  createEntry,
  createTemplate,
  deleteTemplate,
  listTemplates,
} from "../services/appwrite.js";

export const useBudgetTemplates = ({
  entries,
  selectedMonth,
  selectedYear,
  uncategorizedId,
  userId,
  loadUser,
  loadEntries,
}) => {
  const isTemplateOpen = ref(false);
  const templates = ref([]);
  const templateName = ref("");
  const templateError = ref("");
  const templateSuccess = ref("");
  const isTemplateConfirmOpen = ref(false);
  const templateAction = ref("");
  const selectedTemplate = ref(null);
  const isTemplateActioning = ref(false);

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
      await loadUser();
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
      await loadUser();
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
      await loadUser();
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

  return {
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
  };
};
