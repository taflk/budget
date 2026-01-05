<template>
  <DashboardLayout
    eyebrow="Settings"
    title="Settings"
    subtitle="Customize the app to your liking."
  >
    <div class="settings-actions">
      <details v-if="isAdmin" class="settings-card settings-section">
        <summary class="settings-summary">Admin</summary>
        <div class="settings-section__body">
          <label class="field">
            <span>Invite email</span>
            <input
              v-model="inviteEmail"
              type="email"
              placeholder="user@email.com"
            />
          </label>
          <label class="field field--toggle">
            <span>Grant admin</span>
            <span class="switch">
              <input v-model="inviteIsAdmin" type="checkbox" />
              <span class="switch__slider" aria-hidden="true"></span>
            </span>
          </label>
          <p v-if="inviteError" class="form__error">{{ inviteError }}</p>
          <BaseButton
            variant="primary"
            type="button"
            class="button--small"
            :disabled="!inviteEmail"
            @click="onInviteMember"
          >
            Invite user
          </BaseButton>
        </div>
      </details>
      <details class="settings-card settings-section">
        <summary class="settings-summary">Preferences</summary>
        <div class="settings-section__body">
          <label class="field">
            <span>Currency</span>
            <select v-model="currency">
              <option value="NOK">NOK</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="SEK">SEK</option>
              <option value="DKK">DKK</option>
            </select>
          </label>
          <label class="field">
            <span>Savings percentage (%)</span>
            <input
              v-model.number="savingsRate"
              type="number"
              min="0"
              max="100"
              step="1"
              placeholder="20"
            />
          </label>
          <label class="field field--toggle">
            <span>Show decimals</span>
            <span class="switch">
              <input v-model="showDecimals" type="checkbox" />
              <span class="switch__slider" aria-hidden="true"></span>
            </span>
          </label>
          <p v-if="errorMessage" class="form__error">{{ errorMessage }}</p>
          <BaseButton
            variant="primary"
            type="button"
            class="button--small"
            :disabled="isSaving"
            @click="onSavePreferences"
          >
            {{ isSaving ? "Saving..." : "Save" }}
          </BaseButton>
          <p class="settings-hint">
            Used across dashboard and budget entries.
          </p>
        </div>
      </details>
      <details class="settings-card settings-section">
        <summary class="settings-summary">Categories</summary>
        <div class="settings-section__body">
          <p class="category-title">New category</p>
          <label class="field">
            <span>Name</span>
            <input v-model="categoryName" type="text" placeholder="Food" />
          </label>
          <div class="field">
            <span>Color</span>
            <div class="color-row">
              <span
                class="category-swatch"
                :style="{ background: categoryColor }"
              />
              <input
                ref="colorInput"
                v-model="categoryColor"
                type="color"
                @change="onColorChange"
              />
              <span class="color-value">{{ categoryColor }}</span>
            </div>
            <div class="color-presets">
              <button
                v-for="preset in colorPresets"
                :key="preset"
                type="button"
                class="color-preset"
                :style="{ background: preset }"
                :class="{ 'color-preset--active': preset === categoryColor }"
                @click="categoryColor = preset"
              />
            </div>
          </div>
          <p v-if="categoryError" class="form__error">{{ categoryError }}</p>
          <BaseButton
            variant="primary"
            type="button"
            class="button--small"
            :disabled="!canCreateCategory"
            @click="onCreateCategory"
          >
            Add category
          </BaseButton>
          <div v-if="categories.length" class="category-list">
            <p class="category-title">Categories</p>
            <div
              v-for="category in categories"
              :key="category.$id"
              class="category-row"
            >
              <span
                class="category-swatch"
                :style="{ background: category.color }"
              />
              <input
                v-model="category.name"
                class="category-input"
                type="text"
              />
              <div class="category-actions">
                <label class="color-picker">
                  <span
                    class="color-picker__swatch"
                    :style="{ background: category.color }"
                  />
                  <input v-model="category.color" type="color" />
                </label>
                <button
                  type="button"
                  class="entry-button entry-button--secondary"
                  :disabled="updatingCategoryId === category.$id"
                  @click="onUpdateCategory(category)"
                >
                  {{ updatingCategoryId === category.$id ? "Saving" : "Save" }}
                </button>
                <button
                  type="button"
                  class="entry-button entry-button--secondary"
                  @click="onDeleteCategory(category.$id)"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </details>
      <BaseButton variant="ghost" type="button" @click="onLogout">
        Log out
      </BaseButton>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { useRouter } from "vue-router";
import BaseButton from "../components/BaseButton.vue";
import DashboardLayout from "../components/DashboardLayout.vue";
import { computed, onMounted, ref } from "vue";
import {
  createCategory,
  deleteCategory,
  getCurrentUser,
  inviteTeamMember,
  listCategories,
  listTeamMemberships,
  updateCategory,
  logoutCurrent,
} from "../services/appwrite.js";
import {
  currency,
  loadPreferences,
  savePreferences,
  savingsRate,
  showDecimals,
} from "../services/currency.js";

