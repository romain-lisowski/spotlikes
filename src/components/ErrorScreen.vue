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

button {
  margin-top: 1rem;
  padding: 0.5rem 1.25rem;
  cursor: pointer;
}
</style>
