<template>
  <div class="payments-page">
    <header class="page-header">
      <div>
        <p class="overline">Centro de cobros</p>
        <h1>Pagos</h1>
        <span>Autorizacion, validacion y seguimiento de transacciones.</span>
      </div>

      <button v-if="auth.tienePermiso('pagos:crear')" class="btn btn-primary" @click="abrirModal">
        <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        Nuevo pago
      </button>
    </header>

    <section class="summary-bar">
      <div v-for="item in resumen" :key="item.label" class="summary-item">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </section>

    <section class="filters">
      <label class="search">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input v-model="filtros.search" type="text" placeholder="Referencia, titular o email" @input="cargar" />
      </label>

      <select v-model="filtros.estado" class="input" @change="cargar">
        <option value="">Todos los estados</option>
        <option v-for="estado in estados" :key="estado.value" :value="estado.value">{{ estado.label }}</option>
      </select>

      <button class="btn btn-light" @click="limpiarFiltros">Limpiar</button>
    </section>

    <div v-if="loading" class="state">
      <svg class="spin" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      Cargando pagos...
    </div>

    <div v-else-if="error" class="state state-error">{{ error }}</div>

    <section v-else class="table-card">
      <div class="table-top">
        <div>
          <h2>Transacciones</h2>
          <span>{{ pagos.length }} registro{{ pagos.length === 1 ? '' : 's' }}</span>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Referencia</th>
              <th>Asociado a</th>
              <th>Metodo</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Autorizacion</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pago in pagos" :key="pago.idPago">
              <td>
                <strong>{{ pago.referencia }}</strong>
                <span class="muted">{{ formatFecha(pago.creadoEn) }}</span>
              </td>
              <td>
                <strong>{{ asociadoTitulo(pago) }}</strong>
                <span class="muted">{{ asociadoDetalle(pago) }}</span>
              </td>
              <td>
                <strong>{{ etiquetaMetodo[pago.metodo] }}</strong>
                <span class="muted">{{ metodoDetalle(pago) }}</span>
              </td>
              <td>
                <strong>${{ formatPrecio(pago.monto) }}</strong>
                <span class="muted">{{ pago.moneda }}</span>
              </td>
              <td>
                <span class="status" :class="pago.estado"><i></i>{{ labelEstado(pago.estado) }}</span>
              </td>
              <td>
                <strong>{{ pago.autorizacion || '-' }}</strong>
                <span v-if="pago.motivoRechazo" class="muted">{{ pago.motivoRechazo }}</span>
              </td>
              <td>
                <div class="actions">
                  <button class="icon-btn" title="Ver detalle" @click="abrirDetalle(pago)">
                    <svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button v-if="auth.tienePermiso('pagos:reembolsar') && pago.estado === 'aprobado'" class="icon-btn" title="Reembolsar" @click="reembolsar(pago)">
                    <svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a7 7 0 1 1 0 14h-1"/></svg>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="pagos.length === 0">
              <td colspan="7" class="empty">No hay pagos registrados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Transition name="modal">
      <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
        <div class="payment-modal">
          <header class="modal-header">
            <div>
              <p class="overline">Nueva transaccion</p>
              <h2>Procesar pago</h2>
            </div>
            <div class="secure-indicator">
              <svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
              <span>SSL activo</span>
            </div>
            <button class="icon-btn" @click="cerrarModal">
              <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </header>

          <div class="modal-body">
            <section class="form-panel">
              <div class="security-banner">
                <div class="lock-badge">
                  <svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                </div>
                <p>Los datos de su tarjeta son enviados de forma segura y no almacenamos el CVV ni el número completo.</p>
              </div>

              <label class="field">
                <span>Aplicar a</span>
                <select v-model="form.tipoAsociacion" @change="resetAsociacion">
                  <option value="reservacion">Reservacion</option>
                  <option value="factura">Factura</option>
                </select>
              </label>

              <label v-if="form.tipoAsociacion === 'reservacion'" class="field">
                <span>Reservacion</span>
                <select v-model.number="form.reservacionId" @change="tomarMontoReservacion">
                  <option :value="null">Seleccionar reservacion</option>
                  <option v-for="reserva in reservaciones" :key="reserva.idReservacion" :value="reserva.idReservacion">
                    #{{ reserva.idReservacion }} - {{ reserva.cliente.nombre }} {{ reserva.cliente.apellido }} - ${{ formatPrecio(reserva.totalCalculado) }}
                  </option>
                </select>
              </label>

              <label v-else class="field">
                <span>Factura</span>
                <select v-model.number="form.facturaId" @change="tomarMontoFactura">
                  <option :value="null">Seleccionar factura</option>
                  <option v-for="factura in facturas" :key="factura.idFactura" :value="factura.idFactura">
                    {{ factura.numeroFactura }} - {{ factura.clienteNombre }} - ${{ formatPrecio(factura.total) }}
                  </option>
                </select>
              </label>

              <label class="field">
                <span>Metodo</span>
                <select v-model="form.metodo" @change="limpiarDatosMetodo">
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia bancaria</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="wallet">Wallet</option>
                  <option value="link_pago">Link de pago</option>
                </select>
              </label>

              <label class="field">
                <span>Pasarela preparada</span>
                <select v-model="form.pasarela">
                  <option value="n1co">N1co</option>
                  <option value="wompi">Wompi</option>
                  <option value="stripe">Stripe</option>
                  <option value="bizz">Bizz</option>
                </select>
              </label>

              <section v-if="form.metodo === 'tarjeta'" class="method-box">
                <div class="method-head">
                  <div>
                    <strong>Datos de tarjeta</strong>
                    <span>Tokenizacion segura antes de registrar la transaccion.</span>
                  </div>
                  <div class="card-logos">
                    <span class="card-logo visa" :class="{ active: cardBrand.key === 'visa' }">Visa</span>
                    <span class="card-logo mastercard" :class="{ active: cardBrand.key === 'mastercard' }"><i></i><b></b></span>
                    <span class="card-logo amex" :class="{ active: cardBrand.key === 'amex' }">AMEX</span>
                  </div>
                </div>
                <label class="field">
                  <span>Numero de tarjeta</span>
                  <div class="card-input-wrap" :class="validationClass(cardNumberStatus)">
                    <input v-model="form.tarjetaNumero" type="text" inputmode="numeric" autocomplete="cc-number" placeholder="4111 1111 1111 1111" @input="formatCardInput" />
                    <strong>{{ cardBrand.label }}</strong>
                  </div>
                  <small :class="validationClass(cardNumberStatus)">{{ cardNumberHint }}</small>
                </label>
                <div class="field-grid">
                  <label class="field">
                    <span>Vencimiento</span>
                    <input v-model="form.vencimiento" :class="validationClass(expiryStatus)" type="text" maxlength="5" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" @input="formatExpiryInput" />
                    <small :class="validationClass(expiryStatus)">{{ expiryHint }}</small>
                  </label>
                  <label class="field">
                    <span>CVV</span>
                    <input v-model="form.cvv" :class="validationClass(cvvStatus)" type="password" maxlength="4" inputmode="numeric" autocomplete="cc-csc" placeholder="123" />
                    <small :class="validationClass(cvvStatus)">{{ cvvHint }}</small>
                  </label>
                </div>
                <div class="token-note">
                  <span>Se guardara</span>
                  <strong>{{ cardBrand.label }} {{ cardLast4 ? `terminada en ${cardLast4}` : 'tokenizada por pasarela' }}</strong>
                </div>
              </section>

              <section v-if="form.metodo === 'transferencia'" class="method-box">
                <div class="method-head">
                  <strong>Confirmacion bancaria</strong>
                  <span>La referencia se valida como comprobante de transferencia.</span>
                </div>
                <div class="field-grid">
                  <label class="field">
                    <span>Banco origen</span>
                    <input v-model="form.bancoOrigen" type="text" placeholder="Banco Agricola, BAC, Davivienda..." />
                  </label>
                  <label class="field">
                    <span>Referencia bancaria</span>
                    <input v-model="form.referenciaBancaria" type="text" placeholder="TRX20260604A1" />
                  </label>
                </div>
              </section>

              <div class="field-grid">
                <label class="field">
                  <span>Monto</span>
                  <input v-model.number="form.monto" type="number" min="0.01" step="0.01" />
                </label>
                <label class="field">
                  <span>Moneda</span>
                  <input v-model="form.moneda" type="text" maxlength="3" />
                </label>
              </div>

              <label class="field">
                <span>Titular</span>
                <input v-model="form.titular" type="text" placeholder="Nombre del cliente" />
              </label>

              <div class="field-grid">
                <label class="field">
                  <span>Email</span>
                  <input v-model="form.emailPagador" :class="validationClass(emailStatus)" type="email" autocomplete="email" placeholder="correo@cliente.com" />
                  <small :class="validationClass(emailStatus)">{{ emailHint }}</small>
                </label>
              </div>

              <label class="field">
                <span>Notas</span>
                <textarea v-model="form.notas" rows="3" placeholder="Observaciones internas"></textarea>
              </label>

              <div v-if="formError" class="error-inline">{{ formError }}</div>
            </section>

            <aside class="checkout-panel">
              <div class="checkout-card">
                <span>Resumen de transaccion</span>
                <h3>${{ formatPrecio(form.monto) }} {{ form.moneda }}</h3>
                <p>{{ resumenAsociacion }}</p>
              </div>

              <div class="summary-lines">
                <div><span>Metodo</span><strong>{{ etiquetaMetodo[form.metodo] }}</strong></div>
                <div><span>Pasarela</span><strong>{{ pasarelaLabel }}</strong></div>
                <div><span>Pagador</span><strong>{{ form.titular || 'Pendiente' }}</strong></div>
                <div><span>Email</span><strong>{{ form.emailPagador || 'Pendiente' }}</strong></div>
                <div v-if="form.metodo === 'tarjeta'"><span>Tarjeta</span><strong>{{ cardBrand.label }} {{ cardLast4 ? `**** ${cardLast4}` : '' }}</strong></div>
              </div>

              <div class="compliance-box">
                <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>
                <div>
                  <strong>PCI DSS ready</strong>
                  <p>El CVV se usa solo para autorizar. El numero completo no se almacena.</p>
                </div>
              </div>

              <div class="processor-card">
                <span>Decision de autorizacion</span>
                <strong>{{ resultadoPrevisto.label }}</strong>
                <small>{{ resultadoPrevisto.detalle }}</small>
              </div>
            </aside>
          </div>

          <footer class="modal-footer">
            <button class="btn btn-light" @click="cerrarModal">Cancelar</button>
            <button class="btn btn-primary" :disabled="guardando" @click="guardar">
              {{ guardando ? 'Procesando...' : 'Procesar pago' }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="detalle" class="modal-overlay" @click.self="detalle = null">
        <div class="detail-modal">
          <header class="modal-header">
            <div>
              <p class="overline">Detalle de pago</p>
              <h2>{{ detalle.referencia }}</h2>
              <span>{{ formatFecha(detalle.creadoEn) }}</span>
            </div>
            <button class="icon-btn" @click="detalle = null">
              <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </header>
          <div class="detail-grid">
            <div><span>Estado</span><strong>{{ labelEstado(detalle.estado) }}</strong></div>
            <div><span>Monto</span><strong>${{ formatPrecio(detalle.monto) }} {{ detalle.moneda }}</strong></div>
            <div><span>Metodo</span><strong>{{ etiquetaMetodo[detalle.metodo] }}</strong></div>
            <div><span>Autorizacion</span><strong>{{ detalle.autorizacion || '-' }}</strong></div>
            <div><span>Token pasarela</span><strong>{{ detalle.tokenPasarela || '-' }}</strong></div>
            <div><span>Marca</span><strong>{{ detalle.marcaTarjeta || '-' }}</strong></div>
            <div><span>Ultimos 4</span><strong>{{ detalle.ultimos4 || '-' }}</strong></div>
            <div><span>Titular</span><strong>{{ detalle.titular || '-' }}</strong></div>
            <div><span>Email</span><strong>{{ detalle.emailPagador || '-' }}</strong></div>
          </div>
          <div v-if="detalle.notas" class="note"><span>Notas</span>{{ detalle.notas }}</div>
          <div v-if="detalle.motivoRechazo" class="note danger"><span>Motivo rechazo</span>{{ detalle.motivoRechazo }}</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { facturacionApi, pagosApi, reservacionesApi } from '../../services/api'

const auth = useAuthStore()

const pagos = ref<any[]>([])
const reservaciones = ref<any[]>([])
const facturas = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const modalAbierto = ref(false)
const guardando = ref(false)
const formError = ref('')
const detalle = ref<any>(null)

const filtros = reactive({ search: '', estado: '' })

const formVacio = () => ({
  tipoAsociacion: 'reservacion',
  reservacionId: null as any,
  facturaId: null as any,
  metodo: 'tarjeta',
  monto: 0,
  moneda: 'USD',
  titular: '',
  emailPagador: '',
  tarjetaNumero: '',
  vencimiento: '',
  cvv: '',
  bancoOrigen: '',
  referenciaBancaria: '',
  pasarela: 'n1co',
  notas: '',
})

const form = ref(formVacio())

const estados = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'reembolsado', label: 'Reembolsado' },
]

