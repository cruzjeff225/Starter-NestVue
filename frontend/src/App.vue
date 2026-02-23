<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from './stores/themeStore'
import { RouterView } from 'vue-router'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.init()
})
</script>

<template>
  <RouterView />
</template>