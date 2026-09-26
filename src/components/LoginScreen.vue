<script setup lang="ts">
defineEmits<{
  login: []
}>()
</script>

<template>
  <div class="login-screen">
    <h1>Spotlikes</h1>
    <p>Regroupe tes titres likés par mois et crée une playlist pour chacun.</p>
    <button type="button" @click="$emit('login')">Se connecter à Spotify</button>
  </div>
</template>

<style scoped>
.login-screen {
  text-align: center;
  padding: 3rem 0;
}

button {
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  color: white;
  background-color: #1db954;
  border: none;
  border-radius: 999px;
  cursor: pointer;
}

button:hover {
  background-color: #1ed760;
}
</style>