const etiquetaMetodo: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  wallet: 'Wallet',
  link_pago: 'Link de pago',
}

const resumen = computed(() => {
  const aprobados = pagos.value.filter((p) => p.estado === 'aprobado')
  const pendientes = pagos.value.filter((p) => p.estado === 'pendiente').length
  const rechazados = pagos.value.filter((p) => p.estado === 'rechazado').length
  const total = aprobados.reduce((sum, p) => sum + Number(p.monto || 0), 0)

  return [
    { label: 'Pagos', value: pagos.value.length },
    { label: 'Aprobados', value: aprobados.length },
    { label: 'Pendientes', value: pendientes },
    { label: 'Capturado', value: `$${formatPrecio(total)}` },
    { label: 'Rechazados', value: rechazados },
  ]
})

const resultadoPrevisto = computed(() => {
  if (!form.value.monto || form.value.monto <= 0) {
    return { label: 'Rechazado', detalle: 'El monto debe ser mayor a cero' }
  }

  if (form.value.metodo === 'tarjeta') {
    const card = cleanCard(form.value.tarjetaNumero)
    if (!card || card.length < 13) return { label: 'Pendiente de datos', detalle: 'Ingrese el numero de tarjeta' }
    if (!luhn(card)) return { label: 'Rechazado', detalle: 'La tarjeta no pasa validacion bancaria' }
    if (!form.value.vencimiento || !form.value.cvv) return { label: 'Pendiente de datos', detalle: 'Complete vencimiento y CVV' }
    if (card.endsWith('0002')) return { label: 'Rechazado', detalle: 'El banco respondera fondos insuficientes' }
    if (Number(form.value.monto) >= 2500) return { label: 'Pendiente', detalle: 'Monto sujeto a autenticacion 3DS' }
    return { label: 'Aprobado', detalle: 'La autorizacion deberia completarse' }
  }

  if (form.value.metodo === 'transferencia') {
    const ref = form.value.referenciaBancaria.trim().toUpperCase()
    if (!form.value.bancoOrigen || !ref) return { label: 'Pendiente de datos', detalle: 'Ingrese banco y referencia' }
    if (/(FAIL|RECHAZ|VOID|000000)$/.test(ref)) return { label: 'Rechazado', detalle: 'Referencia marcada para rechazo bancario' }
    if (Number(form.value.monto) >= 5000) return { label: 'Pendiente', detalle: 'Revision bancaria por monto alto' }
    return { label: 'Aprobado', detalle: 'Transferencia confirmable' }
  }

  if (form.value.metodo === 'link_pago') return { label: 'Pendiente', detalle: 'El cliente debe completar el enlace' }
  if (form.value.metodo === 'wallet' && Number(form.value.monto) > 1500) return { label: 'Pendiente', detalle: 'Revision de wallet por monto alto' }
  return { label: 'Aprobado', detalle: 'Registro inmediato' }
})

