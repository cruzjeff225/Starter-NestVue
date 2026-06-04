<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from './stores/themeStore'
import { RouterView } from 'vue-router'
import ToastContainer from './components/ToastContainer.vue'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.init()
})
</script>

<template>
  <RouterView />
  <ToastContainer />
</template>
