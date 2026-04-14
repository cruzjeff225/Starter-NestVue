<template>
    <div class="search-select" ref="containerRef">
        <!-- Input de búsqueda -->
        <div class="ss-input-wrapper" :class="{ focused: abierto, 'has-value': !!modelValue }">
            <svg class="ss-icon-search" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input ref="inputRef" v-model="query" type="text" class="ss-input"
                :placeholder="seleccionado ? '' : placeholder" :disabled="disabled" @input="onInput" @focus="onFocus"
                @keydown.down.prevent="moverAbajo" @keydown.up.prevent="moverArriba"
                @keydown.enter.prevent="seleccionarActivo" @keydown.escape="cerrar" />
            <!-- Etiqueta del valor seleccionado (cuando no está en foco) -->
            <span v-if="seleccionado && !abierto" class="ss-selected-label" @click="onFocus">
                {{ seleccionado[labelKey] }}
            </span>
            <!-- Botón limpiar -->
            <button v-if="seleccionado" class="ss-clear" type="button" @click.stop="limpiar">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>

        <!-- Dropdown -->
        <Transition name="dropdown">
            <div v-if="abierto" class="ss-dropdown">
                <!-- Cargando -->
                <div v-if="cargando" class="ss-state">
                    <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Buscando...
                </div>

                <!-- Sin resultados -->
                <div v-else-if="resultados.length === 0 && query.length >= minChars" class="ss-state">
                    Sin resultados para "{{ query }}"
                </div>

                <!-- Prompt inicial -->
                <div v-else-if="query.length < minChars" class="ss-state hint">
                    Escribe {{ minChars === 1 ? 'algo' : `al menos ${minChars} caracteres` }} para buscar...
                </div>

                <!-- Resultados -->
                <ul v-else class="ss-list">
                    <li v-for="(item, i) in resultados" :key="item[valueKey]" class="ss-item"
                        :class="{ active: i === indiceActivo }" @mousedown.prevent="seleccionar(item)"
                        @mouseover="indiceActivo = i">
                        <slot name="item" :item="item">
                            <span class="ss-item-label">{{ item[labelKey] }}</span>
                            <span v-if="subLabelKey && item[subLabelKey]" class="ss-item-sub">{{ item[subLabelKey]
                                }}</span>
                        </slot>
                    </li>
                </ul>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{
    modelValue: any
    fetchFn: (search: string) => Promise<any[]>  // función que llama al backend
    labelKey?: string        // campo a mostrar como texto (ej: 'nombre')
    subLabelKey?: string     // campo secundario opcional (ej: 'email')
    valueKey?: string        // campo del id (ej: 'idCliente')
    placeholder?: string
    minChars?: number        // mínimo de chars para disparar búsqueda
    disabled?: boolean
    initialItem?: any        // objeto completo al editar un registro existente
}>(), {
    labelKey: 'nombre',
    valueKey: 'id',
    placeholder: 'Buscar...',
    minChars: 2,
    disabled: false,
})

const emit = defineEmits<{
    'update:modelValue': [value: any]
    'select': [item: any]
}>()

const query = ref('')
const resultados = ref<any[]>([])
const seleccionado = ref<any>(null)
const abierto = ref(false)
const cargando = ref(false)
const indiceActivo = ref(-1)
const containerRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

let debounceTimer: ReturnType<typeof setTimeout>

// Si viene initialItem (modo edición), cargarlo
onMounted(() => {
    if (props.initialItem) {
        seleccionado.value = props.initialItem
    }
})

watch(() => props.initialItem, (item) => {
    if (item) seleccionado.value = item
    else if (!props.modelValue) {
        seleccionado.value = null
        query.value = ''
    }
})

watch(() => props.modelValue, (val) => {
    if (!val) {
        seleccionado.value = null
        query.value = ''
    }
})