const pasarelas: Record<string, string> = {
  n1co: 'N1co',
  wompi: 'Wompi',
  stripe: 'Stripe',
  bizz: 'Bizz',
}

const pasarelaLabel = computed(() => pasarelas[form.value.pasarela] ?? 'Gateway')

const cardDigits = computed(() => cleanCard(form.value.tarjetaNumero))
const cardLast4 = computed(() => (cardDigits.value.length >= 4 ? cardDigits.value.slice(-4) : ''))
const cardBrand = computed(() => detectarMarcaTarjeta(cardDigits.value))

const cardNumberStatus = computed(() => {
  if (form.value.metodo !== 'tarjeta' || !cardDigits.value) return 'idle'
  return cardDigits.value.length >= 13 && cardDigits.value.length <= 19 && luhn(cardDigits.value) ? 'valid' : 'invalid'
})

const cardNumberHint = computed(() => {
  if (!cardDigits.value) return 'Ingrese el numero impreso en la tarjeta.'
  if (cardNumberStatus.value === 'valid') return `${cardBrand.value.label} detectada correctamente.`
  return 'Numero invalido o incompleto.'
})

const expiryStatus = computed(() => {
  if (form.value.metodo !== 'tarjeta' || !form.value.vencimiento) return 'idle'
  return vencimientoVigente(form.value.vencimiento) ? 'valid' : 'invalid'
})

