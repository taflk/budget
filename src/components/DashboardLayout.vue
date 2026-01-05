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
