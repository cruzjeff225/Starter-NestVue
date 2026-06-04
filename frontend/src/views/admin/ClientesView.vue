<template>
  <div class="clientes-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Clientes</h1>
        <p class="page-subtitle">Gestion de clientes nacionales y extranjeros</p>
      </div>
      <div class="header-right">
        <span class="header-badge">{{ clientes.length }} clientes</span>
        <button v-if="auth.tienePermiso('clientes:crear')" class="btn-primary" @click="abrirModal()">
          <span class="btn-icon">+</span>
          Nuevo cliente
        </button>
      </div>
    </div>

    <div class="search-wrapper">
      <input
        v-model="busqueda"
        type="text"
        class="search-input"
        placeholder="Buscar por nombre, email, DUI, documento o pais..."
        @input="buscar"
      />
    </div>

    <div v-if="loading" class="state-box">Cargando clientes...</div>
    <div v-else-if="errorGlobal" class="state-box error-box">{{ errorGlobal }}</div>

    <div v-else class="table-card">
      <table class="clientes-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Tipo</th>
            <th>Email</th>
            <th>Telefono</th>
            <th>Documento</th>
            <th>Ubicacion</th>
            <th>Estado</th>
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
            <td>
              <span class="type-badge" :class="c.tipoCliente || 'nacional'">
                {{ c.tipoCliente === 'extranjero' ? 'Extranjero' : 'Nacional' }}
              </span>
            </td>
            <td class="td-secondary">{{ c.email }}</td>
            <td class="td-secondary">{{ c.telefono || '-' }}</td>
            <td class="td-secondary">
              {{ c.tipoCliente === 'extranjero' ? c.documento || '-' : formatDui(c.dui) || '-' }}
            </td>
            <td class="td-secondary">{{ ubicacionCliente(c) }}</td>
            <td>
              <span class="status-badge" :class="c.activo ? 'activo' : 'inactivo'">
                {{ c.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>
              <div class="actions">
                <button
                  v-if="auth.tienePermiso('clientes:editar')"
                  class="action-btn edit-btn"
                  title="Editar cliente"
                  @click="abrirModal(c)"
                >
                  Editar
                </button>
                <button
                  v-if="auth.tienePermiso('clientes:toggle_activo')"
                  class="action-btn"
                  :class="c.activo ? 'deactivate-btn' : 'activate-btn'"
                  @click="toggleActivo(c)"
                >
                  {{ c.activo ? 'Desactivar' : 'Activar' }}
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="clientes.length === 0">
            <td colspan="9" class="empty-state">No se encontraron clientes</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Transition name="modal">
      <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">{{ clienteEditando ? 'Editar cliente' : 'Nuevo cliente' }}</h2>
            <button class="modal-close" @click="cerrarModal">x</button>
          </div>

          <div class="modal-body">
            <div class="form-grid">
              <div class="field-group full">
                <label class="field-label">Tipo de cliente</label>
                <div class="segmented">
                  <button
                    type="button"
                    :class="{ active: form.tipoCliente === 'nacional' }"
                    @click="setTipoCliente('nacional')"
                  >
                    Nacional
                  </button>
                  <button
                    type="button"
                    :class="{ active: form.tipoCliente === 'extranjero' }"
                    @click="setTipoCliente('extranjero')"
                  >
                    Extranjero
                  </button>
                </div>
              </div>

              <div class="field-group">
                <label class="field-label">Nombre</label>
                <input v-model="form.nombre" type="text" class="field-input" />
              </div>
              <div class="field-group">
                <label class="field-label">Apellido</label>
                <input v-model="form.apellido" type="text" class="field-input" />
              </div>
              <div class="field-group">
                <label class="field-label">Correo electronico</label>
                <input v-model="form.email" type="email" class="field-input" />
              </div>
              <div class="field-group">
                <label class="field-label">Telefono</label>
                <input v-model="form.telefono" type="text" class="field-input" />
              </div>

              <template v-if="form.tipoCliente === 'nacional'">
                <div class="field-group">
                  <label class="field-label">DUI</label>
                  <input
                    v-model="form.dui"
                    type="text"
                    class="field-input"
                    placeholder="########-#"
                    @input="formatDuiInput"
                  />
                </div>
                <div class="field-group">
                  <label class="field-label">Departamento</label>
                  <select v-model="form.departamento" class="field-input" @change="onDepartamentoChange">
                    <option value="">Seleccione departamento</option>
                    <option v-for="departamento in departamentosElSalvador" :key="departamento" :value="departamento">
                      {{ departamento }}
                    </option>
                  </select>
                </div>
                <div class="field-group">
                  <label class="field-label">Municipio</label>
                  <select v-model="form.municipio" class="field-input" :disabled="!form.departamento" @change="onMunicipioChange">
                    <option value="">Seleccione municipio</option>
                    <option v-for="municipio in municipiosDisponibles" :key="municipio" :value="municipio">
                      {{ municipio }}
                    </option>
                  </select>
                </div>
                <div class="field-group">
                  <label class="field-label">Distrito</label>
                  <select v-model="form.distrito" class="field-input" :disabled="!form.municipio">
                    <option value="">Seleccione distrito</option>
                    <option v-for="distrito in distritosDisponibles" :key="distrito" :value="distrito">
                      {{ distrito }}
                    </option>
                  </select>
                </div>
              </template>

              <template v-else>
                <div class="field-group">
                  <label class="field-label">Pais</label>
                  <input v-model="form.pais" type="text" class="field-input" placeholder="Pais de origen" />
                </div>
                <div class="field-group">
                  <label class="field-label">Documento</label>
                  <input v-model="form.documento" type="text" class="field-input" placeholder="Pasaporte u otro ID" />
                </div>
              </template>

              <div class="field-group full">
                <label class="field-label">Direccion</label>
                <input v-model="form.direccion" type="text" class="field-input" />
              </div>
            </div>

            <div v-if="formError" class="form-error">{{ formError }}</div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" @click="cerrarModal">Cancelar</button>
            <button class="btn-primary" :disabled="guardando" @click="guardar">
              {{ guardando ? 'Guardando...' : clienteEditando ? 'Guardar cambios' : 'Crear cliente' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '../../stores/authStore';
import { clientesApi } from '../../services/api';
import {
  departamentosElSalvador,
  distritosPorMunicipio,
  municipiosPorDepartamento,
} from '../../data/ubicacionesElSalvador';

type TipoCliente = 'nacional' | 'extranjero';

const auth = useAuthStore();
const clientes = ref<any[]>([]);
const loading = ref(true);
const errorGlobal = ref('');
const modalAbierto = ref(false);
const clienteEditando = ref<any>(null);
const guardando = ref(false);
const formError = ref('');
const busqueda = ref('');

const formVacio = () => ({
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  tipoCliente: 'nacional' as TipoCliente,
  pais: 'El Salvador',
  dui: '',
  documento: '',
  direccion: '',
  departamento: '',
  municipio: '',
  distrito: '',
});

const form = ref(formVacio());

const municipiosDisponibles = computed(() =>
  municipiosPorDepartamento(form.value.departamento),
);

const distritosDisponibles = computed(() =>
  distritosPorMunicipio(form.value.departamento, form.value.municipio),
);

onMounted(() => cargar());

async function cargar(search?: string) {
  try {
    loading.value = true;
    errorGlobal.value = '';
    const { data } = await clientesApi.getAll(search);
    clientes.value = data;
  } catch {
    errorGlobal.value = 'No se pudieron cargar los clientes';
  } finally {
    loading.value = false;
  }
}

function buscar() {
  cargar(busqueda.value || undefined);
}

function abrirModal(cliente?: any) {
  clienteEditando.value = cliente || null;
  formError.value = '';
  form.value = cliente
    ? {
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        email: cliente.email,
        telefono: cliente.telefono || '',
        tipoCliente: cliente.tipoCliente || 'nacional',
        pais: cliente.pais || (cliente.tipoCliente === 'extranjero' ? '' : 'El Salvador'),
        dui: formatDui(cliente.dui) || '',
        documento: cliente.documento || '',
        direccion: cliente.direccion || '',
        departamento: cliente.departamento || '',
        municipio: cliente.municipio || '',
        distrito: cliente.distrito || '',
      }
    : formVacio();
  modalAbierto.value = true;
}

function cerrarModal() {
  modalAbierto.value = false;
}

function setTipoCliente(tipoCliente: TipoCliente) {
  form.value.tipoCliente = tipoCliente;
  if (tipoCliente === 'nacional') {
    form.value.pais = 'El Salvador';
    form.value.documento = '';
  } else {
    form.value.dui = '';
    form.value.departamento = '';
    form.value.municipio = '';
    form.value.distrito = '';
    form.value.pais = '';
  }
}

function onDepartamentoChange() {
  form.value.municipio = '';
  form.value.distrito = '';
}

function onMunicipioChange() {
  form.value.distrito = '';
}

async function guardar() {
  guardando.value = true;
  formError.value = '';

  const dataToSend = buildPayload();
  const validationError = validar(dataToSend);
  if (validationError) {
    formError.value = validationError;
    guardando.value = false;
    return;
  }

  try {
    if (clienteEditando.value) {
      await clientesApi.update(clienteEditando.value.idCliente, dataToSend);
    } else {
      await clientesApi.create(dataToSend);
    }
    cerrarModal();
    cargar(busqueda.value || undefined);
  } catch (e: any) {
    const msg = e?.response?.data?.message;
    formError.value = Array.isArray(msg) ? msg[0] : (msg ?? 'Ocurrio un error');
  } finally {
    guardando.value = false;
  }
}

function buildPayload() {
  const duiClean = form.value.dui.replace(/\D/g, '');
  return {
    ...form.value,
    dui: form.value.tipoCliente === 'nacional' ? duiClean : undefined,
    documento: form.value.tipoCliente === 'extranjero' ? form.value.documento.trim() : undefined,
    pais: form.value.tipoCliente === 'extranjero' ? form.value.pais.trim() : 'El Salvador',
    departamento: form.value.tipoCliente === 'nacional' ? form.value.departamento : undefined,
    municipio: form.value.tipoCliente === 'nacional' ? form.value.municipio : undefined,
    distrito: form.value.tipoCliente === 'nacional' ? form.value.distrito : undefined,
  };
}

function validar(data: ReturnType<typeof buildPayload>) {
  if (!data.nombre || !data.apellido || !data.email || !data.telefono || !data.direccion) {
    return 'Complete los datos generales del cliente';
  }

  if (data.tipoCliente === 'nacional') {
    if (!data.dui || data.dui.length !== 9) return 'El DUI debe tener exactamente 9 digitos';
    if (!data.departamento || !data.municipio || !data.distrito) {
      return 'Seleccione departamento, municipio y distrito';
    }
  }

  if (data.tipoCliente === 'extranjero') {
    if (!data.pais) return 'Ingrese el pais del cliente extranjero';
    if (!data.documento) return 'Ingrese el documento del cliente extranjero';
  }

  return '';
}

async function toggleActivo(cliente: any) {
  try {
    await clientesApi.toggleActivo(cliente.idCliente);
    cargar(busqueda.value || undefined);
  } catch {
    errorGlobal.value = 'No se pudo cambiar el estado del cliente';
  }
}

function ubicacionCliente(cliente: any) {
  if (cliente.tipoCliente === 'extranjero') return cliente.pais || 'Extranjero';
  return [cliente.departamento, cliente.municipio, cliente.distrito].filter(Boolean).join(' / ') || '-';
}

function formatDui(value?: string): string {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 8) return cleaned;
  return `${cleaned.slice(0, 8)}-${cleaned.slice(8, 9)}`;
}

function formatDuiInput(event: Event) {
  const target = event.target as HTMLInputElement;
  target.value = formatDui(target.value);
  form.value.dui = target.value;
}
</script>

<style scoped>
.clientes-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1180px;
}

.page-header,
.header-right,
.user-cell,
.actions,
.modal-footer {
  display: flex;
  align-items: center;
}

.page-header {
  justify-content: space-between;
}

.header-right,
.actions,
.modal-footer {
  gap: 10px;
}

.page-title {
  margin: 0 0 4px;
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 600;
}

.page-subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.header-badge,
.type-badge,
.status-badge {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

.header-badge {
  background: var(--accent-light);
  color: var(--accent);
  border: 1px solid var(--accent-border);
}

.btn-primary,
.btn-secondary,
.action-btn {
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
}

.btn-primary {
  background: #6366f1;
  color: white;
  padding: 9px 14px;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-card);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  padding: 9px 14px;
}

.btn-icon {
  font-weight: 700;
}

.search-input,
.field-input {
  box-sizing: border-box;
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-primary);
  font: inherit;
  outline: none;
}

.search-input {
  padding: 10px 12px;
}

.field-input {
  padding: 9px 10px;
}

.search-input:focus,
.field-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.state-box,
.table-card,
.modal {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.state-box {
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
}

.error-box,
.form-error {
  color: #dc2626;
  background: #fef2f2;
  border-color: #fecaca;
}

.table-card {
  overflow: auto;
}

.clientes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
}

th,
td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

th {
  color: var(--text-muted);
  background: var(--bg-app);
  font-size: 0.72rem;
  text-transform: uppercase;
}

.td-id,
.td-secondary {
  color: var(--text-muted);
}

.user-cell {
  gap: 10px;
}

.user-avatar {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #6366f1;
  color: white;
  font-weight: 700;
}

.inactive {
  opacity: 0.5;
}

.type-badge.nacional {
  background: #eef2ff;
  color: #4f46e5;
}

.type-badge.extranjero {
  background: #ecfeff;
  color: #0891b2;
}

.status-badge.activo {
  background: #f0fdf4;
  color: #16a34a;
}

.status-badge.inactivo {
  background: #fef2f2;
  color: #dc2626;
}

.action-btn {
  padding: 7px 10px;
  background: var(--bg-app);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.edit-btn:hover {
  color: #4f46e5;
  border-color: #c7d2fe;
}

.deactivate-btn:hover {
  color: #dc2626;
  border-color: #fecaca;
}

.activate-btn:hover {
  color: #16a34a;
  border-color: #bbf7d0;
}

.empty-state {
  padding: 36px;
  text-align: center;
  color: var(--text-muted);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.55);
}

.modal {
  width: min(680px, 100%);
  max-height: calc(100vh - 40px);
  overflow: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

.modal-header,
.modal-body,
.modal-footer {
  padding: 18px 22px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
}

.modal-title {
  margin: 0;
  color: var(--text-primary);
  font-size: 1rem;
}

.modal-close {
  width: 30px;
  height: 30px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-muted);
  cursor: pointer;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-footer {
  justify-content: flex-end;
  border-top: 1px solid var(--border);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-group.full {
  grid-column: 1 / -1;
}

.field-label {
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 600;
}

.segmented {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border: 1px solid var(--border);
  border-radius: 9px;
  overflow: hidden;
}

.segmented button {
  border: 0;
  padding: 9px 12px;
  background: var(--bg-app);
  color: var(--text-secondary);
  cursor: pointer;
  font: inherit;
}

.segmented button.active {
  background: #6366f1;
  color: white;
}

.form-error {
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 0.84rem;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.18s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 720px) {
  .page-header,
  .header-right {
    align-items: flex-start;
    flex-direction: column;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