const expiryHint = computed(() => {
  if (!form.value.vencimiento) return 'Formato MM/AA.'
  return expiryStatus.value === 'valid' ? 'Fecha vigente.' : 'Fecha vencida o invalida.'
})

const cvvStatus = computed(() => {
  if (form.value.metodo !== 'tarjeta' || !form.value.cvv) return 'idle'
  const expectedLength = cardBrand.value.key === 'amex' ? 4 : 3
  return new RegExp(`^\\d{${expectedLength}}$`).test(form.value.cvv) ? 'valid' : 'invalid'
})

const cvvHint = computed(() => {
  if (!form.value.cvv) return cardBrand.value.key === 'amex' ? '4 digitos para Amex.' : '3 digitos de seguridad.'
  return cvvStatus.value === 'valid' ? 'CVV listo para autorizar, no se almacena.' : 'CVV invalido para la marca detectada.'
})

const emailStatus = computed(() => {
  if (!form.value.emailPagador) return 'idle'
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.emailPagador) ? 'valid' : 'invalid'
})

const emailHint = computed(() => {
  if (!form.value.emailPagador) return 'Se usara para enviar comprobante.'
  return emailStatus.value === 'valid' ? 'Correo valido.' : 'Correo invalido.'
})

const resumenAsociacion = computed(() => {
  if (form.value.tipoAsociacion === 'factura') {
    const factura = facturas.value.find((f) => f.idFactura === form.value.facturaId)
    return factura ? `${factura.numeroFactura} - ${factura.clienteNombre}` : 'Seleccione la factura a cobrar'
  }

  const reserva = reservaciones.value.find((r) => r.idReservacion === form.value.reservacionId)
  return reserva
    ? `Reservacion #${reserva.idReservacion} - ${reserva.cliente.nombre} ${reserva.cliente.apellido}`
    : 'Seleccione la reservacion a cobrar'
})

