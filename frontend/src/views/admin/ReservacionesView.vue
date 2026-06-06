<template>
  <div class="reservations">
    <header class="page-header">
      <div>
        <p class="overline">Recepcion hotelera</p>
        <h1>Reservaciones</h1>
        <span>Gestion de reservas, disponibilidad y estados de estadia.</span>
      </div>

      <button v-if="auth.tienePermiso('reservaciones:crear')" class="btn btn-primary" @click="abrirModal()">
        <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        Nueva reserva
      </button>
    </header>

    <section class="summary-bar">
      <div v-for="item in resumenOperativo" :key="item.label" class="summary-item">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </section>

    <section class="filters">
      <label class="search">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input v-model="filtros.search" type="text" placeholder="Buscar cliente o habitacion" @input="cargar" />
      </label>

      <select v-model="filtros.estado" class="input" @change="cargar">
        <option value="">Todos los estados</option>
        <option v-for="estado in estadosMeta" :key="estado.value" :value="estado.value">{{ estado.label }}</option>
      </select>

      <input v-model="filtros.fechaDesde" class="input" type="date" @change="cargar" />
      <input v-model="filtros.fechaHasta" class="input" type="date" @change="cargar" />

      <button class="btn btn-light" @click="limpiarFiltros">Limpiar</button>
    </section>

    <div v-if="loading" class="state">
      <svg class="spin" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      Cargando reservaciones...
    </div>

    <div v-else-if="errorGlobal" class="state state-error">{{ errorGlobal }}</div>

    <section v-else class="table-card">
      <div class="table-top">
        <div>
          <h2>Libro de reservas</h2>
          <span>{{ reservaciones.length }} registro{{ reservaciones.length === 1 ? '' : 's' }}</span>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Reserva</th>
              <th>Huesped</th>
              <th>Habitacion</th>
              <th>Estadia</th>
              <th>Total</th>
              <th>Estado</th>
              <th class="actions-col"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="reserva in reservaciones" :key="reserva.idReservacion">
              <td>
                <strong class="reservation-code">#{{ reserva.idReservacion }}</strong>
                <span class="muted">{{ etiquetaMetodo[reserva.metodoPago] }}</span>
              </td>
              <td>
                <div class="guest">
                  <div class="avatar">{{ iniciales(reserva) }}</div>
                  <div>
                    <strong>{{ reserva.cliente.nombre }} {{ reserva.cliente.apellido }}</strong>
                    <span>{{ reserva.numHuespedes }} huesped{{ reserva.numHuespedes === 1 ? '' : 'es' }}</span>
                  </div>
                </div>
              </td>
              <td>
                <strong>{{ reserva.habitacion.numero }}</strong>
                <span class="muted">{{ reserva.habitacion.tipo.nombre }} · Piso {{ reserva.habitacion.piso }}</span>
              </td>
              <td>
                <strong>{{ formatFecha(reserva.fechaEntrada) }} - {{ formatFecha(reserva.fechaSalida) }}</strong>
                <span class="muted">{{ calcularNoches(reserva.fechaEntrada, reserva.fechaSalida) }} noche{{ calcularNoches(reserva.fechaEntrada, reserva.fechaSalida) === 1 ? '' : 's' }}</span>
              </td>
              <td>
                <strong>${{ formatPrecio(reserva.totalCalculado) }}</strong>
                <span v-if="Number(reserva.descuento) > 0" class="muted">Descuento {{ reserva.descuento }}%</span>
              </td>
              <td>
                <span class="status" :class="reserva.estado">
                  <i></i>{{ labelEstado(reserva.estado) }}
                </span>
              </td>
              <td>
                <div class="row-actions">
                  <button class="icon-btn" title="Detalle" @click="abrirDetalle(reserva)">
                    <svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button v-if="auth.tienePermiso('reservaciones:cambiar_estado')" class="icon-btn" title="Cambiar estado" @click="abrirModalEstado(reserva)">
                    <svg viewBox="0 0 24 24"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                  </button>
                  <button v-if="auth.tienePermiso('reservaciones:editar') && puedeEditar(reserva)" class="icon-btn" title="Editar" @click="abrirModal(reserva)">
                    <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="reservaciones.length === 0">
              <td colspan="7" class="empty">No hay reservaciones con estos filtros.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Transition name="modal">
      <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
        <div class="reservation-modal">
          <header class="modal-header">
            <div>
              <p class="overline">{{ editando ? 'Editar reserva' : 'Nueva reserva' }}</p>
              <h2>{{ editando ? `Reservacion #${editando.idReservacion}` : 'Crear reservacion' }}</h2>
            </div>
            <button class="icon-btn" @click="cerrarModal">
              <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </header>

          <div class="modal-body">
            <section class="reservation-form">
              <div class="form-block">
                <h3>Datos de estadia</h3>
                <label class="field">
                  <span>Cliente</span>
                  <SearchSelect
                    v-model="form.clienteId"
                    :fetch-fn="buscarClientes"
                    :initial-item="clienteInicial"
                    value-key="idCliente"
                    label-key="nombreCompleto"
                    sub-label-key="email"
                    placeholder="Buscar cliente"
                    :min-chars="2"
                  />
                </label>

                <div class="field-grid">
                  <label class="field">
                    <span>Entrada</span>
                    <input v-model="form.fechaEntrada" type="date" :min="fechaMinimaEntrada" @change="recalcular" />
                  </label>
                  <label class="field">
                    <span>Salida</span>
                    <input v-model="form.fechaSalida" type="date" :min="fechaMinimaSalida" @change="recalcular" />
                  </label>
                </div>

                <div class="field-grid">
                  <label class="field">
                    <span>Huespedes</span>
                    <input v-model.number="form.numHuespedes" type="number" min="1" />
                  </label>
                  <label class="field">
                    <span>Pago</span>
                    <select v-model="form.metodoPago">
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="otro">Otro</option>
                    </select>
                  </label>
                </div>
              </div>

              <div class="form-block">
                <h3>Habitacion seleccionada</h3>
                <div v-if="habSeleccionada" class="selected-room">
                  <div>
                    <strong>{{ habSeleccionada.numero }}</strong>
                    <span>{{ habSeleccionada.tipo?.nombre }} · Piso {{ habSeleccionada.piso }}</span>
                  </div>
                  <button class="btn btn-light" @click="limpiarHabitacion">Cambiar</button>
                </div>
                <div v-else class="room-placeholder">Selecciona una habitacion disponible.</div>
              </div>

              <div class="form-block">
                <h3>Tarifa</h3>
                <label class="field">
                  <span>Descuento (%)</span>
                  <input v-model.number="form.descuento" type="number" min="0" max="100" @input="recalcular" />
                </label>
                <label class="field">
                  <span>Notas internas</span>
                  <textarea v-model="form.notas" rows="3" placeholder="Notas para recepcion o housekeeping"></textarea>
                </label>

                <div class="price-box">
                  <div><span>Noches</span><strong>{{ resumenPrecio.noches }}</strong></div>
                  <div><span>Precio noche</span><strong>${{ formatPrecio(resumenPrecio.precioNoche) }}</strong></div>
                  <div><span>Subtotal</span><strong>${{ formatPrecio(resumenPrecio.subtotal) }}</strong></div>
                  <div v-if="resumenPrecio.descuento > 0"><span>Descuento</span><strong>-${{ formatPrecio(resumenPrecio.montoDescuento) }}</strong></div>
                  <div class="total"><span>Total</span><strong>${{ formatPrecio(resumenPrecio.total) }}</strong></div>
                </div>
              </div>

              <div v-if="formError" class="error-inline">{{ formError }}</div>
            </section>

            <aside class="room-picker">
              <div class="room-tools">
                <label class="search compact">
                  <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input v-model="habQuery" type="text" placeholder="Buscar habitacion" @input="aplicarFiltrosHab" />
                </label>
                <select v-model="ordenHab" class="input" @change="aplicarFiltrosHab">
                  <option value="numero_asc">Numero asc</option>
                  <option value="numero_desc">Numero desc</option>
                  <option value="precio_asc">Precio menor</option>
                  <option value="precio_desc">Precio mayor</option>
                </select>
              </div>

              <div class="tabs">
                <button :class="{ active: filtroDisp === 'disponible' }" @click="setFiltroDisp('disponible')">Disponibles</button>
                <button :class="{ active: filtroDisp === '' }" @click="setFiltroDisp('')">Todas</button>
                <button :class="{ active: filtroDisp === 'reservada' }" @click="setFiltroDisp('reservada')">Reservadas</button>
                <button :class="{ active: filtroDisp === 'ocupada' }" @click="setFiltroDisp('ocupada')">Ocupadas</button>
              </div>

              <div class="type-filter">
                <button :class="{ active: filtroTipo === '' }" @click="setFiltroTipo('')">Todos</button>
                <button v-for="tipo in tiposUnicos" :key="tipo" :class="{ active: filtroTipo === tipo }" @click="setFiltroTipo(tipo)">
                  {{ tipo }}
                </button>
              </div>

              <div class="room-count">
                <span>{{ habFiltradas.length }} habitaciones</span>
                <span>{{ habitacionesDisponibles }} disponibles</span>
              </div>

              <div class="room-list">
                <div v-if="habCargando" class="state small">
                  <svg class="spin" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Cargando habitaciones...
                </div>

                <div
                  v-for="habitacion in habFiltradas"
                  v-else
                  :key="habitacion.idHabitacion"
                  class="room-card"
                  :class="{ selected: form.habitacionId === habitacion.idHabitacion, disabled: !esSeleccionable(habitacion) }"
                  @click="seleccionarHabitacion(habitacion)"
                >
                  <span class="room-dot" :class="habitacion.estado"></span>
                  <div>
                    <strong>{{ habitacion.numero }} <em>{{ habitacion.tipo?.nombre }}</em></strong>
                    <small>Piso {{ habitacion.piso }} · {{ habitacion.capacidad }} personas</small>
                    <button type="button" class="extras-toggle" @click.stop="toggleExtrasHabitacion(habitacion.idHabitacion)">
                      {{ extrasAbiertos === habitacion.idHabitacion ? 'Ocultar extras' : 'Ver extras' }}
                    </button>
                    <div v-if="extrasAbiertos === habitacion.idHabitacion" class="room-extras">
                      <span v-for="extra in extrasHabitacion(habitacion)" :key="extra">{{ extra }}</span>
                      <span v-if="extrasHabitacion(habitacion).length === 0" class="room-no-extras">Sin extras configurados</span>
                    </div>
                  </div>
                  <b>
                    ${{ formatPrecio(precioHabitacion(habitacion)) }}
                    <small v-if="tienePrecioConExtras(habitacion)" class="price-extra-note">con extras</small>
                  </b>
                </div>

                <div v-if="!habCargando && habFiltradas.length === 0" class="empty room-empty">Sin habitaciones disponibles.</div>
              </div>
            </aside>
          </div>

          <footer class="modal-footer">
            <button class="btn btn-light" @click="cerrarModal">Cancelar</button>
            <button class="btn btn-primary" :disabled="guardando || !puedeGuardar" @click="guardar">
              <svg v-if="guardando" class="spin" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              {{ guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear reserva' }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="modalEstado" class="modal-overlay" @click.self="cerrarModalEstado">
        <div class="small-modal">
          <header class="modal-header">
            <div>
              <p class="overline">Estado de estadia</p>
              <h2>Reservacion #{{ reservacionEstado?.idReservacion }}</h2>
              <span>{{ reservacionEstado?.cliente.nombre }} {{ reservacionEstado?.cliente.apellido }}</span>
            </div>
            <button class="icon-btn" @click="cerrarModalEstado">
              <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </header>

          <div class="status-options">
            <button v-for="estado in estadosMeta" :key="estado.value" :class="{ active: estadoSeleccionado === estado.value }" @click="estadoSeleccionado = estado.value">
              <span class="status" :class="estado.value"><i></i>{{ estado.label }}</span>
              <small>{{ estado.descripcion }}</small>
            </button>
          </div>

          <label v-if="estadoSeleccionado === 'cancelada' || estadoSeleccionado === 'no_show'" class="field padded">
            <span>Motivo</span>
            <input v-model="motivoCancelacion" type="text" placeholder="Opcional" />
          </label>

          <div v-if="estadoError" class="error-inline padded-error">{{ estadoError }}</div>

          <footer class="modal-footer">
            <button class="btn btn-light" @click="cerrarModalEstado">Cancelar</button>
            <button class="btn btn-primary" :disabled="estadoLoading || !estadoSeleccionado" @click="guardarEstado">
              {{ estadoLoading ? 'Guardando...' : 'Actualizar' }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="modalDetalle" class="modal-overlay" @click.self="cerrarDetalle">
        <div v-if="detalleData" class="small-modal">
          <header class="modal-header">
            <div>
              <p class="overline">Detalle</p>
              <h2>Reservacion #{{ detalleData.idReservacion }}</h2>
              <span>{{ labelEstado(detalleData.estado) }}</span>
            </div>
            <button class="icon-btn" @click="cerrarDetalle">
              <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </header>

          <div class="detail-grid">
            <div><span>Cliente</span><strong>{{ detalleData.cliente.nombre }} {{ detalleData.cliente.apellido }}</strong><small>{{ detalleData.cliente.email }}</small></div>
            <div><span>Habitacion</span><strong>{{ detalleData.habitacion.numero }}</strong><small>{{ detalleData.habitacion.tipo.nombre }}</small></div>
            <div><span>Entrada</span><strong>{{ formatFechaLarga(detalleData.fechaEntrada) }}</strong></div>
            <div><span>Salida</span><strong>{{ formatFechaLarga(detalleData.fechaSalida) }}</strong></div>
            <div><span>Huespedes</span><strong>{{ detalleData.numHuespedes }}</strong></div>
            <div><span>Metodo de pago</span><strong>{{ etiquetaMetodo[detalleData.metodoPago] }}</strong></div>
          </div>

          <div class="price-box detail-price">
            <div><span>Noches</span><strong>{{ calcularNoches(detalleData.fechaEntrada, detalleData.fechaSalida) }}</strong></div>
            <div><span>Precio noche</span><strong>${{ formatPrecio(detalleData.precioNoche) }}</strong></div>
            <div v-if="Number(detalleData.descuento) > 0"><span>Descuento</span><strong>{{ detalleData.descuento }}%</strong></div>
            <div class="total"><span>Total</span><strong>${{ formatPrecio(detalleData.totalCalculado) }}</strong></div>
          </div>

          <div v-if="detalleData.notas" class="note"><span>Notas</span>{{ detalleData.notas }}</div>
          <div v-if="detalleData.motivoCancelacion" class="note danger"><span>Motivo</span>{{ detalleData.motivoCancelacion }}</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { clientesApi, habitacionesApi, reservacionesApi } from '../../services/api'
import SearchSelect from '../../components/SearchSelect.vue'

const auth = useAuthStore()

const reservaciones = ref<any[]>([])
const loading = ref(true)
const errorGlobal = ref('')
const filtros = reactive({ search: '', estado: '', fechaDesde: '', fechaHasta: '' })

const modalAbierto = ref(false)
const editando = ref<any>(null)
const guardando = ref(false)
const formError = ref('')
const clienteInicial = ref<any>(null)

const formVacio = () => ({
  clienteId: null as any,
  habitacionId: null as any,
  fechaEntrada: '',
  fechaSalida: '',
  numHuespedes: 1,
  metodoPago: 'efectivo',
  descuento: 0,
  notas: '',
})

const form = ref(formVacio())

const todasHabitaciones = ref<any[]>([])
const habFiltradas = ref<any[]>([])
const habSeleccionada = ref<any>(null)
const habQuery = ref('')
const filtroDisp = ref('disponible')
const filtroTipo = ref('')
const ordenHab = ref('numero_asc')
const habCargando = ref(false)
const precioNocheSeleccionado = ref(0)
const extrasAbiertos = ref<number | null>(null)

const modalEstado = ref(false)
const reservacionEstado = ref<any>(null)
const estadoSeleccionado = ref('')
const motivoCancelacion = ref('')
const estadoLoading = ref(false)
const estadoError = ref('')

const modalDetalle = ref(false)
const detalleData = ref<any>(null)

const estadosMeta = [
  { value: 'pendiente', label: 'Pendiente', descripcion: 'En espera de confirmacion' },
  { value: 'confirmada', label: 'Confirmada', descripcion: 'Reserva garantizada' },
  { value: 'en_curso', label: 'En casa', descripcion: 'Huesped hospedado' },
  { value: 'completada', label: 'Completada', descripcion: 'Estadia finalizada' },
  { value: 'cancelada', label: 'Cancelada', descripcion: 'Reserva anulada' },
  { value: 'no_show', label: 'No show', descripcion: 'Huesped no se presento' },
]

const etiquetaMetodo: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  otro: 'Otro',
}

const resumenOperativo = computed(() => {
  const total = reservaciones.value.length
  const activas = reservaciones.value.filter((r) => ['confirmada', 'en_curso'].includes(r.estado)).length
  const pendientes = reservaciones.value.filter((r) => r.estado === 'pendiente').length
  const ingresos = reservaciones.value
    .filter((r) => !['cancelada', 'no_show'].includes(r.estado))
    .reduce((sum, r) => sum + Number(r.totalCalculado || 0), 0)

  return [
    { label: 'Reservas', value: total },
    { label: 'Activas', value: activas },
    { label: 'Pendientes', value: pendientes  },
  ]
})

const resumenPrecio = computed(() => {
  const noches = calcularNoches(form.value.fechaEntrada, form.value.fechaSalida)
  const precioNoche = precioNocheSeleccionado.value
  const subtotal = precioNoche * noches
  const descuento = Number(form.value.descuento || 0)
  const montoDescuento = subtotal * descuento / 100
  return { noches, precioNoche, subtotal, descuento, montoDescuento, total: subtotal - montoDescuento }
})

const tiposUnicos = computed(() => [...new Set(todasHabitaciones.value.map((h) => h.tipo?.nombre).filter(Boolean))].sort())
const habitacionesDisponibles = computed(() => todasHabitaciones.value.filter((h) => h.estado === 'disponible').length)
const fechaMinimaEntrada = computed(() => fechaInput(new Date()))
const fechaMinimaSalida = computed(() => {
  if (!form.value.fechaEntrada) return fechaInput(addDays(new Date(), 1))
  return fechaInput(addDays(parseDateInput(form.value.fechaEntrada), 1))
})
const puedeGuardar = computed(() => Boolean(form.value.clienteId && form.value.habitacionId && fechasValidas.value))
const fechasValidas = computed(() => {
  if (!form.value.fechaEntrada || !form.value.fechaSalida) return false
  return !fechaEntradaPasada.value && calcularNoches(form.value.fechaEntrada, form.value.fechaSalida) >= 1
})
const fechaEntradaPasada = computed(() => {
  if (!form.value.fechaEntrada) return false
  return startOfDay(parseDateInput(form.value.fechaEntrada)) < startOfDay(new Date())
})

onMounted(() => cargar())

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

function limpiarFiltros() {
  filtros.search = ''
  filtros.estado = ''
  filtros.fechaDesde = ''
  filtros.fechaHasta = ''
  cargar()
}

async function buscarClientes(search: string) {
  const { data } = await clientesApi.getAll(search)
  return data
    .filter((cliente: any) => cliente.activo)
    .map((cliente: any) => ({ ...cliente, nombreCompleto: `${cliente.nombre} ${cliente.apellido}` }))
}

async function cargarHabitaciones() {
  habCargando.value = true
  try {
    const { data } = await habitacionesApi.getAll()
    todasHabitaciones.value = data.filter((habitacion: any) => habitacion.activo)
    aplicarFiltrosHab()
  } finally {
    habCargando.value = false
  }
}

function aplicarFiltrosHab() {
  const query = habQuery.value.trim().toLowerCase()
  let resultado = todasHabitaciones.value.filter((habitacion) => {
    if (filtroDisp.value && habitacion.estado !== filtroDisp.value) return false
    if (filtroTipo.value && habitacion.tipo?.nombre !== filtroTipo.value) return false
    if (!query) return true

    const campos = [
      habitacion.numero,
      habitacion.tipo?.nombre,
      `piso ${habitacion.piso}`,
      habitacion.vista,
      habitacion.descripcion,
      ...(habitacion.amenidades || []),
    ].map((campo) => String(campo ?? '').toLowerCase())

    return campos.some((campo) => campo.includes(query))
  })

  resultado = [...resultado].sort((a, b) => {
    switch (ordenHab.value) {
      case 'numero_desc': return b.numero.localeCompare(a.numero, undefined, { numeric: true })
      case 'precio_asc': return precioHabitacion(a) - precioHabitacion(b)
      case 'precio_desc': return precioHabitacion(b) - precioHabitacion(a)
      default: return a.numero.localeCompare(b.numero, undefined, { numeric: true })
    }
  })

  habFiltradas.value = resultado
}

function setFiltroDisp(value: string) {
  filtroDisp.value = value
  aplicarFiltrosHab()
}

function setFiltroTipo(value: string) {
  filtroTipo.value = value
  aplicarFiltrosHab()
}

function esSeleccionable(habitacion: any) {
  return habitacion.estado === 'disponible' || (editando.value && habitacion.idHabitacion === editando.value.habitacionId)
}

function precioHabitacion(habitacion: any) {
  const precioFinal = Number(habitacion?.precioFinal ?? 0)
  return precioFinal > 0 ? precioFinal : Number(habitacion?.tipo?.precioBase ?? 0)
}

function tienePrecioConExtras(habitacion: any) {
  const base = Number(habitacion?.tipo?.precioBase ?? 0)
  return precioHabitacion(habitacion) > base
}

function toggleExtrasHabitacion(idHabitacion: number) {
  extrasAbiertos.value = extrasAbiertos.value === idHabitacion ? null : idHabitacion
}

function extrasHabitacion(habitacion: any) {
  const extras: string[] = []
  if (habitacion?.vista && habitacion.vista !== 'ninguna') {
    extras.push(`Vista: ${labelExtra(habitacion.vista)}`)
  }
  for (const cercania of habitacion?.cercaniasStr ?? []) {
    extras.push(`Cercanía: ${labelExtra(cercania)}`)
  }
  for (const amenidad of habitacion?.amenidades ?? []) {
    extras.push(labelExtra(amenidad))
  }
  return extras
}

function labelExtra(value: any) {
  return String(value ?? '')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function seleccionarHabitacion(habitacion: any) {
  if (!esSeleccionable(habitacion)) return
  habSeleccionada.value = habitacion
  form.value.habitacionId = habitacion.idHabitacion
  precioNocheSeleccionado.value = precioHabitacion(habitacion)
}

function limpiarHabitacion() {
  habSeleccionada.value = null
  form.value.habitacionId = null
  precioNocheSeleccionado.value = 0
}

function abrirModal(reserva?: any) {
  editando.value = reserva || null
  formError.value = ''
  habQuery.value = ''
  filtroDisp.value = reserva ? '' : 'disponible'
  filtroTipo.value = ''
  ordenHab.value = 'numero_asc'

  if (reserva) {
    clienteInicial.value = {
      idCliente: reserva.clienteId,
      nombreCompleto: `${reserva.cliente.nombre} ${reserva.cliente.apellido}`,
      email: reserva.cliente.email,
    }
    habSeleccionada.value = {
      idHabitacion: reserva.habitacionId,
      numero: reserva.habitacion.numero,
      piso: reserva.habitacion.piso,
      capacidad: reserva.numHuespedes,
      estado: 'disponible',
      tipo: { nombre: reserva.habitacion.tipo.nombre, precioBase: reserva.precioNoche },
    }
    form.value = {
      clienteId: reserva.clienteId,
      habitacionId: reserva.habitacionId,
      fechaEntrada: reserva.fechaEntrada.split('T')[0],
      fechaSalida: reserva.fechaSalida.split('T')[0],
      numHuespedes: reserva.numHuespedes,
      metodoPago: reserva.metodoPago,
      descuento: Number(reserva.descuento),
      notas: reserva.notas || '',
    }
    precioNocheSeleccionado.value = Number(reserva.precioNoche ?? reserva.habitacion.tipo.precioBase ?? 0)
  } else {
    clienteInicial.value = null
    habSeleccionada.value = null
    form.value = formVacio()
    precioNocheSeleccionado.value = 0
  }

  modalAbierto.value = true
  cargarHabitaciones()
}

function cerrarModal() {
  modalAbierto.value = false
}

function recalcular() {
  formError.value = ''
  if (!form.value.fechaEntrada) return

  if (fechaEntradaPasada.value) {
    formError.value = 'No se puede reservar una fecha que ya paso.'
    return
  }

  if (!form.value.fechaSalida || calcularNoches(form.value.fechaEntrada, form.value.fechaSalida) < 1) {
    form.value.fechaSalida = fechaMinimaSalida.value
  }
}

async function guardar() {
  if (!puedeGuardar.value) {
    formError.value = fechaEntradaPasada.value
      ? 'No se puede reservar una fecha que ya paso.'
      : 'La reserva minima debe ser de 24 horas y requiere cliente, habitacion y fechas validas.'
    return
  }

  guardando.value = true
  formError.value = ''

  try {
    const payload = {
      ...form.value,
      clienteId: Number(form.value.clienteId),
      habitacionId: Number(form.value.habitacionId),
      numHuespedes: Number(form.value.numHuespedes),
      descuento: Number(form.value.descuento || 0),
    }

    if (editando.value) await reservacionesApi.update(editando.value.idReservacion, payload)
    else await reservacionesApi.create(payload)

    cerrarModal()
    cargar()
  } catch (error: any) {
    const message = error?.response?.data?.message
    formError.value = Array.isArray(message) ? message[0] : (message ?? 'Ocurrio un error al guardar la reservacion')
  } finally {
    guardando.value = false
  }
}

function abrirModalEstado(reserva: any) {
  reservacionEstado.value = reserva
  estadoSeleccionado.value = reserva.estado
  motivoCancelacion.value = reserva.motivoCancelacion || ''
  estadoError.value = ''
  modalEstado.value = true
}

function cerrarModalEstado() {
  modalEstado.value = false
}

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
  } catch (error: any) {
    estadoError.value = error?.response?.data?.message ?? 'Error al cambiar el estado'
  } finally {
    estadoLoading.value = false
  }
}

function abrirDetalle(reserva: any) {
  detalleData.value = reserva
  modalDetalle.value = true
}

function cerrarDetalle() {
  modalDetalle.value = false
}

function labelEstado(estado: string) {
  return estadosMeta.find((item) => item.value === estado)?.label ?? estado
}

function iniciales(reserva: any) {
  return `${reserva.cliente?.nombre?.[0] ?? ''}${reserva.cliente?.apellido?.[0] ?? ''}`.toUpperCase()
}

function puedeEditar(reserva: any) {
  return ['pendiente', 'confirmada'].includes(reserva.estado)
}

function calcularNoches(entrada: string, salida: string): number {
  if (!entrada || !salida) return 0
  return Math.max(0, Math.ceil((parseDateInput(salida).getTime() - parseDateInput(entrada).getTime()) / 86400000))
}

function parseDateInput(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1)
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function fechaInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatPrecio(value: any) {
  return Number(value ?? 0).toFixed(2)
}

function formatFecha(fecha: string) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function formatFechaLarga(fecha: string) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

.reservations {
  width: min(1240px, 100%);
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: 'Sora', sans-serif;
}

.page-header,
.summary-bar,
.filters,
.table-card,
.reservation-modal,
.small-modal {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.page-header {
  padding: 22px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.overline {
  margin: 0 0 5px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1,
h2,
h3 {
  color: var(--text-primary);
  letter-spacing: 0;
}

h1 {
  margin: 0 0 5px;
  font-size: 1.65rem;
  font-weight: 700;
}

.page-header span,
.table-top span,
.modal-header span,
.muted {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.btn,
.icon-btn,
.tabs button,
.type-filter button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.16s, border-color 0.16s, color 0.16s, transform 0.16s;
}

.btn {
  min-height: 36px;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid transparent;
  font-size: 0.82rem;
  font-weight: 700;
}

.btn-primary {
  background: #111827;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0f172a;
  transform: translateY(-1px);
}

.btn-light {
  background: var(--bg-card);
  border-color: var(--border);
  color: var(--text-secondary);
}

.btn-light:hover {
  background: var(--bg-hover);
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.summary-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.summary-item {
  padding: 15px 18px;
  border-right: 1px solid var(--border);
}

.summary-item:last-child {
  border-right: 0;
}

.summary-item span {
  display: block;
  color: var(--text-muted);
  font-size: 0.72rem;
}

.summary-item strong {
  display: block;
  margin-top: 7px;
  color: var(--text-primary);
  font-size: 1.22rem;
}

.filters {
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.search {
  position: relative;
  min-width: 260px;
  flex: 1;
  display: flex;
  align-items: center;
}

.search.compact {
  min-width: 220px;
}

.search svg {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
}

.search input,
.input,
.field input,
.field select,
.field textarea {
  width: 100%;
  min-height: 38px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-app);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.82rem;
  outline: none;
}

.search input {
  padding: 0 12px 0 38px;
}

.input {
  width: auto;
  padding: 0 12px;
}

.search input:focus,
.input:focus,
.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: #64748b;
  box-shadow: 0 0 0 3px rgba(100, 116, 139, 0.12);
}

.state {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-muted);
  font-size: 0.86rem;
}

.state.small {
  min-height: 110px;
}

.state-error,
.error-inline {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.table-top {
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
}

.table-top h2 {
  margin: 0 0 2px;
  font-size: 0.98rem;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 940px;
  border-collapse: collapse;
}

th,
td {
  padding: 13px 16px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: middle;
}

th {
  background: var(--bg-app);
  color: var(--text-muted);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

td {
  color: var(--text-primary);
  font-size: 0.82rem;
}

td strong {
  display: block;
  font-weight: 600;
}

tbody tr:hover {
  background: var(--bg-hover);
}

.reservation-code {
  font-weight: 700;
}

.guest {
  display: flex;
  align-items: center;
  gap: 10px;
}

.guest span {
  display: block;
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 0.73rem;
}

.avatar {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f1f5f9;
  color: #334155;
  font-size: 0.74rem;
  font-weight: 700;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 25px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
}

.status i {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: currentColor;
}

.status.pendiente { background: #fffbeb; color: #b45309; }
.status.confirmada { background: #eff6ff; color: #2563eb; }
.status.en_curso { background: #ecfdf5; color: #047857; }
.status.completada { background: #f1f5f9; color: #475569; }
.status.cancelada { background: #fef2f2; color: #dc2626; }
.status.no_show { background: #f8fafc; color: #64748b; }

.actions-col {
  width: 112px;
}

.row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.icon-btn {
  width: 31px;
  height: 31px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-secondary);
}

.icon-btn:hover {
  background: var(--bg-hover);
  border-color: #94a3b8;
  color: var(--text-primary);
}

.empty {
  padding: 42px;
  color: var(--text-muted);
  text-align: center;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(3px);
}

.reservation-modal {
  width: min(1080px, 100%);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.small-modal {
  width: min(520px, 100%);
  max-height: 92vh;
  overflow-y: auto;
}

.modal-header,
.modal-footer {
  padding: 17px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.modal-header {
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  margin: 0;
  font-size: 1rem;
}

.modal-footer {
  justify-content: flex-end;
  border-top: 1px solid var(--border);
}

.modal-body {
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  min-height: 0;
  overflow: hidden;
}

.reservation-form {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  border-right: 1px solid var(--border);
}

.form-block {
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.form-block h3 {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field.padded {
  padding: 0 20px 16px;
}

.field span {
  color: var(--text-secondary);
  font-size: 0.74rem;
  font-weight: 700;
}

.field input,
.field select {
  padding: 0 11px;
}

.field textarea {
  min-height: 76px;
  padding: 10px 11px;
  resize: vertical;
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.selected-room,
.room-placeholder,
.price-box,
.note {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-app);
}

.selected-room {
  padding: 11px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.selected-room strong,
.selected-room span {
  display: block;
}

.selected-room span,
.room-placeholder {
  color: var(--text-muted);
  font-size: 0.76rem;
}

.room-placeholder {
  padding: 12px;
  border-style: dashed;
}

.price-box {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.price-box div {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.price-box strong {
  color: var(--text-primary);
}

.price-box .total {
  padding-top: 8px;
  border-top: 1px solid var(--border);
  font-weight: 700;
}

.error-inline {
  padding: 10px 12px;
  border: 1px solid;
  border-radius: 8px;
  font-size: 0.8rem;
}

.padded-error {
  margin: 0 20px 16px;
}

.room-picker {
  min-height: 0;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  background: var(--bg-app);
}

.room-tools {
  display: flex;
  gap: 8px;
}

.room-tools .input {
  flex: 0 0 145px;
}

.tabs,
.type-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tabs button,
.type-filter button {
  min-height: 29px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 700;
}

.tabs button.active,
.type-filter button.active {
  background: #111827;
  border-color: #111827;
  color: white;
}

.room-count {
  display: flex;
  justify-content: space-between;
  color: var(--text-muted);
  font-size: 0.74rem;
}

.room-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.room-card {
  width: 100%;
  padding: 11px;
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  gap: 11px;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-primary);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.room-card:hover {
  border-color: #94a3b8;
}

.room-card.selected {
  border-color: #111827;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.1);
}

.room-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.room-card strong {
  display: block;
  font-size: 0.84rem;
}

.room-card em {
  color: var(--text-muted);
  font-style: normal;
  font-weight: 500;
}

.room-card small {
  display: block;
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 0.72rem;
}

.room-card b {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 2px;
  color: var(--text-primary);
  font-size: 0.84rem;
}

.price-extra-note {
  color: #047857 !important;
  font-size: 0.64rem !important;
  font-weight: 700;
  margin-top: 0 !important;
  white-space: nowrap;
}

.extras-toggle {
  margin-top: 7px;
  padding: 0;
  border: none;
  background: transparent;
  color: #4f46e5;
  font-family: inherit;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
}

.extras-toggle:hover {
  text-decoration: underline;
}

.room-extras {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}

.room-extras span {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding: 2px 7px;
  border-radius: 999px;
  background: #f0fdf4;
  color: #047857;
  border: 1px solid #bbf7d0;
  font-size: 0.66rem;
  font-weight: 700;
}

.room-extras .room-no-extras {
  background: #f8fafc;
  color: var(--text-muted);
  border-color: var(--border);
}

.room-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.room-dot.disponible { background: #059669; }
.room-dot.reservada { background: #2563eb; }
.room-dot.ocupada { background: #dc2626; }
.room-dot.mantenimiento { background: #d97706; }

.room-empty {
  border: 1px dashed var(--border);
  border-radius: 8px;
  background: var(--bg-card);
}

.status-options {
  padding: 17px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-options button {
  padding: 11px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-app);
  font-family: inherit;
  cursor: pointer;
}

.status-options button.active {
  border-color: #111827;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.1);
}

.status-options small {
  color: var(--text-muted);
}

.detail-grid {
  padding: 18px 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.detail-grid div {
  padding: 11px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-app);
}

.detail-grid span,
.note span {
  display: block;
  margin-bottom: 5px;
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.detail-grid strong {
  display: block;
  color: var(--text-primary);
  font-size: 0.84rem;
}

.detail-grid small {
  display: block;
  margin-top: 3px;
  color: var(--text-muted);
}

.detail-price,
.note {
  margin: 0 20px 16px;
}

.note {
  padding: 12px;
  color: var(--text-secondary);
  font-size: 0.82rem;
  line-height: 1.6;
}

.note.danger {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.18s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

:global(.dark) .page-header,
:global(.dark) .summary-bar,
:global(.dark) .filters,
:global(.dark) .table-card,
:global(.dark) .reservation-modal,
:global(.dark) .small-modal {
  background: #111827;
  border-color: #243044;
}

:global(.dark) th,
:global(.dark) .room-picker,
:global(.dark) .selected-room,
:global(.dark) .room-placeholder,
:global(.dark) .price-box,
:global(.dark) .note,
:global(.dark) .detail-grid div,
:global(.dark) .status-options button {
  background: #0f172a;
}

:global(.dark) .btn-primary,
:global(.dark) .tabs button.active,
:global(.dark) .type-filter button.active {
  background: #e2e8f0;
  border-color: #e2e8f0;
  color: #0f172a;
}

@media (max-width: 980px) {
  .summary-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-item:nth-child(2) {
    border-right: 0;
  }

  .modal-body {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .reservation-form {
    border-right: 0;
    border-bottom: 1px solid var(--border);
  }
}

@media (max-width: 640px) {
  .page-header,
  .filters,
  .room-tools,
  .modal-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .summary-bar,
  .field-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .summary-item {
    border-right: 0;
    border-bottom: 1px solid var(--border);
  }

  .summary-item:last-child {
    border-bottom: 0;
  }

  .input,
  .room-tools .input {
    width: 100%;
    flex: auto;
  }
}
</style>
