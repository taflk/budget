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
