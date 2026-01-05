<template>
  <button :class="classes" :type="type" :disabled="disabled">
    <slot />
  </button>
</template>

<script setup>
const props = defineProps({
  variant: { type: String, default: "primary" },
  type: { type: String, default: "button" },
  disabled: { type: Boolean, default: false },
});

const classes = ["button", `button--${props.variant}`];
</script>
