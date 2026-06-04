<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'

const auth = useAuthStore()

interface Stats {
  habitacionesDisponibles: number
  reservacionesActivas: number
  facturasMes: number
  clientesTotal: number
}

const stats = ref<Stats | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard/stats')
    stats.value = data
  } catch {
    error.value = 'No se pudieron cargar los indicadores del hotel'
  } finally {
    loading.value = false
  }
})

const primerNombre = computed(() => auth.usuario?.nombre?.split(' ')[0] ?? 'equipo')

const ocupacionEstimada = computed(() => {
  if (!stats.value) return 0
  const disponibles = stats.value.habitacionesDisponibles
  const activas = stats.value.reservacionesActivas
  const totalOperativo = disponibles + activas
  if (!totalOperativo) return 0
  return Math.min(100, Math.round((activas / totalOperativo) * 100))
})

const forecastCards = computed(() => [
  {
    label: 'Ocupacion estimada',
    value: `${ocupacionEstimada.value}%`,
    detail: 'Basada en habitaciones disponibles y reservas activas',
    tone: 'green',
  },
  {
    label: 'Habitaciones listas',
    value: stats.value?.habitacionesDisponibles ?? 0,
    detail: 'Inventario disponible para venta inmediata',
    tone: 'blue',
  },
  {
    label: 'Reservas activas',
    value: stats.value?.reservacionesActivas ?? 0,
    detail: 'Confirmadas o huespedes en casa',
    tone: 'amber',
  },
  {
    label: 'Clientes activos',
    value: stats.value?.clientesTotal ?? 0,
    detail: 'Base comercial disponible para nuevas estadias',
    tone: 'slate',
  },
])

const operationItems = computed(() => [
  {
    title: 'Check-in y ocupacion',
    value: stats.value?.reservacionesActivas ?? 0,
    text: 'Reservas que requieren seguimiento operativo.',
  },
  {
    title: 'Facturacion mensual',
    value: stats.value?.facturasMes ?? 0,
    text: 'Documentos emitidos durante el mes actual.',
  },
  {
    title: 'Capacidad comercial',
    value: stats.value?.habitacionesDisponibles ?? 0,
    text: 'Habitaciones aptas para nuevas confirmaciones.',
  },
])
</script>

<template>
  <div class="dashboard">
    <section class="hero-panel">
      <div class="hero-copy">
        <span class="eyebrow">Administracion hotelera</span>
        <h1>Bienvenido, {{ primerNombre }}</h1>
        <p>
          Vista ejecutiva para monitorear ocupacion, disponibilidad, facturacion
          y movimiento comercial del hotel.
        </p>
      </div>
      <div class="occupancy-card">
        <span class="occupancy-label">Ocupacion</span>
        <strong>{{ ocupacionEstimada }}%</strong>
        <div class="progress-track">
          <span :style="{ width: `${ocupacionEstimada}%` }"></span>
        </div>
        <small>{{ stats?.reservacionesActivas ?? 0 }} reservas activas</small>
      </div>
    </section>

    <div v-if="loading" class="metrics-grid">
      <article v-for="i in 4" :key="i" class="metric-card skeleton">
        <span></span>
        <strong></strong>
        <small></small>
      </article>
    </div>

    <div v-else-if="error" class="state-banner">{{ error }}</div>

    <template v-else-if="stats">
      <section class="metrics-grid">
        <article v-for="card in forecastCards" :key="card.label" class="metric-card" :class="card.tone">
          <div class="metric-top">
            <span>{{ card.label }}</span>
            <i></i>
          </div>
          <strong>{{ card.value }}</strong>
          <small>{{ card.detail }}</small>
        </article>
      </section>

      <section class="dashboard-grid">
        <div class="panel wide">
          <div class="panel-header">
            <div>
              <span class="eyebrow">Resumen diario</span>
              <h2>Estado de operacion</h2>
            </div>
          </div>

          <div class="operation-list">
            <article v-for="item in operationItems" :key="item.title" class="operation-row">
              <div>
                <strong>{{ item.title }}</strong>
                <span>{{ item.text }}</span>
              </div>
              <b>{{ item.value }}</b>
            </article>
          </div>
        </div>

        <aside class="panel">
          <div class="panel-header compact">
            <div>
              <span class="eyebrow">Prioridad</span>
              <h2>Recepcion</h2>
            </div>
          </div>
          <div class="focus-list">
            <div class="focus-item">
              <span class="dot green"></span>
              Confirmar disponibilidad antes de nuevas ventas.
            </div>
            <div class="focus-item">
              <span class="dot amber"></span>
              Revisar reservas pendientes y no shows.
            </div>
            <div class="focus-item">
              <span class="dot blue"></span>
              Mantener facturacion alineada con estadias cerradas.
            </div>
          </div>
        </aside>
      </section>
    </template>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 22px;
  width: min(1180px, 100%);
  font-family: 'Sora', sans-serif;
}