function onInput() {
    seleccionado.value = null
    emit('update:modelValue', null)
    indiceActivo.value = -1

    clearTimeout(debounceTimer)
    if (query.value.length < props.minChars) {
        resultados.value = []
        return
    }

    cargando.value = true
    debounceTimer = setTimeout(async () => {
        try {
            resultados.value = await props.fetchFn(query.value)
        } catch {
            resultados.value = []
        } finally {
            cargando.value = false
        }
    }, 280)
}

async function onFocus() {
    abierto.value = true
    if (seleccionado.value) {
        // Al re-enfocar con valor, mostrar el label en el input para editar
        query.value = seleccionado.value[props.labelKey]
        inputRef.value?.select()
        // Cargar resultados para el valor actual
        if (query.value.length >= props.minChars) {
            cargando.value = true
            try {
                resultados.value = await props.fetchFn(query.value)
            } finally {
                cargando.value = false
            }
        }
    }
}

function seleccionar(item: any) {
    seleccionado.value = item
    query.value = ''
    abierto.value = false
    resultados.value = []
    indiceActivo.value = -1
    emit('update:modelValue', item[props.valueKey])
    emit('select', item)
}

function limpiar() {
    seleccionado.value = null
    query.value = ''
    resultados.value = []
    emit('update:modelValue', null)
    emit('select', null)
    setTimeout(() => inputRef.value?.focus(), 50)
}

function cerrar() {
    abierto.value = false
    if (!seleccionado.value) query.value = ''
    indiceActivo.value = -1
}

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

// Cerrar al click externo
function onClickOutside(e: MouseEvent) {
    if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
        cerrar()
    }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<style scoped>
.search-select {
    position: relative;
    width: 100%;
    font-family: 'Sora', sans-serif;
}

/* ── Input wrapper ────────────────────────────── */
.ss-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    border: 1.5px solid var(--border);
    border-radius: 9px;
    background: var(--bg-app);
    transition: all 0.2s;
    cursor: text;
}

.ss-input-wrapper.focused {
    border-color: #6366f1;
    background: var(--bg-card);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.ss-input-wrapper.has-value:not(.focused) {
    background: var(--bg-card);
}

.ss-icon-search {
    position: absolute;
    left: 10px;
    color: var(--text-muted);
    flex-shrink: 0;
    pointer-events: none;
    z-index: 1;
}

.ss-input {
    width: 100%;
    padding: 9px 32px 9px 32px;
    border: none;
    background: transparent;
    font-size: 0.875rem;
    font-family: 'Sora', sans-serif;
    color: var(--text-primary);
    outline: none;
}

.ss-input::placeholder {
    color: var(--text-muted);
}

.ss-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Etiqueta valor seleccionado */
.ss-selected-label {
    position: absolute;
    left: 32px;
    right: 32px;
    font-size: 0.875rem;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
    line-height: 1;
}

.ss-clear {
    position: absolute;
    right: 8px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: none;
    background: var(--bg-hover);
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.18s;
    flex-shrink: 0;
}

.ss-clear:hover {
    background: #fef2f2;
    color: #ef4444;
}

/* ── Dropdown ─────────────────────────────────── */
.ss-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    background: var(--bg-card);
    border: 1.5px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    z-index: 200;
    overflow: hidden;
    max-height: 260px;
}

.ss-state {
    padding: 12px 14px;
    font-size: 0.82rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 8px;
}

.ss-state.hint {
    font-style: italic;
}

.ss-list {
    list-style: none;
    margin: 0;
    padding: 4px;
    overflow-y: auto;
    max-height: 252px;
}

.ss-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 9px 12px;
    border-radius: 7px;
    cursor: pointer;
    transition: background 0.12s;
}

.ss-item:hover,
.ss-item.active {
    background: var(--bg-hover);
}

.ss-item-label {
    font-size: 0.875rem;
    color: var(--text-primary);
    font-weight: 500;
}

.ss-item-sub {
    font-size: 0.72rem;
    color: var(--text-muted);
    font-weight: 300;
}

/* ── Spin ─────────────────────────────────────── */
.spin {
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* ── Transition ───────────────────────────────── */
.dropdown-enter-active,
.dropdown-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>