onMounted(() => {
  cargar()
  cargarAsociaciones()
})

async function cargar() {
  try {
    loading.value = true
    error.value = ''
    const params: any = {}
    if (filtros.search) params.search = filtros.search
    if (filtros.estado) params.estado = filtros.estado
    const { data } = await pagosApi.getAll(params)
    pagos.value = data
  } catch {
    error.value = 'No se pudieron cargar los pagos'
  } finally {
    loading.value = false
  }
}

async function cargarAsociaciones() {
  const [resReservas, resFacturas] = await Promise.all([
    reservacionesApi.getAll(),
    facturacionApi.getAll({ estado: 'emitida', limit: 100 }),
  ])
  reservaciones.value = resReservas.data
  facturas.value = resFacturas.data.data
}

function limpiarFiltros() {
  filtros.search = ''
  filtros.estado = ''
  cargar()
}

function abrirModal() {
  form.value = formVacio()
  formError.value = ''
  modalAbierto.value = true
  cargarAsociaciones()
}

function cerrarModal() {
  modalAbierto.value = false
}

function resetAsociacion() {
  form.value.reservacionId = null
  form.value.facturaId = null
  form.value.monto = 0
}

function limpiarDatosMetodo() {
  form.value.tarjetaNumero = ''
  form.value.vencimiento = ''
  form.value.cvv = ''
  form.value.bancoOrigen = ''
  form.value.referenciaBancaria = ''
}

function tomarMontoReservacion() {
  const reserva = reservaciones.value.find((r) => r.idReservacion === form.value.reservacionId)
  form.value.monto = Number(reserva?.totalCalculado ?? 0)
  if (reserva?.cliente) {
    form.value.titular = `${reserva.cliente.nombre} ${reserva.cliente.apellido}`
    form.value.emailPagador = reserva.cliente.email
  }
}

