<template>
  <div class="hab-select" ref="containerRef">

    <!-- Input de búsqueda -->
    <div class="hs-input-wrapper" :class="{ focused: abierto, 'has-value': !!seleccionada }">

      <!-- Valor seleccionado (modo cerrado) -->
      <div v-if="seleccionada && !abierto" class="hs-selected" @click="abrir">
        <div class="hs-sel-num">{{ seleccionada.numero }}</div>
        <div class="hs-sel-info">
          <span class="hs-sel-tipo">{{ seleccionada.tipo?.nombre }}</span>
          <span class="hs-sel-detalle">Piso {{ seleccionada.piso }} · ${{ fmt(seleccionada.tipo?.precioBase) }}/noche · {{ seleccionada.capacidad }} pers.</span>
        </div>
        <button class="hs-clear" type="button" @click.stop="limpiar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Input activo -->
      <template v-else>
        <svg class="hs-icon-search" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          class="hs-input"
          :placeholder="placeholder"
          :disabled="disabled"
          @input="aplicarFiltros"
          @focus="abrir"
          @keydown.down.prevent="moverAbajo"
          @keydown.up.prevent="moverArriba"
          @keydown.enter.prevent="seleccionarActivo"
          @keydown.escape="cerrar"
        />
        <span v-if="totalFiltradas < totalDisponibles" class="hs-filtro-badge">
          {{ totalFiltradas }} de {{ totalDisponibles }}
        </span>
      </template>
    </div>

    <!-- Dropdown -->
    <Transition name="hs-drop">
      <div v-if="abierto" class="hs-dropdown">

        <!-- Barra de filtros rápidos -->
        <div v-if="!cargando && todasDisponibles.length > 0" class="hs-filtros">

          <!-- Filtro por tipo -->
          <div class="hs-filtro-grupo">
            <span class="hs-filtro-label">Tipo</span>
            <div class="hs-filtro-chips">
              <button
                class="hs-chip"
                :class="{ active: filtroTipo === '' }"
                @mousedown.prevent="setFiltroTipo('')"
              >Todos</button>
              <button
                v-for="tipo in tiposDisponibles"
                :key="tipo"
                class="hs-chip"
                :class="{ active: filtroTipo === tipo }"
                @mousedown.prevent="setFiltroTipo(tipo)"
              >{{ tipo }}</button>
            </div>
          </div>

          <!-- Filtro por piso -->
          <div class="hs-filtro-grupo">
            <span class="hs-filtro-label">Piso</span>
            <div class="hs-filtro-chips">
              <button
                class="hs-chip"
                :class="{ active: filtroPiso === null }"
                @mousedown.prevent="setFiltroPiso(null)"
              >Todos</button>
              <button
                v-for="piso in pisosDisponibles"
                :key="piso"
                class="hs-chip"
                :class="{ active: filtroPiso === piso }"
                @mousedown.prevent="setFiltroPiso(piso)"
              >{{ piso }}°</button>
            </div>
          </div>

        </div>

        <!-- Cargando -->
        <div v-if="cargando" class="hs-estado">
          <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Cargando habitaciones disponibles...
        </div>

        <!-- Sin resultados -->
        <div v-else-if="resultados.length === 0" class="hs-estado">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          <span>
            {{ todasDisponibles.length === 0
              ? 'No hay habitaciones disponibles'
              : 'Sin resultados — prueba ajustando los filtros' }}
          </span>
        </div>

        <!-- Grid de tarjetas -->
        <div v-else class="hs-grid">
          <button
            v-for="(hab, i) in resultados"
            :key="hab.idHabitacion"
            class="hs-card"
            :class="{ active: i === indiceActivo }"
            type="button"
            @mousedown.prevent="seleccionar(hab)"
            @mouseover="indiceActivo = i"
          >
            <!-- Número -->
            <div class="hs-card-num">{{ hab.numero }}</div>

            <!-- Info -->
            <div class="hs-card-body">
              <span class="hs-card-tipo">{{ hab.tipo?.nombre }}</span>
              <div class="hs-card-meta">
                <span class="hs-meta-item">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  </svg>
                  Piso {{ hab.piso }}
                </span>
                <span class="hs-meta-item">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  {{ hab.capacidad }} pers.
                </span>
              </div>
              <div v-if="hab.amenidades?.length" class="hs-amenidades">
                <span v-for="a in hab.amenidades.slice(0, 3)" :key="a" class="hs-amenidad">{{ a }}</span>
                <span v-if="hab.amenidades.length > 3" class="hs-amenidad hs-amenidad-more">+{{ hab.amenidades.length - 3 }}</span>
              </div>
            </div>

            <!-- Precio -->
            <div class="hs-card-precio">
              <span class="hs-precio-val">${{ fmt(hab.tipo?.precioBase) }}</span>
              <span class="hs-precio-label">/noche</span>
            </div>
          </button>
        </div>

        <!-- Footer -->
        <div v-if="!cargando" class="hs-footer">
          <span>
            <strong>{{ resultados.length }}</strong>
            habitación{{ resultados.length !== 1 ? 'es' : '' }} disponible{{ resultados.length !== 1 ? 's' : '' }}
            <template v-if="hayFiltrosActivos">
              · <button class="hs-limpiar-filtros" @mousedown.prevent="limpiarFiltros">Limpiar filtros</button>
            </template>
          </span>
          <span v-if="query" class="hs-footer-query">para "{{ query }}"</span>
        </div>

      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: any
  fetchFn: (search: string) => Promise<any[]>
  placeholder?: string
  disabled?: boolean
  initialItem?: any
}>(), {
  placeholder: 'Buscar por número o tipo...',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'select': [item: any]
}>()

