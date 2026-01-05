<template>
  <main class="page">
    <AuthCard
      eyebrow="Budget"
      title="Log in"
    >
      <form class="form" autocomplete="on" @submit.prevent="onSubmit">
        <BaseInput
          v-model="email"
          type="email"
          name="email"
          label="Email"
          placeholder="you@example.com"
        />
        <BaseInput
          v-model="password"
          type="password"
          name="password"
          label="Password"
          placeholder="••••••••"
        />
        <p v-if="error" class="form__error">{{ error }}</p>
        <BaseButton
          variant="primary"
          type="submit"
          :disabled="isSubmitting || isCreating"
        >
          {{ isSubmitting ? "Signing in..." : "Sign in" }}
        </BaseButton>
        <!-- <BaseButton
          variant="ghost"
          type="button"
          :disabled="isSubmitting || isCreating"
          @click="onCreateAccount"
        >
          {{ isCreating ? "Creating..." : "Create account" }}
        </BaseButton> -->
      </form>
    </AuthCard>
  </main>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import AuthCard from "../components/AuthCard.vue";
import BaseButton from "../components/BaseButton.vue";
import BaseInput from "../components/BaseInput.vue";
import { createAccount, loginWithEmail } from "../services/appwrite.js";

const email = ref("");
const password = ref("");
const error = ref("");
const isSubmitting = ref(false);
const isCreating = ref(false);
const router = useRouter();

const onSubmit = async () => {
  error.value = "";
  isSubmitting.value = true;
  try {
    await loginWithEmail(email.value.trim(), password.value);
    await router.push("/home");
  } catch (err) {
    error.value =
      err?.message || "Could not sign in. Check your email and password.";
  } finally {
    isSubmitting.value = false;
  }
};

const onCreateAccount = async () => {
  error.value = "";
  isCreating.value = true;
  try {
    const trimmedEmail = email.value.trim();
    const displayName = trimmedEmail.split("@")[0] || "User";
    await createAccount(trimmedEmail, password.value, displayName);
    await loginWithEmail(trimmedEmail, password.value);
    await router.push("/home");
  } catch (err) {
    error.value =
      err?.message || "Could not create account. Please try again.";
  } finally {
    isCreating.value = false;
  }
};
</script>