function tomarMontoFactura() {
  const factura = facturas.value.find((f) => f.idFactura === form.value.facturaId)
  form.value.monto = Number(factura?.total ?? 0)
  form.value.titular = factura?.clienteNombre ?? ''
  form.value.emailPagador = factura?.clienteEmail ?? ''
}

async function guardar() {
  if (!form.value.monto || form.value.monto <= 0) {
    formError.value = 'El monto debe ser mayor a 0'
    return
  }

  if (form.value.tipoAsociacion === 'reservacion' && !form.value.reservacionId) {
    formError.value = 'Selecciona una reservacion'
    return
  }

  if (form.value.tipoAsociacion === 'factura' && !form.value.facturaId) {
    formError.value = 'Selecciona una factura'
    return
  }

  const metodoError = validarMetodo()
  if (metodoError) {
    formError.value = metodoError
    return
  }

  guardando.value = true
  formError.value = ''

  try {
    await pagosApi.create({
      metodo: form.value.metodo,
      monto: Number(form.value.monto),
      moneda: form.value.moneda,
      reservacionId: form.value.tipoAsociacion === 'reservacion' ? Number(form.value.reservacionId) : undefined,
      facturaId: form.value.tipoAsociacion === 'factura' ? Number(form.value.facturaId) : undefined,
      titular: form.value.titular || undefined,
      emailPagador: form.value.emailPagador || undefined,
      tarjetaNumero: form.value.metodo === 'tarjeta' ? cleanCard(form.value.tarjetaNumero) : undefined,
      vencimiento: form.value.metodo === 'tarjeta' ? form.value.vencimiento : undefined,
      cvv: form.value.metodo === 'tarjeta' ? form.value.cvv : undefined,
      bancoOrigen: form.value.metodo === 'transferencia' ? form.value.bancoOrigen : undefined,
      referenciaBancaria: form.value.metodo === 'transferencia' ? form.value.referenciaBancaria : undefined,
      pasarela: form.value.pasarela,
      notas: form.value.notas || undefined,
    })
    cerrarModal()
    cargar()
  } catch (e: any) {
    const msg = e?.response?.data?.message
    formError.value = Array.isArray(msg) ? msg[0] : (msg ?? 'No se pudo procesar el pago')
  } finally {
    guardando.value = false
  }
}

async function reembolsar(pago: any) {
  await pagosApi.reembolsar(pago.idPago)
  cargar()
}

function abrirDetalle(pago: any) {
  detalle.value = pago
}

function validarMetodo() {
  if (form.value.metodo === 'tarjeta') {
    const card = cleanCard(form.value.tarjetaNumero)
    if (!card || cardNumberStatus.value !== 'valid') return 'Ingrese un numero de tarjeta valido'
    if (expiryStatus.value !== 'valid') return 'Ingrese un vencimiento vigente en formato MM/AA'
    if (cvvStatus.value !== 'valid') return 'Ingrese un CVV valido'
  }

  if (form.value.metodo === 'transferencia') {
    if (!form.value.bancoOrigen.trim()) return 'Ingrese el banco origen'
    if (form.value.referenciaBancaria.trim().length < 6) return 'Ingrese una referencia bancaria valida'
  }

  return ''
}

function cleanCard(value: string) {
  return (value || '').replace(/\D/g, '')
}

function detectarMarcaTarjeta(card: string) {
  if (/^4/.test(card)) return { key: 'visa', label: 'Visa' }
  if (/^(5[1-5]|2[2-7])/.test(card)) return { key: 'mastercard', label: 'Mastercard' }
  if (/^3[47]/.test(card)) return { key: 'amex', label: 'American Express' }
  if (/^6(?:011|5)/.test(card)) return { key: 'discover', label: 'Discover' }
  return { key: 'unknown', label: 'Tarjeta' }
}

function luhn(card: string) {
  let sum = 0
  let shouldDouble = false

  for (let i = card.length - 1; i >= 0; i -= 1) {
    let digit = Number(card[i] ?? 0)
    if (shouldDouble) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    shouldDouble = !shouldDouble
  }

  return sum % 10 === 0
}

