<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div
      class="modal"
      :class="[contentClass, { 'modal--compact': compact }]"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
    >
      <header class="modal__header">
        <h2>{{ title }}</h2>
        <button class="modal__close" type="button" @click="emit('close')">
          Close
        </button>
      </header>
      <div
        class="modal__body"
        :class="[bodyClass, { 'modal__body--scroll': scrollBody }]"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  compact: { type: Boolean, default: false },
  scrollBody: { type: Boolean, default: false },
  contentClass: { type: String, default: "" },
  bodyClass: { type: String, default: "" },
});

const emit = defineEmits(["close"]);
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(25, 20, 12, 0.35);
  display: grid;
  place-items: center;
  padding: 24px;
  z-index: 20;
}

.modal {
  width: min(520px, 100%);
  background: #ffffff;
  border-radius: var(--radius-md);
  padding: 24px;
  border: 1px solid rgba(24, 19, 10, 0.1);
  box-shadow: 0 22px 50px rgba(24, 19, 10, 0.18);
}

.modal--compact {
  width: min(420px, 100%);
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.modal__header h2 {
  margin: 0;
  font-size: 20px;
}

.modal__close {
  border: none;
  background: transparent;
  color: #2c6e63;
  font-weight: 600;
  cursor: pointer;
}

.modal__body {
  color: #5f564c;
}

.modal__body--scroll {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 6px;
}

:slotted(.modal__hint) {
  margin: 0 0 12px;
  font-size: var(--font-sm);
  color: #7a6f63;
}
</style>
