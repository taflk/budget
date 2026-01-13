<template>
  <main class="page page--wide">
    <section class="panel">
      <header class="panel__header">
        <div>
          <!-- <p class="eyebrow">{{ eyebrow }}</p> -->
          <h1>{{ title }}</h1>
          <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
        </div>
        <div v-if="$slots.actions" class="panel__actions">
          <slot name="actions" />
        </div>
      </header>
      <slot />
    </section>
    <BottomNav />
  </main>
</template>

<script setup>
import BottomNav from "./BottomNav.vue";

defineProps({
  eyebrow: { type: String, default: "" },
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
});
</script>

<style scoped>
.panel {
  width: min(960px, 100%);
  background: #ffffff;
  border-radius: var(--radius-lg);
  padding: 40px;
  box-shadow: 0 24px 60px rgba(24, 19, 10, 0.12);
  border: 1px solid rgba(24, 19, 10, 0.08);
}

.panel__header {
  display: grid;
  gap: 16px;
  margin-bottom: 28px;
}

.panel__actions {
  display: grid;
  gap: 18px;
  justify-items: start;
}

@media (max-width: 768px) {
  .panel {
    padding: 32px 24px;
    width: 100%;
    max-width: 100%;
    margin: 0;
  }

  .panel__header {
    width: 100%;
  }

  .panel__actions {
    width: 100%;
  }
}
</style>
