<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

const auth = useAuthStore()

interface Room {
  id: string
  number: string
  floor: number
  price: number
  status: string
  type?: { id: string, name: string }
  createdAt: string
}

interface RoomType {
  id: string
  name: string
}

const rooms = ref<Room[]>([])
const roomTypes = ref<RoomType[]>([])
const loading = ref(true)
const error = ref('')

const showModal = ref(false)
const editando = ref<string | null>(null)
const formError = ref('')
const formLoading = ref(false)

const form = reactive({
  number: '',
  floor: 1,
  price: 0,
  status: 'AVAILABLE',
  typeId: '',
})

async function cargarRooms() {
  try {
    loading.value = true
    error.value = ''
    const res = await api.get('/rooms')
    rooms.value = res.data
  } catch {
    error.value = 'No se pudieron cargar las habitaciones'
  } finally {
    loading.value = false
  }
}

async function cargarTipos() {
  const res = await api.get('/room-types')
  roomTypes.value = res.data
}

function abrirCrear() {
  editando.value = null
  Object.assign(form, { number: '', floor: 1, price: 0, status: 'AVAILABLE', typeId: '' })
  formError.value = ''
  showModal.value = true
}

function abrirEditar(room: Room) {
  editando.value = room.id
  Object.assign(form, {
    number: room.number,
    floor: room.floor,
    price: room.price,
    status: room.status,
    typeId: room.type?.id ?? ''
  })
  formError.value = ''
  showModal.value = true
}

function cerrarModal() {
  showModal.value = false
}

async function guardar() {
  try {
    formLoading.value = true
    formError.value = ''

    if (!form.number.trim()) return formError.value = 'El número es obligatorio'
    if (form.price <= 0) return formError.value = 'El precio debe ser mayor a 0'
    if (!form.typeId) return formError.value = 'Seleccione un tipo'

    if (editando.value === null) {
      await api.post('/rooms', form)
    } else {
      await api.patch(`/rooms/${editando.value}`, form)
    }

    await cargarRooms()
    cerrarModal()

  } catch (e: any) {
    formError.value = e?.response?.data?.message ?? 'Error al guardar'
  } finally {
    formLoading.value = false
  }
}

async function eliminar(id: string) {
  if (!confirm('¿Eliminar habitación?')) return
  await api.delete(`/rooms/${id}`)
  await cargarRooms()
}

function estadoLabel(status: string) {
  return {
    AVAILABLE: 'Disponible',
    OCCUPIED: 'Ocupada',
    MAINTENANCE: 'Mantenimiento'
  }[status] || status
}

onMounted(async () => {
  await cargarRooms()
  await cargarTipos()
})
</script>

<template>
  <div class="users-page">

    <div class="page-header">
      <div>
        <h1 class="page-title">Habitaciones</h1>
        <p class="page-subtitle">Gestión del sistema</p>
      </div>

      <div class="header-right">
        <span class="header-badge">{{ rooms.length }} habitaciones</span>

        <button v-if="auth.tienePermiso('rooms:crear')" class="btn-primary" @click="abrirCrear">
          + Nueva habitación
        </button>
      </div>
    </div>

    <div v-if="loading" class="state-box">Cargando habitaciones...</div>

    <div v-else-if="error" class="state-box error-box">{{ error }}</div>

    <div v-else class="table-card">
      <table class="users-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Número</th>
            <th>Piso</th>
            <th>Tipo</th>
            <th>Precio</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="room in rooms" :key="room.id">
            <td class="td-id">{{ room.id }}</td>
            <td><strong>#{{ room.number }}</strong></td>
            <td>{{ room.floor }}</td>
            <td>{{ room.type?.name || '—' }}</td>
            <td>${{ room.price }}</td>

            <td>
              <span class="status-badge"
                :class="{
                  activo: room.status === 'AVAILABLE',
                  inactivo: room.status === 'OCCUPIED',
                  mantenimiento: room.status === 'MAINTENANCE'
                }">
                {{ estadoLabel(room.status) }}
              </span>
            </td>

            <td>
              <div class="actions">
                <button v-if="auth.tienePermiso('rooms:editar')" class="action-btn edit-btn" @click="abrirEditar(room)">✏️</button>
                <button v-if="auth.tienePermiso('rooms:eliminar')" class="action-btn deactivate-btn" @click="eliminar(room.id)">🗑</button>
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
              {{ editando ? 'Editar habitación' : 'Nueva habitación' }}
            </h2>
          </div>

          <div class="modal-body">
            <input v-model="form.number" class="field-input" placeholder="Número" />
            <input v-model="form.floor" type="number" class="field-input" placeholder="Piso" />
            <input v-model="form.price" type="number" class="field-input" placeholder="Precio" />

            <select v-model="form.typeId" class="field-input">
              <option disabled value="">Seleccione tipo</option>
              <option v-for="t in roomTypes" :key="t.id" :value="t.id">
                {{ t.name }}
              </option>
            </select>

            <select v-model="form.status" class="field-input">
              <option value="AVAILABLE">Disponible</option>
              <option value="OCCUPIED">Ocupada</option>
              <option value="MAINTENANCE">Mantenimiento</option>
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
/* REUTILIZA TODO EL SISTEMA VISUAL */
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

.users-page {
  font-family: 'Sora', sans-serif;
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
  font-size: 0.8rem;
}

/* BOTONES */
.btn-primary {
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: white;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  border: none;
}

.btn-secondary {
  border: 1px solid var(--border);
  padding: 8px 14px;
  border-radius: 8px;
}

/* TABLA */
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

.td-id {
  color: var(--text-muted);
}

/* ESTADOS */
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

/* ACCIONES */
.actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  padding: 6px;
  border-radius: 6px;
  border: 1px solid var(--border);
  cursor: pointer;
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

.field-input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
}

.form-error {
  color: red;
}
</style>