.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 18px;
  align-items: stretch;
  padding: 28px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(15, 118, 110, 0.08), transparent 44%),
    var(--bg-card);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
}

.eyebrow {
  display: inline-flex;
  margin-bottom: 8px;
  color: #0f766e;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-copy h1,
.panel h2 {
  margin: 0;
  color: var(--text-primary);
  letter-spacing: 0;
}

.hero-copy h1 {
  font-size: clamp(1.7rem, 3vw, 2.35rem);
  font-weight: 700;
}

.hero-copy p {
  max-width: 680px;
  margin: 10px 0 0;
  color: var(--text-secondary);
  font-size: 0.94rem;
  line-height: 1.7;
}

.occupancy-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  border: 1px solid rgba(15, 118, 110, 0.2);
  border-radius: 8px;
  background: rgba(240, 253, 250, 0.72);
}

.occupancy-label,
.metric-top span,
.operation-row span,
.focus-item,
.occupancy-card small {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.occupancy-card strong {
  color: #0f766e;
  font-size: 2.35rem;
  line-height: 1;
}

.progress-track {
  height: 8px;
  overflow: hidden;
  border-radius: 99px;
  background: rgba(15, 118, 110, 0.16);
}

.progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #0f766e;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.metric-card,
.panel {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.045);
}

.metric-card {
  min-height: 142px;
  padding: 18px;
}

.metric-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.metric-top i {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: currentColor;
}

.metric-card strong {
  display: block;
  margin-top: 22px;
  color: var(--text-primary);
  font-size: 1.8rem;
  line-height: 1;
}

.metric-card small {
  display: block;
  margin-top: 10px;
  color: var(--text-muted);
  font-size: 0.75rem;
  line-height: 1.45;
}

.metric-card.green { color: #0f766e; }
.metric-card.blue { color: #2563eb; }
.metric-card.amber { color: #b45309; }
.metric-card.slate { color: #475569; }

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.8fr);
  gap: 18px;
}

.panel {
  padding: 22px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.panel h2 {
  font-size: 1.05rem;
  font-weight: 700;
}

.operation-list,
.focus-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.operation-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-top: 1px solid var(--border);
}

.operation-row:first-child {
  border-top: 0;
}

.operation-row strong {
  display: block;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 600;
}

.operation-row span {
  display: block;
  margin-top: 4px;
  line-height: 1.5;
}

.operation-row b {
  min-width: 52px;
  color: var(--text-primary);
  font-size: 1.45rem;
  text-align: right;
}

.focus-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-app);
  line-height: 1.5;
}

.dot {
  width: 8px;
  height: 8px;
  margin-top: 5px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.dot.green { background: #0f766e; }
.dot.amber { background: #b45309; }
.dot.blue { background: #2563eb; }

.state-banner {
  padding: 16px 18px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 0.9rem;
}

.skeleton {
  animation: pulse 1.4s ease-in-out infinite;
}

.skeleton span,
.skeleton strong,
.skeleton small {
  display: block;
  border-radius: 6px;
  background: #e2e8f0;
}

.skeleton span { width: 55%; height: 12px; }
.skeleton strong { width: 34%; height: 30px; margin-top: 24px; }
.skeleton small { width: 85%; height: 12px; margin-top: 16px; }

@keyframes pulse {
  50% { opacity: 0.5; }
}

:global(.dark) .hero-panel,
:global(.dark) .metric-card,
:global(.dark) .panel {
  background: #111827;
  border-color: #243044;
}

:global(.dark) .occupancy-card {
  background: rgba(20, 83, 45, 0.18);
  border-color: rgba(45, 212, 191, 0.2);
}

:global(.dark) .focus-item {
  background: #0f172a;
}

@media (max-width: 980px) {
  .hero-panel,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .hero-panel,
  .panel {
    padding: 18px;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
