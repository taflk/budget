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
          <details class="admin-subsection">
            <summary class="admin-summary">Create user</summary>
            <div class="admin-section__body">
              <label class="field">
                <span>Name</span>
                <input v-model="adminName" type="text" placeholder="Full name" />
              </label>
              <label class="field">
                <span>Email</span>
                <input
                  v-model="adminEmail"
                  type="email"
                  placeholder="user@email.com"
                />
              </label>
              <label class="field">
                <span>Temporary password</span>
                <input
                  v-model="adminPassword"
                  type="password"
                  autocomplete="new-password"
                />
              </label>
              <p v-if="adminCreateError" class="form__error">
                {{ adminCreateError }}
              </p>
              <p v-if="adminCreateSuccess" class="settings-hint">
                {{ adminCreateSuccess }}
              </p>
              <BaseButton
                variant="primary"
                type="button"
                class="button--small"
                :disabled="isCreatingUser"
                @click="onCreateUser"
              >
                {{ isCreatingUser ? "Creating..." : "Create user" }}
              </BaseButton>
            </div>
          </details>
          <p v-if="adminError" class="form__error">{{ adminError }}</p>
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
        <summary class="settings-summary">Password</summary>
        <div class="settings-section__body">
          <label class="field">
            <span>Current password</span>
            <input
              v-model="currentPassword"
              type="password"
              autocomplete="current-password"
            />
          </label>
          <label class="field">
            <span>New password</span>
            <input
              v-model="newPassword"
              type="password"
              autocomplete="new-password"
            />
          </label>
          <label class="field">
            <span>Confirm new password</span>
            <input
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
            />
          </label>
          <p v-if="passwordError" class="form__error">{{ passwordError }}</p>
          <p v-if="passwordSuccess" class="settings-hint">
            {{ passwordSuccess }}
          </p>
          <BaseButton
            variant="primary"
            type="button"
            class="button--small"
            :disabled="isUpdatingPassword"
            @click="onUpdatePassword"
          >
            {{ isUpdatingPassword ? "Saving..." : "Save password" }}
          </BaseButton>
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
              <div class="category-content">
                <div class="category-header">
                  <span class="category-name">{{ category.name }}</span>
                  <button
                    v-if="activeCategoryId !== category.$id"
                    type="button"
                    class="entry-button entry-button--secondary"
                    @click="activeCategoryId = category.$id"
                  >
                    Edit
                  </button>
                </div>
                <div
                  v-if="activeCategoryId === category.$id"
                  class="category-editor"
                >
                  <input
                    v-model="category.name"
                    class="category-input"
                    type="text"
                  />
                  <div class="category-actions">
                    <div class="category-actions__left">
                      <label class="color-picker">
                        <span
                          class="color-picker__swatch"
                          :style="{ background: category.color }"
                        />
                        <input
                          v-model="category.color"
                          type="color"
                          @input="onCategoryColorPicker(category)"
                        />
                      </label>
                      <input
                        v-model="category.hexInput"
                        class="category-input category-input--hex"
                        type="text"
                        placeholder="#2c6e63"
                        @blur="onHexBlur(category)"
                      />
                    </div>
                    <div class="category-actions__buttons">
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
                      <button
                        type="button"
                        class="entry-button"
                        @click="activeCategoryId = null"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
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
  createAccount,
  deleteCategory,
  getCurrentUser,
  listCategories,
  listTeamMemberships,
  updatePassword,
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
const activeCategoryId = ref(null);
const adminError = ref("");
const isAdmin = ref(false);
const adminName = ref("");
const adminEmail = ref("");
const adminPassword = ref("");
const adminCreateError = ref("");
const adminCreateSuccess = ref("");
const isCreatingUser = ref(false);
const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const passwordError = ref("");
const passwordSuccess = ref("");
const isUpdatingPassword = ref(false);
const defaultCategories = [
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

const syncHexInput = (category) => {
  category.hexInput = category.color;
};

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
    categories.value = result.documents.map((category) => ({
      ...category,
      hexInput: category.color,
    }));
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
    syncHexInput(created);
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
    if (activeCategoryId.value === categoryId) {
      activeCategoryId.value = null;
    }
  } catch (error) {
    categoryError.value = error?.message || "Could not delete category.";
  }
};

const onUpdateCategory = async (category) => {
  categoryError.value = "";
  updatingCategoryId.value = category.$id;
  try {
    const normalized = normalizeHex(category.hexInput || category.color);
    if (!normalized) {
      category.hexInput = category.color;
      categoryError.value = "Enter a valid hex color (e.g. #2C6E63).";
      return;
    }
    category.color = normalized;
    category.hexInput = normalized;
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

const onHexBlur = (category) => {
  categoryError.value = "";
  const normalized = normalizeHex(category.hexInput || "");
  if (!normalized) {
    category.hexInput = category.color;
    categoryError.value = "Enter a valid hex color (e.g. #2C6E63).";
    return;
  }
  category.color = normalized;
  category.hexInput = normalized;
};

const onCategoryColorPicker = (category) => {
  category.hexInput = normalizeHex(category.color) || category.color;
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
      syncHexInput(result);
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
  adminError.value = "";
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
    adminError.value = error?.message || "Could not load admin state.";
  }
};

const onCreateUser = async () => {
  adminCreateError.value = "";
  adminCreateSuccess.value = "";
  const trimmedEmail = adminEmail.value.trim().toLowerCase();
  if (!trimmedEmail || !adminPassword.value) {
    adminCreateError.value = "Email and password are required.";
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    adminCreateError.value = "Enter a valid email address.";
    return;
  }
  isCreatingUser.value = true;
  try {
    await createAccount(trimmedEmail, adminPassword.value, adminName.value.trim());
    adminName.value = "";
    adminEmail.value = "";
    adminPassword.value = "";
    adminCreateSuccess.value = "User created.";
  } catch (error) {
    adminCreateError.value = error?.message || "Could not create user.";
  } finally {
    isCreatingUser.value = false;
  }
};

const onUpdatePassword = async () => {
  passwordError.value = "";
  passwordSuccess.value = "";
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    passwordError.value = "Fill in all password fields.";
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = "New passwords do not match.";
    return;
  }
  isUpdatingPassword.value = true;
  try {
    await updatePassword(newPassword.value, currentPassword.value);
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    passwordSuccess.value = "Password updated.";
  } catch (error) {
    passwordError.value = error?.message || "Could not update password.";
  } finally {
    isUpdatingPassword.value = false;
  }
};

onMounted(async () => {
  await loadPreferences();
  await loadCategories();
  await addDefaultCategories();
  await loadAdminState();
});
</script>
