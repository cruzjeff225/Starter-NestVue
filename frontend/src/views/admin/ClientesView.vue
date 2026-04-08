<template>
  <div class="clientes-page">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Clientes</h1>
        <p class="page-subtitle">Gestión de clientes del sistema</p>
      </div>
      <div class="header-right">
        <span class="header-badge">{{ clientes.length }} clientes</span>
        <button v-if="auth.tienePermiso('clientes:crear')" class="btn-primary" @click="abrirModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo cliente
        </button>
      </div>
    </div>

    <!-- Búsqueda -->
    <div class="search-wrapper">
      <div class="search-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <input v-model="busqueda" type="text" class="search-input" placeholder="Buscar por nombre, email o DUI..."
        @input="buscar" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-box">
      <svg class="spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      Cargando clientes...
    </div>

    <!-- Error -->
    <div v-else-if="errorGlobal" class="state-box error-box">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {{ errorGlobal }}
    </div>

    <!-- Tabla -->
    <div v-else class="table-card">
      <table class="clientes-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>DUI</th>
            <th>Dirección</th>
            <th>Departamento - Municipio</th>
            <th>Estado</th>
            <th>Registrado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in clientes" :key="c.idCliente">
            <td class="td-id">{{ c.idCliente }}</td>
            <td>
              <div class="user-cell">
                <div class="user-avatar" :class="{ inactive: !c.activo }">
                  {{ c.nombre.charAt(0).toUpperCase() }}
                </div>
                <span class="user-name" :class="{ inactive: !c.activo }">
                  {{ c.nombre }} {{ c.apellido }}
                </span>
              </div>
            </td>
            <td class="td-email">{{ c.email }}</td>
            <td class="td-secondary">{{ c.telefono || '—' }}</td>
            <td class="td-secondary">{{ formatDui(c.dui) || '—' }}</td>
            <td class="td-secondary">{{ c.direccion || '—' }}</td>
            <td class="td-secondary">{{ c.departamento || '—' }} - {{ c.municipio || '—' }}</td>
            <td>
              <span class="status-badge" :class="c.activo ? 'activo' : 'inactivo'">
                <span class="status-dot"></span>
                {{ c.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="td-date">{{ formatFecha(c.creadoEn) }}</td>
            <td>
              <div class="actions">
                <button v-if="auth.tienePermiso('clientes:editar')" class="action-btn edit-btn" title="Editar cliente"
                  @click="abrirModal(c)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button v-if="auth.tienePermiso('clientes:toggle_activo')" class="action-btn"
                  :class="c.activo ? 'deactivate-btn' : 'activate-btn'" :title="c.activo ? 'Desactivar' : 'Activar'"
                  @click="toggleActivo(c)">
                  <svg v-if="c.activo" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="clientes.length === 0">
            <td colspan="10" class="empty-state">No se encontraron clientes</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Crear / Editar -->
    <Transition name="modal">
      <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">
              {{ clienteEditando ? 'Editar cliente' : 'Nuevo cliente' }}
            </h2>
            <button class="modal-close" @click="cerrarModal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-grid">
              <div class="field-group">
                <label class="field-label">Nombre</label>
                <input v-model="form.nombre" type="text" class="field-input" placeholder="Nombre del cliente"
                  required />
              </div>
              <div class="field-group">
                <label class="field-label">Apellido</label>
                <input v-model="form.apellido" type="text" class="field-input" placeholder="Apellido del cliente"
                  required />
              </div>
              <div class="field-group">
                <label class="field-label">Correo electrónico</label>
                <input v-model="form.email" type="email" class="field-input" placeholder="correo@ejemplo.com"
                  required />
              </div>
              <div class="field-group">
                <label class="field-label">Teléfono</label>
                <input v-model="form.telefono" type="text" class="field-input" placeholder="Teléfono del cliente"
                  required />
              </div>
              <div class="field-group">
                <label class="field-label">DUI</label>
                <input v-model="form.dui" type="text" class="field-input" placeholder="########-#"
                  @input="formatDuiInput" required />
              </div>
              <div class="field-group">
                <label class="field-label">Dirección</label>
                <input v-model="form.direccion" type="text" class="field-input" placeholder="Dirección del cliente"
                  required />
              </div>
              <div class="field-group">
                <label class="field-label">Departamento</label>
                <input v-model="form.departamento" type="text" class="field-input" placeholder="Departamento"
                  required />
              </div>
              <div class="field-group">
                <label class="field-label">Municipio</label>
                <input v-model="form.municipio" type="text" class="field-input" placeholder="Municipio" required />
              </div>
              <div class="field-group">
                <label class="field-label">Distrito</label>
                <input v-model="form.distrito" type="text" class="field-input" placeholder="Distrito" required />
              </div>
            </div>

            <div v-if="formError" class="form-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {{ formError }}
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" @click="cerrarModal">Cancelar</button>
            <button class="btn-primary" :disabled="guardando" @click="guardar">
              <span v-if="!guardando">{{ clienteEditando ? 'Guardar cambios' : 'Crear cliente' }}</span>
              <span v-else class="btn-loading">
                <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Guardando...
              </span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { clientesApi } from '../../services/api'

const auth = useAuthStore()

const clientes = ref<any[]>([])
const loading = ref(true)
const errorGlobal = ref('')

const modalAbierto = ref(false)
const clienteEditando = ref<any>(null)
const guardando = ref(false)
const formError = ref('')
const busqueda = ref('')

const formVacio = () => ({
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  dui: '',
  direccion: '',
  departamento: '',
  distrito: '',
  municipio: '',
})
const form = ref(formVacio())

onMounted(() => cargar())

async function cargar(search?: string) {
  try {
    loading.value = true
    errorGlobal.value = ''
    const { data } = await clientesApi.getAll(search)
    clientes.value = data
  } catch {
    errorGlobal.value = 'No se pudieron cargar los clientes'
  } finally {
    loading.value = false
  }
}

function buscar() {
  cargar(busqueda.value || undefined)
}

function abrirModal(cliente?: any) {
  clienteEditando.value = cliente || null
  formError.value = ''
  form.value = cliente
    ? {
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      email: cliente.email,
      telefono: cliente.telefono || '',
      dui: formatDui(cliente.dui) || '',
      direccion: cliente.direccion || '',
      departamento: cliente.departamento || '',
      distrito: cliente.distrito || '',
      municipio: cliente.municipio || '',
    }
    : formVacio()
  modalAbierto.value = true
}

function cerrarModal() {
  modalAbierto.value = false
}

async function guardar() {
  guardando.value = true
  formError.value = ''
  const duiClean = form.value.dui.replace('-', '')
  if (duiClean.length !== 9 || !/^\d{9}$/.test(duiClean)) {
    formError.value = 'El DUI debe tener exactamente 9 dígitos'
    guardando.value = false
    return
  }
  try {
    const dataToSend = { ...form.value, dui: duiClean }
    if (clienteEditando.value) {
      await clientesApi.update(clienteEditando.value.idCliente, dataToSend)
    } else {
      await clientesApi.create(dataToSend)
    }
    cerrarModal()
    cargar(busqueda.value || undefined)
  } catch (e: any) {
    const msg = e?.response?.data?.message
    formError.value = Array.isArray(msg) ? msg[0] : (msg ?? 'Ocurrió un error')
  } finally {
    guardando.value = false
  }
}

async function toggleActivo(cliente: any) {
  try {
    await clientesApi.toggleActivo(cliente.idCliente)
    cargar(busqueda.value || undefined)
  } catch {
    errorGlobal.value = 'No se pudo cambiar el estado del cliente'
  }
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function formatDui(value: string): string {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 8) {
    return cleaned;
  } else {
    return cleaned.slice(0, 8) + '-' + cleaned.slice(8, 9);
  }
}

function formatDuiInput(event: Event) {
  const target = event.target as HTMLInputElement;
  target.value = formatDui(target.value);
  form.value.dui = target.value;
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

.clientes-page {
  font-family: 'Sora', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1100px;
}

/* ── Header ─────────────────────────────────────── */
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

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
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

/* ── Botones ─────────────────────────────────────── */
.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: white;
  border: none;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 500;
  font-family: 'Sora', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 9px 16px;
  background: var(--bg-card);
  color: var(--text-secondary);
  border: 1.5px solid var(--border);
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 500;
  font-family: 'Sora', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ── Búsqueda ────────────────────────────────────── */
.search-wrapper {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 9px 12px 9px 36px;
  border: 1.5px solid var(--border);
  border-radius: 9px;
  font-size: 0.875rem;
  font-family: 'Sora', sans-serif;
  color: var(--text-primary);
  background: var(--bg-card);
  transition: all 0.2s;
  outline: none;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.search-input::placeholder {
  color: var(--text-muted);
}

/* ── Estados ─────────────────────────────────────── */
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

.error-box {
  color: #ef4444;
  background: #fef2f2;
  border-color: #fecaca;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Tabla ───────────────────────────────────────── */
.table-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.clientes-table {
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
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

tbody tr {
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}

tbody tr:last-child {
  border-bottom: none;
}

tbody tr:hover {
  background: var(--bg-hover);
}

td {
  padding: 14px 16px;
  color: var(--text-primary);
}

.td-id {
  color: var(--text-muted);
  font-size: 0.8rem;
  width: 40px;
}

.td-email {
  color: var(--text-secondary);
}

.td-secondary {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.td-date {
  color: var(--text-muted);
  font-size: 0.8rem;
  white-space: nowrap;
}

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
  transition: opacity 0.2s;
}

.user-avatar.inactive {
  opacity: 0.4;
}

.user-name.inactive {
  color: var(--text-muted);
  text-decoration: line-through;
}

/* ── Status badge ────────────────────────────────── */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 99px;
}

.status-badge.activo {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.status-badge.inactivo {
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* ── Acciones ────────────────────────────────────── */
.actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: 1.5px solid var(--border);
  background: var(--bg-card);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s;
  color: var(--text-muted);
}

.edit-btn:hover {
  background: #eef2ff;
  border-color: #c7d2fe;
  color: #6366f1;
}

.deactivate-btn:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #ef4444;
}

.activate-btn:hover {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #16a34a;
}

/* ── Estado vacío ────────────────────────────────── */
.empty-state {
  text-align: center;
  padding: 48px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* ── Modal overlay ───────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
}

.modal-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1.5px solid var(--border);
  background: var(--bg-card);
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s;
}

.modal-close:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #ef4444;
}

.modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--bg-card);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 20px;
  border-top: 1px solid var(--border);
  background: var(--bg-card);
}

/* ── Form ────────────────────────────────────────── */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.field-input {
  padding: 9px 12px;
  border: 1.5px solid var(--border);
  border-radius: 9px;
  font-size: 0.875rem;
  font-family: 'Sora', sans-serif;
  color: var(--text-primary);
  background: var(--bg-app);
  transition: all 0.2s;
  outline: none;
}

.field-input:focus {
  border-color: #6366f1;
  background: var(--bg-card);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.field-input::placeholder {
  color: var(--text-muted);
}

.form-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #ef4444;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 8px 12px;
}

/* ── Transition ──────────────────────────────────── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.95) translateY(10px);
}
</style>