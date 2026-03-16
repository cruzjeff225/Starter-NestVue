<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '../../services/api'

// Types
interface Permiso {
    idPermiso: number
    nombre: string
    _count?: { roles: number }
}

interface Rol {
    idRol: number
    nombre: string
    permisos: { permiso: Permiso }[]
    _count?: { usuarios: number }
}

// Tab activo
const tabActivo = ref<'permisos' | 'roles'>('permisos')

// Estado permisos
const permisos = ref<Permiso[]>([])
const loadingPermisos = ref(true)
const errorPermisos = ref('')

// Estado roles
const roles = ref<Rol[]>([])
const loadingRoles = ref(true)
const errorRoles = ref('')

// Modal permiso
const showModalPermiso = ref(false)
const editandoPermiso = ref<number | null>(null)
const formPermiso = ref('')
const formPermisoError = ref('')
const formPermisoLoading = ref(false)

// Modal rol
const showModalRol = ref(false)
const editandoRol = ref<number | null>(null)
const formRol = ref('')
const formRolError = ref('')
const formRolLoading = ref(false)

// Modal gestionar permisos de un rol
const showModalGestionar = ref(false)
const rolGestionando = ref<Rol | null>(null)
const toggleLoading = ref<number | null>(null)

// Modal confirmación eliminar
const showConfirm = ref(false)
const confirmMsg = ref('')
const confirmAction = ref<(() => Promise<void>) | null>(null)
const confirmLoading = ref(false)

// Carga de datos
async function cargarPermisos() {
    try {
        loadingPermisos.value = true
        errorPermisos.value = ''
        const res = await api.get('/permissions')
        permisos.value = res.data
    } catch {
        errorPermisos.value = 'No se pudieron cargar los permisos'
    } finally {
        loadingPermisos.value = false
    }
}

async function cargarRoles() {
    try {
        loadingRoles.value = true
        errorRoles.value = ''
        const res = await api.get('/roles')
        roles.value = res.data
    } catch {
        errorRoles.value = 'No se pudieron cargar los roles'
    } finally {
        loadingRoles.value = false
    }
}

// CRUD Permisos
function abrirCrearPermiso() {
    editandoPermiso.value = null
    formPermiso.value = ''
    formPermisoError.value = ''
    showModalPermiso.value = true
}

function abrirEditarPermiso(p: Permiso) {
    editandoPermiso.value = p.idPermiso
    formPermiso.value = p.nombre
    formPermisoError.value = ''
    showModalPermiso.value = true
}

async function guardarPermiso() {
    try {
        formPermisoLoading.value = true
        formPermisoError.value = ''
        if (editandoPermiso.value === null) {
            await api.post('/permissions', { nombre: formPermiso.value })
        } else {
            await api.patch(`/permissions/${editandoPermiso.value}`, { nombre: formPermiso.value })
        }
        await cargarPermisos()
        showModalPermiso.value = false
    } catch (e: any) {
        const msg = e?.response?.data?.message
        formPermisoError.value = Array.isArray(msg) ? msg[0] : (msg ?? 'Ocurrió un error')
    } finally {
        formPermisoLoading.value = false
    }
}

function pedirEliminarPermiso(p: Permiso) {
    confirmMsg.value = `¿Eliminar el permiso "${p.nombre}"? Esta acción no se puede deshacer.`
    confirmAction.value = async () => {
        await api.delete(`/permissions/${p.idPermiso}`)
        await cargarPermisos()
    }
    showConfirm.value = true
}

// CRUD Roles
function abrirCrearRol() {
    editandoRol.value = null
    formRol.value = ''
    formRolError.value = ''
    showModalRol.value = true
}

function abrirEditarRol(r: Rol) {
    editandoRol.value = r.idRol
    formRol.value = r.nombre
    formRolError.value = ''
    showModalRol.value = true
}