const query          = ref('')
const todasDisponibles = ref<any[]>([])  // cache completo del backend
const resultados     = ref<any[]>([])    // filtrado actual
const seleccionada   = ref<any>(null)
const abierto        = ref(false)
const cargando       = ref(false)
const indiceActivo   = ref(-1)
const filtroTipo     = ref('')
const filtroPiso     = ref<number | null>(null)
const containerRef   = ref<HTMLElement | null>(null)
const inputRef       = ref<HTMLInputElement | null>(null)

// Derivados para los chips de filtro
const tiposDisponibles = computed(() => {
  const tipos = todasDisponibles.value.map(h => h.tipo?.nombre).filter(Boolean)
  return [...new Set(tipos)].sort()
})

const pisosDisponibles = computed(() => {
  const pisos = todasDisponibles.value.map(h => h.piso).filter(Boolean)
  return [...new Set(pisos)].sort((a, b) => a - b)
})

const hayFiltrosActivos = computed(() =>
  filtroTipo.value !== '' || filtroPiso.value !== null || query.value !== ''
)

const totalDisponibles = computed(() => todasDisponibles.value.length)
const totalFiltradas   = computed(() => resultados.value.length)

// Lifecycle
onMounted(async () => {
  if (props.initialItem) seleccionada.value = props.initialItem
  document.addEventListener('mousedown', onClickOutside)
  // Pre-cargar en background para que el dropdown sea instantáneo
  await cargarTodas()
})

onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))

watch(() => props.initialItem, (item) => {
  seleccionada.value = item ?? null
  if (!item) query.value = ''
})

watch(() => props.modelValue, (val) => {
  if (!val) { seleccionada.value = null; query.value = '' }
})

// Carga única desde el backend
async function cargarTodas() {
  cargando.value = true
  try {
    todasDisponibles.value = await props.fetchFn('')
    resultados.value = todasDisponibles.value
  } catch {
    todasDisponibles.value = []
    resultados.value = []
  } finally {
    cargando.value = false
  }
}

