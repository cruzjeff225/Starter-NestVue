<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

const auth = useAuthStore()

interface Usuario {
  idUsuario: number
  nombre: string
  email: string
  activo: boolean
  creadoEn: string
  rol: { nombre: string }
}

interface FormUsuario {
  nombre: string
  email: string
  contraseña: string
  rolId: number
}

// Estado principal
const usuarios = ref<Usuario[]>([])
const loading = ref(true)
const error = ref('')

// Modal crear - editar
const showModal = ref(false)
const editando = ref<number | null>(null)
const formError = ref('')
const formLoading = ref(false)

const form = reactive<FormUsuario>({
  nombre: '',
  email: '',
  contraseña: '',
  rolId: 2,
})

// Modal de roles
const showRolModal = ref(false)
const usuarioRol = ref<Usuario | null>(null)
const roles = ref<any[]>([])
const rolSeleccionado = ref<number | null>(null)
const rolLoading = ref(false)
const rolError = ref('')

// Carga de datos
async function cargarUsuarios() {
  try {
    loading.value = true
    error.value = ''
    const res = await api.get('/users')
    usuarios.value = res.data
  } catch {
    error.value = 'No se pudieron cargar los usuarios'
  } finally {
    loading.value = false
  }
}

// Modal crear - editar
function abrirCrear() {
  editando.value = null
  form.nombre = ''
  form.email = ''
  form.contraseña = ''
  form.rolId = 2
  formError.value = ''
  showModal.value = true
}

function abrirEditar(user: Usuario) {
  editando.value = user.idUsuario
  form.nombre = user.nombre
  form.email = user.email
  form.contraseña = ''
  formError.value = ''

  const rolActual = roles.value.find((r: any) => r.nombre === user.rol.nombre)
  form.rolId = rolActual ? Number(rolActual.idRol) : roles.value[0]?.idRol

  showModal.value = true
}

function cerrarModal() {
  showModal.value = false
}

async function guardar() {
  try {
    formLoading.value = true
    formError.value = ''

    if (editando.value === null) {
      await api.post('/users', {
        nombre: form.nombre,
        email: form.email,
        contraseña: form.contraseña,
        rolId: form.rolId,
      })
    } else {
      const payload: Partial<FormUsuario> = {
        nombre: form.nombre,
        email: form.email,
        rolId: form.rolId,
      }
      if (form.contraseña) payload.contraseña = form.contraseña
      await api.patch(`/users/${editando.value}`, payload)
    }

    await cargarUsuarios()
    cerrarModal()
  } catch (e: any) {
    formError.value = e?.response?.data?.message ?? 'Ocurrió un error'
  } finally {
    formLoading.value = false
  }
}

// Modal de roles
async function abrirModalRol(user: Usuario) {
  usuarioRol.value = user
  rolSeleccionado.value = null
  rolError.value = ''
  showRolModal.value = true

  if (roles.value.length === 0) {
    const res = await api.get('/users/roles')
    roles.value = res.data
  }

  const rolActual = roles.value.find((r: any) => r.nombre === user.rol.nombre)
  if (rolActual) rolSeleccionado.value = Number(rolActual.idRol)
}

function cerrarModalRol() {
  showRolModal.value = false
  usuarioRol.value = null
}

async function guardarRol() {
  if (!rolSeleccionado.value || !usuarioRol.value) return
  try {
    rolLoading.value = true
    rolError.value = ''
    await api.patch(`/users/${usuarioRol.value.idUsuario}/rol`, {
      rolId: rolSeleccionado.value,
    })
    await cargarUsuarios()
    cerrarModalRol()
  } catch (e: any) {
    rolError.value = e?.response?.data?.message ?? 'Error al cambiar rol'
  } finally {
    rolLoading.value = false
  }
}

function permisosDelRolSeleccionado(): string[] {
  const rol = roles.value.find((r: any) => Number(r.idRol) === rolSeleccionado.value)
  return rol?.permisos?.map((rp: any) => rp.permiso.nombre) ?? []
}

const etiquetaPermiso: Record<string, string> = {
  'usuarios:leer': '👁  Ver lista y detalle de usuarios',
  'usuarios:editar': '✏️  Editar datos básicos de usuarios',
  'usuarios:editar_rol': '🔑  Cambiar rol de usuarios',
  'usuarios:toggle_activo': '🔄  Activar / desactivar usuarios',
}

