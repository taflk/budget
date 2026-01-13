<template>
  <section class="card">
    <div class="card__header">
      <p class="eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
      <p class="subtitle">{{ subtitle }}</p>
    </div>
    <slot />
    <p v-if="footnote" class="footnote">{{ footnote }}</p>
  </section>
</template>

<script setup>
defineProps({
  eyebrow: { type: String, default: "" },
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  footnote: { type: String, default: "" },
});
</script>

<style scoped>
.card {
  width: min(440px, 100%);
  background: #ffffff;
  border-radius: var(--radius-lg);
  padding: 40px;
  box-shadow: 0 24px 60px rgba(24, 19, 10, 0.12);
  border: 1px solid rgba(24, 19, 10, 0.08);
}

.card__header {
  display: grid;
  gap: 8px;
  margin-bottom: 24px;
}

.footnote {
  margin: 0;
  font-size: var(--font-sm);
  color: #7a6f63;
}

@media (max-width: 768px) {
  .card {
    padding: 32px 24px;
  }
}
</style>
