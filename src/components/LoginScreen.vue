<script setup lang="ts">
defineEmits<{
  login: []
}>()

const FEATURES = [
  {
    icon: '🗂️',
    title: 'Trimestre ou genre',
    text: 'Choisis comment regrouper tes titres likés, ou combine les deux.',
  },
  {
    icon: '✏️',
    title: '100% personnalisable',
    text: 'Renomme chaque playlist et exclus les titres qui ne t’intéressent pas.',
  },
  {
    icon: '▶️',
    title: 'Écoute avant de créer',
    text: 'Un extrait audio par titre pour te rappeler de quoi il s’agit.',
  },
]
</script>

<template>
  <div class="login-screen">
    <h1>Tes likes Spotify, enfin rangés.</h1>
    <p class="tagline">
      Regroupe tes titres likés par trimestre ou par genre, et crée une playlist prête à écouter en
      un clic.
    </p>
    <button type="button" @click="$emit('login')">Se connecter à Spotify</button>

    <ul class="features">
      <li v-for="feature in FEATURES" :key="feature.title" class="feature">
        <span class="feature-icon" aria-hidden="true">{{ feature.icon }}</span>
        <span class="feature-title">{{ feature.title }}</span>
        <span class="feature-text">{{ feature.text }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.login-screen {
  text-align: center;
  padding: 2.5rem 0 3rem;
}

h1 {
  font-size: 1.9rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 0.75rem;
}

.tagline {
  opacity: 0.75;
  max-width: 34rem;
  margin: 0 auto 2rem;
  font-size: 1.05rem;
  line-height: 1.5;
}

button {
  padding: 0.85rem 2rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: white;
  background-color: #1db954;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
}

button:hover {
  background-color: #1ed760;
}

button:active {
  transform: scale(0.98);
}

.features {
  list-style: none;
  padding: 0;
  margin: 3.5rem 0 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  text-align: left;
}

.feature {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 1.25rem;
  border-radius: 12px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
}

.feature-icon {
  font-size: 1.5rem;
}

.feature-title {
  font-weight: 700;
  font-size: 0.95rem;
}

.feature-text {
  font-size: 0.85rem;
  opacity: 0.7;
  line-height: 1.4;
}

@media (max-width: 640px) {
  .features {
    grid-template-columns: 1fr;
  }
}
</style>
