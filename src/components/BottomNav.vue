<template>
  <nav class="bottom-nav">
    <RouterLink class="bottom-nav__link" to="/home">Dashboard</RouterLink>
    <RouterLink class="bottom-nav__link" to="/budget">Budget</RouterLink>
    <RouterLink class="bottom-nav__link" to="/calendar">Calendar</RouterLink>
    <RouterLink class="bottom-nav__link" to="/settings">Settings</RouterLink>
  </nav>
</template>

<script setup>
import { RouterLink } from "vue-router";
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: min(680px, 100%);
  margin: 32px auto 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: var(--radius-md);
  border: 1px solid rgba(24, 19, 10, 0.12);
  box-shadow: 0 16px 30px rgba(24, 19, 10, 0.12);
  backdrop-filter: blur(12px);
}

.bottom-nav__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  border-radius: var(--radius-pill);
  text-decoration: none;
  color: #4f473e;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.2s ease, color 0.2s ease;
}

.bottom-nav__link:hover {
  background: rgba(44, 110, 99, 0.08);
  color: #2c6e63;
}

.bottom-nav__link.router-link-active {
  background: #2c6e63;
  color: #fdfaf4;
}

@media (max-width: 640px) {
  .bottom-nav {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: 24px;
    width: min(680px, calc(100% - 24px));
    margin: 0;
    border-radius: var(--radius-md);
    border-left: 1px solid rgba(24, 19, 10, 0.12);
    border-right: 1px solid rgba(24, 19, 10, 0.12);
    border-bottom: 1px solid rgba(24, 19, 10, 0.12);
  }
}

@media (min-width: 641px) {
  .bottom-nav {
    width: min(680px, 100%);
    margin: 0;
  }
}
</style>