async function guardarRol() {
    try {
        formRolLoading.value = true
        formRolError.value = ''
        if (editandoRol.value === null) {
            await api.post('/roles', { nombre: formRol.value })
        } else {
            await api.patch(`/roles/${editandoRol.value}`, { nombre: formRol.value })
        }
        await cargarRoles()
        showModalRol.value = false
    } catch (e: any) {
        const msg = e?.response?.data?.message
        formRolError.value = Array.isArray(msg) ? msg[0] : (msg ?? 'Ocurrió un error')
    } finally {
        formRolLoading.value = false
    }
}

function pedirEliminarRol(r: Rol) {
    confirmMsg.value = `¿Eliminar el rol "${r.nombre}"? Esta acción no se puede deshacer.`
    confirmAction.value = async () => {
        await api.delete(`/roles/${r.idRol}`)
        await cargarRoles()
    }
    showConfirm.value = true
}

// Gestionar permisos de un rol
function abrirGestionar(r: Rol) {
    rolGestionando.value = r
    showModalGestionar.value = true
}

function rolTienePermiso(permisoId: number): boolean {
    return rolGestionando.value?.permisos.some(
        (rp) => rp.permiso.idPermiso === permisoId
    ) ?? false
}

async function togglePermiso(permiso: Permiso) {
    if (!rolGestionando.value) return
    toggleLoading.value = permiso.idPermiso
    try {
        const rolId = rolGestionando.value.idRol
        const permisoId = permiso.idPermiso
        if (rolTienePermiso(permisoId)) {
            await api.delete(`/roles/${rolId}/permissions/${permisoId}`)
        } else {
            await api.post(`/roles/${rolId}/permissions`, { permisoId })
        }
        const res = await api.get(`/roles/${rolId}`)
        rolGestionando.value = res.data
        const idx = roles.value.findIndex((r) => r.idRol === rolId)
        if (idx !== -1) roles.value[idx] = res.data
    } catch (e: any) {
        errorRoles.value = e?.response?.data?.message ?? 'Error al cambiar permiso'
        setTimeout(() => { errorRoles.value = '' }, 3000)
    } finally {
        toggleLoading.value = null
    }
}

// Confirmación
async function ejecutarConfirm() {
    if (!confirmAction.value) return
    try {
        confirmLoading.value = true
        await confirmAction.value()
        showConfirm.value = false
    } catch (e: any) {
        const msg = e?.response?.data?.message
        alert(Array.isArray(msg) ? msg[0] : (msg ?? 'No se pudo completar la acción'))
    } finally {
        confirmLoading.value = false
    }
}

// Computed
const permisosDisponibles = computed(() =>
    permisos.value.filter((p) => p.nombre !== 'superadmin:todo')
)

onMounted(async () => {
    await Promise.all([cargarPermisos(), cargarRoles()])
})
</script>

