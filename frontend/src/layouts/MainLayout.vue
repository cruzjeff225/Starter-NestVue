<script setup lang="ts">
import Navbar from '../components/Navbar.vue'
import Sidebar from '../components/Sidebar.vue'
</script>

<template>
  <div class="app-shell">
    <Navbar />
    <div class="app-body">
      <Sidebar />
      <main class="app-main">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: var(--bg-app);
  font-family: 'Sora', sans-serif;
}

:global(.dark) .app-shell {
  background: #0f0e2a;
}

.app-body {
  display: flex;
}

.app-main {
  flex: 1;
  padding: 28px;
  min-height: calc(100vh - 60px);
  overflow-x: hidden;
}

/* Page transition */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>