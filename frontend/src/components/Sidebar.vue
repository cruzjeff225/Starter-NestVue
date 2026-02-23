<script setup lang="ts">
import { useAuthStore } from '../stores/authStore'
import { useRoute } from 'vue-router'

const auth = useAuthStore()
const route = useRoute()

const navItems = [
  {
    to: '/',
    label: 'Dashboard',
    icon: `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
    roles: ['admin', 'user'],
  },
  {
    to: '/admin/users',
    label: 'Usuarios',
    icon: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
    roles: ['admin'],
  },
]

const visibleItems = navItems.filter(item =>
  item.roles.includes(auth.usuario?.rol ?? '')
)
</script>

<template>
  <aside class="sidebar">
    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in visibleItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="{ active: route.path === item.to }"
      >
        <svg
          class="nav-item-icon"
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          v-html="item.icon"
        />
        <span>{{ item.label }}</span>
        <div v-if="route.path === item.to" class="active-indicator"></div>
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-version">v1.0.0</div>
    </div>
  </aside>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

.sidebar {
  width: 220px;
  min-height: calc(100vh - 60px);
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px 12px;
  font-family: 'Sora', sans-serif;
  flex-shrink: 0;
}

:global(.dark) .sidebar {
  background: #1e1b4b;
  border-right-color: #312e81;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.18s;
  position: relative;
  overflow: hidden;
}

:global(.dark) .nav-item { color: #94a3b8; }

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--accent);
}

:global(.dark) .nav-item:hover {
  background: #312e81;
  color: #a5b4fc;
}

.nav-item.active {
  background: var(--bg-active);
  color: var(--text-active);
  font-weight: 500;
}

:global(.dark) .nav-item.active {
  background: #312e81;
  color: #a5b4fc;
}

.nav-item-icon {
  flex-shrink: 0;
  transition: transform 0.18s;
}

.nav-item:hover .nav-item-icon {
  transform: scale(1.1);
}

.active-indicator {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: var(--accent);
  border-radius: 99px 0 0 99px;
}

.sidebar-footer {
  padding: 8px 12px;
}

.sidebar-version {
  font-size: 0.72rem;
  color: #cbd5e1;
  font-weight: 300;
}
</style>