const etiquetaRol: Record<string, { label: string; descripcion: string }> = {
  'admin_full': { label: "Administrador Completo", descripcion: "Acceso total al sistema" },
  'admin_editor': { label: "Administrador Editor", descripcion: "Puede crear y editar usuarios pero no cambiar roles" },
  'admin_readonly': { label: "Administrador de Solo Lectura", descripcion: "Solo puede ver información, no puede hacer cambios" },
  'user': { label: "Usuario Estándar", descripcion: "Acceso limitado, sin permisos administrativos" },
}

// Toggle activo
async function toggleActivo(user: Usuario) {
  try {
    await api.patch(`/users/${user.idUsuario}/toggle_activo`)
    await cargarUsuarios()
  } catch {
    error.value = 'No se pudo cambiar el estado del usuario'
  }
}

// Helpers
function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

onMounted(async () => {
  await cargarUsuarios()
  const res = await api.get('/users/roles')
  roles.value = res.data
})
</script>

<template>
  <div class="users-page">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Usuarios</h1>
        <p class="page-subtitle">Gestión de usuarios del sistema</p>
      </div>
      <div class="header-right">
        <span class="header-badge">{{ usuarios.length }} usuarios</span>
        <button v-if="auth.tienePermiso('usuarios:editar')" class="btn-primary" @click="abrirCrear">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo usuario
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-box">
      <svg class="spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      Cargando usuarios...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="state-box error-box">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
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
            <th>Estado</th>
            <th>Registrado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in usuarios" :key="user.idUsuario">
            <td class="td-id">{{ user.idUsuario }}</td>
            <td>
              <div class="user-cell">
                <div class="user-avatar" :class="{ inactive: !user.activo }">
                  {{ user.nombre.charAt(0).toUpperCase() }}
                </div>
                <span class="user-name" :class="{ inactive: !user.activo }">
                  {{ user.nombre }}
                </span>
              </div>
            </td>
            <td class="td-email">{{ user.email }}</td>
            <td>
              <span class="role-badge" :class="user.rol.nombre">
                {{ etiquetaRol[user.rol.nombre]?.label ?? user.rol.nombre }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="user.activo ? 'activo' : 'inactivo'">
                <span class="status-dot"></span>
                {{ user.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="td-date">{{ formatFecha(user.creadoEn) }}</td>
            <td>
              <div class="actions">
                <!-- Editar -->
                <button v-if="auth.tienePermiso('usuarios:editar')" class="action-btn edit-btn" title="Editar usuario"
                  @click="abrirEditar(user)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>

                <!-- Cambiar rol -->
                <button v-if="auth.tienePermiso('usuarios:editar_rol')" class="action-btn rol-btn" title="Cambiar rol"
                  @click="abrirModalRol(user)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </button>

                <!-- Toggle activo -->
                <button v-if="auth.tienePermiso('usuarios:toggle_activo')" class="action-btn"
                  :class="user.activo ? 'deactivate-btn' : 'activate-btn'"
                  :title="user.activo ? 'Desactivar' : 'Activar'" @click="toggleActivo(user)">
                  <svg v-if="user.activo" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
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
        </tbody>
      </table>
    </div>

    <!-- Modal Crear - Editar -->
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal">

          <div class="modal-header">
            <h2 class="modal-title">
              {{ editando === null ? 'Nuevo usuario' : 'Editar usuario' }}
            </h2>
            <button class="modal-close" @click="cerrarModal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="field-group">
              <label class="field-label">Nombre completo</label>
              <input v-model="form.nombre" type="text" class="field-input" placeholder="Nombre del usuario" />
            </div>
            <div class="field-group">
              <label class="field-label">Correo electrónico</label>
              <input v-model="form.email" type="email" class="field-input" placeholder="correo@ejemplo.com" />
            </div>
            <div class="field-group">
              <label class="field-label">
                Contraseña
                <span v-if="editando !== null" class="field-hint">(dejar vacío para no cambiar)</span>
              </label>
              <input v-model="form.contraseña" type="password" class="field-input"
                :placeholder="editando !== null ? '••••••••' : 'Mínimo 6 caracteres'" />
            </div>
            <div class="field-group">
              <label class="field-label">Rol</label>
              <select v-model="form.rolId" class="field-input">
                <option v-for="rol in roles" :key="rol.idRol" :value="Number(rol.idRol)">
                  {{ etiquetaRol[rol.nombre]?.label ?? rol.nombre }}
                </option>
              </select>
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
            <button class="btn-primary" :disabled="formLoading" @click="guardar">
              <span v-if="!formLoading">
                {{ editando === null ? 'Crear usuario' : 'Guardar cambios' }}
              </span>
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

    <!-- Modal Cambiar Rol -->
    <Transition name="modal">
      <div v-if="showRolModal" class="modal-overlay" @click.self="cerrarModalRol">
        <div class="modal">

          <div class="modal-header">
            <div>
              <h2 class="modal-title">Cambiar rol</h2>
              <p class="modal-subtitle">{{ usuarioRol?.nombre }}</p>
            </div>
            <button class="modal-close" @click="cerrarModalRol">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="field-group">
              <label class="field-label">Seleccionar rol</label>
              <div class="roles-list">
                <button v-for="rol in roles" :key="rol.idRol" class="rol-option"
                  :class="{ selected: rolSeleccionado === Number(rol.idRol) }"
                  @click="rolSeleccionado = Number(rol.idRol)">
                  <div class="rol-option-header">
                    <div class="rol-info">
                      <span class="rol-nombre">{{ etiquetaRol[rol.nombre]?.label ?? rol.nombre }}</span>
                      <span class="rol-desc">{{ etiquetaRol[rol.nombre]?.descripcion }}</span>
                    </div>
                    <span v-if="rolSeleccionado === Number(rol.idRol)" class="rol-check">✓</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- Permisos del rol seleccionado -->
            <div v-if="rolSeleccionado" class="permisos-preview">
              <p class="permisos-title">Permisos de este rol</p>
              <div v-if="permisosDelRolSeleccionado().length > 0" class="permisos-list">
                <div v-for="permiso in permisosDelRolSeleccionado()" :key="permiso" class="permiso-item">
                  {{ etiquetaPermiso[permiso] ?? permiso }}
                </div>
              </div>
              <div v-else class="permisos-vacio">
                Sin permisos asignados
              </div>
            </div>

            <div v-if="rolError" class="form-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {{ rolError }}
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" @click="cerrarModalRol">Cancelar</button>
            <button class="btn-primary" :disabled="rolLoading || !rolSeleccionado" @click="guardarRol">
              <span v-if="!rolLoading">Guardar rol</span>
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

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

.users-page {
  font-family: 'Sora', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1000px;
}

/* Header */
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

/* Buttons */
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

/* Table */
.table-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
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

.td-date {
  color: var(--text-muted);
  font-size: 0.8rem;
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

/* Role badges */
.role-badge {
  font-size: 0.72rem;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 99px;
  text-transform: capitalize;
  white-space: nowrap;
}

.role-badge.admin_full {
  background: #eef2ff;
  color: #6366f1;
  border: 1px solid #c7d2fe;
}

.role-badge.admin_editor {
  background: #fdf4ff;
  color: #9333ea;
  border: 1px solid #e9d5ff;
}

.role-badge.admin_readonly {
  background: #fff7ed;
  color: #ea580c;
  border: 1px solid #fed7aa;
}

.role-badge.user {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

/* Status badge */
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

/* Actions */
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

.rol-btn:hover {
  background: #fffbeb;
  border-color: #fde68a;
  color: #d97706;
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

/* Modal base */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: var(--bg-card);
  border-radius: 16px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-subtitle {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 2px 0 0;
  font-weight: 300;
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
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 20px;
  border-top: 1px solid var(--border);
}

/* Form fields */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.field-hint {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 300;
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
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
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

/* Roles modal */
.roles-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rol-option {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  background: var(--bg-app);
  cursor: pointer;
  text-align: left;
  transition: all 0.18s;
  font-family: 'Sora', sans-serif;
}

.rol-option:hover {
  border-color: #6366f1;
  background: #eef2ff;
}

.rol-option.selected {
  border-color: #6366f1;
  background: #eef2ff;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.rol-option-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rol-nombre {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
  text-transform: capitalize;
}

.rol-check {
  font-size: 0.85rem;
  color: #6366f1;
  font-weight: 600;
}

.rol-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rol-desc {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 300;
}

.permisos-preview {
  background: var(--bg-app);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
}

.permisos-title {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 10px;
}

.permisos-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.permiso-item {
  font-size: 0.82rem;
  color: var(--text-secondary);
  padding: 5px 0;
  border-bottom: 1px solid var(--border);
}

.permiso-item:last-child {
  border-bottom: none;
}

.permisos-vacio {
  font-size: 0.82rem;
  color: var(--text-muted);
  font-style: italic;
}

/* Modal transition */
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