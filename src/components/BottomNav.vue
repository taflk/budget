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
