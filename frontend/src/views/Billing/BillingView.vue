<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

const auth = useAuthStore()

interface Factura {
  id: string
  clienteNombre: string
  total: number
  estado: string
  fecha: string
}

const facturas = ref<Factura[]>([])
const loading = ref(true)
const error = ref('')

// Modal
const showModal = ref(false)
const editando = ref<string | null>(null)
const formError = ref('')
const formLoading = ref(false)

const form = reactive({
  clienteNombre: '',
  total: 0,
  estado: 'PENDIENTE'
})

// Cargar facturas
async function cargarFacturas() {
  try {
    loading.value = true
    error.value = ''
    const res = await api.get('/billing')
    facturas.value = res.data
  } catch {
    error.value = 'No se pudieron cargar las facturas'
  } finally {
    loading.value = false
  }
}

// Modal
function abrirCrear() {
  editando.value = null
  form.clienteNombre = ''
  form.total = 0
  form.estado = 'PENDIENTE'
  formError.value = ''
  showModal.value = true
}

function abrirEditar(f: Factura) {
  editando.value = f.id
  form.clienteNombre = f.clienteNombre
  form.total = f.total
  form.estado = f.estado
  formError.value = ''
  showModal.value = true
}

function cerrarModal() {
  showModal.value = false
}

// Guardar
async function guardar() {
  try {
    formLoading.value = true
    formError.value = ''

    if (!form.clienteNombre.trim()) {
      formError.value = 'El cliente es obligatorio'
      return
    }

    if (form.total <= 0) {
      formError.value = 'El total debe ser mayor a 0'
      return
    }

    if (editando.value === null) {
      await api.post('/billing', form)
    } else {
      await api.patch(`/billing/${editando.value}`, form)
    }

    await cargarFacturas()
    cerrarModal()

  } catch (e: any) {
    formError.value = e?.response?.data?.message ?? 'Error al guardar'
  } finally {
    formLoading.value = false
  }
}

// Eliminar
async function eliminar(id: string) {
  if (!confirm('¿Eliminar factura?')) return
  await api.delete(`/billing/${id}`)
  await cargarFacturas()
}

// Helpers
function estadoLabel(e: string) {
  return {
    PENDIENTE: 'Pendiente',
    PAGADA: 'Pagada',
    CANCELADA: 'Cancelada'
  }[e] || e
}

function formatFecha(f: string) {
  return new Date(f).toLocaleDateString('es-ES')
}

onMounted(cargarFacturas)
</script>

<template>
  <div class="users-page">

    <!-- HEADER -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Facturación</h1>
        <p class="page-subtitle">Gestión de facturas del sistema</p>
      </div>

      <div class="header-right">
        <span class="header-badge">{{ facturas.length }} facturas</span>

        <button v-if="auth.tienePermiso('billing:crear')" class="btn-primary" @click="abrirCrear">
          + Nueva factura
        </button>
      </div>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="state-box">
      Cargando facturas...
    </div>

    <!-- ERROR -->
    <div v-else-if="error" class="state-box error-box">
      {{ error }}
    </div>

    <!-- TABLA -->
    <div v-else class="table-card">
      <table class="users-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="f in facturas" :key="f.id">
            <td class="td-id">{{ f.id }}</td>
            <td>{{ f.clienteNombre }}</td>
            <td><strong>${{ f.total }}</strong></td>

            <td>
              <span class="status-badge"
                :class="{
                  activo: f.estado === 'PAGADA',
                  inactivo: f.estado === 'CANCELADA',
                  mantenimiento: f.estado === 'PENDIENTE'
                }">
                {{ estadoLabel(f.estado) }}
              </span>
            </td>

            <td class="td-date">{{ formatFecha(f.fecha) }}</td>

            <td>
              <div class="actions">
                <button v-if="auth.tienePermiso('billing:editar')" class="action-btn edit-btn" @click="abrirEditar(f)">✏️</button>
                <button v-if="auth.tienePermiso('billing:eliminar')" class="action-btn deactivate-btn" @click="eliminar(f.id)">🗑</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL -->
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal">

          <div class="modal-header">
            <h2 class="modal-title">
              {{ editando ? 'Editar factura' : 'Nueva factura' }}
            </h2>
          </div>

          <div class="modal-body">
            <input v-model="form.clienteNombre" class="field-input" placeholder="Nombre del cliente" />
            <input v-model="form.total" type="number" class="field-input" placeholder="Total" />

            <select v-model="form.estado" class="field-input">
              <option value="PENDIENTE">Pendiente</option>
              <option value="PAGADA">Pagada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>

            <div v-if="formError" class="form-error">{{ formError }}</div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" @click="cerrarModal">Cancelar</button>

            <button class="btn-primary" :disabled="formLoading" @click="guardar">
              {{ formLoading ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
/* MISMO SISTEMA VISUAL */

.users-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1000px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
}

.page-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.header-badge {
  background: var(--accent-light);
  padding: 4px 12px;
  border-radius: 999px;
}

.table-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.users-table {
  width: 100%;
}

td, th {
  padding: 12px;
}

.status-badge.activo {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.inactivo {
  background: #fee2e2;
  color: #dc2626;
}

.status-badge.mantenimiento {
  background: #fef9c3;
  color: #ca8a04;
}

.actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  padding: 6px;
  border: 1px solid var(--border);
  border-radius: 6px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 12px;
  width: 400px;
}

.field-input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
}

.form-error {
  color: red;
}
</style>