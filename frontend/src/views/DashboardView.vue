<script setup lang="ts">
import { useAuthStore } from '../stores/authStore'

const auth = useAuthStore()

const stats = [
  { label: 'Rol asignado', value: auth.usuario?.rol ?? '—', icon: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>` },
  { label: 'Estado', value: 'Activo', icon: `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>` },
  { label: 'Sesión', value: 'En línea', icon: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>` },
]
</script>

<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">
          Hola! {{ auth.usuario?.nombre?.split(' ')[0] }}
        </h1>
        <p class="page-subtitle">Bienvenido a tu panel de control</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card">
        <div class="stat-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" v-html="stat.icon"/>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </div>

    <!-- Info card -->
    <div class="info-card">
      <div class="info-card-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Sobre este boilerplate
      </div>
      <p class="info-card-text">
        Este es un boilerplate fullstack construido con <strong>NestJS</strong>, <strong>Vue 3</strong>,
        <strong>Prisma</strong> y <strong>TailwindCSS</strong>. Incluye autenticación JWT,
        control de acceso por roles (RBAC), modo claro/oscuro y configuración de tamaño de fuente.
      </p>
      <div class="info-tags">
        <span class="tag">NestJS</span>
        <span class="tag">Vue 3</span>
        <span class="tag">Prisma</span>
        <span class="tag">PostgreSQL</span>
        <span class="tag">JWT</span>
        <span class="tag">RBAC</span>
        <span class="tag">TailwindCSS</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

.dashboard {
  font-family: 'Sora', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 900px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}

:global(.dark) .page-title { color: #e2e8f0; }

.page-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
  font-weight: 300;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card {
  background: var(--bg-card); border-color: var(--border);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99,102,241,0.1);
}

:global(.dark) .stat-card {
  background: #1e1b4b;
  border-color: #312e81;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--bg-icon); color: var(--accent);
  color: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

:global(.dark) .stat-icon {
  background: #312e81;
  color: #a5b4fc;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: capitalize;
}

:global(.dark) .stat-value { color: #e2e8f0; }

.stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 300;
}

/* Info card */
.info-card {
  background: var(--bg-card); border-color: var(--border);
  border-radius: 14px;
  padding: 22px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

:global(.dark) .info-card {
  background: #1e1b4b;
  border-color: #312e81;
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #6366f1;
  margin-bottom: 12px;
}

.info-card-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 16px;
  font-weight: 300;
}

:global(.dark) .info-card-text { color: #94a3b8; }

.info-card-text strong {
  color: #1e293b;
  font-weight: 500;
}

:global(.dark) .info-card-text strong { color: #e2e8f0; }

.info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--accent-light);
  border-color: var(--accent-border);
  color: var(--accent);
  border-radius: 6px;
  padding: 3px 10px;
}

:global(.dark) .tag {
  background: #312e81;
  border-color: #4338ca;
  color: #a5b4fc;
}
</style>