<template>
    <div class="rp-page">

        <!-- Header -->
        <div class="page-header">
            <div>
                <h1 class="page-title">Roles y Permisos</h1>
                <p class="page-subtitle">Gestión de accesos del sistema</p>
            </div>
        </div>

        <!-- Tabs y botón -->
        <div class="tabs-row">
            <div class="tabs">
                <button class="tab-btn" :class="{ active: tabActivo === 'permisos' }" @click="tabActivo = 'permisos'">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Permisos
                    <span class="tab-count">{{ permisos.length }}</span>
                </button>
                <button class="tab-btn" :class="{ active: tabActivo === 'roles' }" @click="tabActivo = 'roles'">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Roles
                    <span class="tab-count">{{ roles.length }}</span>
                </button>
            </div>

            <!-- Botón dinámico según tab activo -->
            <button class="btn-primary" @click="tabActivo === 'permisos' ? abrirCrearPermiso() : abrirCrearRol()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {{ tabActivo === 'permisos' ? 'Nuevo permiso' : 'Nuevo rol' }}
            </button>
        </div>

        <!-- TAB PERMISOS -->
        <div v-if="tabActivo === 'permisos'">

            <div v-if="loadingPermisos" class="state-box">
                <svg class="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Cargando permisos...
            </div>

            <div v-else-if="errorPermisos" class="state-box error-box">{{ errorPermisos }}</div>

            <div v-else class="table-card">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Nombre del permiso</th>
                            <th>Roles que lo usan</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="p in permisos" :key="p.idPermiso">
                            <td class="td-id">{{ p.idPermiso }}</td>
                            <td>
                                <span class="permiso-nombre">{{ p.nombre }}</span>
                                <span v-if="p.nombre === 'superadmin:todo'" class="badge-sistema">sistema</span>
                            </td>
                            <td>
                                <span class="meta-count">
                                    {{ p._count?.roles ?? 0 }} rol{{ (p._count?.roles ?? 0) !== 1 ? 'es' : '' }}
                                </span>
                            </td>
                            <td>
                                <div class="actions" v-if="p.nombre !== 'superadmin:todo'">
                                    <button class="action-btn edit-btn" title="Editar" @click="abrirEditarPermiso(p)">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" stroke-width="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button class="action-btn delete-btn" title="Eliminar"
                                        @click="pedirEliminarPermiso(p)">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" stroke-width="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                            <path d="M10 11v6M14 11v6" />
                                            <path d="M9 6V4h6v2" />
                                        </svg>
                                    </button>
                                </div>
                                <span v-else class="td-muted">—</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- TAB ROLES -->
        <div v-if="tabActivo === 'roles'">

            <div v-if="loadingRoles" class="state-box">
                <svg class="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Cargando roles...
            </div>

            <div v-else-if="errorRoles" class="state-box error-box">{{ errorRoles }}</div>

            <div v-else class="table-card">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Nombre del rol</th>
                            <th>Permisos</th>
                            <th>Usuarios</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="r in roles" :key="r.idRol">
                            <td class="td-id">{{ r.idRol }}</td>
                            <td>
                                <div class="rol-cell">
                                    <span class="rol-nombre">{{ r.nombre }}</span>
                                    <span v-if="r.nombre === 'superadmin'" class="badge-sistema">sistema</span>
                                </div>
                            </td>
                            <td>
                                <div class="permisos-chips">
                                    <span v-for="rp in r.permisos.slice(0, 3)" :key="rp.permiso.idPermiso"
                                        class="permiso-chip">
                                        {{ rp.permiso.nombre }}
                                    </span>
                                    <span v-if="r.permisos.length > 3" class="permiso-chip more">
                                        +{{ r.permisos.length - 3 }}
                                    </span>
                                    <span v-if="r.permisos.length === 0" class="td-muted">Sin permisos</span>
                                </div>
                            </td>
                            <td>
                                <span class="meta-count">
                                    {{ r._count?.usuarios ?? 0 }} usuario{{ (r._count?.usuarios ?? 0) !== 1 ? 's' : ''
                                    }}
                                </span>
                            </td>
                            <td>
                                <div class="actions">
                                    <button v-if="r.nombre !== 'superadmin'" class="action-btn permisos-btn"
                                        title="Gestionar permisos" @click="abrirGestionar(r)">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" stroke-width="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                    </button>
                                    <button v-if="r.nombre !== 'superadmin'" class="action-btn edit-btn" title="Editar"
                                        @click="abrirEditarRol(r)">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" stroke-width="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button v-if="r.nombre !== 'superadmin'" class="action-btn delete-btn"
                                        title="Eliminar" @click="pedirEliminarRol(r)">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" stroke-width="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                            <path d="M10 11v6M14 11v6" />
                                            <path d="M9 6V4h6v2" />
                                        </svg>
                                    </button>
                                    <span v-if="r.nombre === 'superadmin'" class="td-muted">—</span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Modal Permiso -->
        <Transition name="modal">
            <div v-if="showModalPermiso" class="modal-overlay" @click.self="showModalPermiso = false">
                <div class="modal">
                    <div class="modal-header">
                        <h2 class="modal-title">{{ editandoPermiso === null ? 'Nuevo permiso' : 'Editar permiso' }}</h2>
                        <button class="modal-close" @click="showModalPermiso = false">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="field-group">
                            <label class="field-label">Nombre del permiso</label>
                            <input v-model="formPermiso" type="text" class="field-input"
                                placeholder="ej: productos:crear" @keyup.enter="guardarPermiso" />
                            <p class="field-hint-block">
                                Usa el formato <strong>recurso:accion</strong>.
                                Ejemplo: <code>reportes:exportar</code>
                            </p>
                        </div>
                        <div v-if="formPermisoError" class="form-error">{{ formPermisoError }}</div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" @click="showModalPermiso = false">Cancelar</button>
                        <button class="btn-primary" :disabled="formPermisoLoading" @click="guardarPermiso">
                            <span v-if="!formPermisoLoading">{{ editandoPermiso === null ? 'Crear permiso' : 'Guardar cambios' }}</span>
                            <span v-else class="btn-loading">
                                <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                                Guardando...
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Modal Rol -->
        <Transition name="modal">
            <div v-if="showModalRol" class="modal-overlay" @click.self="showModalRol = false">
                <div class="modal">
                    <div class="modal-header">
                        <h2 class="modal-title">{{ editandoRol === null ? 'Nuevo rol' : 'Editar rol' }}</h2>
                        <button class="modal-close" @click="showModalRol = false">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="field-group">
                            <label class="field-label">Nombre del rol</label>
                            <input v-model="formRol" type="text" class="field-input" placeholder="ej: editor_contenido"
                                @keyup.enter="guardarRol" />
                        </div>
                        <div v-if="formRolError" class="form-error">{{ formRolError }}</div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" @click="showModalRol = false">Cancelar</button>
                        <button class="btn-primary" :disabled="formRolLoading" @click="guardarRol">
                            <span v-if="!formRolLoading">{{ editandoRol === null ? 'Crear rol' : 'Guardar cambios'
                                }}</span>
                            <span v-else class="btn-loading">
                                <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                                Guardando...
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Modal Gestionar Permisos de Rol -->
        <Transition name="modal">
            <div v-if="showModalGestionar" class="modal-overlay" @click.self="showModalGestionar = false">
                <div class="modal modal-wide">
                    <div class="modal-header">
                        <div>
                            <h2 class="modal-title">Permisos del rol</h2>
                            <p class="modal-subtitle">{{ rolGestionando?.nombre }}</p>
                        </div>
                        <button class="modal-close" @click="showModalGestionar = false">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p class="gestionar-desc">
                            Activa o desactiva los permisos de este rol. Los cambios se aplican inmediatamente.
                        </p>
                        <div v-if="permisosDisponibles.length === 0" class="state-box">
                            No hay permisos creados aún. Crea permisos en la pestaña de Permisos.
                        </div>
                        <div v-else class="toggle-list">
                            <div v-for="p in permisosDisponibles" :key="p.idPermiso" class="toggle-item">
                                <span class="toggle-nombre">{{ p.nombre }}</span>
                                <button class="toggle-switch"
                                    :class="{ on: rolTienePermiso(p.idPermiso), loading: toggleLoading === p.idPermiso }"
                                    :disabled="toggleLoading !== null" @click="togglePermiso(p)">
                                    <span class="toggle-thumb"></span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-primary" @click="showModalGestionar = false">Listo</button>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Modal Confirmación -->
        <Transition name="modal">
            <div v-if="showConfirm" class="modal-overlay" @click.self="showConfirm = false">
                <div class="modal modal-sm">
                    <div class="modal-header">
                        <h2 class="modal-title">Confirmar acción</h2>
                    </div>
                    <div class="modal-body">
                        <p class="confirm-msg">{{ confirmMsg }}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" @click="showConfirm = false">Cancelar</button>
                        <button class="btn-danger" :disabled="confirmLoading" @click="ejecutarConfirm">
                            <span v-if="!confirmLoading">Eliminar</span>
                            <span v-else class="btn-loading">
                                <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                                Eliminando...
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

