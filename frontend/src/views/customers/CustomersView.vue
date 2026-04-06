<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import api from '../../services/api'

interface Cliente {
  id: number
  nombre: string
  email: string
  telefono: string
  activo: boolean
  creadoEn: string
}

const clientes = ref<Cliente[]>([])
const loading = ref(true)
const error = ref('')

const showModal = ref(false)
const editando = ref<number | null>(null)
const formError = ref('')
const formLoading = ref(false)

const form = reactive({
  nombre: '',
  email: '',
  telefono: '',
})

async function cargarClientes() {
  try {
    loading.value = true
    const res = await api.get('/customers')
    clientes.value = res.data
  } catch {
    error.value = 'No se pudieron cargar los clientes'
  } finally {
    loading.value = false
  }
}

function abrirCrear() {
  editando.value = null
  form.nombre = ''
  form.email = ''
  form.telefono = ''
  showModal.value = true
}

function abrirEditar(c: Cliente) {
  editando.value = c.id
  form.nombre = c.nombre
  form.email = c.email
  form.telefono = c.telefono
  showModal.value = true
}

function cerrarModal() {
  showModal.value = false
}

async function guardar() {
  try {
    formLoading.value = true

    if (editando.value === null) {
      await api.post('/customers', form)
    } else {
      await api.patch(`/customers/${editando.value}`, form)
    }

    await cargarClientes()
    cerrarModal()
  } catch (e: any) {
    formError.value = e?.response?.data?.message ?? 'Error'
  } finally {
    formLoading.value = false
  }
}

async function eliminar(id: number) {
  await api.delete(`/customers/${id}`)
  await cargarClientes()
}

async function toggleActivo(c: Cliente) {
  await api.patch(`/customers/${c.id}/toggle`)
  await cargarClientes()
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-ES')
}

onMounted(cargarClientes)
</script>

<template>
  <div class="users-page">

    <div class="page-header">
      <div>
        <h1 class="page-title">Clientes</h1>
        <p class="page-subtitle">Gestión de clientes</p>
      </div>

      <div class="header-right">
        <span class="header-badge">{{ clientes.length }} clientes</span>

        <button class="btn-primary" @click="abrirCrear">
          ➕ Nuevo cliente
        </button>
      </div>
    </div>

    <div v-if="loading" class="state-box">Cargando...</div>

    <div v-else-if="error" class="state-box error-box">
      {{ error }}
    </div>

    <div v-else class="table-card">
      <table class="users-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Estado</th>
            <th>Registro</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="c in clientes" :key="c.id">
            <td>{{ c.id }}</td>

            <td>
              <div class="user-cell">
                <div class="user-avatar" :class="{ inactive: !c.activo }">
                  {{ c.nombre.charAt(0) }}
                </div>
                <span :class="{ inactive: !c.activo }">{{ c.nombre }}</span>
              </div>
            </td>

            <td>{{ c.email }}</td>
            <td>{{ c.telefono }}</td>

            <td>
              <span class="status-badge" :class="c.activo ? 'activo' : 'inactivo'">
                {{ c.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>

            <td>{{ formatFecha(c.creadoEn) }}</td>

            <td>
              <div class="actions">
                <button class="action-btn edit-btn" @click="abrirEditar(c)">✏️</button>
                <button class="action-btn" @click="toggleActivo(c)">🔄</button>
                <button class="action-btn deactivate-btn" @click="eliminar(c.id)">🗑</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">
              {{ editando ? 'Editar cliente' : 'Nuevo cliente' }}
            </h2>
          </div>

          <div class="modal-body">
            <input v-model="form.nombre" class="field-input" placeholder="Nombre" />
            <input v-model="form.email" class="field-input" placeholder="Email" />
            <input v-model="form.telefono" class="field-input" placeholder="Teléfono" />

            <div v-if="formError" class="form-error">
              {{ formError }}
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" @click="cerrarModal">Cancelar</button>
            <button class="btn-primary" @click="guardar">Guardar</button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.users-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1000px;
}

/* HEADER */
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
  color: gray;
}

.header-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.header-badge {
  background: #eef2ff;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
}

/* BOTONES */
.btn-primary {
  background: #6366f1;
  color: white;
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.btn-secondary {
  background: white;
  border: 1px solid #ccc;
  padding: 8px 14px;
  border-radius: 8px;
}

/* TABLA */
.table-card {
  border: 1px solid #ddd;
  border-radius: 12px;
  overflow: hidden;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
}

tbody tr:hover {
  background: #f9fafb;
}

/* USER */
.user-cell {
  display: flex;
  gap: 10px;
  align-items: center;
}

.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #6366f1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* STATUS */
.status-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
}

.activo {
  background: #dcfce7;
  color: #16a34a;
}

.inactivo {
  background: #fee2e2;
  color: #dc2626;
}

/* ACTIONS */
.actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  border: 1px solid #ccc;
  padding: 5px;
  border-radius: 6px;
  cursor: pointer;
}

.edit-btn:hover {
  background: #eef2ff;
}

.deactivate-btn:hover {
  background: #fee2e2;
}

/* MODAL */
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

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
</style>