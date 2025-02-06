<script setup lang="ts">
const colorMode = useColorMode();

const options = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' }
];
</script>

<template>
  <USelect
    v-model="colorMode.preference"
    :options="options"
    placeholder="Select theme"
    icon="i-heroicons-swatch"
    size="sm"
    class="w-32"
  />
</template>