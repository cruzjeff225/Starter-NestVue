<template>
    <div class="habitaciones-page">

        <!-- Header -->
        <div class="page-header">
            <div>
                <h1 class="page-title">Habitaciones</h1>
                <p class="page-subtitle">Gestión de habitaciones del hotel</p>
            </div>
            <div class="header-right">
                <span class="header-badge">{{ habitaciones.length }} habitaciones</span>
                <button v-if="auth.tienePermiso('habitaciones:gestionar_tipos')" class="btn-secondary"
                    @click="abrirModalTipos">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Tipos
                </button>
                <button v-if="auth.tienePermiso('habitaciones:crear')" class="btn-primary" @click="abrirModal()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Nueva habitación
                </button>
            </div>
        </div>

        <!-- Filtros -->
        <div class="filters-row">
            <div class="search-wrapper">
                <div class="search-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </div>
                <input v-model="filtros.search" type="text" class="search-input"
                    placeholder="Buscar por número o descripción..." @input="cargar" />
            </div>
            <select v-model="filtros.estado" class="filter-select" @change="cargar">
                <option value="">Todos los estados</option>
                <option value="disponible">Disponible</option>
                <option value="ocupada">Ocupada</option>
                <option value="reservada">Reservada</option>
                <option value="mantenimiento">Mantenimiento</option>
            </select>
            <select v-model="filtros.tipoId" class="filter-select" @change="cargar">
                <option value="">Todos los tipos</option>
                <option v-for="t in tipos" :key="t.idTipo" :value="t.idTipo">{{ t.nombre }}</option>
            </select>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="state-box">
            <svg class="spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Cargando habitaciones...
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
            <table class="hab-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Habitación</th>
                        <th>Tipo</th>
                        <th>Piso</th>
                        <th>Capacidad</th>
                        <th>Precio/noche</th>
                        <th>Amenidades</th>
                        <th>Estado</th>
                        <th>Activo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="h in habitaciones" :key="h.idHabitacion">
                        <td class="td-id">{{ h.idHabitacion }}</td>
                        <td>
                            <div class="hab-cell">
                                <div class="hab-avatar" :class="{ inactive: !h.activo }">
                                    {{ h.numero }}
                                </div>
                                <span class="hab-desc" :class="{ inactive: !h.activo }">
                                    {{ h.descripcion || 'Sin descripción' }}
                                </span>
                            </div>
                        </td>
                        <td>
                            <span class="tipo-badge">{{ h.tipo.nombre }}</span>
                        </td>
                        <td class="td-secondary">Piso {{ h.piso }}</td>
                        <td class="td-secondary">{{ h.capacidad }} pers.</td>
                        <td class="td-price">${{ formatPrecio(h.tipo.precioBase) }}</td>
                        <td>
                            <div class="amenidades-list">
                                <span v-for="a in (h.amenidades || []).slice(0, 3)" :key="a" class="amenidad-tag">{{ a
                                    }}</span>
                                <span v-if="(h.amenidades || []).length > 3" class="amenidad-tag more">
                                    +{{ h.amenidades.length - 3 }}
                                </span>
                            </div>
                        </td>
                        <td>
                            <span class="estado-badge" :class="h.estado">
                                <span class="status-dot"></span>
                                {{ etiquetaEstado[h.estado] }}
                            </span>
                        </td>
                        <td>
                            <span class="status-badge" :class="h.activo ? 'activo' : 'inactivo'">
                                <span class="status-dot"></span>
                                {{ h.activo ? 'Activo' : 'Inactivo' }}
                            </span>
                        </td>
                        <td>
                            <div class="actions">
                                <button v-if="auth.tienePermiso('habitaciones:cambiar_estado')"
                                    class="action-btn estado-btn" title="Cambiar estado" @click="abrirModalEstado(h)">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        stroke-width="2">
                                        <polyline points="17 1 21 5 17 9" />
                                        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                                        <polyline points="7 23 3 19 7 15" />
                                        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                                    </svg>
                                </button>
                                <button v-if="auth.tienePermiso('habitaciones:editar')" class="action-btn edit-btn"
                                    title="Editar" @click="abrirModal(h)">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                                <button v-if="auth.tienePermiso('habitaciones:toggle_activo')" class="action-btn"
                                    :class="h.activo ? 'deactivate-btn' : 'activate-btn'"
                                    :title="h.activo ? 'Desactivar' : 'Activar'" @click="toggleActivo(h)">
                                    <svg v-if="h.activo" width="14" height="14" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="8" y1="12" x2="16" y2="12" />
                                    </svg>
                                    <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="16" />
                                        <line x1="8" y1="12" x2="16" y2="12" />
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                    <tr v-if="habitaciones.length === 0">
                        <td colspan="10" class="empty-state">No se encontraron habitaciones</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Modal Crear / Editar habitación -->
        <Transition name="modal">
            <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h2 class="modal-title">{{ editando ? 'Editar habitación' : 'Nueva habitación' }}</h2>
                        <button class="modal-close" @click="cerrarModal">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-grid">
                            <div class="field-group">
                                <label class="field-label">Número *</label>
                                <input v-model="form.numero" type="text" class="field-input"
                                    placeholder="Ej: 101, 202-A" />
                            </div>
                            <div class="field-group">
                                <label class="field-label">Tipo *</label>
                                <select v-model="form.tipoId" class="field-input">
                                    <option value="">Seleccionar tipo</option>
                                    <option v-for="t in tipos" :key="t.idTipo" :value="t.idTipo">
                                        {{ t.nombre }} — ${{ formatPrecio(t.precioBase) }}/noche
                                    </option>
                                </select>
                            </div>
                            <div class="field-group">
                                <label class="field-label">Piso *</label>
                                <input v-model.number="form.piso" type="number" min="1" class="field-input"
                                    placeholder="1" />
                            </div>
                            <div class="field-group">
                                <label class="field-label">Capacidad (personas) *</label>
                                <input v-model.number="form.capacidad" type="number" min="1" class="field-input"
                                    placeholder="2" />
                            </div>
                            <div class="field-group full-width">
                                <label class="field-label">Descripción</label>
                                <input v-model="form.descripcion" type="text" class="field-input"
                                    placeholder="Opcional" />
                            </div>
                            <div class="field-group full-width">
                                <label class="field-label">Imagen URL</label>
                                <input v-model="form.imagenUrl" type="text" class="field-input"
                                    placeholder="https://..." />
                            </div>
                            <div class="field-group full-width">
                                <label class="field-label">
                                    Amenidades
                                    <span class="field-hint">Presiona Enter o coma para agregar</span>
                                </label>
                                <div class="amenidades-input-wrapper">
                                    <div class="amenidades-tags">
                                        <span v-for="(a, i) in form.amenidades" :key="i" class="amenidad-tag editable">
                                            {{ a }}
                                            <button class="amenidad-remove" @click="removeAmenidad(i)">×</button>
                                        </span>
                                        <input v-model="amenidadInput" type="text" class="amenidad-input"
                                            placeholder="wifi, AC, TV..." @keydown.enter.prevent="addAmenidad"
                                            @keydown.comma.prevent="addAmenidad" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-if="formError" class="form-error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
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
                            <span v-if="!guardando">{{ editando ? 'Guardar cambios' : 'Crear habitación' }}</span>
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

        <!-- Modal Cambiar Estado -->
        <Transition name="modal">
            <div v-if="modalEstado" class="modal-overlay" @click.self="cerrarModalEstado">
                <div class="modal">
                    <div class="modal-header">
                        <div>
                            <h2 class="modal-title">Cambiar estado</h2>
                            <p class="modal-subtitle">Habitación {{ habitacionEstado?.numero }}</p>
                        </div>
                        <button class="modal-close" @click="cerrarModalEstado">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="estados-list">
                            <button v-for="e in estados" :key="e.value" class="estado-option"
                                :class="{ selected: estadoSeleccionado === e.value }"
                                @click="estadoSeleccionado = e.value">
                                <div class="estado-option-left">
                                    <span class="estado-dot-lg" :class="e.value"></span>
                                    <div>
                                        <span class="estado-label">{{ e.label }}</span>
                                        <span class="estado-desc">{{ e.descripcion }}</span>
                                    </div>
                                </div>
                                <span v-if="estadoSeleccionado === e.value" class="check-mark">✓</span>
                            </button>
                        </div>
                        <div v-if="estadoError" class="form-error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {{ estadoError }}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" @click="cerrarModalEstado">Cancelar</button>
                        <button class="btn-primary" :disabled="estadoLoading || !estadoSeleccionado"
                            @click="guardarEstado">
                            <span v-if="!estadoLoading">Guardar estado</span>
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

        <!-- Modal Tipos de Habitación -->
        <Transition name="modal">
            <div v-if="modalTipos" class="modal-overlay" @click.self="cerrarModalTipos">
                <div class="modal">
                    <div class="modal-header">
                        <h2 class="modal-title">Tipos de habitación</h2>
                        <button class="modal-close" @click="cerrarModalTipos">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <!-- Form nuevo/editar tipo -->
                        <div class="tipo-form">
                            <div class="form-grid tipo-grid">
                                <div class="field-group">
                                    <label class="field-label">Nombre</label>
                                    <input v-model="tipoForm.nombre" type="text" class="field-input"
                                        placeholder="Suite, Doble..." />
                                </div>
                                <div class="field-group">
                                    <label class="field-label">Precio base / noche ($)</label>
                                    <input v-model.number="tipoForm.precioBase" type="number" min="0" step="0.01"
                                        class="field-input" placeholder="0.00" />
                                </div>
                                <div class="field-group full-width">
                                    <label class="field-label">Descripción</label>
                                    <input v-model="tipoForm.descripcion" type="text" class="field-input"
                                        placeholder="Opcional" />
                                </div>
                            </div>
                            <div v-if="tipoError" class="form-error">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {{ tipoError }}
                            </div>
                            <div class="tipo-form-actions">
                                <button v-if="tipoEditando" class="btn-secondary"
                                    @click="cancelarEdicionTipo">Cancelar</button>
                                <button class="btn-primary" :disabled="tipoLoading" @click="guardarTipo">
                                    <span v-if="!tipoLoading">{{ tipoEditando ? 'Actualizar tipo' : 'Agregar tipo'
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

                        <!-- Lista de tipos -->
                        <div class="tipos-list">
                            <div v-for="t in tipos" :key="t.idTipo" class="tipo-item">
                                <div class="tipo-info">
                                    <span class="tipo-nombre">{{ t.nombre }}</span>
                                    <span class="tipo-precio">${{ formatPrecio(t.precioBase) }}/noche</span>
                                    <span class="tipo-count">{{ t._count?.habitaciones ?? 0 }} hab.</span>
                                </div>
                                <div class="tipo-actions">
                                    <button class="action-btn edit-btn" title="Editar" @click="editarTipo(t)">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" stroke-width="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button class="action-btn deactivate-btn" title="Eliminar" @click="eliminarTipo(t)">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" stroke-width="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                            <path d="M10 11v6" />
                                            <path d="M14 11v6" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div v-if="tipos.length === 0" class="empty-state-sm">No hay tipos creados aún</div>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>

    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { habitacionesApi } from '../../services/api'

const auth = useAuthStore()

const habitaciones = ref<any[]>([])
const tipos = ref<any[]>([])
const loading = ref(true)
const errorGlobal = ref('')

// Filtros
const filtros = reactive({ search: '', estado: '', tipoId: '' })

// Modal habitación
const modalAbierto = ref(false)
const editando = ref<any>(null)
const guardando = ref(false)
const formError = ref('')
const amenidadInput = ref('')

const formVacio = () => ({
    numero: '', tipoId: '' as any, piso: 1,
    capacidad: 2, descripcion: '', imagenUrl: '',
    amenidades: [] as string[],
})
const form = ref(formVacio())

// Modal estado
const modalEstado = ref(false)
const habitacionEstado = ref<any>(null)
const estadoSeleccionado = ref('')
const estadoLoading = ref(false)
const estadoError = ref('')

// Modal tipos
const modalTipos = ref(false)
const tipoEditando = ref<any>(null)
const tipoLoading = ref(false)
const tipoError = ref('')
const tipoForm = reactive({ nombre: '', precioBase: 0, descripcion: '' })

const etiquetaEstado: Record<string, string> = {
    disponible: 'Disponible',
    ocupada: 'Ocupada',
    reservada: 'Reservada',
    mantenimiento: 'Mantenimiento',
}

const estados = [
    { value: 'disponible', label: 'Disponible', descripcion: 'Lista para recibir huéspedes' },
    { value: 'ocupada', label: 'Ocupada', descripcion: 'Actualmente con huéspedes' },
    { value: 'reservada', label: 'Reservada', descripcion: 'Con reservación confirmada' },
    { value: 'mantenimiento', label: 'Mantenimiento', descripcion: 'Fuera de servicio temporalmente' },
]

onMounted(async () => {
    await Promise.all([cargar(), cargarTipos()])
})

async function cargar() {
    try {
        loading.value = true
        errorGlobal.value = ''
        const params: any = {}
        if (filtros.search) params.search = filtros.search
        if (filtros.estado) params.estado = filtros.estado
        if (filtros.tipoId) params.tipoId = filtros.tipoId
        const { data } = await habitacionesApi.getAll(params)
        habitaciones.value = data
    } catch {
        errorGlobal.value = 'No se pudieron cargar las habitaciones'
    } finally {
        loading.value = false
    }
}

async function cargarTipos() {
    const { data } = await habitacionesApi.getTipos()
    tipos.value = data
}

// Habitación modal
function abrirModal(hab?: any) {
    editando.value = hab || null
    formError.value = ''
    amenidadInput.value = ''
    form.value = hab
        ? {
            numero: hab.numero, tipoId: hab.tipoId, piso: hab.piso,
            capacidad: hab.capacidad, descripcion: hab.descripcion || '',
            imagenUrl: hab.imagenUrl || '', amenidades: [...(hab.amenidades || [])],
        }
        : formVacio()
    modalAbierto.value = true
}

function cerrarModal() { modalAbierto.value = false }

function addAmenidad() {
    const val = amenidadInput.value.trim().replace(/,$/, '')
    if (val && !form.value.amenidades.includes(val)) {
        form.value.amenidades.push(val)
    }
    amenidadInput.value = ''
}

function removeAmenidad(i: number) {
    form.value.amenidades.splice(i, 1)
}

async function guardar() {
    guardando.value = true
    formError.value = ''
    try {
        if (amenidadInput.value.trim()) addAmenidad()
        const payload = { ...form.value, tipoId: Number(form.value.tipoId) }
        if (editando.value) {
            await habitacionesApi.update(editando.value.idHabitacion, payload)
        } else {
            await habitacionesApi.create(payload)
        }
        cerrarModal()
        cargar()
    } catch (e: any) {
        const msg = e?.response?.data?.message
        formError.value = Array.isArray(msg) ? msg[0] : (msg ?? 'Ocurrió un error')
    } finally {
        guardando.value = false
    }
}

async function toggleActivo(hab: any) {
    try {
        await habitacionesApi.toggleActivo(hab.idHabitacion)
        cargar()
    } catch {
        errorGlobal.value = 'No se pudo cambiar el estado del registro'
    }
}

// Estado modal
function abrirModalEstado(hab: any) {
    habitacionEstado.value = hab
    estadoSeleccionado.value = hab.estado
    estadoError.value = ''
    modalEstado.value = true
}

function cerrarModalEstado() { modalEstado.value = false }

async function guardarEstado() {
    if (!estadoSeleccionado.value || !habitacionEstado.value) return
    estadoLoading.value = true
    estadoError.value = ''
    try {
        await habitacionesApi.cambiarEstado(habitacionEstado.value.idHabitacion, estadoSeleccionado.value)
        cerrarModalEstado()
        cargar()
    } catch (e: any) {
        estadoError.value = e?.response?.data?.message ?? 'Error al cambiar estado'
    } finally {
        estadoLoading.value = false
    }
}

// Tipos modal
function abrirModalTipos() {
    tipoEditando.value = null
    tipoError.value = ''
    Object.assign(tipoForm, { nombre: '', precioBase: 0, descripcion: '' })
    modalTipos.value = true
}

function cerrarModalTipos() { modalTipos.value = false }

function editarTipo(t: any) {
    tipoEditando.value = t
    Object.assign(tipoForm, { nombre: t.nombre, precioBase: Number(t.precioBase), descripcion: t.descripcion || '' })
    tipoError.value = ''
}

function cancelarEdicionTipo() {
    tipoEditando.value = null
    Object.assign(tipoForm, { nombre: '', precioBase: 0, descripcion: '' })
}

async function guardarTipo() {
    tipoLoading.value = true
    tipoError.value = ''
    try {
        if (tipoEditando.value) {
            await habitacionesApi.updateTipo(tipoEditando.value.idTipo, tipoForm)
        } else {
            await habitacionesApi.createTipo(tipoForm)
        }
        await cargarTipos()
        cancelarEdicionTipo()
    } catch (e: any) {
        const msg = e?.response?.data?.message
        tipoError.value = Array.isArray(msg) ? msg[0] : (msg ?? 'Ocurrió un error')
    } finally {
        tipoLoading.value = false
    }
}

async function eliminarTipo(t: any) {
    if (!confirm(`¿Eliminar el tipo "${t.nombre}"? Esta acción no se puede deshacer.`)) return
    try {
        await habitacionesApi.deleteTipo(t.idTipo)
        await cargarTipos()
    } catch (e: any) {
        tipoError.value = e?.response?.data?.message ?? 'Error al eliminar'
    }
}

// Helpers
function formatPrecio(val: any) {
    return Number(val).toFixed(2)
}

function formatFecha(fecha: string) {
    return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'short', day: 'numeric',
    })
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

.habitaciones-page {
    font-family: 'Sora', sans-serif;
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 1200px;
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

/* Botones */
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
    display: flex;
    align-items: center;
    gap: 6px;
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

/* Filtros */
.filters-row {
    display: flex;
    gap: 12px;
    align-items: center;
}

.search-wrapper {
    position: relative;
    flex: 1;
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

.filter-select {
    padding: 9px 12px;
    border: 1.5px solid var(--border);
    border-radius: 9px;
    font-size: 0.85rem;
    font-family: 'Sora', sans-serif;
    color: var(--text-primary);
    background: var(--bg-card);
    outline: none;
    cursor: pointer;
    transition: all 0.2s;
}

.filter-select:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

/* Estados generales */
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

/* Tabla */
.table-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.hab-table {
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
    padding: 12px 16px;
    color: var(--text-primary);
    vertical-align: middle;
}

.td-id {
    color: var(--text-muted);
    font-size: 0.8rem;
    width: 40px;
}

.td-secondary {
    color: var(--text-muted);
    font-size: 0.82rem;
}

.td-price {
    color: var(--text-primary);
    font-weight: 500;
    font-size: 0.85rem;
}

/* Celda habitación */
.hab-cell {
    display: flex;
    align-items: center;
    gap: 10px;
}

.hab-avatar {
    min-width: 38px;
    height: 30px;
    border-radius: 7px;
    background: linear-gradient(135deg, #6366f1, #a5b4fc);
    color: white;
    font-size: 0.72rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    transition: opacity 0.2s;
}

.hab-avatar.inactive {
    opacity: 0.4;
}

.hab-desc {
    color: var(--text-secondary);
    font-size: 0.82rem;
}

.hab-desc.inactive {
    color: var(--text-muted);
    text-decoration: line-through;
}

/* Tipo badge */
.tipo-badge {
    font-size: 0.72rem;
    font-weight: 500;
    padding: 3px 10px;
    border-radius: 99px;
    background: #eef2ff;
    color: #6366f1;
    border: 1px solid #c7d2fe;
    white-space: nowrap;
}

/* Amenidades */
.amenidades-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.amenidad-tag {
    font-size: 0.68rem;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 99px;
    background: var(--bg-app);
    color: var(--text-secondary);
    border: 1px solid var(--border);
    white-space: nowrap;
}

.amenidad-tag.more {
    background: var(--bg-hover);
    color: var(--text-muted);
}

.amenidad-tag.editable {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    font-size: 0.75rem;
}

.amenidad-remove {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0;
    font-size: 0.9rem;
    line-height: 1;
    display: flex;
    align-items: center;
}

.amenidad-remove:hover {
    color: #ef4444;
}

/* Estado badge */
.estado-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.72rem;
    font-weight: 500;
    padding: 3px 10px;
    border-radius: 99px;
}

.estado-badge.disponible {
    background: #f0fdf4;
    color: #16a34a;
    border: 1px solid #bbf7d0;
}

.estado-badge.ocupada {
    background: #fef2f2;
    color: #ef4444;
    border: 1px solid #fecaca;
}

.estado-badge.reservada {
    background: #eff6ff;
    color: #2563eb;
    border: 1px solid #bfdbfe;
}

.estado-badge.mantenimiento {
    background: #fffbeb;
    color: #d97706;
    border: 1px solid #fde68a;
}

/* Status activo badge */
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

/* Acciones */
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

.estado-btn:hover {
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

.empty-state {
    text-align: center;
    padding: 48px;
    color: var(--text-muted);
    font-size: 0.9rem;
}

.empty-state-sm {
    text-align: center;
    padding: 16px;
    color: var(--text-muted);
    font-size: 0.85rem;
    font-style: italic;
}

/* ── Modal ───────────────────────────────────── */
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
    max-width: 460px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
    overflow: hidden;
}

.modal-lg {
    max-width: 580px;
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
    max-height: 65vh;
    overflow-y: auto;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px 20px;
    border-top: 1px solid var(--border);
}

/* Form */
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

.full-width {
    grid-column: 1 / -1;
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
    font-size: 0.7rem;
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
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.field-input::placeholder {
    color: var(--text-muted);
}

/* Amenidades input */
.amenidades-input-wrapper {
    border: 1.5px solid var(--border);
    border-radius: 9px;
    background: var(--bg-app);
    transition: all 0.2s;
    padding: 6px 10px;
}

.amenidades-input-wrapper:focus-within {
    border-color: #6366f1;
    background: var(--bg-card);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.amenidades-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    align-items: center;
}

.amenidad-input {
    border: none;
    outline: none;
    background: transparent;
    font-size: 0.875rem;
    font-family: 'Sora', sans-serif;
    color: var(--text-primary);
    flex: 1;
    min-width: 100px;
    padding: 3px 2px;
}

.amenidad-input::placeholder {
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

/* Modal Estado */
.estados-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.estado-option {
    width: 100%;
    padding: 12px 14px;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    background: var(--bg-app);
    cursor: pointer;
    text-align: left;
    font-family: 'Sora', sans-serif;
    transition: all 0.18s;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.estado-option:hover {
    border-color: #6366f1;
    background: var(--bg-hover);
}

.estado-option.selected {
    border-color: #6366f1;
    background: var(--bg-hover);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.estado-option-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.estado-dot-lg {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
}

.estado-dot-lg.disponible {
    background: #16a34a;
}

.estado-dot-lg.ocupada {
    background: #ef4444;
}

.estado-dot-lg.reservada {
    background: #2563eb;
}

.estado-dot-lg.mantenimiento {
    background: #d97706;
}

.estado-label {
    display: block;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-primary);
}

.estado-desc {
    display: block;
    font-size: 0.72rem;
    color: var(--text-muted);
    font-weight: 300;
    margin-top: 1px;
}

.check-mark {
    font-size: 0.9rem;
    color: #6366f1;
    font-weight: 700;
}

/* Modal Tipos */
.tipo-form {
    background: var(--bg-app);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.tipo-grid {
    grid-template-columns: 1fr 1fr;
}

.tipo-form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

.tipos-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.tipo-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: var(--bg-app);
    border: 1px solid var(--border);
    border-radius: 9px;
}

.tipo-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.tipo-nombre {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-primary);
}

.tipo-precio {
    font-size: 0.78rem;
    color: var(--accent);
    font-weight: 500;
}

.tipo-count {
    font-size: 0.72rem;
    color: var(--text-muted);
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: 99px;
    padding: 2px 8px;
}

.tipo-actions {
    display: flex;
    gap: 6px;
}

/* Transitions */
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