// Filtrado 100% local (sin más llamadas al backend)
function aplicarFiltros() {
  indiceActivo.value = -1
  const q = query.value.toLowerCase().trim()

  resultados.value = todasDisponibles.value.filter(h => {
    // Filtro por tipo (chip)
    if (filtroTipo.value && h.tipo?.nombre !== filtroTipo.value) return false
    // Filtro por piso (chip)
    if (filtroPiso.value !== null && h.piso !== filtroPiso.value) return false
    // Búsqueda por texto (número O tipo)
    if (q) {
      const matchNumero = h.numero.toLowerCase().includes(q)
      const matchTipo   = h.tipo?.nombre.toLowerCase().includes(q)
      if (!matchNumero && !matchTipo) return false
    }
    return true
  })
}

function setFiltroTipo(tipo: string) {
  filtroTipo.value = tipo
  aplicarFiltros()
  inputRef.value?.focus()
}

function setFiltroPiso(piso: number | null) {
  filtroPiso.value = piso
  aplicarFiltros()
  inputRef.value?.focus()
}

function limpiarFiltros() {
  filtroTipo.value = ''
  filtroPiso.value = null
  query.value = ''
  resultados.value = todasDisponibles.value
  inputRef.value?.focus()
}

// Abrir / cerrar
function abrir() {
  if (props.disabled) return
  abierto.value = true
  indiceActivo.value = -1
  setTimeout(() => inputRef.value?.focus(), 30)
}

function cerrar() {
  abierto.value = false
  if (!seleccionada.value) query.value = ''
  indiceActivo.value = -1
}

// Selección
function seleccionar(hab: any) {
  seleccionada.value = hab
  query.value = ''
  abierto.value = false
  indiceActivo.value = -1
  emit('update:modelValue', hab.idHabitacion)
  emit('select', hab)
}

function limpiar() {
  seleccionada.value = null
  query.value = ''
  filtroTipo.value = ''
  filtroPiso.value = null
  resultados.value = todasDisponibles.value
  emit('update:modelValue', null)
  emit('select', null)
  setTimeout(() => abrir(), 50)
}

// Navegación por teclado
function moverAbajo() {
  if (!abierto.value) return
  indiceActivo.value = Math.min(indiceActivo.value + 1, resultados.value.length - 1)
}

function moverArriba() {
  indiceActivo.value = Math.max(indiceActivo.value - 1, -1)
}

function seleccionarActivo() {
  if (indiceActivo.value >= 0 && resultados.value[indiceActivo.value]) {
    seleccionar(resultados.value[indiceActivo.value])
  }
}

function onClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) cerrar()
}

function fmt(val: any) { return Number(val ?? 0).toFixed(2) }
</script>

<style scoped>
.hab-select {
  position: relative;
  width: 100%;
  font-family: 'Sora', sans-serif;
}

/* Input wrapper */
.hs-input-wrapper {
  border: 1.5px solid var(--border);
  border-radius: 9px;
  background: var(--bg-app);
  transition: all 0.2s;
  min-height: 38px;
  display: flex;
  align-items: center;
  position: relative;
}
.hs-input-wrapper.focused {
  border-color: #6366f1;
  background: var(--bg-card);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
}

.hs-icon-search {
  position: absolute;
  left: 10px;
  color: var(--text-muted);
  pointer-events: none;
  flex-shrink: 0;
}

.hs-input {
  width: 100%;
  padding: 9px 60px 9px 32px;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  font-family: 'Sora', sans-serif;
  color: var(--text-primary);
  outline: none;
}
.hs-input::placeholder { color: var(--text-muted); }
.hs-input:disabled { opacity: 0.5; cursor: not-allowed; }

/* Badge contador de filtros activos */
.hs-filtro-badge {
  position: absolute;
  right: 10px;
  font-size: 0.68rem;
  font-weight: 500;
  color: #6366f1;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 99px;
  padding: 2px 7px;
  white-space: nowrap;
}