.rp-page {
    font-family: 'Sora', sans-serif;
    display: flex;
    flex-direction: column;
    gap: 16px;
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

/* Tabs row */
.tabs-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.tabs {
    display: flex;
    gap: 4px;
    background: var(--bg-app);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 4px;
}

.tab-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 18px;
    border: none;
    border-radius: 9px;
    font-size: 0.85rem;
    font-weight: 500;
    font-family: 'Sora', sans-serif;
    color: var(--text-muted);
    background: transparent;
    cursor: pointer;
    transition: all 0.18s;
}

.tab-btn:hover {
    color: var(--text-primary);
    background: var(--bg-hover);
}

.tab-btn.active {
    background: var(--bg-card);
    color: var(--text-primary);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.tab-count {
    font-size: 0.7rem;
    font-weight: 600;
    background: var(--accent-light);
    color: var(--accent);
    border-radius: 99px;
    padding: 1px 7px;
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
    white-space: nowrap;
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

.btn-danger {
    padding: 9px 16px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 9px;
    font-size: 0.85rem;
    font-weight: 500;
    font-family: 'Sora', sans-serif;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-danger:hover:not(:disabled) {
    background: #dc2626;
}

.btn-danger:disabled {
    opacity: 0.7;
    cursor: not-allowed;
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

.data-table {
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
    vertical-align: middle;
}

.td-id {
    color: var(--text-muted);
    font-size: 0.8rem;
    width: 40px;
}

.td-muted {
    color: var(--text-muted);
    font-size: 0.8rem;
}

.permiso-nombre {
    font-weight: 500;
}

.badge-sistema {
    display: inline-block;
    margin-left: 8px;
    font-size: 0.65rem;
    font-weight: 600;
    background: #fef3c7;
    color: #d97706;
    border: 1px solid #fde68a;
    border-radius: 99px;
    padding: 1px 8px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.meta-count {
    font-size: 0.8rem;
    color: var(--text-muted);
}

.rol-cell {
    display: flex;
    align-items: center;
    gap: 8px;
}

.rol-nombre {
    font-weight: 500;
}

.permisos-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.permiso-chip {
    font-size: 0.68rem;
    font-family: monospace;
    background: var(--bg-app);
    color: var(--text-secondary);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 2px 7px;
}

.permiso-chip.more {
    background: var(--accent-light);
    color: var(--accent);
    border-color: var(--accent-border);
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

.delete-btn:hover {
    background: #fef2f2;
    border-color: #fecaca;
    color: #ef4444;
}

.permisos-btn:hover {
    background: #fffbeb;
    border-color: #fde68a;
    color: #d97706;
}

/* Modal */
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
    max-width: 440px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
    overflow: hidden;
}

.modal-wide {
    max-width: 520px;
}

.modal-sm {
    max-width: 380px;
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
    background: var(--bg-card);
    max-height: 60vh;
    overflow-y: auto;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 14px 24px 18px;
    border-top: 1px solid var(--border);
    background: var(--bg-card);
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

.field-hint-block {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin: 2px 0 0;
    line-height: 1.5;
}

.field-hint-block code {
    font-family: monospace;
    background: var(--bg-app);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 1px 5px;
    font-size: 0.78rem;
    color: #6366f1;
}

.form-error {
    font-size: 0.8rem;
    color: #ef4444;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 8px 12px;
}

/* Toggle list */
.gestionar-desc {
    font-size: 0.82rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.5;
}

.toggle-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.toggle-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--bg-app);
    transition: background 0.15s;
}

.toggle-item:hover {
    background: var(--bg-hover);
}

.toggle-nombre {
    font-size: 0.83rem;
    font-family: monospace;
    color: var(--text-primary);
    font-weight: 500;
}

.toggle-switch {
    position: relative;
    width: 42px;
    height: 24px;
    border-radius: 99px;
    border: none;
    background: var(--border);
    cursor: pointer;
    transition: background 0.25s;
    flex-shrink: 0;
}

.toggle-switch.on {
    background: #6366f1;
}

.toggle-switch.loading {
    opacity: 0.6;
    cursor: not-allowed;
}

.toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    transition: transform 0.25s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-switch.on .toggle-thumb {
    transform: translateX(18px);
}

/* Confirm */
.confirm-msg {
    font-size: 0.88rem;
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0;
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