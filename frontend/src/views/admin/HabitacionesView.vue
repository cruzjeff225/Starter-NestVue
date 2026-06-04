<template>
  <div class="hab-page">

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast.visible" class="toast" :class="toast.type">
        <svg v-if="toast.type==='success'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ toast.message }}
      </div>
    </Transition>

    <!-- ── HEADER ─────────────────────────────────────────────────── -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Habitaciones</h1>
        <p class="page-sub">Gestión de inventario hotelero</p>
      </div>
      <div class="header-stats">
        <div class="stat-pill disp">
          <span class="spill-dot"></span>
          <span class="stat-n">{{ conteo('disponible') }}</span>
          <span class="stat-l">disponibles</span>
        </div>
        <div class="stat-pill ocup">
          <span class="spill-dot"></span>
          <span class="stat-n">{{ conteo('ocupada') }}</span>
          <span class="stat-l">ocupadas</span>
        </div>
        <div class="stat-pill mant">
          <span class="spill-dot"></span>
          <span class="stat-n">{{ conteo('mantenimiento') }}</span>
          <span class="stat-l">mantenimiento</span>
        </div>
        <div class="stat-pill total">
          <span class="stat-n">{{ habitaciones.length }}</span>
          <span class="stat-l">total</span>
        </div>
      </div>
      <div class="header-actions">
        <button v-if="auth.tienePermiso('habitaciones:gestionar_tipos')" class="btn-outline" @click="abrirModalTipos">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          Tipos
        </button>
        <button v-if="auth.tienePermiso('habitaciones:crear')" class="btn-primary" @click="abrirModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva habitación
        </button>
      </div>
    </div>

    <!-- ── FILTROS ────────────────────────────────────────────────── -->
    <div class="filters-bar">
      <div class="search-wrap">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-ico"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="filtros.search" type="text" class="search-inp" placeholder="Buscar por número, descripción..." @input="cargar"/>
        <button v-if="filtros.search" class="search-x" @click="filtros.search='';cargar()">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <select v-model="filtros.estado" class="sel" @change="cargar">
        <option value="">Todos los estados</option>
        <option value="disponible">Disponible</option>
        <option value="ocupada">Ocupada</option>
        <option value="reservada">Reservada</option>
        <option value="mantenimiento">Mantenimiento</option>
      </select>
      <select v-model="filtros.tipoId" class="sel" @change="cargar">
        <option value="">Todos los tipos</option>
        <option v-for="t in tipos" :key="t.idTipo" :value="t.idTipo">{{ t.nombre }}</option>
      </select>
      <button v-if="filtros.search||filtros.estado||filtros.tipoId" class="btn-clear" @click="limpiarFiltros">
        Limpiar filtros
      </button>
    </div>

    <!-- ── LOADING / ERROR ────────────────────────────────────────── -->
    <div v-if="loading" class="state-center">
      <svg class="spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
      Cargando habitaciones...
    </div>

    <div v-else-if="errorGlobal" class="state-center err">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {{ errorGlobal }}
      <button class="btn-retry" @click="cargar">Reintentar</button>
    </div>

    <!-- ── TABLA ──────────────────────────────────────────────────── -->
    <div v-else class="table-card">
      <table class="htable">
        <thead>
          <tr>
            <th class="th-num">#</th>
            <th>Habitación</th>
            <th>Tipo</th>
            <th>Piso · Cap.</th>
            <th>Ubicación</th>
            <th>Precio base</th>
            <th>Precio final</th>
            <th>Amenidades</th>
            <th>Estado</th>
            <th>Activo</th>
            <th class="th-acc">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="h in habitaciones" :key="h.idHabitacion" :class="{'tr-inactive': !h.activo}">
            <td class="td-id">{{ h.idHabitacion }}</td>
            <td>
              <div class="hab-cell">
                <div class="hab-badge" :class="[h.estado, {inactive: !h.activo}]">{{ h.numero }}</div>
                <div class="hab-info">
                  <span class="hab-num">Hab. {{ h.numero }}</span>
                  <span class="hab-desc">{{ h.descripcion || 'Sin descripción' }}</span>
                </div>
              </div>
            </td>
            <td><span class="chip-tipo">{{ h.tipo?.nombre }}</span></td>
            <td class="td-sec">Piso {{ h.piso }} · {{ h.capacidad }} pers.</td>
            <td>
              <div class="ubicacion-cell">
                <span v-if="h.vista && h.vista !== 'ninguna'" class="chip-ubicacion vista" :title="`Vista: ${etiquetaVista[h.vista]}`">
                  {{ iconoVista[h.vista] }} {{ etiquetaVista[h.vista] }}
                </span>
                <span v-for="c in (h.cercaniasStr||[])" :key="c" class="chip-ubicacion cercania" :title="`Cercano a: ${etiquetaCercania[c]}`">
                  {{ iconoCercania[c] }} {{ etiquetaCercania[c] }}
                </span>
                <span v-if="!h.vista || (h.vista==='ninguna' && !(h.cercaniasStr||[]).length)" class="td-empty">—</span>
              </div>
            </td>
            <td class="td-price-base">${{ fmt(h.tipo?.precioBase) }}</td>
            <td>
              <div class="precio-final-cell">
                <span class="precio-final">${{ fmt(h.precioFinal || h.tipo?.precioBase) }}</span>
                <span v-if="h.precioFinal && Number(h.precioFinal) > Number(h.tipo?.precioBase)" class="precio-delta">
                  +{{ calcDelta(h) }}%
                </span>
              </div>
            </td>
            <td>
              <div class="amenidades-wrap">
                <span v-for="a in (h.amenidades||[]).slice(0,2)" :key="a" class="chip-amen">{{ a }}</span>
                <span v-if="(h.amenidades||[]).length > 2" class="chip-amen more" :title="h.amenidades.slice(2).join(', ')">+{{ h.amenidades.length - 2 }}</span>
                <span v-if="!(h.amenidades||[]).length" class="td-empty">—</span>
              </div>
            </td>
            <td>
              <span class="estado-chip" :class="h.estado">
                <span class="edot"></span>{{ etiquetaEstado[h.estado] }}
              </span>
            </td>
            <td>
              <span class="activo-chip" :class="h.activo ? 'si' : 'no'">
                <span class="edot"></span>{{ h.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>
              <div class="acc-row">
                <button v-if="auth.tienePermiso('habitaciones:cambiar_estado')" class="abtn estado" title="Cambiar estado" :disabled="!h.activo" @click="abrirModalEstado(h)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
                </button>
                <button v-if="auth.tienePermiso('habitaciones:editar')" class="abtn edit" title="Editar" @click="abrirModal(h)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button v-if="auth.tienePermiso('habitaciones:toggle_activo')" class="abtn" :class="h.activo ? 'deact' : 'act'" :title="h.activo ? 'Desactivar' : 'Activar'" @click="pedirConfirmToggle(h)">
                  <svg v-if="h.activo" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!habitaciones.length">
            <td colspan="11" class="empty-td">
              <div class="empty-box">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M2 4h20v14a2 2 0 01-2 2H4a2 2 0 01-2-2z"/><path d="M2 10h20M6 4v14M18 4v14"/></svg>
                <p>No se encontraron habitaciones</p>
                <span v-if="filtros.search||filtros.estado||filtros.tipoId">Intenta ajustar los filtros</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>


    <!-- ═══════════════════════════════════════════════════════════
         MODAL CREAR / EDITAR — DISEÑO NUEVO
    ════════════════════════════════════════════════════════════ -->
    <Transition name="modal">
      <div v-if="modalAbierto" class="overlay" @click.self="cerrarModal">
        <div class="modal-xl">

          <!-- Header del modal -->
          <div class="mxl-header">
            <div class="mxl-header-left">
              <div class="mxl-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4h20v14a2 2 0 01-2 2H4a2 2 0 01-2-2z"/><path d="M2 10h20M6 4v14M18 4v14"/></svg>
              </div>
              <div>
                <h2 class="mxl-title">{{ editando ? 'Editar habitación' : 'Nueva habitación' }}</h2>
                <p class="mxl-sub">{{ editando ? `Hab. ${editando.numero}` : 'Completa todos los campos requeridos' }}</p>
              </div>
            </div>
            <button class="mxl-close" @click="cerrarModal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Body del modal en 2 columnas -->
          <div class="mxl-body">

            <!-- COL IZQUIERDA: datos de la habitación -->
            <div class="mxl-col mxl-left">

              <!-- Sección 1: Identificación -->
              <div class="mxl-section">
                <div class="mxl-section-title">
                  <span class="msnum">01</span>
                  <span>Identificación</span>
                </div>
                <div class="mxl-fields-2">
                  <div class="ff">
                    <label class="fl">Número de habitación *</label>
                    <input v-model="form.numero" type="text" class="fi" :class="{ferr: v.numero}" placeholder="Ej: 101, 202-A, PH1"/>
                    <span v-if="v.numero" class="ferr-msg">{{ v.numero }}</span>
                  </div>
                  <div class="ff">
                    <label class="fl">Tipo de habitación *</label>
                    <select v-model="form.tipoId" class="fi" :class="{ferr: v.tipoId}">
                      <option value="">Seleccionar tipo...</option>
                      <option v-for="t in tipos" :key="t.idTipo" :value="t.idTipo">{{ t.nombre }} — ${{ fmt(t.precioBase) }}/noche</option>
                    </select>
                    <span v-if="v.tipoId" class="ferr-msg">{{ v.tipoId }}</span>
                  </div>
                  <div class="ff">
                    <label class="fl">Piso *</label>
                    <input v-model.number="form.piso" type="number" min="1" max="99" class="fi" :class="{ferr: v.piso}" placeholder="1"/>
                    <span v-if="v.piso" class="ferr-msg">{{ v.piso }}</span>
                  </div>
                  <div class="ff">
                    <label class="fl">Capacidad *</label>
                    <div class="counter-row">
                      <button class="cnt-btn" type="button" @click="form.capacidad = Math.max(1, form.capacidad - 1)">−</button>
                      <span class="cnt-val">{{ form.capacidad }} pers.</span>
                      <button class="cnt-btn" type="button" @click="form.capacidad = Math.min(20, form.capacidad + 1)">+</button>
                    </div>
                  </div>
                  <div class="ff ff-full">
                    <label class="fl">Descripción <span class="fl-opt">opcional</span></label>
                    <input v-model="form.descripcion" type="text" class="fi" placeholder="Describe la habitación brevemente..." maxlength="200"/>
                    <span class="fl-count">{{ form.descripcion.length }}/200</span>
                  </div>
                  <div class="ff ff-full">
                    <label class="fl">URL de imagen <span class="fl-opt">opcional</span></label>
                    <input v-model="form.imagenUrl" type="url" class="fi" placeholder="https://..."/>
                    <div v-if="form.imagenUrl" class="img-prev-wrap">
                      <img :src="form.imagenUrl" alt="Preview" class="img-prev" @error="(e:any)=>e.target.style.display='none'"/>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Sección 2: Amenidades checklist -->
              <div class="mxl-section">
                <div class="mxl-section-title">
                  <span class="msnum">02</span>
                  <span>Amenidades</span>
                </div>
                <div class="amenidades-checklist">
                  <label v-for="a in AMENIDADES_CATALOGO" :key="a.id" class="amen-check-item" :class="{checked: form.amenidades.includes(a.label)}">
                    <input type="checkbox" :value="a.label" v-model="form.amenidades" class="amen-checkbox"/>
                    <span class="amen-icon">{{ a.icon }}</span>
                    <span class="amen-label">{{ a.label }}</span>
                    <span class="amen-tick">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                  </label>
                </div>
                <!-- Amenidad personalizada -->
                <div class="amen-custom-row">
                  <input v-model="amenidadCustom" type="text" class="fi amen-custom-inp" placeholder="Agregar amenidad personalizada..." @keydown.enter.prevent="addCustomAmen" @keydown.188.prevent="addCustomAmen"/>
                  <button type="button" class="btn-add-custom" @click="addCustomAmen" :disabled="!amenidadCustom.trim()">+ Agregar</button>
                </div>
                <div v-if="form.amenidades.filter(a => !AMENIDADES_CATALOGO.map(c=>c.label).includes(a)).length" class="amen-custom-tags">
                  <span v-for="a in form.amenidades.filter(a => !AMENIDADES_CATALOGO.map(c=>c.label).includes(a))" :key="a" class="custom-tag">
                    {{ a }} <button @click="quitarAmen(a)" class="ctag-x">×</button>
                  </span>
                </div>
              </div>
            </div>

            <!-- COL DERECHA: ubicación + precio dinámico -->
            <div class="mxl-col mxl-right">

              <!-- Sección 3: Ubicación y vistas -->
              <div class="mxl-section">
                <div class="mxl-section-title">
                  <span class="msnum">03</span>
                  <span>Ubicación y vistas</span>
                  <span class="ms-badge-info">Impactan el precio final</span>
                </div>

                <div class="ff ff-full" style="margin-bottom:16px">
                  <label class="fl">Vista desde la habitación</label>
                  <div class="vista-grid">
                    <button v-for="v2 in VISTAS" :key="v2.id" type="button"
                      class="vista-btn"
                      :class="{selected: form.vista === v2.id}"
                      @click="form.vista = v2.id">
                      <span class="vista-icon">{{ v2.icon }}</span>
                      <span class="vista-label">{{ v2.label }}</span>
                      <span v-if="v2.mod > 0" class="vista-mod">+{{ v2.mod }}%</span>
                    </button>
                  </div>
                </div>

                <div class="ff ff-full">
                  <label class="fl">Cercanía a instalaciones <span class="fl-opt">selecciona todas las que apliquen</span></label>
                  <div class="cercanias-grid">
                    <label v-for="c in CERCANIAS" :key="c.id" class="cerc-check" :class="{checked: form.cercanias.includes(c.id)}">
                      <input type="checkbox" :value="c.id" v-model="form.cercanias" class="amen-checkbox"/>
                      <span class="cerc-icon">{{ c.icon }}</span>
                      <div class="cerc-info">
                        <span class="cerc-label">{{ c.label }}</span>
                        <span class="cerc-mod">+{{ c.mod }}% precio</span>
                      </div>
                      <span class="amen-tick">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Sección 4: Calculadora de precio -->
              <div class="mxl-section precio-card" v-if="tipoSel">
                <div class="mxl-section-title">
                  <span class="msnum">04</span>
                  <span>Resumen de precio</span>
                </div>
                <div class="precio-calc">
                  <div class="pc-row">
                    <span class="pc-label">Precio base ({{ tipoSel.nombre }})</span>
                    <span class="pc-val">${{ fmt(tipoSel.precioBase) }}</span>
                  </div>
                  <div v-if="form.vista && form.vista !== 'ninguna'" class="pc-row pc-mod">
                    <span class="pc-label">
                      {{ iconoVista[form.vista] }} Vista {{ etiquetaVista[form.vista] }}
                    </span>
                    <span class="pc-val green">+{{ ((MODIFICADORES_VISTA[form.vista] ?? 0) * 100).toFixed(0) }}%</span>
                  </div>
                  <div v-for="c in form.cercanias" :key="c" class="pc-row pc-mod">
                    <span class="pc-label">{{ iconoCercania[c] }} {{ etiquetaCercania[c] }}</span>
                    <span class="pc-val green">+{{ ((MODIFICADORES_CERCANIA[c] ?? 0) * 100).toFixed(0) }}%</span>
                  </div>
                  <div v-if="modificadorTotal >= MAX_MODIFICADOR" class="pc-cap-warn">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Se aplicó el límite máximo de +{{ (MAX_MODIFICADOR * 100).toFixed(0) }}%
                  </div>
                  <div class="pc-divider"></div>
                  <div class="pc-row pc-total">
                    <span class="pc-label-total">Precio final / noche</span>
                    <span class="pc-final">${{ fmt(precioCalculado) }}</span>
                  </div>
                  <div v-if="modificadorTotal > 0" class="pc-ahorro">
                    <span>Incremento total: <strong>+{{ (Math.min(modificadorTotal, MAX_MODIFICADOR) * 100).toFixed(1) }}%</strong> sobre precio base</span>
                  </div>
                </div>
              </div>

              <div v-else class="mxl-section precio-placeholder">
                <div class="mxl-section-title">
                  <span class="msnum">04</span>
                  <span>Resumen de precio</span>
                </div>
                <div class="pp-empty">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p>Selecciona un tipo de habitación para ver el cálculo de precio</p>
                </div>
              </div>

            </div>
          </div>

          <!-- Footer del modal -->
          <div class="mxl-footer">
            <div v-if="formError" class="f-err">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {{ formError }}
            </div>
            <div class="mxl-footer-btns">
              <button class="btn-outline" @click="cerrarModal">Cancelar</button>
              <button class="btn-primary" :disabled="guardando" @click="guardar">
                <span v-if="!guardando">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:5px;vertical-align:-2px"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v14a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  {{ editando ? 'Guardar cambios' : 'Crear habitación' }}
                </span>
                <span v-else class="btn-spin">
                  <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                  Guardando...
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>


    <!-- ── MODAL CAMBIAR ESTADO ───────────────────────────────────── -->
    <Transition name="modal">
      <div v-if="modalEstado" class="overlay" @click.self="cerrarModalEstado">
        <div class="modal-sm">
          <div class="mxl-header">
            <div class="mxl-header-left">
              <div>
                <h2 class="mxl-title">Cambiar estado</h2>
                <p class="mxl-sub">Hab. {{ habitacionEstado?.numero }} · estado actual: {{ etiquetaEstado[habitacionEstado?.estado] }}</p>
              </div>
            </div>
            <button class="mxl-close" @click="cerrarModalEstado">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="mxl-body" style="display:block">
            <div v-if="habitacionEstado?.estado==='ocupada'||habitacionEstado?.estado==='reservada'" class="adv-warn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Esta habitación tiene una reservación activa. Cambiar el estado puede causar inconsistencias.
            </div>
            <div class="estados-grid">
              <button v-for="e in ESTADOS_HAB" :key="e.value" class="estado-opt"
                :class="{sel: estadoSel===e.value, current: habitacionEstado?.estado===e.value}"
                @click="estadoSel=e.value">
                <span class="edot-lg" :class="e.value"></span>
                <div class="eopt-info">
                  <span class="eopt-label">{{ e.label }} <span v-if="habitacionEstado?.estado===e.value" class="eopt-curr">actual</span></span>
                  <span class="eopt-desc">{{ e.desc }}</span>
                </div>
                <svg v-if="estadoSel===e.value" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            </div>
            <div v-if="estadoError" class="f-err" style="margin-top:12px">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {{ estadoError }}
            </div>
          </div>
          <div class="mxl-footer">
            <div></div>
            <div class="mxl-footer-btns">
              <button class="btn-outline" @click="cerrarModalEstado">Cancelar</button>
              <button class="btn-primary" :disabled="estadoLoading||!estadoSel||estadoSel===habitacionEstado?.estado" @click="guardarEstado">
                <span v-if="!estadoLoading">Aplicar estado</span>
                <span v-else class="btn-spin"><svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Guardando...</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>


    <!-- ── MODAL CONFIRMAR TOGGLE ─────────────────────────────────── -->
    <Transition name="modal">
      <div v-if="confirm.visible" class="overlay" @click.self="confirm.visible=false">
        <div class="modal-sm">
          <div class="mxl-header">
            <div><h2 class="mxl-title">{{ confirm.hab?.activo ? 'Desactivar habitación' : 'Activar habitación' }}</h2><p class="mxl-sub">Hab. {{ confirm.hab?.numero }}</p></div>
            <button class="mxl-close" @click="confirm.visible=false"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          <div class="mxl-body" style="display:block">
            <div class="confirm-msg" :class="confirm.hab?.activo ? 'warn' : 'ok'">
              <svg v-if="confirm.hab?.activo" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              <span v-if="confirm.hab?.activo">La habitación quedará inactiva y no podrá reservarse. ¿Confirmar desactivación?</span>
              <span v-else>La habitación estará disponible nuevamente para reservaciones. ¿Confirmar activación?</span>
            </div>
          </div>
          <div class="mxl-footer">
            <div></div>
            <div class="mxl-footer-btns">
              <button class="btn-outline" @click="confirm.visible=false">Cancelar</button>
              <button :class="confirm.hab?.activo ? 'btn-danger' : 'btn-success'" :disabled="confirm.loading" @click="ejecutarToggle">
                <span v-if="!confirm.loading">{{ confirm.hab?.activo ? 'Sí, desactivar' : 'Sí, activar' }}</span>
                <span v-else class="btn-spin"><svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>


    <!-- ── MODAL TIPOS ────────────────────────────────────────────── -->
    <Transition name="modal">
      <div v-if="modalTipos" class="overlay" @click.self="cerrarModalTipos">
        <div class="modal-sm">
          <div class="mxl-header">
            <h2 class="mxl-title">Tipos de habitación</h2>
            <button class="mxl-close" @click="cerrarModalTipos"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          <div class="mxl-body" style="display:block;gap:14px">
            <div class="tipo-form-box">
              <p class="tipo-form-lbl">{{ tipoEdit ? '✏️ Editando tipo' : '+ Nuevo tipo' }}</p>
              <div class="mxl-fields-2">
                <div class="ff"><label class="fl">Nombre *</label><input v-model="tipoForm.nombre" class="fi" placeholder="Suite, Doble..."/></div>
                <div class="ff"><label class="fl">Precio base ($) *</label><input v-model.number="tipoForm.precioBase" type="number" min="0" step="0.01" class="fi" placeholder="0.00"/></div>
                <div class="ff ff-full"><label class="fl">Descripción</label><input v-model="tipoForm.descripcion" class="fi" placeholder="Opcional"/></div>
              </div>
              <div v-if="tipoError" class="f-err" style="margin-top:8px">{{ tipoError }}</div>
              <div class="tipo-form-btns">
                <button v-if="tipoEdit" class="btn-outline" @click="cancelarTipoEdit">Cancelar</button>
                <button class="btn-primary" :disabled="tipoLoading||!tipoForm.nombre.trim()||!tipoForm.precioBase" @click="guardarTipo">
                  <span v-if="!tipoLoading">{{ tipoEdit ? 'Actualizar' : 'Agregar tipo' }}</span>
                  <span v-else class="btn-spin"><svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg></span>
                </button>
              </div>
            </div>
            <div class="tipos-lista">
              <div v-for="t in tipos" :key="t.idTipo" class="tipo-row" :class="{'tipo-editing': tipoEdit?.idTipo===t.idTipo}">
                <div class="tipo-row-info">
                  <span class="tipo-nombre">{{ t.nombre }}</span>
                  <span class="tipo-precio">${{ fmt(t.precioBase) }}/noche</span>
                  <span class="tipo-cnt">{{ t._count?.habitaciones??0 }} hab.</span>
                </div>
                <div class="tipo-row-btns">
                  <button class="abtn edit" @click="iniciarTipoEdit(t)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                  <button class="abtn deact" :disabled="(t._count?.habitaciones??0)>0" :title="(t._count?.habitaciones??0)>0?'Tiene habitaciones asignadas':'Eliminar'" @click="eliminarTipo(t)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></button>
                </div>
              </div>
              <div v-if="!tipos.length" class="empty-sm">No hay tipos creados aún</div>
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
import { habitacionesApi } from '../../services/api'

const auth = useAuthStore()

// ── Modificadores de precio (igual que el backend) ───────────────────────────
const MODIFICADORES_VISTA: Record<string, number> = {
  mar: 0.25, montania: 0.20, ciudad: 0.15, piscina: 0.12, jardin: 0.08, ninguna: 0,
}
const MODIFICADORES_CERCANIA: Record<string, number> = {
  playa: 0.15, piscina: 0.10, spa: 0.08, restaurante: 0.06, bar: 0.05, gym: 0.04,
}
const MAX_MODIFICADOR = 0.45

// ── Catálogos UI ─────────────────────────────────────────────────────────────
const AMENIDADES_CATALOGO = [
  { id: 'wifi',   icon: '📶', label: 'WiFi' },
  { id: 'tv',     icon: '📺', label: 'TV' },
  { id: 'ac',     icon: '❄️',  label: 'Aire acondicionado' },
  { id: 'minibar',icon: '🍷', label: 'Mini bar' },
  { id: 'jacuzzi',icon: '🛁', label: 'Jacuzzi' },
  { id: 'frigobar',icon:'🧊', label: 'Frigobar' },
  { id: 'balcon', icon: '🌅', label: 'Balcón' },
  { id: 'caja',   icon: '🔒', label: 'Caja fuerte' },
  { id: 'secadora',icon:'💨', label: 'Secadora de cabello' },
  { id: 'escritorio',icon:'🖥️',label:'Escritorio de trabajo' },
  { id: 'bano',   icon: '🚿', label: 'Baño privado' },
  { id: 'cafetera',icon:'☕', label: 'Cafetera' },
  { id: 'plancha', icon:'👔', label: 'Plancha de ropa' },
  { id: 'vista',  icon: '🪟', label: 'Ventanas grandes' },
]

const VISTAS = [
  { id: 'ninguna', icon: '🏢', label: 'Sin vista especial', mod: 0 },
  { id: 'jardin',  icon: '🌿', label: 'Jardín',             mod: 8 },
  { id: 'piscina', icon: '🏊', label: 'Piscina',            mod: 12 },
  { id: 'ciudad',  icon: '🌆', label: 'Ciudad',             mod: 15 },
  { id: 'montania',icon: '⛰️', label: 'Montaña',            mod: 20 },
  { id: 'mar',     icon: '🌊', label: 'Mar / Océano',       mod: 25 },
]

const CERCANIAS = [
  { id: 'gym',        icon: '🏋️', label: 'Gimnasio',   mod: 4 },
  { id: 'bar',        icon: '🍸', label: 'Bar / Lounge', mod: 5 },
  { id: 'restaurante',icon: '🍽️', label: 'Restaurante', mod: 6 },
  { id: 'spa',        icon: '💆', label: 'Spa',          mod: 8 },
  { id: 'piscina',    icon: '🏊', label: 'Piscina',      mod: 10 },
  { id: 'playa',      icon: '🏖️', label: 'Playa',        mod: 15 },
]

const ESTADOS_HAB = [
  { value: 'disponible',   label: 'Disponible',   desc: 'Lista para recibir huéspedes' },
  { value: 'ocupada',      label: 'Ocupada',      desc: 'Actualmente con huéspedes' },
  { value: 'reservada',    label: 'Reservada',    desc: 'Con reservación confirmada' },
  { value: 'mantenimiento',label: 'Mantenimiento',desc: 'Fuera de servicio temporalmente' },
]

// ── Labels / íconos ──────────────────────────────────────────────────────────
const etiquetaEstado: Record<string,string> = { disponible:'Disponible', ocupada:'Ocupada', reservada:'Reservada', mantenimiento:'Mantenimiento' }
const etiquetaVista: Record<string,string>  = { mar:'Mar', montania:'Montaña', ciudad:'Ciudad', piscina:'Piscina', jardin:'Jardín', ninguna:'—' }
const iconoVista: Record<string,string>     = { mar:'🌊', montania:'⛰️', ciudad:'🌆', piscina:'🏊', jardin:'🌿', ninguna:'—' }
const etiquetaCercania: Record<string,string>={ playa:'Playa', piscina:'Piscina', spa:'Spa', restaurante:'Restaurante', bar:'Bar', gym:'Gimnasio' }
const iconoCercania: Record<string,string>  = { playa:'🏖️', piscina:'🏊', spa:'💆', restaurante:'🍽️', bar:'🍸', gym:'🏋️' }

// ── Estado principal ─────────────────────────────────────────────────────────
const habitaciones = ref<any[]>([])
const tipos = ref<any[]>([])
const loading = ref(true)
const errorGlobal = ref('')

// Toast
const toast = reactive({ visible: false, message: '', type: 'success' as 'success'|'error' })
let toastT: any
function showToast(msg: string, type: 'success'|'error' = 'success') {
  clearTimeout(toastT); toast.message = msg; toast.type = type; toast.visible = true
  toastT = setTimeout(() => { toast.visible = false }, 3500)
}

// Filtros
const filtros = reactive({ search: '', estado: '', tipoId: '' })

// Modal crear/editar
const modalAbierto = ref(false)
const editando = ref<any>(null)
const guardando = ref(false)
const formError = ref('')
const amenidadCustom = ref('')

const formVacio = () => ({
  numero: '', tipoId: '' as any, piso: 1, capacidad: 2,
  descripcion: '', imagenUrl: '',
  amenidades: [] as string[],
  vista: 'ninguna',
  cercanias: [] as string[],
})
const form = ref(formVacio())
const v = reactive({ numero: '', tipoId: '', piso: '', capacidad: '' })

// Tipo seleccionado (para preview de precio)
const tipoSel = computed(() =>
  form.value.tipoId ? tipos.value.find(t => t.idTipo === Number(form.value.tipoId)) : null
)
const modificadorTotal = computed(() => {
  let m = form.value.vista && form.value.vista !== 'ninguna' ? (MODIFICADORES_VISTA[form.value.vista] ?? 0) : 0
  for (const c of form.value.cercanias) m += MODIFICADORES_CERCANIA[c] ?? 0
  return m
})
const precioCalculado = computed(() => {
  if (!tipoSel.value) return 0
  const base = Number(tipoSel.value.precioBase)
  const m = Math.min(modificadorTotal.value, MAX_MODIFICADOR)
  return Math.round(base * (1 + m) * 100) / 100
})

// Modal estado
const modalEstado = ref(false)
const habitacionEstado = ref<any>(null)
const estadoSel = ref('')
const estadoLoading = ref(false)
const estadoError = ref('')

// Confirm toggle
const confirm = reactive({ visible: false, hab: null as any, loading: false })

// Modal tipos
const modalTipos = ref(false)
const tipoEdit = ref<any>(null)
const tipoLoading = ref(false)
const tipoError = ref('')
const huboTiposCambios = ref(false)
const tipoForm = reactive({ nombre: '', precioBase: 0, descripcion: '' })

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(v: any) { return Number(v ?? 0).toFixed(2) }
function conteo(estado: string) { return habitaciones.value.filter(h => h.estado === estado && h.activo).length }
function calcDelta(h: any) {
  const base = Number(h.tipo?.precioBase ?? 0)
  const final = Number(h.precioFinal ?? base)
  if (!base) return '0'
  return ((final - base) / base * 100).toFixed(0)
}

// ── Cargar datos ─────────────────────────────────────────────────────────────
onMounted(() => Promise.all([cargar(), cargarTipos()]))

async function cargar() {
  loading.value = true; errorGlobal.value = ''
  try {
    const p: any = {}
    if (filtros.search) p.search = filtros.search
    if (filtros.estado) p.estado = filtros.estado
    if (filtros.tipoId) p.tipoId = filtros.tipoId
    const { data } = await habitacionesApi.getAll(p)
    habitaciones.value = data
  } catch { errorGlobal.value = 'No se pudieron cargar las habitaciones' }
  finally { loading.value = false }
}

async function cargarTipos() {
  try { const { data } = await habitacionesApi.getTipos(); tipos.value = data } catch {}
}

function limpiarFiltros() { filtros.search = ''; filtros.estado = ''; filtros.tipoId = ''; cargar() }

// ── Modal Habitación ─────────────────────────────────────────────────────────
function abrirModal(hab?: any) {
  editando.value = hab ?? null; formError.value = ''; amenidadCustom.value = ''
  Object.assign(v, { numero:'', tipoId:'', piso:'', capacidad:'' })
  form.value = hab ? {
    numero: hab.numero, tipoId: hab.tipoId, piso: hab.piso,
    capacidad: hab.capacidad, descripcion: hab.descripcion ?? '',
    imagenUrl: hab.imagenUrl ?? '',
    amenidades: [...(hab.amenidades ?? [])],
    vista: hab.vista ?? 'ninguna',
    cercanias: [...(hab.cercaniasStr ?? [])],
  } : formVacio()
  modalAbierto.value = true
}
function cerrarModal() { modalAbierto.value = false }

function addCustomAmen() {
  const val = amenidadCustom.value.trim().replace(/[,;]+$/, '')
  if (val && !form.value.amenidades.some(a => a.toLowerCase() === val.toLowerCase())) {
    form.value.amenidades.push(val)
  }
  amenidadCustom.value = ''
}
function quitarAmen(a: string) { form.value.amenidades = form.value.amenidades.filter(x => x !== a) }

function validar(): boolean {
  Object.assign(v, { numero:'', tipoId:'', piso:'', capacidad:'' }); let ok = true
  if (!form.value.numero.trim()) { v.numero = 'El número es requerido'; ok = false }
  if (!form.value.tipoId) { v.tipoId = 'Selecciona un tipo'; ok = false }
  if (!form.value.piso || form.value.piso < 1) { v.piso = 'Piso inválido'; ok = false }
  if (!form.value.capacidad || form.value.capacidad < 1) { v.capacidad = 'Capacidad inválida'; ok = false }
  return ok
}

async function guardar() {
  if (!validar()) return
  guardando.value = true; formError.value = ''
  try {
    const payload = {
      ...form.value,
      tipoId: Number(form.value.tipoId),
      cercaniasStr: form.value.cercanias,
    }
    if (editando.value) {
      await habitacionesApi.update(editando.value.idHabitacion, payload)
      showToast(`Habitación ${form.value.numero} actualizada`)
    } else {
      await habitacionesApi.create(payload)
      showToast(`Habitación ${form.value.numero} creada`)
    }
    cerrarModal(); cargar()
  } catch (e: any) {
    const msg = e?.response?.data?.message
    formError.value = Array.isArray(msg) ? msg[0] : (msg ?? 'Ocurrió un error')
  } finally { guardando.value = false }
}

// ── Toggle activo ────────────────────────────────────────────────────────────
function pedirConfirmToggle(hab: any) { confirm.hab = hab; confirm.loading = false; confirm.visible = true }
async function ejecutarToggle() {
  confirm.loading = true
  try {
    await habitacionesApi.toggleActivo(confirm.hab.idHabitacion)
    showToast(`Habitación ${confirm.hab.numero} ${confirm.hab.activo ? 'desactivada' : 'activada'}`)
    confirm.visible = false; cargar()
  } catch { showToast('No se pudo cambiar el estado', 'error'); confirm.visible = false }
  finally { confirm.loading = false }
}

// ── Modal estado ─────────────────────────────────────────────────────────────
function abrirModalEstado(hab: any) { habitacionEstado.value = hab; estadoSel.value = hab.estado; estadoError.value = ''; modalEstado.value = true }
function cerrarModalEstado() { modalEstado.value = false }
async function guardarEstado() {
  if (!estadoSel.value || estadoSel.value === habitacionEstado.value?.estado) { cerrarModalEstado(); return }
  estadoLoading.value = true; estadoError.value = ''
  try {
    await habitacionesApi.cambiarEstado(habitacionEstado.value.idHabitacion, estadoSel.value)
    showToast(`Estado actualizado a "${etiquetaEstado[estadoSel.value]}"`)
    cerrarModalEstado(); cargar()
  } catch (e: any) { estadoError.value = e?.response?.data?.message ?? 'Error al cambiar estado' }
  finally { estadoLoading.value = false }
}

// ── Modal tipos ──────────────────────────────────────────────────────────────
function abrirModalTipos() { tipoEdit.value = null; tipoError.value = ''; huboTiposCambios.value = false; Object.assign(tipoForm, { nombre:'', precioBase:0, descripcion:'' }); modalTipos.value = true }
function cerrarModalTipos() { modalTipos.value = false; if (huboTiposCambios.value) cargar() }
function iniciarTipoEdit(t: any) { tipoEdit.value = t; Object.assign(tipoForm, { nombre:t.nombre, precioBase:Number(t.precioBase), descripcion:t.descripcion??'' }); tipoError.value = '' }
function cancelarTipoEdit() { tipoEdit.value = null; Object.assign(tipoForm, { nombre:'', precioBase:0, descripcion:'' }) }
async function guardarTipo() {
  if (!tipoForm.nombre.trim()) { tipoError.value = 'El nombre es requerido'; return }
  if (!tipoForm.precioBase || tipoForm.precioBase <= 0) { tipoError.value = 'El precio debe ser mayor a 0'; return }
  tipoLoading.value = true; tipoError.value = ''
  try {
    if (tipoEdit.value) { await habitacionesApi.updateTipo(tipoEdit.value.idTipo, tipoForm); showToast(`Tipo "${tipoForm.nombre}" actualizado`) }
    else { await habitacionesApi.createTipo(tipoForm); showToast(`Tipo "${tipoForm.nombre}" creado`) }
    huboTiposCambios.value = true; await cargarTipos(); cancelarTipoEdit()
  } catch (e: any) {
    const msg = e?.response?.data?.message
    tipoError.value = Array.isArray(msg) ? msg[0] : (msg ?? 'Error')
  } finally { tipoLoading.value = false }
}
async function eliminarTipo(t: any) {
  if ((t._count?.habitaciones ?? 0) > 0) return
  if (!window.confirm(`¿Eliminar "${t.nombre}"?`)) return
  try { await habitacionesApi.deleteTipo(t.idTipo); showToast(`Tipo "${t.nombre}" eliminado`); huboTiposCambios.value = true; await cargarTipos() }
  catch (e: any) { tipoError.value = e?.response?.data?.message ?? 'Error al eliminar' }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box}
.hab-page{font-family:'Plus Jakarta Sans',sans-serif;display:flex;flex-direction:column;gap:22px;max-width:1280px}

/* Toast */
.toast{position:fixed;bottom:28px;right:28px;z-index:3000;display:flex;align-items:center;gap:9px;padding:12px 18px;border-radius:10px;font-size:.83rem;font-weight:500;box-shadow:0 8px 30px rgba(0,0,0,.18);max-width:360px}
.toast.success{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0}
.toast.error{background:#fef2f2;color:#dc2626;border:1px solid #fecaca}
.toast-enter-active,.toast-leave-active{transition:all .3s ease}
.toast-enter-from,.toast-leave-to{opacity:0;transform:translateY(10px) scale(.95)}

/* Header */
.page-header{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.header-left{flex:1;min-width:160px}
.page-title{font-size:1.45rem;font-weight:700;color:var(--text-primary);margin:0 0 3px;letter-spacing:-.025em}
.page-sub{font-size:.82rem;color:var(--text-muted);margin:0;font-weight:300}
.header-stats{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.stat-pill{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:99px;font-size:.78rem;font-weight:500;border:1px solid var(--border);background:var(--bg-card)}
.stat-pill.disp{background:#f0fdf4;border-color:#bbf7d0;color:#15803d}
.stat-pill.ocup{background:#fef2f2;border-color:#fecaca;color:#dc2626}
.stat-pill.mant{background:#fffbeb;border-color:#fde68a;color:#92400e}
.stat-pill.total{background:var(--bg-card);color:var(--text-secondary)}
.spill-dot{width:7px;height:7px;border-radius:50%;background:currentColor}
.stat-n{font-weight:700}
.stat-l{font-weight:400;opacity:.8}
.header-actions{display:flex;gap:10px;align-items:center;margin-left:auto}

/* Botones */
.btn-primary{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff;border:none;border-radius:9px;font-size:.83rem;font-weight:600;font-family:inherit;cursor:pointer;transition:all .2s;box-shadow:0 4px 14px rgba(99,102,241,.3)}
.btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 18px rgba(99,102,241,.4)}
.btn-primary:disabled{opacity:.6;cursor:not-allowed;transform:none}
.btn-outline{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;background:var(--bg-card);color:var(--text-secondary);border:1.5px solid var(--border);border-radius:9px;font-size:.83rem;font-weight:500;font-family:inherit;cursor:pointer;transition:all .2s}
.btn-outline:hover{background:var(--bg-hover)}
.btn-danger{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;background:#ef4444;color:#fff;border:none;border-radius:9px;font-size:.83rem;font-weight:600;font-family:inherit;cursor:pointer;transition:all .2s}
.btn-danger:hover:not(:disabled){background:#dc2626}
.btn-danger:disabled{opacity:.6;cursor:not-allowed}
.btn-success{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;background:#16a34a;color:#fff;border:none;border-radius:9px;font-size:.83rem;font-weight:600;font-family:inherit;cursor:pointer;transition:all .2s}
.btn-success:hover:not(:disabled){background:#15803d}
.btn-success:disabled{opacity:.6;cursor:not-allowed}
.btn-clear{padding:7px 14px;border:1.5px dashed var(--border);border-radius:9px;font-size:.78rem;font-family:inherit;color:var(--text-muted);background:transparent;cursor:pointer;transition:all .18s;white-space:nowrap}
.btn-clear:hover{border-color:#ef4444;color:#ef4444;background:#fef2f2}
.btn-retry{margin-left:8px;padding:4px 12px;border:1px solid currentColor;border-radius:6px;background:transparent;color:inherit;font-size:.75rem;cursor:pointer;font-family:inherit}
.btn-add-custom{padding:8px 14px;background:var(--bg-hover);border:1.5px solid var(--border);border-radius:8px;font-size:.78rem;font-family:inherit;color:var(--text-secondary);cursor:pointer;transition:all .15s;white-space:nowrap}
.btn-add-custom:hover:not(:disabled){border-color:#6366f1;color:#6366f1;background:#eef2ff}
.btn-add-custom:disabled{opacity:.4;cursor:not-allowed}
.btn-spin{display:inline-flex;align-items:center;gap:6px}

/* Filtros */
.filters-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.search-wrap{position:relative;flex:1;min-width:200px}
.search-ico{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--text-muted);pointer-events:none}
.search-inp{width:100%;padding:9px 34px;border:1.5px solid var(--border);border-radius:9px;font-size:.85rem;font-family:inherit;color:var(--text-primary);background:var(--bg-card);outline:none;transition:all .2s}
.search-inp:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.1)}
.search-inp::placeholder{color:var(--text-muted)}
.search-x{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--text-muted);cursor:pointer;display:flex;align-items:center;padding:2px;border-radius:4px}
.search-x:hover{color:#ef4444}
.sel{padding:9px 12px;border:1.5px solid var(--border);border-radius:9px;font-size:.83rem;font-family:inherit;color:var(--text-primary);background:var(--bg-card);outline:none;cursor:pointer;transition:all .2s}
.sel:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.1)}

/* Loading / Error */
.state-center{display:flex;align-items:center;justify-content:center;gap:10px;padding:48px;background:var(--bg-card);border:1px solid var(--border);border-radius:14px;color:var(--text-muted);font-size:.9rem}
.state-center.err{color:#ef4444;background:#fef2f2;border-color:#fecaca}
.spin{animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* Tabla */
.table-card{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)}
.htable{width:100%;border-collapse:collapse;font-size:.83rem}
thead tr{background:var(--bg-app);border-bottom:1px solid var(--border)}
th{padding:11px 14px;text-align:left;font-size:.69rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.055em;white-space:nowrap}
.th-num{width:40px}
.th-acc{width:100px}
tbody tr{border-bottom:1px solid var(--border);transition:background .13s}
tbody tr:last-child{border-bottom:none}
tbody tr:hover{background:var(--bg-hover)}
tbody tr.tr-inactive{opacity:.5}
td{padding:11px 14px;vertical-align:middle;color:var(--text-primary)}
.td-id{color:var(--text-muted);font-size:.78rem}
.td-sec{color:var(--text-muted);font-size:.8rem;white-space:nowrap}
.td-empty{color:var(--text-muted);font-size:.82rem}
.td-price-base{color:var(--text-muted);font-size:.82rem}

/* Celda hab */
.hab-cell{display:flex;align-items:center;gap:9px}
.hab-badge{min-width:38px;height:28px;border-radius:7px;color:#fff;font-size:.7rem;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 6px;white-space:nowrap}
.hab-badge.disponible{background:linear-gradient(135deg,#16a34a,#4ade80)}
.hab-badge.ocupada{background:linear-gradient(135deg,#dc2626,#f87171)}
.hab-badge.reservada{background:linear-gradient(135deg,#2563eb,#60a5fa)}
.hab-badge.mantenimiento{background:linear-gradient(135deg,#d97706,#fbbf24)}
.hab-badge.inactive{opacity:.4}
.hab-info{display:flex;flex-direction:column;gap:1px}
.hab-num{font-size:.8rem;font-weight:600}
.hab-desc{font-size:.7rem;color:var(--text-muted);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* Chips */
.chip-tipo{font-size:.7rem;font-weight:500;padding:3px 9px;border-radius:99px;background:#eef2ff;color:#6366f1;border:1px solid #c7d2fe;white-space:nowrap}
.chip-amen{font-size:.67rem;padding:2px 7px;border-radius:99px;background:var(--bg-app);color:var(--text-secondary);border:1px solid var(--border);white-space:nowrap}
.chip-amen.more{cursor:default}
.amenidades-wrap{display:flex;flex-wrap:wrap;gap:3px}

/* Ubicación */
.ubicacion-cell{display:flex;flex-wrap:wrap;gap:3px}
.chip-ubicacion{font-size:.67rem;padding:2px 7px;border-radius:99px;white-space:nowrap;display:flex;align-items:center;gap:3px}
.chip-ubicacion.vista{background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe}
.chip-ubicacion.cercania{background:#faf5ff;color:#7c3aed;border:1px solid #ddd6fe}

/* Precio final */
.precio-final-cell{display:flex;align-items:center;gap:5px}
.precio-final{font-weight:700;font-size:.85rem;color:var(--text-primary)}
.precio-delta{font-size:.68rem;background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;border-radius:99px;padding:1px 6px;font-weight:600}

/* Estado/activo chips */
.estado-chip,.activo-chip{display:inline-flex;align-items:center;gap:4px;font-size:.7rem;font-weight:500;padding:3px 9px;border-radius:99px}
.estado-chip.disponible{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
.estado-chip.ocupada{background:#fef2f2;color:#ef4444;border:1px solid #fecaca}
.estado-chip.reservada{background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe}
.estado-chip.mantenimiento{background:#fffbeb;color:#d97706;border:1px solid #fde68a}
.activo-chip.si{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
.activo-chip.no{background:#fef2f2;color:#ef4444;border:1px solid #fecaca}
.edot{width:5px;height:5px;border-radius:50%;background:currentColor}

/* Acciones */
.acc-row{display:flex;gap:5px}
.abtn{width:28px;height:28px;border-radius:7px;border:1.5px solid var(--border);background:var(--bg-card);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .16s;color:var(--text-muted)}
.abtn:disabled{opacity:.3;cursor:not-allowed}
.abtn.edit:hover:not(:disabled){background:#eef2ff;border-color:#c7d2fe;color:#6366f1}
.abtn.estado:hover:not(:disabled){background:#fffbeb;border-color:#fde68a;color:#d97706}
.abtn.deact:hover:not(:disabled){background:#fef2f2;border-color:#fecaca;color:#ef4444}
.abtn.act:hover:not(:disabled){background:#f0fdf4;border-color:#bbf7d0;color:#16a34a}

/* Empty state */
.empty-td{text-align:center;padding:48px}
.empty-box{display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--text-muted)}
.empty-box p{font-size:.9rem;margin:0}
.empty-box span{font-size:.78rem;font-weight:300}
.empty-sm{text-align:center;padding:14px;color:var(--text-muted);font-size:.83rem;font-style:italic}

/* ════════════════════════════════════════
   OVERLAYS Y MODALES
═══════════════════════════════════════ */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px}
.modal-xl{background:var(--bg-card);border:1px solid var(--border);border-radius:18px;width:100%;max-width:900px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 24px 70px rgba(0,0,0,.4);overflow:hidden}
.modal-sm{background:var(--bg-card);border:1px solid var(--border);border-radius:16px;width:100%;max-width:460px;box-shadow:0 20px 60px rgba(0,0,0,.35);overflow:hidden}

/* Modal header */
.mxl-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;border-bottom:1px solid var(--border);flex-shrink:0}
.mxl-header-left{display:flex;align-items:center;gap:12px}
.mxl-icon{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#818cf8);display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0}
.mxl-title{font-size:1rem;font-weight:700;color:var(--text-primary);margin:0}
.mxl-sub{font-size:.75rem;color:var(--text-muted);margin:2px 0 0;font-weight:300}
.mxl-close{width:28px;height:28px;border-radius:7px;border:1.5px solid var(--border);background:var(--bg-card);color:var(--text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .18s;flex-shrink:0}
.mxl-close:hover{background:#fef2f2;border-color:#fecaca;color:#ef4444}

/* Modal body 2-col */
.mxl-body{display:grid;grid-template-columns:1fr 1fr;gap:0;overflow-y:auto;flex:1}
.mxl-col{padding:20px 24px;display:flex;flex-direction:column;gap:18px}
.mxl-left{border-right:1px solid var(--border)}

/* Secciones del modal */
.mxl-section{display:flex;flex-direction:column;gap:12px}
.mxl-section-title{display:flex;align-items:center;gap:8px;font-size:.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.065em;margin-bottom:2px}
.msnum{width:18px;height:18px;border-radius:50%;background:var(--bg-hover);color:var(--text-muted);border:1px solid var(--border);font-size:.65rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ms-badge-info{font-size:.65rem;background:#eef2ff;color:#6366f1;border:1px solid #c7d2fe;border-radius:99px;padding:1px 7px;text-transform:none;letter-spacing:0;font-weight:500}

/* Grid de campos */
.mxl-fields-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ff{display:flex;flex-direction:column;gap:4px}
.ff-full{grid-column:1/-1}
.fl{font-size:.75rem;font-weight:500;color:var(--text-secondary);display:flex;align-items:center;gap:5px}
.fl-opt{font-size:.68rem;font-weight:300;color:var(--text-muted)}
.fl-count{font-size:.67rem;color:var(--text-muted);text-align:right;margin-top:2px}
.fi{padding:8px 11px;border:1.5px solid var(--border);border-radius:8px;font-size:.85rem;font-family:inherit;color:var(--text-primary);background:var(--bg-app);outline:none;transition:all .18s;width:100%}
.fi:focus{border-color:#6366f1;background:var(--bg-card);box-shadow:0 0 0 3px rgba(99,102,241,.1)}
.fi::placeholder{color:var(--text-muted)}
.fi.ferr{border-color:#ef4444}
.fi.ferr:focus{box-shadow:0 0 0 3px rgba(239,68,68,.1)}
.ferr-msg{font-size:.7rem;color:#ef4444}

/* Counter capacidad */
.counter-row{display:flex;align-items:center;gap:10px;padding:7px 11px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-app)}
.cnt-btn{width:26px;height:26px;border-radius:6px;border:1.5px solid var(--border);background:var(--bg-card);color:var(--text-primary);cursor:pointer;font-size:1rem;line-height:1;display:flex;align-items:center;justify-content:center;transition:all .15s;font-family:inherit}
.cnt-btn:hover{border-color:#6366f1;color:#6366f1;background:#eef2ff}
.cnt-val{font-size:.85rem;font-weight:500;color:var(--text-primary);min-width:60px;text-align:center}

/* Preview imagen */
.img-prev-wrap{margin-top:6px}
.img-prev{height:72px;border-radius:8px;border:1px solid var(--border);object-fit:cover}

/* Amenidades checklist */
.amenidades-checklist{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}
.amen-check-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1.5px solid var(--border);border-radius:9px;cursor:pointer;transition:all .15s;background:var(--bg-app);user-select:none}
.amen-check-item:hover{border-color:#a5b4fc;background:var(--bg-hover)}
.amen-check-item.checked{border-color:#6366f1;background:#eef2ff}
.amen-checkbox{display:none}
.amen-icon{font-size:1.05rem;flex-shrink:0;width:20px;text-align:center}
.amen-label{font-size:.78rem;font-weight:500;color:var(--text-secondary);flex:1}
.amen-check-item.checked .amen-label{color:#4f46e5}
.amen-tick{width:16px;height:16px;border-radius:50%;border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;color:transparent}
.amen-check-item.checked .amen-tick{background:#6366f1;border-color:#6366f1;color:#fff}

/* Amenidad personalizada */
.amen-custom-row{display:flex;gap:8px;margin-top:4px}
.amen-custom-inp{flex:1}
.amen-custom-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}
.custom-tag{display:inline-flex;align-items:center;gap:4px;font-size:.75rem;padding:3px 8px 3px 10px;border-radius:99px;background:var(--bg-hover);color:var(--text-secondary);border:1px solid var(--border)}
.ctag-x{background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.9rem;padding:0;display:flex;align-items:center;line-height:1}
.ctag-x:hover{color:#ef4444}

/* Vistas */
.vista-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.vista-btn{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px;border:1.5px solid var(--border);border-radius:10px;background:var(--bg-app);cursor:pointer;transition:all .15s;font-family:inherit;position:relative}
.vista-btn:hover{border-color:#a5b4fc;background:var(--bg-hover)}
.vista-btn.selected{border-color:#6366f1;background:#eef2ff;box-shadow:0 0 0 3px rgba(99,102,241,.1)}
.vista-icon{font-size:1.4rem;line-height:1}
.vista-label{font-size:.72rem;font-weight:500;color:var(--text-secondary);text-align:center;line-height:1.2}
.vista-btn.selected .vista-label{color:#4f46e5}
.vista-mod{position:absolute;top:4px;right:5px;font-size:.6rem;font-weight:700;background:#16a34a;color:#fff;border-radius:99px;padding:1px 5px}

/* Cercanías */
.cercanias-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}
.cerc-check{display:flex;align-items:center;gap:9px;padding:9px 11px;border:1.5px solid var(--border);border-radius:9px;cursor:pointer;transition:all .15s;background:var(--bg-app);user-select:none}
.cerc-check:hover{border-color:#a5b4fc;background:var(--bg-hover)}
.cerc-check.checked{border-color:#7c3aed;background:#faf5ff}
.cerc-icon{font-size:1.1rem;flex-shrink:0;width:22px;text-align:center}
.cerc-info{display:flex;flex-direction:column;gap:1px;flex:1}
.cerc-label{font-size:.78rem;font-weight:500;color:var(--text-secondary)}
.cerc-check.checked .cerc-label{color:#6d28d9}
.cerc-mod{font-size:.68rem;color:var(--text-muted)}
.cerc-check.checked .cerc-mod{color:#7c3aed}
.cerc-check.checked .amen-tick{background:#7c3aed;border-color:#7c3aed;color:#fff}

/* Calculadora de precio */
.precio-card{background:linear-gradient(135deg,#f8faff,#f0f5ff);border:1px solid #c7d2fe;border-radius:12px;padding:14px}
.precio-calc{display:flex;flex-direction:column;gap:7px}
.pc-row{display:flex;align-items:center;justify-content:space-between;font-size:.82rem}
.pc-label{color:var(--text-secondary);flex:1}
.pc-val{font-weight:600;color:var(--text-primary)}
.pc-val.green{color:#16a34a}
.pc-mod .pc-label{color:var(--text-muted);font-size:.78rem}
.pc-divider{border:none;border-top:1.5px dashed #c7d2fe;margin:4px 0}
.pc-row.pc-total{padding-top:2px}
.pc-label-total{font-size:.85rem;font-weight:600;color:#4f46e5}
.pc-final{font-size:1.2rem;font-weight:700;color:#4f46e5}
.pc-ahorro{font-size:.72rem;color:#6366f1;background:#eef2ff;border:1px solid #c7d2fe;border-radius:7px;padding:5px 10px;text-align:center}
.pc-cap-warn{display:flex;align-items:center;gap:6px;font-size:.72rem;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:5px 9px}

.precio-placeholder{border:1.5px dashed var(--border);border-radius:12px;padding:14px}
.pp-empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 0;color:var(--text-muted)}
.pp-empty p{font-size:.8rem;text-align:center;margin:0;line-height:1.5}

/* Modal footer */
.mxl-footer{display:flex;align-items:center;justify-content:space-between;padding:14px 24px 18px;border-top:1px solid var(--border);flex-shrink:0;gap:12px}
.mxl-footer-btns{display:flex;gap:10px;align-items:center;margin-left:auto}
.f-err{display:flex;align-items:center;gap:6px;font-size:.78rem;color:#ef4444;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:7px 11px;flex:1}

/* Modal estado */
.adv-warn{display:flex;align-items:flex-start;gap:7px;padding:9px 11px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:.77rem;color:#92400e;line-height:1.5;margin-bottom:2px}
.estados-grid{display:flex;flex-direction:column;gap:7px;padding:4px 0}
.estado-opt{width:100%;padding:11px 13px;border:1.5px solid var(--border);border-radius:9px;background:var(--bg-app);cursor:pointer;text-align:left;font-family:inherit;transition:all .15s;display:flex;align-items:center;gap:10px}
.estado-opt:hover{border-color:#6366f1;background:var(--bg-hover)}
.estado-opt.sel{border-color:#6366f1;background:#eef2ff;box-shadow:0 0 0 3px rgba(99,102,241,.1)}
.estado-opt.current{border-style:dashed}
.edot-lg{width:11px;height:11px;border-radius:50%;flex-shrink:0}
.edot-lg.disponible{background:#16a34a}
.edot-lg.ocupada{background:#ef4444}
.edot-lg.reservada{background:#2563eb}
.edot-lg.mantenimiento{background:#d97706}
.eopt-info{flex:1}
.eopt-label{display:block;font-size:.83rem;font-weight:500;color:var(--text-primary)}
.eopt-curr{margin-left:5px;font-size:.67rem;background:var(--bg-hover);color:var(--text-muted);border:1px solid var(--border);border-radius:99px;padding:1px 6px;font-weight:400}
.eopt-desc{display:block;font-size:.7rem;color:var(--text-muted);margin-top:1px}

/* Confirm */
.confirm-msg{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:9px;font-size:.83rem;line-height:1.55}
.confirm-msg.warn{background:#fffbeb;color:#92400e;border:1px solid #fde68a}
.confirm-msg.ok{background:#f0fdf4;color:#14532d;border:1px solid #bbf7d0}

/* Modal tipos */
.tipo-form-box{background:var(--bg-app);border:1px solid var(--border);border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:10px}
.tipo-form-lbl{font-size:.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin:0}
.tipo-form-btns{display:flex;justify-content:flex-end;gap:8px}
.tipos-lista{display:flex;flex-direction:column;gap:7px;margin-top:4px}
.tipo-row{display:flex;align-items:center;justify-content:space-between;padding:9px 13px;background:var(--bg-app);border:1px solid var(--border);border-radius:9px;transition:border-color .15s}
.tipo-row.tipo-editing{border-color:#6366f1;background:#eef2ff}
.tipo-row-info{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.tipo-nombre{font-size:.83rem;font-weight:500;color:var(--text-primary)}
.tipo-precio{font-size:.77rem;color:var(--accent);font-weight:500}
.tipo-cnt{font-size:.7rem;color:var(--text-muted);background:var(--bg-hover);border:1px solid var(--border);border-radius:99px;padding:1px 7px}
.tipo-row-btns{display:flex;gap:6px}

/* Transitions */
.modal-enter-active,.modal-leave-active{transition:opacity .2s ease}
.modal-enter-active .modal-xl,.modal-leave-active .modal-xl,
.modal-enter-active .modal-sm,.modal-leave-active .modal-sm{transition:transform .2s ease}
.modal-enter-from,.modal-leave-to{opacity:0}
.modal-enter-from .modal-xl,.modal-leave-to .modal-xl,
.modal-enter-from .modal-sm,.modal-leave-to .modal-sm{transform:scale(.96) translateY(10px)}

/* Responsive */
@media(max-width:720px){
  .mxl-body{grid-template-columns:1fr}
  .mxl-left{border-right:none;border-bottom:1px solid var(--border)}
  .vista-grid{grid-template-columns:repeat(2,1fr)}
  .amenidades-checklist{grid-template-columns:1fr}
}
</style>
