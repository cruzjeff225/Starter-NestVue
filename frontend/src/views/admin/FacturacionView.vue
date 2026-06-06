<template>
  <div class="page">

    <!-- ── Header ── -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Facturación</h1>
        <p class="page-subtitle">Emisión y gestión de documentos tributarios</p>
      </div>
      <div class="header-actions">
        <div class="stat-chips">
          <span class="stat-chip total">{{ paginacion.total }} facturas</span>
          <span class="stat-chip emitida">{{ statsEmitidas }} emitidas</span>
          <span class="stat-chip anulada">{{ statsAnuladas }} anuladas</span>
        </div>
        <button v-if="auth.tienePermiso('facturacion:crear')" type="button" class="btn-primary" @click="abrirModal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva factura
        </button>
      </div>
    </div>

    <!-- ── Filtros ── -->
    <div class="filters-bar">
      <div class="search-wrap">
        <svg class="search-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="filtros.search" class="search-input" placeholder="N° factura, cliente, email..." @input="debouncedCargar" />
      </div>
      <select v-model="filtros.tipo" class="filt-sel" @change="cargar(1)">
        <option value="">Todos los tipos</option>
        <option value="consumidor_final">Consumidor Final</option>
        <option value="credito_fiscal">Crédito Fiscal</option>
      </select>
      <select v-model="filtros.estado" class="filt-sel" @change="cargar(1)">
        <option value="">Todos los estados</option>
        <option value="emitida">Emitidas</option>
        <option value="anulada">Anuladas</option>
      </select>
      <select v-model="filtros.limit" class="filt-sel filt-sm" @change="cargar(1)">
        <option :value="10">10/pág</option>
        <option :value="20">20/pág</option>
        <option :value="50">50/pág</option>
      </select>
    </div>

    <!-- ── Loading / Error ── -->
    <div v-if="loading" class="state-box">
      <svg class="spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      Cargando facturas...
    </div>
    <div v-else-if="errorGlobal" class="state-box err-box">⚠ {{ errorGlobal }}</div>

    <!-- ── Tabla ── -->
    <div v-else class="card-table">
      <table class="table">
        <thead>
          <tr>
            <th>Número</th>
            <th>Tipo</th>
            <th>Cliente</th>
            <th>Reservación</th>
            <th>Fecha</th>
            <th class="tr">Subtotal</th>
            <th class="tr">IVA</th>
            <th class="tr">Turismo</th>
            <th class="tr">Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in facturas" :key="f.idFactura" :class="{ anulada: f.estado === 'anulada' }">
            <td class="td-num">{{ f.numeroFactura }}</td>
            <td>
              <span class="tipo-pill" :class="f.tipo">
                {{ f.tipo === 'consumidor_final' ? 'C. Final' : 'Créd. Fiscal' }}
              </span>
            </td>
            <td>
              <div class="user-cell">
                <div class="u-avatar">{{ f.clienteNombre.charAt(0) }}</div>
                <div>
                  <div class="cell-name">{{ f.clienteNombre }}</div>
                  <div class="cell-sub">{{ f.clienteEmail }}</div>
                </div>
              </div>
            </td>
            <td>
              <span v-if="f.reservacion" class="res-link">#{{ f.reservacion.idReservacion }} · Hab. {{ f.reservacion.habitacion.numero }}</span>
              <span v-else class="cell-sub">Manual</span>
            </td>
            <td class="td-date">{{ formatFecha(f.fechaEmision) }}</td>
            <td class="td-money">${{ fmt(f.subtotalConDesc) }}</td>
            <td class="td-money td-muted">${{ fmt(f.iva) }}</td>
            <td class="td-money td-muted">${{ fmt(f.turismo) }}</td>
            <td class="td-money td-total">${{ fmt(f.total) }}</td>
            <td>
              <span class="estado-pill" :class="f.estado">
                <span class="dot"></span>{{ f.estado === 'emitida' ? 'Emitida' : 'Anulada' }}
              </span>
            </td>
            <td>
              <div class="action-row">
                <button type="button" class="act-btn view" title="Ver detalle" @click="abrirDetalle(f)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </button>
                <button v-if="auth.tienePermiso('facturacion:anular') && f.estado === 'emitida'" type="button" class="act-btn danger" title="Anular" @click="abrirModalAnular(f)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="facturas.length === 0">
            <td colspan="11" class="empty">No se encontraron facturas</td>
          </tr>
        </tbody>
      </table>

      <!-- Paginación -->
      <div v-if="paginacion.totalPages > 1" class="pagination">
        <button type="button" class="pag-btn" :disabled="paginacion.page === 1" @click="cargar(paginacion.page - 1)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="pag-info">Página {{ paginacion.page }} de {{ paginacion.totalPages }}</span>
        <button type="button" class="pag-btn" :disabled="paginacion.page === paginacion.totalPages" @click="cargar(paginacion.page + 1)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         MODAL NUEVA FACTURA
    ══════════════════════════════════════════════ -->
    <Transition name="modal">
      <div v-if="modalAbierto" class="overlay" @click.self="cerrarModal">
        <div class="modal modal-xl">
          <div class="modal-head">
            <h2 class="modal-title">Nueva factura</h2>
            <button type="button" class="close-btn" @click="cerrarModal">✕</button>
          </div>

          <div class="modal-body">

            <!-- Tipo de documento -->
            <div class="section-label">Tipo de documento</div>
            <div class="tipo-selector">
              <button type="button" class="tipo-opt" :class="{ sel: form.tipo === 'consumidor_final' }" @click="form.tipo = 'consumidor_final'">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span class="tipo-opt-name">Consumidor Final</span>
                <span class="tipo-opt-sub">Sin desglose de IVA</span>
              </button>
              <button type="button" class="tipo-opt" :class="{ sel: form.tipo === 'credito_fiscal' }" @click="form.tipo = 'credito_fiscal'">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                <span class="tipo-opt-name">Crédito Fiscal</span>
                <span class="tipo-opt-sub">IVA desglosado · requiere NIT</span>
              </button>
            </div>

            <!-- Origen -->
            <div class="section-label">Origen</div>
            <div class="origen-btns">
              <button type="button" class="origen-btn" :class="{ sel: origen === 'reservacion' }" @click="setOrigen('reservacion')">📅 Desde reservación</button>
              <button type="button" class="origen-btn" :class="{ sel: origen === 'manual' }" @click="setOrigen('manual')">✏️ Manual</button>
            </div>

            <!-- Buscar reservación -->
            <div v-if="origen === 'reservacion'" class="field">
              <label class="lbl">Reservación completada *</label>
              <div class="search-res-wrap">
                <svg class="search-ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input v-model="resSearch" class="inp" style="padding-left:32px" placeholder="Buscar por cliente o número de habitación..." @input="buscarReservaciones" />
              </div>
              <div v-if="resSugerencias.length" class="res-dropdown">
                <button v-for="r in resSugerencias" :key="r.idReservacion" type="button" class="res-opt" @click="seleccionarReservacion(r)">
                  <span class="res-opt-num">#{{ r.idReservacion }}</span>
                  <div class="res-opt-info">
                    <span class="res-opt-name">{{ r.cliente.nombre }} {{ r.cliente.apellido }}</span>
                    <span class="res-opt-sub">Hab. {{ r.habitacion.numero }} · {{ formatFecha(r.fechaEntrada) }} → {{ formatFecha(r.fechaSalida) }}</span>
                  </div>
                  <span v-if="r.factura" class="res-ya-facturada">✓ Ya facturada</span>
                </button>
              </div>
              <div v-if="resBuscando" class="res-loading">
                <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Buscando...
              </div>
              <!-- Reservación seleccionada -->
              <div v-if="resSeleccionada" class="res-selected">
                <div class="res-sel-header">
                  <span class="res-sel-num">#{{ resSeleccionada.idReservacion }}</span>
                  <span v-if="resSeleccionada.factura" class="warn-ya-facturada">⚠ Esta reservación ya tiene factura {{ resSeleccionada.factura.numeroFactura }}</span>
                </div>
                <div class="res-sel-info">
                  <span>{{ resSeleccionada.cliente.nombre }} {{ resSeleccionada.cliente.apellido }}</span>
                  <span>Hab. {{ resSeleccionada.habitacion.numero }} — {{ resSeleccionada.habitacion.tipo.nombre }}</span>
                  <span>{{ formatFecha(resSeleccionada.fechaEntrada) }} → {{ formatFecha(resSeleccionada.fechaSalida) }}</span>
                </div>
                <button type="button" class="res-clear" @click="limpiarReservacion">× Cambiar</button>
              </div>
              <span v-if="errors.reservacionId" class="field-err">{{ errors.reservacionId }}</span>
            </div>

            <!-- Cliente -->
            <div class="section-label">Cliente</div>
            <div class="field">
              <label class="lbl">Buscar cliente *</label>
              <div class="search-res-wrap">
                <svg class="search-ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input v-model="clienteSearch" class="inp" style="padding-left:32px" :disabled="origen === 'reservacion' && !!form.reservacionId" placeholder="Nombre, email..." @input="buscarClientes" />
              </div>
              <div v-if="clienteSugerencias.length && !form.clienteId" class="res-dropdown">
                <button v-for="c in clienteSugerencias" :key="c.idCliente" type="button" class="res-opt" @click="seleccionarCliente(c)">
                  <div class="u-avatar sm">{{ c.nombre.charAt(0) }}</div>
                  <div class="res-opt-info">
                    <span class="res-opt-name">{{ c.nombre }} {{ c.apellido }}</span>
                    <span class="res-opt-sub">{{ c.email }}</span>
                  </div>
                </button>
              </div>
              <div v-if="clienteSeleccionado" class="cliente-chip">
                <div class="u-avatar sm">{{ clienteSeleccionado.nombre.charAt(0) }}</div>
                <span class="cc-name">{{ clienteSeleccionado.nombre }} {{ clienteSeleccionado.apellido }}</span>
                <span class="cc-email">{{ clienteSeleccionado.email }}</span>
                <button v-if="!(origen === 'reservacion' && form.reservacionId)" type="button" class="res-clear" @click="limpiarCliente">×</button>
              </div>
              <span v-if="errors.clienteId" class="field-err">{{ errors.clienteId }}</span>
            </div>

            <div v-if="origen === 'reservacion' && clienteSeleccionado && !form.reservacionId" class="field">
              <label class="lbl">Reservaciones completadas del cliente</label>
              <div v-if="resBuscando" class="res-loading">
                <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Cargando reservaciones...
              </div>
              <div v-else-if="resSugerencias.length" class="res-dropdown">
                <button v-for="r in resSugerencias" :key="r.idReservacion" type="button" class="res-opt" @click="seleccionarReservacion(r)">
                  <span class="res-opt-num">#{{ r.idReservacion }}</span>
                  <div class="res-opt-info">
                    <span class="res-opt-name">Habitacion {{ r.habitacion.numero }}</span>
                    <span class="res-opt-sub">{{ formatFecha(r.fechaEntrada) }} -> {{ formatFecha(r.fechaSalida) }} - ${{ fmt(r.totalCalculado) }}</span>
                  </div>
                </button>
              </div>
              <div v-else class="res-empty">Este cliente no tiene reservaciones completadas pendientes para facturar.</div>
            </div>

            <!-- Datos fiscales -->
            <template v-if="form.tipo === 'credito_fiscal'">
              <div class="section-label">Datos fiscales</div>
              <div class="form-grid">
                <div class="field">
                  <label class="lbl">NIT *</label>
                  <input v-model="form.clienteNit" class="inp" :class="{ 'inp-err': errors.clienteNit }" placeholder="0000-000000-000-0" />
                  <span v-if="errors.clienteNit" class="field-err">{{ errors.clienteNit }}</span>
                </div>
                <div class="field">
                  <label class="lbl">NRC</label>
                  <input v-model="form.clienteNrc" class="inp" placeholder="000000-0" />
                </div>
                <div class="field">
                  <label class="lbl">Giro / Actividad</label>
                  <input v-model="form.clienteGiro" class="inp" placeholder="Ej: Comercio" />
                </div>
                <div class="field">
                  <label class="lbl">Dirección fiscal</label>
                  <input v-model="form.clienteDireccion" class="inp" placeholder="Dirección" />
                </div>
              </div>
            </template>

            <!-- Ítems -->
            <div class="items-header">
              <div class="items-title">
                <div class="section-label" style="margin:0">Ítems de factura</div>
                <span class="items-count">{{ form.items.length }} {{ form.items.length === 1 ? 'ítem' : 'ítems' }}</span>
              </div>
              <button type="button" class="btn-add-item" @click.prevent="agregarItem">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Agregar ítem
              </button>
            </div>
            <span v-if="errors.items" class="field-err">{{ errors.items }}</span>
            <div class="items-list">
              <div v-for="(item, i) in form.items" :key="item.uid" class="item-row-card">
                <div class="item-row-top">
                  <span class="item-index">Ítem {{ i + 1 }}</span>
                  <button type="button" class="item-del-text" :disabled="form.items.length === 1" @click="quitarItem(i)">
                    Quitar
                  </button>
                </div>

                <div class="item-fields">
                  <div class="item-field item-desc-field">
                    <label class="item-label">Descripción *</label>
                    <input
                      :ref="(el) => setItemDescripcionRef(item.uid, el)"
                      v-model="item.descripcion"
                      class="item-inp"
                      :class="{ 'item-inp-err': !String(item.descripcion ?? '').trim() && errors.items }"
                      placeholder="Ej: Estadía habitación 101, consumo restaurante..."
                    />
                  </div>

                  <div class="item-field item-qty-field">
                    <label class="item-label">Cantidad *</label>
                    <input
                      v-model.number="item.cantidad"
                      type="number"
                      min="1"
                      class="item-inp item-num"
                      :class="{ 'item-inp-err': Number(item.cantidad || 0) < 1 && errors.items }"
                    />
                  </div>

                  <div class="item-field item-price-field">
                    <label class="item-label">Precio unitario *</label>
                    <div class="item-precio-wrap">
                      <span class="item-dollar">$</span>
                      <input
                        v-model.number="item.precioUnit"
                        type="number"
                        min="0"
                        step="0.01"
                        class="item-inp item-num item-price-input"
                        :class="{ 'item-inp-err': Number(item.precioUnit ?? -1) < 0 && errors.items }"
                      />
                    </div>
                  </div>

                  <div class="item-field item-sub-field">
                    <label class="item-label">Subtotal</label>
                    <div class="item-sub-box">${{ fmt(toNumber(item.cantidad) * toNumber(item.precioUnit)) }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Resumen fiscal -->
            <div class="resumen">
              <div class="resumen-row"><span>Subtotal</span><span>${{ fmt(totales.subtotal) }}</span></div>
              <div v-if="form.tipo === 'credito_fiscal'" class="resumen-row muted"><span>IVA (13%)</span><span>${{ fmt(totales.iva) }}</span></div>
              <div v-else class="resumen-row muted"><span>IVA incluido (13%)</span><span>${{ fmt(totales.ivaIncluido) }}</span></div>
              <div class="resumen-row muted"><span>Contrib. Turismo (5%)</span><span>${{ fmt(totales.turismo) }}</span></div>
              <div class="resumen-row total"><span>TOTAL A PAGAR</span><span>${{ fmt(totales.total) }}</span></div>
            </div>

            <!-- Notas -->
            <div class="field">
              <label class="lbl">Notas / Observaciones</label>
              <input v-model="form.notas" class="inp" placeholder="Opcional" />
            </div>

            <div v-if="formError" class="alert-err">⚠ {{ formError }}</div>
          </div>

          <div class="modal-foot">
            <button type="button" class="btn-ghost" @click="cerrarModal">Cancelar</button>
            <button type="button" class="btn-primary" :disabled="guardando" @click="guardar">
              <svg v-if="guardando" class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              {{ guardando ? 'Emitiendo...' : 'Emitir factura' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ══════════════════════════════════════════════
         MODAL ANULAR
    ══════════════════════════════════════════════ -->
    <Transition name="modal">
      <div v-if="modalAnular" class="overlay" @click.self="cerrarModalAnular">
        <div class="modal">
          <div class="modal-head">
            <div>
              <h2 class="modal-title">Anular factura</h2>
              <p class="modal-sub">{{ facturaAnular?.numeroFactura }}</p>
            </div>
            <button type="button" class="close-btn" @click="cerrarModalAnular">✕</button>
          </div>
          <div class="modal-body">
            <div class="warn-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Esta acción no se puede deshacer. La factura quedará anulada permanentemente.
            </div>
            <div class="field">
              <label class="lbl">Motivo de anulación *</label>
              <input v-model="motivoAnulacion" class="inp" :class="{ 'inp-err': !motivoAnulacion.trim() && anularIntentado }" placeholder="Ingresa el motivo..." />
            </div>
            <div v-if="anularError" class="alert-err">{{ anularError }}</div>
          </div>
          <div class="modal-foot">
            <button type="button" class="btn-ghost" @click="cerrarModalAnular">Cancelar</button>
            <button type="button" class="btn-danger" :disabled="anularLoading || !motivoAnulacion.trim()" @click="confirmarAnulacion">
              <svg v-if="anularLoading" class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              {{ anularLoading ? 'Anulando...' : 'Anular factura' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ══════════════════════════════════════════════
         MODAL DETALLE / PDF
    ══════════════════════════════════════════════ -->
    <Transition name="modal">
      <div v-if="modalDetalle" class="overlay" @click.self="cerrarDetalle">
        <div class="modal modal-pdf">
          <div class="modal-head">
            <div>
              <h2 class="modal-title">{{ detalleFactura?.numeroFactura }}</h2>
              <p class="modal-sub">{{ detalleFactura?.tipo === 'consumidor_final' ? 'Consumidor Final' : 'Crédito Fiscal' }} · {{ formatFecha(detalleFactura?.fechaEmision) }}</p>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
              <button type="button" class="btn-primary" :disabled="generandoPDF" @click="descargarPDF">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {{ generandoPDF ? 'Generando...' : 'PDF' }}
              </button>
              <button type="button" class="close-btn" @click="cerrarDetalle">✕</button>
            </div>
          </div>
          <div class="modal-body">
            <div id="factura-pdf-content" class="dte-doc">

              <div class="dte-titulo">
                <p>DOCUMENTO DE CONSULTA PORTAL OPERATIVO</p>
                <p>DOCUMENTO TRIBUTARIO ELECTRÓNICO</p>
                <p class="dte-tipo-doc">{{ detalleFactura?.tipo === 'consumidor_final' ? 'FACTURA' : 'COMPROBANTE DE CRÉDITO FISCAL' }}</p>
                <div v-if="detalleFactura?.estado === 'anulada'" class="dte-anulada">★ DOCUMENTO ANULADO ★</div>
              </div>

              <div class="dte-enc">
                <div class="dte-enc-col">
                  <div class="dte-enc-row"><span class="dte-el">Código de generación:</span><span class="dte-ev">{{ codigoGeneracion(detalleFactura) }}</span></div>
                  <div class="dte-enc-row"><span class="dte-el">Número de control:</span><span class="dte-ev">{{ numeroControl(detalleFactura) }}</span></div>
                  <div class="dte-enc-row"><span class="dte-el">Sello de recepción:</span><span class="dte-ev">{{ selloRecepcion(detalleFactura) }}</span></div>
                </div>
                <div class="dte-enc-col right">
                  <div class="dte-enc-row"><span class="dte-el">Modelo:</span><span class="dte-ev">Facturación previo</span></div>
                  <div class="dte-enc-row"><span class="dte-el">Transmisión:</span><span class="dte-ev">Normal</span></div>
                  <div class="dte-enc-row"><span class="dte-el">Fecha/hora:</span><span class="dte-ev">{{ formatFechaHora(detalleFactura?.fechaEmision) }}</span></div>
                </div>
              </div>

              <div class="dte-partes">
                <div class="dte-parte">
                  <div class="dte-parte-tit">EMISOR</div>
                  <p class="dte-parte-nombre">HOTEL DEL SISTEMA, S.A. DE C.V.</p>
                  <p class="dte-parte-dir">CASA MATRIZ — SAN SALVADOR</p>
                  <div class="dte-fila"><span class="dte-el">NIT</span><span class="dte-ev">0000-000000-000-0</span></div>
                  <div class="dte-fila"><span class="dte-el">NRC</span><span class="dte-ev">000000-0</span></div>
                  <div class="dte-fila"><span class="dte-el">Actividad</span><span class="dte-ev">Servicios de hospedaje y turismo</span></div>
                  <div class="dte-fila"><span class="dte-el">Dirección</span><span class="dte-ev">San Salvador, El Salvador, C.A.</span></div>
                  <div class="dte-fila"><span class="dte-el">Correo</span><span class="dte-ev">facturacion@hoteldelsistema.com</span></div>
                </div>
                <div class="dte-parte">
                  <div class="dte-parte-tit">RECEPTOR</div>
                  <div class="dte-fila"><span class="dte-el">Nombre</span><span class="dte-ev bold">{{ detalleFactura?.clienteNombre }}</span></div>
                  <div class="dte-fila"><span class="dte-el">Doc. identif.</span><span class="dte-ev">{{ detalleFactura?.tipo === 'credito_fiscal' ? (detalleFactura?.clienteNit || '—') : (detalleFactura?.clienteDui || '—') }}</span></div>
                  <div class="dte-fila"><span class="dte-el">Correo</span><span class="dte-ev">{{ detalleFactura?.clienteEmail }}</span></div>
                  <template v-if="detalleFactura?.tipo === 'credito_fiscal'">
                    <div class="dte-fila"><span class="dte-el">NRC</span><span class="dte-ev">{{ detalleFactura?.clienteNrc || '—' }}</span></div>
                    <div class="dte-fila"><span class="dte-el">Giro</span><span class="dte-ev">{{ detalleFactura?.clienteGiro || '—' }}</span></div>
                    <div class="dte-fila"><span class="dte-el">Dirección</span><span class="dte-ev">{{ detalleFactura?.clienteDireccion || '—' }}</span></div>
                  </template>
                  <template v-if="detalleFactura?.reservacion">
                    <div class="dte-fila"><span class="dte-el">Reservación</span><span class="dte-ev">#{{ detalleFactura.reservacion.idReservacion }} — Hab. {{ detalleFactura.reservacion.habitacion.numero }}</span></div>
                    <div class="dte-fila"><span class="dte-el">Check-in</span><span class="dte-ev">{{ formatFecha(detalleFactura.reservacion.fechaEntrada) }}</span></div>
                    <div class="dte-fila"><span class="dte-el">Check-out</span><span class="dte-ev">{{ formatFecha(detalleFactura.reservacion.fechaSalida) }}</span></div>
                  </template>
                </div>
              </div>

              <table class="dte-items">
                <thead>
                  <tr>
                    <th class="tc">No.</th><th class="tc">Cant.</th><th class="tc">Unidad</th>
                    <th>Descripción</th><th class="tr">Precio Unit.</th>
                    <th class="tr">Descuento</th><th class="tr">Ventas gravadas</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, i) in detalleFactura?.items" :key="item.idItem">
                    <td class="tc">{{ Number(i) + 1 }}</td>
                    <td class="tc">{{ item.cantidad }}</td>
                    <td class="tc">Unidad</td>
                    <td>{{ item.descripcion }}</td>
                    <td class="tr">${{ fmt(item.precioUnit) }}</td>
                    <td class="tr">$0</td>
                    <td class="tr">${{ fmt(item.subtotal) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="5" class="tr dte-suma-label">Suma de ventas:</td>
                    <td class="tr">$0</td>
                    <td class="tr">${{ fmt(detalleFactura?.subtotalConDesc) }}</td>
                  </tr>
                </tfoot>
              </table>

              <div class="dte-totales-wrap">
                <div class="dte-totales">
                  <div class="dte-tr"><span>Sub-Total:</span><span>${{ fmt(detalleFactura?.subtotalConDesc) }}</span></div>
                  <div v-if="detalleFactura?.tipo === 'credito_fiscal'" class="dte-tr"><span>IVA (13%):</span><span>${{ fmt(detalleFactura?.iva) }}</span></div>
                  <div class="dte-tr"><span>Contrib. Especial Turismo (5%):</span><span>${{ fmt(detalleFactura?.turismo) }}</span></div>
                  <div class="dte-tr"><span>IVA retenido:</span><span>$0</span></div>
                  <div class="dte-tr"><span>Retención renta:</span><span>$0</span></div>
                  <div class="dte-tr grand"><span>TOTAL A PAGAR:</span><span>${{ fmt(detalleFactura?.total) }}</span></div>
                </div>
              </div>

              <div class="dte-pie">
                <div class="dte-pie-row">
                  <span class="dte-el">Valor en letras:</span>
                  <span class="dte-ev">{{ numeroALetras(Number(detalleFactura?.total ?? 0)) }}</span>
                </div>
                <div class="dte-pie-row"><span class="dte-el">Condición:</span><span class="dte-ev">Contado</span></div>
                <div v-if="detalleFactura?.notas" class="dte-pie-row"><span class="dte-el">Observaciones:</span><span class="dte-ev">{{ detalleFactura.notas }}</span></div>
                <div v-if="detalleFactura?.motivoAnulacion" class="dte-pie-row anulacion"><span class="dte-el">Motivo anulación:</span><span class="dte-ev">{{ detalleFactura.motivoAnulacion }}</span></div>
              </div>

              <div class="dte-firmas">
                <div class="dte-firma"><div class="firma-linea"></div><p>Responsable por parte del Emisor</p></div>
                <div class="dte-firma"><div class="firma-linea"></div><p>Responsable por parte del Receptor</p></div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { facturacionApi, clientesApi, reservacionesApi } from '../../services/api'
import { useToast } from '../../composables/useToast'

const auth = useAuthStore()
const toast = useToast()

// ── Estado listado ─────────────────────────────────────
const facturas = ref<any[]>([])
const loading = ref(true)
const errorGlobal = ref('')
const filtros = reactive({ search: '', tipo: '', estado: '', limit: 20 })
const paginacion = reactive({ page: 1, total: 0, totalPages: 1 })
const statsEmitidas = ref(0)
const statsAnuladas = ref(0)

// ── Modal nueva factura ────────────────────────────────
const modalAbierto = ref(false)
const guardando = ref(false)
const formError = ref('')
const errors = reactive<Record<string, string>>({})
const origen = ref<'reservacion' | 'manual'>('reservacion')

// Búsqueda reservaciones
const resSearch = ref('')
const resSugerencias = ref<any[]>([])
const resBuscando = ref(false)
const resSeleccionada = ref<any>(null)
let resTimer: ReturnType<typeof setTimeout>

// Búsqueda clientes
const clienteSearch = ref('')
const clienteSugerencias = ref<any[]>([])
const clienteSeleccionado = ref<any>(null)
let clienteTimer: ReturnType<typeof setTimeout>
const itemDescripcionRefs = new Map<string, HTMLInputElement>()

type FacturaItemForm = {
  uid: string
  descripcion: string
  cantidad: number
  precioUnit: number
}

let itemSeq = 0
const nuevoItemId = () => `item-${Date.now()}-${++itemSeq}`
const normalizarItem = (item: Partial<FacturaItemForm> = {}): FacturaItemForm => ({
  uid: item.uid ?? nuevoItemId(),
  descripcion: String(item.descripcion ?? ''),
  cantidad: Math.max(1, Number(item.cantidad || 1)),
  precioUnit: Number(item.precioUnit || 0),
})
const itemVacio = () => normalizarItem()
const formVacio = () => ({
  tipo: 'consumidor_final' as 'consumidor_final' | 'credito_fiscal',
  clienteId: null as any,
  reservacionId: null as any,
  clienteNit: '', clienteNrc: '', clienteGiro: '', clienteDireccion: '',
  notas: '',
  items: [itemVacio()],
})
const form = ref(formVacio())

function setItemDescripcionRef(uid: string, el: any) {
  if (el instanceof HTMLInputElement) {
    itemDescripcionRefs.set(uid, el)
  } else {
    itemDescripcionRefs.delete(uid)
  }
}

// ── Modal anular ───────────────────────────────────────
const modalAnular = ref(false)
const facturaAnular = ref<any>(null)
const motivoAnulacion = ref('')
const anularLoading = ref(false)
const anularError = ref('')
const anularIntentado = ref(false)

// ── Modal detalle ──────────────────────────────────────
const modalDetalle = ref(false)
const detalleFactura = ref<any>(null)
const generandoPDF = ref(false)

// ── Totales computados ─────────────────────────────────
const IVA = 0.13
const TURISMO = 0.05
const toNumber = (value: any) => Number(value ?? 0)
const normalizeList = (payload: any) => Array.isArray(payload) ? payload : (payload?.data ?? [])
const cleanItems = () =>
  form.value.items.map((item: FacturaItemForm) => ({
    descripcion: String(item.descripcion ?? '').trim(),
    cantidad: Math.max(1, Number(item.cantidad || 1)),
    precioUnit: Number(item.precioUnit || 0),
  }))
const totales = computed(() => {
  const subtotal = form.value.items.reduce((s, i) => s + toNumber(i.cantidad) * toNumber(i.precioUnit), 0)
  if (form.value.tipo === 'consumidor_final') {
    const ivaIncluido = subtotal - subtotal / (1 + IVA)
    const turismo = subtotal * TURISMO
    return { subtotal, iva: 0, ivaIncluido, turismo, total: subtotal + turismo }
  } else {
    const iva = subtotal * IVA
    const turismo = subtotal * TURISMO
    return { subtotal, iva, ivaIncluido: 0, turismo, total: subtotal + iva + turismo }
  }
})

// ── Debounce búsqueda ──────────────────────────────────
let searchTimer: ReturnType<typeof setTimeout>
function debouncedCargar() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => cargar(1), 400)
}

onMounted(() => cargar(1))

// ─────────────────────────────────────────────────────────
async function cargar(page = paginacion.page) {
  loading.value = true; errorGlobal.value = ''
  try {
    const params: any = { page, limit: filtros.limit }
    if (filtros.search) params.search = filtros.search
    if (filtros.tipo) params.tipo = filtros.tipo
    if (filtros.estado) params.estado = filtros.estado

    const { data } = await facturacionApi.getAll(params)

    // API returns { data, total, page, limit, totalPages }
    facturas.value = normalizeList(data)
    if (data.total !== undefined) {
      paginacion.page = data.page
      paginacion.total = data.total
      paginacion.totalPages = data.totalPages
    } else {
      paginacion.total = facturas.value.length
      paginacion.totalPages = 1
    }

    statsEmitidas.value = facturas.value.filter((f: any) => f.estado === 'emitida').length
    statsAnuladas.value = facturas.value.filter((f: any) => f.estado === 'anulada').length
  } catch {
    errorGlobal.value = 'No se pudieron cargar las facturas'
  } finally {
    loading.value = false
  }
}

// ── Búsqueda reservaciones ─────────────────────────────
function buscarReservaciones() {
  clearTimeout(resTimer)
  if (resSearch.value.trim().length < 2) { resSugerencias.value = []; return }
  resBuscando.value = true
  resTimer = setTimeout(async () => {
    try {
      const { data } = await reservacionesApi.getAll({ search: resSearch.value })
      resSugerencias.value = normalizeList(data).filter((r: any) => r.estado === 'completada')
    } catch { resSugerencias.value = [] }
    finally { resBuscando.value = false }
  }, 350)
}

async function seleccionarReservacion(r: any) {
  resSugerencias.value = []
  resSearch.value = `#${r.idReservacion} — ${r.cliente.nombre} ${r.cliente.apellido}`
  try {
    const { data } = await facturacionApi.getItemsDesdeReservacion(r.idReservacion)
    if (data.facturaExistente && data.facturaExistente.estado !== 'anulada') {
      formError.value = `La reservacion ya tiene factura ${data.facturaExistente.numeroFactura}`
      toast.error(formError.value)
      resSeleccionada.value = { ...r, factura: data.facturaExistente }
      return
    }
    resSeleccionada.value = { ...r, factura: data.facturaExistente }
    form.value.reservacionId = r.idReservacion
    form.value.items = normalizeList(data.items).map((item: any) => normalizarItem(item))
    seleccionarCliente(data.cliente, false)
  } catch (e: any) {
    formError.value = e?.response?.data?.message ?? 'Error al cargar reservación'
  }
}

function limpiarReservacion() {
  resSeleccionada.value = null
  form.value.reservacionId = null
  form.value.items = [itemVacio()]
  resSearch.value = ''
  limpiarCliente()
}

// ── Búsqueda clientes ──────────────────────────────────
function buscarClientes() {
  clearTimeout(clienteTimer)
  if (clienteSearch.value.trim().length < 2) { clienteSugerencias.value = []; return }
  clienteTimer = setTimeout(async () => {
    try {
      const { data } = await clientesApi.getAll(clienteSearch.value)
      clienteSugerencias.value = normalizeList(data).filter((c: any) => c.activo)
    } catch { clienteSugerencias.value = [] }
  }, 300)
}

async function cargarReservacionesCliente(clienteId: number) {
  if (origen.value !== 'reservacion') return
  resBuscando.value = true
  resSugerencias.value = []
  resSeleccionada.value = null
  form.value.reservacionId = null
  form.value.items = [itemVacio()]
  try {
    const { data } = await reservacionesApi.getAll({
      clienteId,
      estado: 'completada',
    })
    resSugerencias.value = normalizeList(data)
  } catch {
    resSugerencias.value = []
    toast.error('No se pudieron cargar las reservaciones del cliente')
  } finally {
    resBuscando.value = false
  }
}

function seleccionarCliente(c: any, cargarReservas = true) {
  clienteSeleccionado.value = c
  form.value.clienteId = c.idCliente
  clienteSearch.value = ''
  clienteSugerencias.value = []
  if (errors.clienteId) delete errors.clienteId
  if (cargarReservas) cargarReservacionesCliente(c.idCliente)
}

function limpiarCliente() {
  clienteSeleccionado.value = null
  form.value.clienteId = null
  clienteSearch.value = ''
  clienteSugerencias.value = []
  if (origen.value === 'reservacion') {
    resSugerencias.value = []
    resSeleccionada.value = null
    form.value.reservacionId = null
    form.value.items = [itemVacio()]
    resSearch.value = ''
  }
}

// ── Ítems ──────────────────────────────────────────────
async function agregarItem() {
  const items = Array.isArray(form.value.items) ? form.value.items : []
  const nuevoItem = itemVacio()
  form.value.items = [...items, nuevoItem]
  if (errors.items) delete errors.items
  await nextTick()
  const input = itemDescripcionRefs.get(nuevoItem.uid)
  input?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  input?.focus()
}

function quitarItem(i: number) {
  if (form.value.items.length <= 1) return
  form.value.items = form.value.items.filter((_, index) => index !== i)
  if (errors.items) delete errors.items
}

// ── Validación ─────────────────────────────────────────
function validar(): boolean {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.value.clienteId) errors.clienteId = 'Selecciona un cliente'
  if (resSeleccionada.value?.factura && resSeleccionada.value.factura.estado !== 'anulada') {
    errors.reservacionId = 'Esta reservacion ya tiene una factura emitida'
  }
  if (form.value.tipo === 'credito_fiscal' && !form.value.clienteNit?.trim()) errors.clienteNit = 'NIT requerido para Crédito Fiscal'
  if (!form.value.items.length) form.value.items = [itemVacio()]
  form.value.items = form.value.items.map((item: FacturaItemForm) => normalizarItem(item))
  const itemsValidos = cleanItems().every(i => i.descripcion && i.cantidad > 0 && i.precioUnit >= 0)
  if (!itemsValidos) errors.items = 'Todos los ítems deben tener descripción, cantidad y precio válidos'
  return Object.keys(errors).length === 0
}

// ── Modal factura ──────────────────────────────────────
function abrirModal() {
  form.value = formVacio()
  Object.keys(errors).forEach(k => delete errors[k])
  formError.value = ''
  origen.value = 'reservacion'
  resSearch.value = ''; resSugerencias.value = []; resSeleccionada.value = null
  clienteSearch.value = ''; clienteSugerencias.value = []; clienteSeleccionado.value = null
  modalAbierto.value = true
}
function cerrarModal() { modalAbierto.value = false }

function setOrigen(o: 'reservacion' | 'manual') {
  origen.value = o
  formError.value = ''
  if (o === 'manual') {
    limpiarReservacion()
  } else {
    form.value.reservacionId = null
    form.value.items = [itemVacio()]
    limpiarCliente()
  }
}

async function guardar() {
  if (!validar()) return
  guardando.value = true; formError.value = ''
  try {
    const payload = {
      tipo: form.value.tipo,
      clienteId: Number(form.value.clienteId),
      reservacionId: form.value.reservacionId ? Number(form.value.reservacionId) : undefined,
      clienteNit: form.value.clienteNit || undefined,
      clienteNrc: form.value.clienteNrc || undefined,
      clienteGiro: form.value.clienteGiro || undefined,
      clienteDireccion: form.value.clienteDireccion || undefined,
      notas: form.value.notas || undefined,
      items: cleanItems(),
    }
    const { data } = await facturacionApi.create(payload)
    toast.success(`Factura ${data.numeroFactura} emitida correctamente`)
    cerrarModal()
    cargar(1)
    abrirDetalle(data)
  } catch (e: any) {
    const msg = e?.response?.data?.message
    formError.value = Array.isArray(msg) ? msg[0] : (msg ?? 'Ocurrió un error al emitir')
    toast.error(formError.value)
  } finally { guardando.value = false }
}

// ── Modal anular ───────────────────────────────────────
function abrirModalAnular(f: any) {
  facturaAnular.value = f; motivoAnulacion.value = ''
  anularError.value = ''; anularIntentado.value = false
  modalAnular.value = true
}
function cerrarModalAnular() { modalAnular.value = false }

async function confirmarAnulacion() {
  anularIntentado.value = true
  if (!motivoAnulacion.value.trim()) return
  anularLoading.value = true; anularError.value = ''
  try {
    await facturacionApi.anular(facturaAnular.value.idFactura, { motivoAnulacion: motivoAnulacion.value })
    toast.success('Factura anulada')
    cerrarModalAnular(); cargar(paginacion.page)
  } catch (e: any) {
    anularError.value = e?.response?.data?.message ?? 'Error al anular'
    toast.error(anularError.value)
  } finally { anularLoading.value = false }
}

// ── Modal detalle ──────────────────────────────────────
async function abrirDetalle(f: any) {
  detalleFactura.value = f
  modalDetalle.value = true
  try {
    const { data } = await facturacionApi.getById(f.idFactura)
    detalleFactura.value = data
  } catch {
    toast.error('No se pudo cargar el detalle completo de la factura')
  }
}
function cerrarDetalle() { modalDetalle.value = false }

async function descargarPDF() {
  generandoPDF.value = true
  try {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')])
    const el = document.getElementById('factura-pdf-content')
    if (!el) return
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pdfW = pdf.internal.pageSize.getWidth()
    const pdfH = (canvas.height * pdfW) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH)
    pdf.save(`${detalleFactura.value?.numeroFactura}.pdf`)
  } finally { generandoPDF.value = false }
}

// ── Helpers DTE ───────────────────────────────────────
function codigoGeneracion(f: any) {
  if (!f) return ''
  const id = String(f.idFactura).padStart(8, '0')
  return `${id}-${id}A6-${id.slice(0,4)}A-${id.slice(0,4)}E007`.toUpperCase().substring(0, 36)
}
function numeroControl(f: any) {
  if (!f) return ''
  return `${f.tipo === 'consumidor_final' ? 'DTE-01' : 'DTE-03'}-M001P001-${String(f.idFactura).padStart(15, '0')}`
}
function selloRecepcion(f: any) {
  if (!f) return ''
  return `${f.numeroFactura}${f.idFactura}`.replace(/[^A-Z0-9]/gi, '').toUpperCase().padEnd(32, 'X').substring(0, 32)
}

function numeroALetras(num: number): string {
  const unidades = ['','un','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve']
  const decenas = ['','','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa']
  const centenas = ['','ciento','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos']
  function grupo(n: number): string {
    if (n === 0) return ''
    if (n === 100) return 'cien'
    let r = ''; const c = Math.floor(n/100); const resto = n%100
    if (c > 0) r += (centenas[c] ?? '') + (resto > 0 ? ' ' : '')
    if (resto < 20) r += unidades[resto] ?? ''
    else { const d = Math.floor(resto/10); const u = resto%10; r += (decenas[d] ?? '') + (u > 0 ? ' y ' + (unidades[u] ?? '') : '') }
    return r
  }
  const entero = Math.floor(num); const centavos = Math.round((num - entero) * 100)
  const miles = Math.floor(entero/1000); const resto = entero%1000
  let res = ''
  if (miles > 0) { res += (miles === 1 ? 'mil' : grupo(miles) + ' mil'); if (resto > 0) res += ' ' }
  if (resto > 0) res += grupo(resto)
  if (!res) res = 'cero'
  const cStr = centavos > 0 ? ` con ${String(centavos).padStart(2,'0')}/100` : ' exactos'
  return res.charAt(0).toUpperCase() + res.slice(1) + ' dólares' + cStr
}

function fmt(val: any) { return Number(val ?? 0).toFixed(2) }
function formatFecha(f: string) { if (!f) return ''; return new Date(f).toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric' }) }
function formatFechaHora(f: string) { if (!f) return ''; return new Date(f).toLocaleString('es-SV', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false }) }
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
* { box-sizing: border-box; }

.page { font-family: 'Sora', sans-serif; display: flex; flex-direction: column; gap: 22px; max-width: 1300px; }
.page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; letter-spacing: -0.02em; }
.page-subtitle { font-size: 0.82rem; color: var(--text-muted); margin: 0; font-weight: 300; }
.header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

/* Stat chips */
.stat-chips { display: flex; gap: 6px; }
.stat-chip { font-size: 0.75rem; font-weight: 600; border-radius: 99px; padding: 4px 12px; border: 1px solid; }
.stat-chip.total { background: #eef2ff; color: #6366f1; border-color: #c7d2fe; }
.stat-chip.emitida { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
.stat-chip.anulada { background: #fef2f2; color: #ef4444; border-color: #fecaca; }

/* Buttons */
.btn-primary { display: flex; align-items: center; gap: 6px; padding: 9px 18px; background: linear-gradient(135deg,#6366f1,#818cf8); color: white; border: none; border-radius: 10px; font-size: 0.85rem; font-weight: 600; font-family: 'Sora', sans-serif; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(99,102,241,0.35); }
.btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.45); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-ghost { display: flex; align-items: center; gap: 6px; padding: 9px 16px; background: transparent; color: var(--text-secondary); border: 1.5px solid var(--border); border-radius: 10px; font-size: 0.85rem; font-weight: 500; font-family: 'Sora', sans-serif; cursor: pointer; transition: all 0.2s; }
.btn-ghost:hover { background: var(--bg-hover); border-color: #a5b4fc; color: #6366f1; }
.btn-danger { display: flex; align-items: center; gap: 6px; padding: 9px 16px; background: #ef4444; color: white; border: none; border-radius: 10px; font-size: 0.85rem; font-weight: 600; font-family: 'Sora', sans-serif; cursor: pointer; transition: all 0.2s; }
.btn-danger:hover:not(:disabled) { background: #dc2626; }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

/* Filters */
.filters-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-wrap { position: relative; flex: 1; min-width: 220px; }
.search-ico { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
.search-input { width: 100%; padding: 9px 12px 9px 34px; border: 1.5px solid var(--border); border-radius: 9px; font-size: 0.85rem; font-family: 'Sora', sans-serif; color: var(--text-primary); background: var(--bg-card); outline: none; transition: all 0.2s; }
.search-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
.filt-sel { padding: 9px 12px; border: 1.5px solid var(--border); border-radius: 9px; font-size: 0.85rem; font-family: 'Sora', sans-serif; color: var(--text-primary); background: var(--bg-card); outline: none; cursor: pointer; }
.filt-sm { max-width: 100px; }

/* State boxes */
.state-box { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 48px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; color: var(--text-muted); font-size: 0.9rem; }
.err-box { color: #ef4444; background: #fef2f2; border-color: #fecaca; }

/* Table */
.card-table { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
thead tr { background: var(--bg-app); border-bottom: 1px solid var(--border); }
th { padding: 11px 14px; text-align: left; font-size: 0.7rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }
th.tr { text-align: right; }
tbody tr { border-bottom: 1px solid var(--border); transition: background 0.15s; }
tbody tr:last-child { border-bottom: none; }
tbody tr:hover { background: var(--bg-hover); }
tbody tr.anulada { opacity: 0.5; }
td { padding: 11px 14px; color: var(--text-primary); vertical-align: middle; }
.td-num { font-weight: 700; font-size: 0.82rem; color: #6366f1; }
.td-date { color: var(--text-secondary); font-size: 0.82rem; white-space: nowrap; }
.td-money { text-align: right; font-size: 0.84rem; }
.td-muted { color: var(--text-muted); }
.td-total { font-weight: 700; }
.tr { text-align: right; }
.tc { text-align: center; }
.empty { text-align: center; padding: 48px; color: var(--text-muted); }
.user-cell { display: flex; align-items: center; gap: 9px; }
.u-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg,#6366f1,#a5b4fc); color: white; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.u-avatar.sm { width: 26px; height: 26px; font-size: 0.7rem; }
.cell-name { font-size: 0.84rem; font-weight: 500; }
.cell-sub { font-size: 0.72rem; color: var(--text-muted); }
.tipo-pill { font-size: 0.7rem; font-weight: 600; padding: 3px 9px; border-radius: 99px; white-space: nowrap; }
.tipo-pill.consumidor_final { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
.tipo-pill.credito_fiscal { background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; }
.res-link { font-size: 0.78rem; color: #6366f1; font-weight: 500; }
.estado-pill { display: inline-flex; align-items: center; gap: 5px; font-size: 0.7rem; font-weight: 600; padding: 3px 10px; border-radius: 99px; }
.estado-pill.emitida { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.estado-pill.anulada { background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.action-row { display: flex; gap: 5px; }
.act-btn { width: 30px; height: 30px; border-radius: 7px; border: 1.5px solid var(--border); background: var(--bg-card); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.18s; color: var(--text-muted); }
.act-btn.view:hover { background: #f5f3ff; border-color: #ddd6fe; color: #7c3aed; }
.act-btn.danger:hover { background: #fef2f2; border-color: #fecaca; color: #ef4444; }

/* Pagination */
.pagination { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 14px; border-top: 1px solid var(--border); }
.pag-btn { width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid var(--border); background: var(--bg-card); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-muted); transition: all 0.15s; }
.pag-btn:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; background: #eef2ff; }
.pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pag-info { font-size: 0.82rem; color: var(--text-secondary); }

/* ── Modal ── */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal { background: var(--bg-card); border: 1px solid var(--border); border-radius: 18px; width: 100%; max-width: 480px; box-shadow: 0 24px 64px rgba(0,0,0,0.4); overflow: hidden; max-height: 95vh; display: flex; flex-direction: column; }
.modal-xl { max-width: 700px; }
.modal-pdf { max-width: 900px; }
.modal-head { display: flex; align-items: flex-start; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
.modal-title { font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.modal-sub { font-size: 0.75rem; color: var(--text-muted); margin: 2px 0 0; }
.close-btn { width: 28px; height: 28px; border-radius: 7px; border: 1.5px solid var(--border); background: transparent; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; transition: all 0.15s; flex-shrink: 0; }
.close-btn:hover { background: #fef2f2; border-color: #fecaca; color: #ef4444; }
.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; flex: 1; }
.modal-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px 20px; border-top: 1px solid var(--border); flex-shrink: 0; }

/* Form elements */
.section-label { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.07em; }
.field { display: flex; flex-direction: column; gap: 5px; }
.lbl { font-size: 0.77rem; font-weight: 600; color: var(--text-secondary); }
.inp { padding: 9px 12px; border: 1.5px solid var(--border); border-radius: 9px; font-size: 0.875rem; font-family: 'Sora', sans-serif; color: var(--text-primary); background: var(--bg-app); outline: none; transition: all 0.2s; width: 100%; }
.inp:focus { border-color: #6366f1; background: var(--bg-card); box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
.inp:disabled { opacity: 0.6; cursor: not-allowed; }
.inp-err { border-color: #ef4444 !important; }
.field-err { font-size: 0.72rem; color: #ef4444; }
.form-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }
.alert-err { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; border-radius: 9px; padding: 9px 13px; }
.warn-box { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 9px; font-size: 0.82rem; color: #92400e; }

/* Tipo selector */
.tipo-selector { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.tipo-opt { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 12px; border: 1.5px solid var(--border); border-radius: 11px; background: var(--bg-app); cursor: pointer; font-family: 'Sora', sans-serif; transition: all 0.18s; color: var(--text-muted); }
.tipo-opt:hover { border-color: #a5b4fc; color: #6366f1; }
.tipo-opt.sel { border-color: #6366f1; background: #eef2ff; color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
.tipo-opt-name { font-size: 0.85rem; font-weight: 700; }
.tipo-opt-sub { font-size: 0.7rem; font-weight: 300; text-align: center; color: var(--text-muted); }
.tipo-opt.sel .tipo-opt-sub { color: #818cf8; }

/* Origen */
.origen-btns { display: flex; gap: 8px; }
.origen-btn { padding: 8px 16px; border: 1.5px solid var(--border); border-radius: 9px; background: var(--bg-app); cursor: pointer; font-size: 0.82rem; font-family: 'Sora', sans-serif; color: var(--text-secondary); transition: all 0.18s; }
.origen-btn:hover { border-color: #a5b4fc; }
.origen-btn.sel { border-color: #6366f1; background: #eef2ff; color: #6366f1; font-weight: 600; }

/* Búsqueda reservaciones / clientes */
.search-res-wrap { position: relative; }
.search-ico { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
.res-dropdown { border: 1.5px solid var(--border); border-radius: 10px; background: var(--bg-card); overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.12); margin-top: 4px; max-height: 220px; overflow-y: auto; }
.res-opt { width: 100%; padding: 10px 12px; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; gap: 10px; text-align: left; font-family: 'Sora', sans-serif; border-bottom: 1px solid var(--border); transition: background 0.15s; }
.res-opt:last-child { border-bottom: none; }
.res-opt:hover { background: var(--bg-hover); }
.res-opt-num { font-size: 0.78rem; font-weight: 700; color: #6366f1; flex-shrink: 0; }
.res-opt-info { flex: 1; display: flex; flex-direction: column; }
.res-opt-name { font-size: 0.82rem; font-weight: 500; color: var(--text-primary); }
.res-opt-sub { font-size: 0.72rem; color: var(--text-muted); }
.res-ya-facturada { font-size: 0.7rem; color: #d97706; background: #fffbeb; border: 1px solid #fde68a; border-radius: 99px; padding: 2px 8px; flex-shrink: 0; }
.res-loading { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--text-muted); padding: 8px 0; }
.res-empty { font-size: 0.78rem; color: var(--text-muted); background: var(--bg-app); border: 1px dashed var(--border); border-radius: 9px; padding: 10px 12px; }
.res-selected { background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 5px; }
.res-sel-header { display: flex; align-items: center; gap: 10px; }
.res-sel-num { font-size: 0.82rem; font-weight: 700; color: #16a34a; }
.warn-ya-facturada { font-size: 0.75rem; color: #d97706; background: #fffbeb; border: 1px solid #fde68a; border-radius: 7px; padding: 3px 10px; }
.res-sel-info { display: flex; flex-wrap: wrap; gap: 8px; font-size: 0.78rem; color: #166534; }
.res-clear { background: none; border: 1.5px solid #bbf7d0; border-radius: 7px; color: #16a34a; cursor: pointer; font-size: 0.75rem; padding: 3px 9px; transition: all 0.15s; margin-top: 2px; align-self: flex-start; }
.res-clear:hover { background: white; }
.cliente-chip { display: flex; align-items: center; gap: 8px; background: #eef2ff; border: 1.5px solid #c7d2fe; border-radius: 10px; padding: 8px 12px; }
.cc-name { font-size: 0.84rem; font-weight: 600; color: #4338ca; }
.cc-email { font-size: 0.72rem; color: #818cf8; flex: 1; }

/* Items */
.items-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.items-title { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.items-count { display: inline-flex; align-items: center; height: 22px; padding: 0 9px; border-radius: 999px; background: #eef2ff; color: #4f46e5; border: 1px solid #c7d2fe; font-size: 0.7rem; font-weight: 700; }
.btn-add-item { display: flex; align-items: center; gap: 5px; padding: 6px 12px; border: 1.5px solid var(--border); border-radius: 7px; background: var(--bg-app); color: var(--text-secondary); font-size: 0.78rem; font-family: 'Sora', sans-serif; cursor: pointer; transition: all 0.15s; }
.btn-add-item:hover { border-color: #6366f1; color: #6366f1; background: #eef2ff; }
.items-list { display: flex; flex-direction: column; gap: 10px; }
.item-row-card { border: 1.5px solid var(--border); border-radius: 12px; background: var(--bg-app); padding: 12px; }
.item-row-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
.item-index { font-size: 0.75rem; font-weight: 700; color: #4f46e5; }
.item-fields { display: grid; grid-template-columns: minmax(220px, 1fr) 92px 130px 110px; gap: 10px; align-items: end; }
.item-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.item-label { font-size: 0.68rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.item-inp { width: 100%; height: 38px; padding: 8px 10px; border: 1.5px solid var(--border); border-radius: 8px; font-size: 0.82rem; font-family: 'Sora', sans-serif; color: var(--text-primary); background: var(--bg-card); outline: none; transition: all 0.15s; }
.item-inp::placeholder { color: #9ca3af; }
.item-inp:focus { border-color: #6366f1; background: var(--bg-card); box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
.item-inp-err { border-color: #ef4444; background: #fff7f7; }
.item-num { text-align: right; }
.item-precio-wrap { display: flex; align-items: center; }
.item-dollar { height: 38px; display: flex; align-items: center; padding: 0 9px; border: 1.5px solid var(--border); border-right: none; border-radius: 8px 0 0 8px; font-size: 0.8rem; color: var(--text-muted); background: var(--bg-card); }
.item-price-input { border-radius: 0 8px 8px 0; }
.item-sub-box { height: 38px; display: flex; align-items: center; justify-content: flex-end; padding: 0 10px; border-radius: 8px; background: #eef2ff; color: #3730a3; font-size: 0.86rem; font-weight: 700; white-space: nowrap; }
.item-del-text { border: 1.5px solid #fecaca; background: #fef2f2; color: #dc2626; border-radius: 7px; padding: 4px 9px; font-size: 0.72rem; font-family: 'Sora', sans-serif; font-weight: 700; cursor: pointer; transition: all 0.15s; }
.item-del-text:hover:not(:disabled) { background: #fee2e2; border-color: #fca5a5; }
.item-del-text:disabled { opacity: 0.45; cursor: not-allowed; }

@media (max-width: 760px) {
  .items-header { align-items: flex-start; flex-direction: column; }
  .item-fields { grid-template-columns: 1fr 1fr; }
  .item-desc-field { grid-column: 1 / -1; }
}

/* Resumen */
.resumen { background: var(--bg-app); border: 1px solid var(--border); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.resumen-row { display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-secondary); }
.resumen-row.muted { color: var(--text-muted); font-size: 0.8rem; }
.resumen-row.total { font-size: 1rem; font-weight: 700; color: var(--text-primary); border-top: 1px solid var(--border); padding-top: 10px; margin-top: 2px; }

/* ── DTE Document ── */
.dte-doc { background: #fff; color: #111; font-family: Arial, sans-serif; font-size: 9px; padding: 24px 28px; border: 1px solid #ccc; border-radius: 4px; line-height: 1.4; }
.dte-titulo { text-align: center; margin-bottom: 10px; border-bottom: 2px solid #111; padding-bottom: 8px; }
.dte-titulo p { margin: 2px 0; font-size: 9px; font-weight: 600; text-transform: uppercase; }
.dte-tipo-doc { font-size: 11px !important; font-weight: 700 !important; margin-top: 4px !important; }
.dte-anulada { margin-top: 6px; display: inline-block; background: #ef4444; color: white; font-size: 10px; font-weight: 700; padding: 3px 16px; border-radius: 3px; letter-spacing: 0.1em; }
.dte-enc { display: flex; gap: 24px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #ccc; }
.dte-enc-col { flex: 1; }
.dte-enc-col.right { text-align: right; }
.dte-enc-row { margin-bottom: 3px; }
.dte-el { font-weight: 700; font-size: 8px; }
.dte-ev { font-size: 8px; margin-left: 4px; word-break: break-all; }
.dte-partes { display: flex; border: 1px solid #999; margin-bottom: 10px; }
.dte-parte { flex: 1; padding: 8px 10px; }
.dte-parte:first-child { border-right: 1px solid #999; }
.dte-parte-tit { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; background: #111; color: #fff; padding: 2px 6px; margin: -8px -10px 6px; text-align: center; }
.dte-parte-nombre { font-size: 9px; font-weight: 700; margin: 0 0 2px; text-transform: uppercase; }
.dte-parte-dir { font-size: 8px; color: #555; margin: 0 0 4px; }
.dte-fila { display: flex; gap: 4px; margin-bottom: 1px; flex-wrap: wrap; }
.bold { font-weight: 700; }
.dte-items { width: 100%; border-collapse: collapse; font-size: 8px; margin-bottom: 6px; }
.dte-items th { background: #f0f0f0; border: 1px solid #aaa; padding: 4px 5px; font-weight: 700; font-size: 7.5px; text-transform: uppercase; }
.dte-items td { border: 1px solid #ccc; padding: 4px 5px; vertical-align: middle; }
.dte-items tfoot td { background: #f8f8f8; font-weight: 700; border: 1px solid #aaa; }
.dte-suma-label { text-align: right; }
.dte-totales-wrap { display: flex; justify-content: flex-end; margin-bottom: 10px; }
.dte-totales { width: 55%; border: 1px solid #aaa; }
.dte-tr { display: flex; justify-content: space-between; padding: 3px 8px; border-bottom: 1px solid #e5e5e5; font-size: 8px; }
.dte-tr:last-child { border-bottom: none; }
.dte-tr.grand { font-weight: 700; font-size: 9px; background: #111; color: #fff; padding: 5px 8px; }
.dte-pie { border: 1px solid #aaa; padding: 6px 10px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 4px; font-size: 8px; background: #fafafa; }
.dte-pie-row { display: flex; gap: 8px; flex-wrap: wrap; }
.dte-pie-row.anulacion { color: #dc2626; }
.dte-firmas { display: flex; gap: 40px; margin-top: 20px; }
.dte-firma { flex: 1; text-align: center; font-size: 8px; }
.firma-linea { border-top: 1px solid #555; margin-bottom: 4px; }

/* Spin / Transitions */
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.modal-enter-active, .modal-leave-active { transition: opacity 0.22s ease; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: transform 0.22s cubic-bezier(.34,1.56,.64,1); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: scale(0.93) translateY(12px); }
</style>
