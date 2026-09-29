<script setup lang="ts">
defineProps<{
  message: string
}>()

defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="error-screen">
    <p>{{ message }}</p>
    <button type="button" @click="$emit('retry')">Se reconnecter</button>
  </div>
</template>

<style scoped>
.error-screen {
  text-align: center;
  padding: 3rem 0;
}

p {
  opacity: 0.85;
  margin-bottom: 1rem;
}

button {
  padding: 0.6rem 1.4rem;
  border: none;
  border-radius: 999px;
  background: hsla(160, 100%, 37%, 1);
  color: white;
  font-weight: 600;
  cursor: pointer;
}

button:hover {
  background: hsla(160, 100%, 42%, 1);
}
</style>