function formatCardInput(event: Event) {
  const target = event.target as HTMLInputElement
  const digits = cleanCard(target.value).slice(0, 19)
  target.value = digits.replace(/(.{4})/g, '$1 ').trim()
  form.value.tarjetaNumero = target.value
}

function formatExpiryInput(event: Event) {
  const target = event.target as HTMLInputElement
  const digits = target.value.replace(/\D/g, '').slice(0, 4)
  target.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
  form.value.vencimiento = target.value
}

function vencimientoVigente(value: string) {
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) return false
  const [monthRaw, yearRaw] = value.split('/')
  const month = Number(monthRaw)
  const year = 2000 + Number(yearRaw)
  return new Date(year, month, 0, 23, 59, 59, 999) >= new Date()
}

function validationClass(status: string) {
  return {
    'is-valid': status === 'valid',
    'is-invalid': status === 'invalid',
  }
}

function metodoDetalle(pago: any) {
  if (pago.metodo === 'tarjeta') {
    const marca = pago.marcaTarjeta || 'Tarjeta'
    return pago.ultimos4 ? `${marca} **** ${pago.ultimos4}` : marca
  }
  return pago.proveedor
}

function asociadoTitulo(pago: any) {
  if (pago.factura) return pago.factura.numeroFactura
  if (pago.reservacion) return `Reservacion #${pago.reservacion.idReservacion}`
  return 'Sin asociacion'
}

function asociadoDetalle(pago: any) {
  if (pago.factura) return `Factura ${pago.factura.estado}`
  if (pago.reservacion) {
    return `${pago.reservacion.cliente.nombre} ${pago.reservacion.cliente.apellido} · Hab. ${pago.reservacion.habitacion.numero}`
  }
  return '-'
}

function labelEstado(value: string) {
  return estados.find((estado) => estado.value === value)?.label ?? value
}

function formatPrecio(value: any) {
  return Number(value ?? 0).toFixed(2)
}

