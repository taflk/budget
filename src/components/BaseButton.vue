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

<style scoped>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-pill);
  padding: 12px 16px;
  font-size: var(--font-md);
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease;
  text-decoration: none;
}

.button:active {
  transform: translateY(1px);
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}

.button--primary {
  background: #2c6e63;
  color: #fdfaf4;
  box-shadow: 0 16px 30px rgba(44, 110, 99, 0.25);
}

.button--ghost {
  background: transparent;
  color: #2c6e63;
  border: 1px solid rgba(44, 110, 99, 0.3);
}

.button--small {
  padding: 8px 12px;
  font-size: var(--font-sm);
}

@supports (-webkit-touch-callout: none) {
  .button {
    padding: 14px 18px;
    font-size: 16px;
  }

  .button--small {
    padding: 10px 14px;
    font-size: 14px;
  }
}
</style>
