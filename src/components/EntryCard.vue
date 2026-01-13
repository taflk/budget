<template>
  <div class="entry-card">
    <div>
      <p class="entry-title">
        <slot name="title" />
      </p>
      <p class="entry-meta">
        <slot name="meta" />
      </p>
    </div>
    <div v-if="$slots.trailing" class="entry-actions">
      <slot name="trailing" />
    </div>
  </div>
</template>

<style scoped>
.entry-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-radius: var(--radius-item);
  background: #fbfaf7;
  border: 1px solid rgba(24, 19, 10, 0.08);
}

.entry-title {
  margin: 0 0 6px;
  font-weight: 600;
  color: #1f1d1a;
}

.entry-meta {
  margin: 0;
  font-size: var(--font-sm);
  color: #7a6f63;
}

.entry-actions {
  display: grid;
  justify-items: end;
  gap: 8px;
}

:slotted(.entry-amount) {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f1d1a;
}
</style>