/* Valor seleccionado */
.hs-selected {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  width: 100%;
  cursor: pointer;
}
.hs-sel-num {
  min-width: 44px;
  height: 30px;
  border-radius: 7px;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: white;
  font-size: 0.78rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  flex-shrink: 0;
}
.hs-sel-info { display: flex; flex-direction: column; gap: 1px; flex: 1; overflow: hidden; }
.hs-sel-tipo { font-size: 0.82rem; font-weight: 600; color: var(--text-primary); }
.hs-sel-detalle { font-size: 0.72rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hs-clear {
  width: 22px; height: 22px; border-radius: 50%;
  border: none; background: var(--bg-hover);
  color: var(--text-muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; flex-shrink: 0;
}
.hs-clear:hover { background: #fef2f2; color: #ef4444; }

/* Dropdown */
.hs-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--bg-card);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.14);
  z-index: 300;
  overflow: hidden;
}

/* Barra de filtros rápidos */
.hs-filtros {
  padding: 10px 12px 8px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-app);
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.hs-filtro-grupo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hs-filtro-label {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  min-width: 28px;
}

.hs-filtro-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.hs-chip {
  padding: 3px 10px;
  border: 1.5px solid var(--border);
  border-radius: 99px;
  background: var(--bg-card);
  font-size: 0.72rem;
  font-weight: 500;
  font-family: 'Sora', sans-serif;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.hs-chip:hover { border-color: #6366f1; color: #6366f1; background: #eef2ff; }
.hs-chip.active {
  border-color: #6366f1;
  background: #6366f1;
  color: white;
  font-weight: 600;
}

/* Estado vacío / cargando */
.hs-estado {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
  font-size: 0.82rem;
  color: var(--text-muted);
  justify-content: center;
  text-align: center;
}

/* Grid de tarjetas */
.hs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 10px;
  max-height: 280px;
  overflow-y: auto;
}

/* Scrollbar del grid */
.hs-grid::-webkit-scrollbar { width: 6px; }
.hs-grid::-webkit-scrollbar-track { background: transparent; }
.hs-grid::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
.hs-grid::-webkit-scrollbar-thumb:hover { background: #6366f1; }

/* Tarjeta */
.hs-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  background: var(--bg-app);
  cursor: pointer;
  text-align: left;
  font-family: 'Sora', sans-serif;
  transition: all 0.15s;
}
.hs-card:hover,
.hs-card.active {
  border-color: #6366f1;
  background: var(--bg-hover);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  transform: translateY(-1px);
}

.hs-card-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: white;
  font-size: 0.82rem;
  font-weight: 700;
  border-radius: 7px;
  padding: 3px 10px;
  width: fit-content;
}

.hs-card-body { display: flex; flex-direction: column; gap: 4px; }
.hs-card-tipo { font-size: 0.82rem; font-weight: 600; color: var(--text-primary); }

.hs-card-meta { display: flex; gap: 8px; flex-wrap: wrap; }
.hs-meta-item {
  display: flex; align-items: center; gap: 3px;
  font-size: 0.72rem; color: var(--text-muted);
}

.hs-amenidades { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 1px; }
.hs-amenidad {
  font-size: 0.65rem; font-weight: 500;
  padding: 1px 6px; border-radius: 99px;
  background: var(--bg-card);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}
.hs-amenidad-more { color: var(--text-muted); }

.hs-card-precio {
  display: flex;
  align-items: baseline;
  gap: 2px;
  margin-top: 2px;
  border-top: 1px solid var(--border);
  padding-top: 6px;
}
.hs-precio-val { font-size: 0.95rem; font-weight: 700; color: #6366f1; }
.hs-precio-label { font-size: 0.68rem; color: var(--text-muted); }

/* Footer */
.hs-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-top: 1px solid var(--border);
  background: var(--bg-app);
  font-size: 0.72rem;
  color: var(--text-muted);
}
.hs-footer strong { color: var(--text-secondary); }
.hs-footer-query { font-style: italic; }
.hs-limpiar-filtros {
  background: none; border: none; cursor: pointer;
  color: #6366f1; font-size: 0.72rem; font-family: 'Sora', sans-serif;
  text-decoration: underline; padding: 0;
}
.hs-limpiar-filtros:hover { color: #4f46e5; }

/* Spin */
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Transition */
.hs-drop-enter-active,
.hs-drop-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.hs-drop-enter-from,
.hs-drop-leave-to { opacity: 0; transform: translateY(-4px); }
</style>