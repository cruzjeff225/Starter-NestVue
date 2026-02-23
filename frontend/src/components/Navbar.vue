<script setup lang="ts">
import { useAuthStore } from '../stores/authStore'
import { useRouter } from 'vue-router'
import ThemeToggle from './ThemeToggle.vue'

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <header class="navbar">
    <div class="navbar-left">
      <!-- Logo -->
      <div class="nav-logo">
        <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
          <path d="M14 4L22 9V19L14 24L6 19V9L14 4Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
          <circle cx="14" cy="14" r="3" fill="white"/>
        </svg>
      </div>
      <span class="nav-brand">Boilerplate</span>
    </div>

    <div class="navbar-right">
      <ThemeToggle />

      <div class="nav-divider"></div>

      <!-- User info -->
      <div class="nav-user">
        <div class="nav-avatar">
          {{ auth.usuario?.nombre?.charAt(0).toUpperCase() }}
        </div>
        <div class="nav-user-info">
          <span class="nav-user-name">{{ auth.usuario?.nombre }}</span>
          <span class="nav-user-role">{{ auth.usuario?.rol }}</span>
        </div>
      </div>

      <button class="nav-logout" @click="logout" title="Cerrar sesión">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

.navbar {
  height: 60px;
  background: var(--bg-navbar);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  font-family: 'Sora', sans-serif;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

:global(.dark) .navbar {
  background: #1e1b4b;
  border-bottom-color: #312e81;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-logo {
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(99,102,241,0.3);
  flex-shrink: 0;
}

.nav-brand {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

:global(.dark) .nav-brand { color: white; }

.navbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-divider {
  width: 1px;
  height: 24px;
  background: var(--border);
}

:global(.dark) .nav-divider { background: #312e81; }

.nav-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #a5b4fc);
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.nav-user-name {
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-primary);
}

:global(.dark) .nav-user-name { color: #e2e8f0; }

.nav-user-role {
  font-size: 0.7rem;
  color: #94a3b8;
  text-transform: capitalize;
}

.nav-logout {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--bg-card);
  border-color: var(--border);
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

:global(.dark) .nav-logout {
  background: #312e81;
  border-color: #4338ca;
  color: #a5b4fc;
}

.nav-logout:hover {
  background: var(--bg-hover);
  border-color: var(--border);
  color: var(--text-primary);
}
</style>