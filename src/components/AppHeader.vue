<script setup lang="ts">
import SpotlikesLogo from './SpotlikesLogo.vue'
</script>

<template>
  <header class="app-header">
    <SpotlikesLogo :size="30" />
    <span class="title">Spotlikes</span>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.title {
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
</style>
