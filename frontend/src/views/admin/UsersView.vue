<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../services/api'

interface Usuario {
  idUsuario: number
  nombre: string
  email: string
  creadoEn: string
  rol: { nombre: string }
}

const usuarios = ref<Usuario[]>([])
const loading = ref(true)
const error = ref('')

async function cargarUsuarios() {
  try {
    loading.value = true
    const res = await api.get('/users')
    usuarios.value = res.data
  } catch {
    error.value = 'No se pudieron cargar los usuarios'
  } finally {
    loading.value = false
  }
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

onMounted(() => cargarUsuarios())
</script>

<template>
  <div class="users-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Usuarios</h1>
        <p class="page-subtitle">Listado de usuarios registrados en el sistema</p>
      </div>
      <div class="header-badge">
        {{ usuarios.length }} usuarios
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-box">
      <svg class="spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <span>Cargando usuarios...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="state-box error-box">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {{ error }}
    </div>

    <!-- Tabla -->
    <div v-else class="table-card">
      <table class="users-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Registrado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in usuarios" :key="user.idUsuario">
            <td class="td-id">{{ user.idUsuario }}</td>
            <td>
              <div class="user-cell">
                <div class="user-avatar">
                  {{ user.nombre.charAt(0).toUpperCase() }}
                </div>
                <span class="user-name">{{ user.nombre }}</span>
              </div>
            </td>
            <td class="td-email">{{ user.email }}</td>
            <td>
              <span class="role-badge" :class="user.rol.nombre">
                {{ user.rol.nombre }}
              </span>
            </td>
            <td class="td-date">{{ formatFecha(user.creadoEn) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

.users-page {
  font-family: 'Sora', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 900px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
  font-weight: 300;
}

.header-badge {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--accent);
  background: var(--accent-light);
  border: 1px solid var(--accent-border);
  border-radius: 99px;
  padding: 4px 14px;
}

/* States */
.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.error-box { color: #ef4444; background: #fef2f2; border-color: #fecaca; }

.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Table */
.table-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

thead tr {
  background: var(--bg-app);
  border-bottom: 1px solid var(--border);
}

th {
  padding: 12px 16px;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

tbody tr {
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}

tbody tr:last-child { border-bottom: none; }

tbody tr:hover { background: var(--bg-hover); }

td {
  padding: 14px 16px;
  color: var(--text-primary);
}

.td-id    { color: var(--text-muted); font-size: 0.8rem; width: 40px; }
.td-email { color: var(--text-secondary); }
.td-date  { color: var(--text-muted); font-size: 0.8rem; }

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #a5b4fc);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-name { font-weight: 500; }

.role-badge {
  font-size: 0.72rem;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 99px;
  text-transform: capitalize;
}

.role-badge.admin {
  background: #eef2ff;
  color: #6366f1;
  border: 1px solid #c7d2fe;
}

.role-badge.user {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}
</style>