function formatFecha(value: string) {
  if (!value) return ''
  return new Date(value).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

.payments-page {
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
.payment-modal,
.detail-modal {
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
}

.page-header span,
.table-top span,
.modal-header span,
.muted {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.btn,
.icon-btn {
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

.btn-light {
  background: var(--bg-card);
  border-color: var(--border);
  color: var(--text-secondary);
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
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
  grid-template-columns: repeat(5, minmax(0, 1fr));
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
  font-size: 1.12rem;
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
  min-width: 980px;
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
.status.aprobado { background: #ecfdf5; color: #047857; }
.status.rechazado { background: #fef2f2; color: #dc2626; }
.status.reembolsado { background: #eff6ff; color: #2563eb; }

.actions {
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

.payment-modal {
  width: min(980px, 100%);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-modal {
  width: min(540px, 100%);
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

.secure-indicator {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid #bbf7d0;
  border-radius: 999px;
  background: #f0fdf4;
  color: #047857;
  font-size: 0.72rem;
  font-weight: 800;
}

.modal-footer {
  justify-content: flex-end;
  border-top: 1px solid var(--border);
}

.modal-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  min-height: 0;
  overflow: hidden;
}

.form-panel {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  border-right: 1px solid var(--border);
}

.security-banner {
  display: grid;
  grid-template-columns: 38px 1fr;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1e3a8a;
}

.security-banner p {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.5;
}

.lock-badge {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #dbeafe;
  color: #1d4ed8;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
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

.field small {
  color: var(--text-muted);
  font-size: 0.68rem;
  line-height: 1.4;
}

.field small.is-valid {
  color: #047857;
}

.field small.is-invalid {
  color: #dc2626;
}

.field input.is-valid {
  border-color: #34d399;
  background: #f0fdf4;
}

.field input.is-invalid {
  border-color: #f87171;
  background: #fef2f2;
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

.method-box {
  padding: 13px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-app);
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.method-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.method-head strong {
  color: var(--text-primary);
  font-size: 0.85rem;
}

.method-head span {
  color: var(--text-muted);
  font-size: 0.73rem;
}

.card-logos {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.card-logo {
  width: 52px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: #fff;
  color: #64748b;
  font-size: 0.66rem;
  font-weight: 900;
  opacity: 0.58;
}

.card-logo.active {
  border-color: #111827;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
  opacity: 1;
}

.card-logo.visa {
  color: #172b85;
  font-style: italic;
}

.card-logo.amex {
  background: #2563eb;
  color: #fff;
}

.card-logo.mastercard {
  position: relative;
}

.card-logo.mastercard i,
.card-logo.mastercard b {
  width: 17px;
  height: 17px;
  border-radius: 999px;
}

.card-logo.mastercard i {
  background: #ef4444;
  transform: translateX(4px);
}

.card-logo.mastercard b {
  background: #f59e0b;
  transform: translateX(-4px);
}

.card-input-wrap {
  min-height: 38px;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-app);
}

.card-input-wrap input {
  border: 0;
  background: transparent;
}

.card-input-wrap strong {
  padding: 0 11px;
  color: var(--text-muted);
  font-size: 0.72rem;
  white-space: nowrap;
}

.card-input-wrap.is-valid {
  border-color: #34d399;
  background: #f0fdf4;
}

.card-input-wrap.is-invalid {
  border-color: #f87171;
  background: #fef2f2;
}

.token-note {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #fff;
}

.token-note span {
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
}

.token-note strong {
  color: var(--text-primary);
  font-size: 0.78rem;
}

.error-inline {
  padding: 10px 12px;
  border: 1px solid;
  border-radius: 8px;
  font-size: 0.8rem;
}

.checkout-panel {
  padding: 18px;
  background: var(--bg-app);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkout-panel h3 {
  margin: 0 0 8px;
  font-size: 0.95rem;
}

.checkout-panel p {
  margin: 0 0 14px;
  color: var(--text-muted);
  font-size: 0.8rem;
  line-height: 1.6;
}

.checkout-card,
.processor-card,
.compliance-box,
.summary-lines,
.note,
.detail-grid div {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
}

.checkout-card,
.processor-card {
  padding: 12px;
}

.checkout-card span,
.processor-card span,
.summary-lines span,
.detail-grid span,
.note span {
  display: block;
  margin-bottom: 5px;
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.checkout-card h3 {
  margin: 0 0 4px;
  font-size: 1.55rem;
}

.checkout-card p {
  margin: 0;
}

.processor-card strong {
  display: block;
  color: var(--text-primary);
}

.processor-card small {
  display: block;
  margin-top: 5px;
  color: var(--text-muted);
  font-size: 0.74rem;
  line-height: 1.45;
}

.summary-lines {
  padding: 5px 12px;
}

.summary-lines div {
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.summary-lines div:last-child {
  border-bottom: 0;
}

.summary-lines strong {
  display: block;
  color: var(--text-primary);
  font-size: 0.78rem;
  overflow-wrap: anywhere;
}

.compliance-box {
  padding: 12px;
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 10px;
  color: #0f766e;
}

.compliance-box svg {
  width: 28px;
  height: 28px;
}

.compliance-box strong {
  color: var(--text-primary);
  font-size: 0.82rem;
}

.compliance-box p {
  margin: 3px 0 0;
  font-size: 0.74rem;
}

.detail-grid {
  padding: 18px 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.detail-grid div {
  padding: 11px;
}

.detail-grid strong {
  color: var(--text-primary);
  font-size: 0.84rem;
}

.note {
  margin: 0 20px 16px;
  padding: 12px;
  color: var(--text-secondary);
  font-size: 0.82rem;
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
:global(.dark) .payment-modal,
:global(.dark) .detail-modal,
:global(.dark) .checkout-card,
:global(.dark) .processor-card,
:global(.dark) .compliance-box,
:global(.dark) .summary-lines,
:global(.dark) .token-note,
:global(.dark) .detail-grid div,
:global(.dark) .note {
  background: #111827;
  border-color: #243044;
}

:global(.dark) th,
:global(.dark) .checkout-panel {
  background: #0f172a;
}

:global(.dark) .security-banner,
:global(.dark) .secure-indicator {
  background: #0f1f2f;
  border-color: #1d4ed8;
}

@media (max-width: 900px) {
  .summary-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .modal-body {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .form-panel {
    border-right: 0;
    border-bottom: 1px solid var(--border);
  }
}

@media (max-width: 640px) {
  .page-header,
  .filters,
  .modal-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .summary-bar,
  .field-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .input {
    width: 100%;
  }
}
</style>