const router = useRouter();
const isSaving = ref(false);
const errorMessage = ref("");
const categoryName = ref("");
const categoryColor = ref("#2c6e63");
const categories = ref([]);
const categoryError = ref("");
const colorInput = ref(null);
const updatingCategoryId = ref(null);
const inviteEmail = ref("");
const inviteIsAdmin = ref(false);
const inviteError = ref("");
const isAdmin = ref(false);
const defaultCategories = [
  { name: "Uncategorized", color: "#7a6f63" },
  { name: "Income", color: "#2c6e63" },
];
const colorPresets = [
  "#c17b3b",
  "#3a6ea5",
  "#6b5fa6",
  "#b24a3b",
  "#9c5b7a",
  "#7a6f63",
  "#d4a04b",
  "#6f7aa6",
];

const onLogout = async () => {
  await logoutCurrent();
  await router.push("/login");
};

const onSavePreferences = async () => {
  errorMessage.value = "";
  isSaving.value = true;
  try {
    await savePreferences();
  } catch (error) {
    errorMessage.value = error?.message || "Could not save preferences.";
  } finally {
    isSaving.value = false;
  }
};

const loadCategories = async () => {
  categoryError.value = "";
  try {
    const user = await getCurrentUser();
    if (!user?.$id) {
      categories.value = [];
      return;
    }
    const result = await listCategories(user.$id);
    categories.value = result.documents;
  } catch (error) {
    categoryError.value = error?.message || "Could not load categories.";
  }
};

const canCreateCategory = computed(
  () => categoryName.value.trim().length > 0
);

const onCreateCategory = async () => {
  if (!canCreateCategory.value) return;
  categoryError.value = "";
  try {
    const user = await getCurrentUser();
    if (!user?.$id) return;
    const created = await createCategory(
      {
        name: categoryName.value.trim(),
        color: categoryColor.value,
        userId: user.$id,
      },
      user.$id
    );
    categories.value = [...categories.value, created].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    categoryName.value = "";
  } catch (error) {
    categoryError.value = error?.message || "Could not create category.";
  }
};

const onDeleteCategory = async (categoryId) => {
  categoryError.value = "";
  try {
    await deleteCategory(categoryId);
    categories.value = categories.value.filter((item) => item.$id !== categoryId);
  } catch (error) {
    categoryError.value = error?.message || "Could not delete category.";
  }
};

const onUpdateCategory = async (category) => {
  categoryError.value = "";
  updatingCategoryId.value = category.$id;
  try {
    await updateCategory(category.$id, {
      name: category.name.trim() || "Uncategorized",
      color: category.color,
      userId: category.userId,
    });
  } catch (error) {
    categoryError.value = error?.message || "Could not update category.";
  } finally {
    updatingCategoryId.value = null;
  }
};

const onColorChange = () => {
  if (colorInput.value) {
    colorInput.value.blur();
  }
};

const addDefaultCategories = async () => {
  categoryError.value = "";
  try {
    const user = await getCurrentUser();
    if (!user?.$id) return;
    const existing = new Set(
      categories.value.map((category) => category.name.toLowerCase())
    );
    const created = [];
    for (const category of defaultCategories) {
      if (existing.has(category.name.toLowerCase())) continue;
      const result = await createCategory(
        { ...category, userId: user.$id },
        user.$id
      );
      created.push(result);
    }
    if (created.length > 0) {
      categories.value = [...categories.value, ...created].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }
  } catch (error) {
    categoryError.value = error?.message || "Could not add defaults.";
  }
};

const loadAdminState = async () => {
  inviteError.value = "";
  try {
    const user = await getCurrentUser();
    if (!user?.$id) {
      isAdmin.value = false;
      return;
    }
    const memberships = await listTeamMemberships();
    const membership = memberships.memberships.find(
      (item) => item.userId === user.$id
    );
    isAdmin.value = membership?.roles?.includes("admin") || false;
  } catch (error) {
    inviteError.value = error?.message || "Could not load admin state.";
  }
};

const onInviteMember = async () => {
  inviteError.value = "";
  try {
    const email = inviteEmail.value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      inviteError.value = "Enter a valid email address.";
      return;
    }
    const roles = inviteIsAdmin.value ? ["admin"] : ["member"];
    const url = import.meta.env.VITE_APPWRITE_INVITE_URL || window.location.origin;
    await inviteTeamMember(email, roles, url);
    inviteEmail.value = "";
    inviteIsAdmin.value = false;
  } catch (error) {
    const message = error?.message || "Could not invite user.";
    if (message.includes("SMTP is disabled")) {
      inviteError.value =
        "SMTP is disabled on the Appwrite server. Enable SMTP to send invites.";
    } else {
      inviteError.value = message;
    }
  }
};

onMounted(async () => {
  await loadPreferences();
  await loadCategories();
  await addDefaultCategories();
  await loadAdminState();
});
</script>
