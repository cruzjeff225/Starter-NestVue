<template>
  <div class="reservaciones-page">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Reservaciones</h1>
        <p class="page-subtitle">Gestión de reservaciones del hotel</p>
      </div>
      <div class="header-right">
        <span class="header-badge">{{ reservaciones.length }} reservaciones</span>
        <button v-if="auth.tienePermiso('reservaciones:crear')" class="btn-primary" @click="abrirModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nueva reservación
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
          placeholder="Buscar por cliente o habitación..." @input="cargar" />
      </div>
      <select v-model="filtros.estado" class="filter-select" @change="cargar">
        <option value="">Todos los estados</option>
        <option v-for="e in estadosMeta" :key="e.value" :value="e.value">{{ e.label }}</option>
      </select>
      <input v-model="filtros.fechaDesde" type="date" class="filter-select" @change="cargar" title="Desde" />
      <input v-model="filtros.fechaHasta" type="date" class="filter-select" @change="cargar" title="Hasta" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-box">
      <svg class="spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      Cargando reservaciones...
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
      <table class="res-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Habitación</th>
            <th>Entrada</th>
            <th>Salida</th>
            <th>Noches</th>
            <th>Total</th>
            <th>Método pago</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in reservaciones" :key="r.idReservacion">
            <td class="td-id">{{ r.idReservacion }}</td>
            <td>
              <div class="user-cell">
                <div class="user-avatar">
                  {{ r.cliente.nombre.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <span class="cell-name">{{ r.cliente.nombre }} {{ r.cliente.apellido }}</span>
                  <span class="cell-sub">{{ r.numHuespedes }} huésped{{ r.numHuespedes > 1 ? 'es' : '' }}</span>
                </div>
              </div>
            </td>
            <td>
              <div class="hab-cell">
                <span class="hab-num">{{ r.habitacion.numero }}</span>
                <span class="cell-sub">{{ r.habitacion.tipo.nombre }}</span>
              </div>
            </td>
            <td class="td-date">{{ formatFecha(r.fechaEntrada) }}</td>
            <td class="td-date">{{ formatFecha(r.fechaSalida) }}</td>
            <td class="td-secondary">{{ calcularNoches(r.fechaEntrada, r.fechaSalida) }}n</td>
            <td class="td-price">
              <span>${{ formatPrecio(r.totalCalculado) }}</span>
              <span v-if="Number(r.descuento) > 0" class="descuento-tag">-{{ r.descuento }}%</span>
            </td>
            <td>
              <span class="metodo-badge">{{ etiquetaMetodo[r.metodoPago] }}</span>
            </td>
            <td>
              <span class="estado-badge" :class="r.estado">
                <span class="status-dot"></span>
                {{estadosMeta.find(e => e.value === r.estado)?.label ?? r.estado}}
              </span>
            </td>
            <td>
              <div class="actions">
                <button v-if="auth.tienePermiso('reservaciones:cambiar_estado')" class="action-btn estado-btn"
                  title="Cambiar estado" @click="abrirModalEstado(r)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="17 1 21 5 17 9" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <polyline points="7 23 3 19 7 15" />
                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                  </svg>
                </button>
                <button v-if="auth.tienePermiso('reservaciones:editar') && puedeEditar(r)" class="action-btn edit-btn"
                  title="Editar" @click="abrirModal(r)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button class="action-btn detail-btn" title="Ver detalle" @click="abrirDetalle(r)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="reservaciones.length === 0">
            <td colspan="10" class="empty-state">No se encontraron reservaciones</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Modal Crear / Editar ── -->
    <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h2 class="modal-title">{{ editando ? 'Editar reservación' : 'Nueva reservación' }}</h2>
            <button class="modal-close" @click="cerrarModal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <!-- Sección cliente y habitación -->
            <p class="section-label">Asignación</p>
            <div class="form-grid">
              <div class="field-group">
                <label class="field-label">Cliente *</label>
                <SearchSelect v-model="form.clienteId" :fetch-fn="buscarClientes" :initial-item="clienteInicial"
                  value-key="idCliente" label-key="nombre" sub-label-key="email"
                  placeholder="Buscar cliente por nombre o email..." :min-chars="2">
                  <template #item="{ item }">
                    <span class="ss-item-label">{{ item.nombre }} {{ item.apellido }}</span>
                    <span class="ss-item-sub">{{ item.email }}</span>
                  </template>
                </SearchSelect>
              </div>
              <div class="field-group">
                <label class="field-label">Habitación *</label>
                <SearchSelect v-model="form.habitacionId" :fetch-fn="buscarHabitaciones"
                  :initial-item="habitacionInicial" value-key="idHabitacion" label-key="nombre"
                  placeholder="Buscar por número o tipo..." :min-chars="1" @select="onHabitacionSelect">
                  <template #item="{ item }">
                    <span class="ss-item-label">Nro. {{ item.numero }} — {{ item.tipo.nombre }}</span>
                    <span class="ss-item-sub">Piso {{ item.piso }} · ${{ item.tipo.precioBase }}/noche · Cap. {{
                      item.capacidad }}</span>
                  </template>
                </SearchSelect>
              </div>
            </div>

            <!-- Sección fechas -->
            <p class="section-label">Fechas</p>
            <div class="form-grid">
              <div class="field-group">
                <label class="field-label">Fecha de entrada *</label>
                <input v-model="form.fechaEntrada" type="date" class="field-input" @change="recalcular" />
              </div>
              <div class="field-group">
                <label class="field-label">Fecha de salida *</label>
                <input v-model="form.fechaSalida" type="date" class="field-input" @change="recalcular" />
              </div>
            </div>

            <!-- Sección detalles -->
            <p class="section-label">Detalles</p>
            <div class="form-grid">
              <div class="field-group">
                <label class="field-label">Número de huéspedes</label>
                <input v-model.number="form.numHuespedes" type="number" min="1" class="field-input" />
              </div>
              <div class="field-group">
                <label class="field-label">Método de pago</label>
                <select v-model="form.metodoPago" class="field-input">
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div class="field-group">
                <label class="field-label">Descuento (%)</label>
                <input v-model.number="form.descuento" type="number" min="0" max="100" class="field-input"
                  @input="recalcular" />
              </div>
              <div class="field-group">
                <label class="field-label">Notas</label>
                <input v-model="form.notas" type="text" class="field-input" placeholder="Opcional" />
              </div>
            </div>

            <!-- Resumen de precio -->
            <div v-if="resumenPrecio.noches > 0" class="precio-resumen">
              <div class="precio-row">
                <span>{{ resumenPrecio.noches }} noche{{ resumenPrecio.noches > 1 ? 's' : '' }} × ${{
                  formatPrecio(resumenPrecio.precioNoche) }}</span>
                <span>${{ formatPrecio(resumenPrecio.subtotal) }}</span>
              </div>
              <div v-if="resumenPrecio.descuento > 0" class="precio-row descuento">
                <span>Descuento ({{ resumenPrecio.descuento }}%)</span>
                <span>-${{ formatPrecio(resumenPrecio.montoDescuento) }}</span>
              </div>
              <div class="precio-row total">
                <span>Total</span>
                <span>${{ formatPrecio(resumenPrecio.total) }}</span>
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
              <span v-if="!guardando">{{ editando ? 'Guardar cambios' : 'Crear reservación' }}</span>
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

    <!-- ── Modal Cambiar Estado ── -->
    <Transition name="modal">
      <div v-if="modalEstado" class="modal-overlay" @click.self="cerrarModalEstado">
        <div class="modal">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Cambiar estado</h2>
              <p class="modal-subtitle">
                Reservación #{{ reservacionEstado?.idReservacion }} —
                {{ reservacionEstado?.cliente.nombre }} {{ reservacionEstado?.cliente.apellido }}
              </p>
            </div>
            <button class="modal-close" @click="cerrarModalEstado">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="estados-list">
              <button v-for="e in estadosMeta" :key="e.value" class="estado-option"
                :class="{ selected: estadoSeleccionado === e.value }" @click="estadoSeleccionado = e.value">
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

            <!-- Motivo cancelación -->
            <div v-if="estadoSeleccionado === 'cancelada' || estadoSeleccionado === 'no_show'" class="field-group">
              <label class="field-label">Motivo</label>
              <input v-model="motivoCancelacion" type="text" class="field-input" placeholder="Opcional" />
            </div>

            <div v-if="estadoError" class="form-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {{ estadoError }}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="cerrarModalEstado">Cancelar</button>
            <button class="btn-primary" :disabled="estadoLoading || !estadoSeleccionado" @click="guardarEstado">
              <span v-if="!estadoLoading">Guardar estado</span>
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

    <!-- ── Modal Detalle ── -->
    <Transition name="modal">
      <div v-if="modalDetalle" class="modal-overlay" @click.self="cerrarDetalle">
        <div class="modal">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Reservación #{{ detalleData?.idReservacion }}</h2>
              <p class="modal-subtitle">{{estadosMeta.find(e => e.value === detalleData?.estado)?.label}}</p>
            </div>
            <button class="modal-close" @click="cerrarDetalle">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div v-if="detalleData" class="modal-body">
            <div class="detalle-grid">
              <div class="detalle-section">
                <p class="section-label">Cliente</p>
                <p class="detalle-val">{{ detalleData.cliente.nombre }} {{ detalleData.cliente.apellido }}</p>
                <p class="detalle-sub">{{ detalleData.cliente.email }}</p>
              </div>
              <div class="detalle-section">
                <p class="section-label">Habitación</p>
                <p class="detalle-val">Nro. {{ detalleData.habitacion.numero }} — Piso {{ detalleData.habitacion.piso }}
                </p>
                <p class="detalle-sub">{{ detalleData.habitacion.tipo.nombre }}</p>
              </div>
              <div class="detalle-section">
                <p class="section-label">Check-in</p>
                <p class="detalle-val">{{ formatFechaLarga(detalleData.fechaEntrada) }}</p>
              </div>
              <div class="detalle-section">
                <p class="section-label">Check-out</p>
                <p class="detalle-val">{{ formatFechaLarga(detalleData.fechaSalida) }}</p>
              </div>
              <div class="detalle-section">
                <p class="section-label">Huéspedes</p>
                <p class="detalle-val">{{ detalleData.numHuespedes }}</p>
              </div>
              <div class="detalle-section">
                <p class="section-label">Método de pago</p>
                <p class="detalle-val">{{ etiquetaMetodo[detalleData.metodoPago] }}</p>
              </div>
            </div>

            <div class="precio-resumen">
              <div class="precio-row">
                <span>{{ calcularNoches(detalleData.fechaEntrada, detalleData.fechaSalida) }} noches × ${{
                  formatPrecio(detalleData.precioNoche) }}</span>
                <span>${{ formatPrecio(Number(detalleData.precioNoche) * calcularNoches(detalleData.fechaEntrada,
                  detalleData.fechaSalida)) }}</span>
              </div>
              <div v-if="Number(detalleData.descuento) > 0" class="precio-row descuento">
                <span>Descuento ({{ detalleData.descuento }}%)</span>
                <span>-${{ formatPrecio(Number(detalleData.precioNoche) * calcularNoches(detalleData.fechaEntrada,
                  detalleData.fechaSalida) * Number(detalleData.descuento) / 100) }}</span>
              </div>
              <div class="precio-row total">
                <span>Total</span>
                <span>${{ formatPrecio(detalleData.totalCalculado) }}</span>
              </div>
            </div>

            <div v-if="detalleData.notas" class="detalle-notas">
              <p class="section-label">Notas</p>
              <p class="detalle-notas-text">{{ detalleData.notas }}</p>
            </div>
            <div v-if="detalleData.motivoCancelacion" class="detalle-notas cancelacion">
              <p class="section-label">Motivo de cancelación</p>
              <p class="detalle-notas-text">{{ detalleData.motivoCancelacion }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { reservacionesApi } from '../../services/api'
import { clientesApi } from '../../services/api'
import { habitacionesApi } from '../../services/api'
import SearchSelect from '../../components/SearchSelect.vue'


const auth = useAuthStore()

const reservaciones = ref<any[]>([])
const clientes = ref<any[]>([])
const habitacionesDisp = ref<any[]>([])
const loading = ref(true)
const errorGlobal = ref('')
const clienteInicial = ref<any>(null)
const habitacionInicial = ref<any>(null)

const filtros = reactive({ search: '', estado: '', fechaDesde: '', fechaHasta: '' })

// Modal reservación
const modalAbierto = ref(false)
const editando = ref<any>(null)
const guardando = ref(false)
const formError = ref('')

const formVacio = () => ({
  clienteId: '' as any, habitacionId: '' as any,
  fechaEntrada: '', fechaSalida: '',
  numHuespedes: 1, metodoPago: 'efectivo',
  descuento: 0, notas: '',
})
const form = ref(formVacio())
const precioNocheSeleccionado = ref(0)

// Modal estado
const modalEstado = ref(false)
const reservacionEstado = ref<any>(null)
const estadoSeleccionado = ref('')
const motivoCancelacion = ref('')
const estadoLoading = ref(false)
const estadoError = ref('')

// Modal detalle
const modalDetalle = ref(false)
const detalleData = ref<any>(null)

const estadosMeta = [
  { value: 'pendiente', label: 'Pendiente', descripcion: 'En espera de confirmación' },
  { value: 'confirmada', label: 'Confirmada', descripcion: 'Reservación confirmada, habitación reservada' },
  { value: 'en_curso', label: 'En curso', descripcion: 'Huésped actualmente hospedado' },
  { value: 'completada', label: 'Completada', descripcion: 'Estadía finalizada exitosamente' },
  { value: 'cancelada', label: 'Cancelada', descripcion: 'Reservación cancelada' },
  { value: 'no_show', label: 'No show', descripcion: 'El huésped no se presentó' },
]

const etiquetaMetodo: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  otro: 'Otro',
}

const resumenPrecio = computed(() => {
  const noches = calcularNoches(form.value.fechaEntrada, form.value.fechaSalida)
  const precioNoche = precioNocheSeleccionado.value
  const subtotal = precioNoche * noches
  const descuento = form.value.descuento || 0
  const montoDescuento = subtotal * descuento / 100
  const total = subtotal - montoDescuento
  return { noches, precioNoche, subtotal, descuento, montoDescuento, total }
})

onMounted(async () => {
  await Promise.all([cargar(), cargarCatalogos()])
})

async function cargar() {
  try {
    loading.value = true
    errorGlobal.value = ''
    const params: any = {}
    if (filtros.search) params.search = filtros.search
    if (filtros.estado) params.estado = filtros.estado
    if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde
    if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta
    const { data } = await reservacionesApi.getAll(params)
    reservaciones.value = data
  } catch {
    errorGlobal.value = 'No se pudieron cargar las reservaciones'
  } finally {
    loading.value = false
  }
}

async function buscarClientes(search: string) {
  const { data } = await clientesApi.getAll(search)
  return data.filter((c: any) => c.activo)
}

async function buscarHabitaciones(search: string) {
  const { data } = await habitacionesApi.getDisponibles(search)
  return data
}

async function cargarCatalogos() {
  const [{ data: c }, { data: h }] = await Promise.all([
    clientesApi.getAll(),
    habitacionesApi.getAll(),
  ])
  clientes.value = c.filter((x: any) => x.activo)
  habitacionesDisp.value = h.filter((x: any) => x.activo)
}

// Reservación modal
function abrirModal(r?: any) {
  console.log('Abriendo modal', r ? 'editar' : 'crear')
  editando.value = r || null
  formError.value = ''
  if (r) {
    clienteInicial.value = {
      idCliente: r.clienteId,
      nombre: `${r.cliente.nombre} ${r.cliente.apellido}`,
      email: r.cliente.email,
    }
    habitacionInicial.value = {
      idHabitacion: r.habitacionId,
      nombre: `${r.habitacion.numero} — ${r.habitacion.tipo.nombre} ($${r.habitacion.tipo.precioBase}/noche)`,
    }
    form.value = {
      clienteId: r.clienteId,
      habitacionId: r.habitacionId,
      fechaEntrada: r.fechaEntrada.split('T')[0], // formato YYYY-MM-DD
      fechaSalida: r.fechaSalida.split('T')[0],
      numHuespedes: r.numHuespedes,
      metodoPago: r.metodoPago,
      descuento: Number(r.descuento),
      notas: r.notas || '',
    }
    precioNocheSeleccionado.value = Number(r.habitacion.tipo.precioBase)
  } else {
    clienteInicial.value = null
    habitacionInicial.value = null
    form.value = formVacio()
    precioNocheSeleccionado.value = 0
  }
  modalAbierto.value = true
  console.log('Modal abierto:', modalAbierto.value)
}

function cerrarModal() { 
  modalAbierto.value = false
  form.value = formVacio()
  precioNocheSeleccionado.value = 0
}

function onHabitacionSelect(item: any) {
  if (item) {
    precioNocheSeleccionado.value = Number(item.tipo.precioBase)
  } else {
    precioNocheSeleccionado.value = 0
  }
}

function recalcular() {
  // el computed resumenPrecio se actualiza reactivamente
}

async function guardar() {
  guardando.value = true
  formError.value = ''
  try {
    const payload = {
      ...form.value,
      clienteId: Number(form.value.clienteId),
      habitacionId: Number(form.value.habitacionId),
    }
    if (editando.value) {
      await reservacionesApi.update(editando.value.idReservacion, payload)
    } else {
      await reservacionesApi.create(payload)
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

// Estado modal
function abrirModalEstado(r: any) {
  reservacionEstado.value = r
  estadoSeleccionado.value = r.estado
  motivoCancelacion.value = r.motivoCancelacion || ''
  estadoError.value = ''
  modalEstado.value = true
}

function cerrarModalEstado() { modalEstado.value = false }

async function guardarEstado() {
  if (!estadoSeleccionado.value || !reservacionEstado.value) return
  estadoLoading.value = true
  estadoError.value = ''
  try {
    await reservacionesApi.cambiarEstado(reservacionEstado.value.idReservacion, {
      estado: estadoSeleccionado.value,
      motivoCancelacion: motivoCancelacion.value || undefined,
    })
    cerrarModalEstado()
    cargar()
  } catch (e: any) {
    estadoError.value = e?.response?.data?.message ?? 'Error al cambiar estado'
  } finally {
    estadoLoading.value = false
  }
}

// Detalle modal
function abrirDetalle(r: any) { detalleData.value = r; modalDetalle.value = true }
function cerrarDetalle() { modalDetalle.value = false }

// Helpers
function calcularNoches(entrada: string, salida: string): number {
  if (!entrada || !salida) return 0
  const diff = new Date(salida).getTime() - new Date(entrada).getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function puedeEditar(r: any) {
  return ['pendiente', 'confirmada'].includes(r.estado)
}

function formatPrecio(val: any) { return Number(val).toFixed(2) }

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatFechaLarga(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

.reservaciones-page {
  font-family: 'Sora', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1300px;
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
  flex-wrap: wrap;
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
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

/* Estados */
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

.res-table {
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

.td-date {
  color: var(--text-secondary);
  font-size: 0.82rem;
  white-space: nowrap;
}

.td-price {
  font-weight: 500;
  white-space: nowrap;
}

/* Celdas */
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

.cell-name {
  display: block;
  font-size: 0.85rem;
  color: var(--text-primary);
}

.cell-sub {
  display: block;
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 1px;
}

.hab-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hab-num {
  font-size: 0.82rem;
  font-weight: 600;
  background: #eef2ff;
  color: #6366f1;
  border: 1px solid #c7d2fe;
  border-radius: 6px;
  padding: 2px 8px;
  display: inline-block;
  width: fit-content;
}

.descuento-tag {
  font-size: 0.68rem;
  font-weight: 500;
  background: #fef3c7;
  color: #d97706;
  border: 1px solid #fde68a;
  border-radius: 99px;
  padding: 1px 6px;
  margin-left: 4px;
}

.metodo-badge {
  font-size: 0.72rem;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 99px;
  background: var(--bg-app);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

/* Estado badges */
.estado-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 99px;
}

.estado-badge.pendiente {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fde68a;
}

.estado-badge.confirmada {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.estado-badge.en_curso {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.estado-badge.completada {
  background: #f5f3ff;
  color: #7c3aed;
  border: 1px solid #ddd6fe;
}

.estado-badge.cancelada {
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
}

.estado-badge.no_show {
  background: #f9fafb;
  color: #6b7280;
  border: 1px solid #e5e7eb;
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

.detail-btn:hover {
  background: #f5f3ff;
  border-color: #ddd6fe;
  color: #7c3aed;
}

.empty-state {
  text-align: center;
  padding: 48px;
  color: var(--text-muted);
  font-size: 0.9rem;
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
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.modal-lg {
  max-width: 620px;
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
  gap: 16px;
  max-height: 70vh;
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
.section-label {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
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

/* Resumen precio */
.precio-resumen {
  background: var(--bg-app);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.precio-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.precio-row.descuento {
  color: #d97706;
}

.precio-row.total {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  border-top: 1px solid var(--border);
  padding-top: 8px;
  margin-top: 2px;
}

/* Detalle */
.detalle-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.detalle-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detalle-val {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}

.detalle-sub {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 0;
}

.detalle-notas {
  background: var(--bg-app);
  border: 1px solid var(--border);
  border-radius: 9px;
  padding: 12px;
}

.detalle-notas.cancelacion {
  background: #fef2f2;
  border-color: #fecaca;
}

.detalle-notas-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 4px 0 0;
}

/* Form error */
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

/* Modal estado */
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

.estado-dot-lg.pendiente {
  background: #d97706;
}

.estado-dot-lg.confirmada {
  background: #2563eb;
}

.estado-dot-lg.en_curso {
  background: #16a34a;
}

.estado-dot-lg.completada {
  background: #7c3aed;
}

.estado-dot-lg.cancelada {
  background: #ef4444;
}

.estado-dot-lg.no_show {
  background: #9ca3af;
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