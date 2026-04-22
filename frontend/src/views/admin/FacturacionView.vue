<template>
    <div class="facturacion-page">

        <!-- Header -->
        <div class="page-header">
            <div>
                <h1 class="page-title">Facturación</h1>
                <p class="page-subtitle">Gestión de facturas del hotel</p>
            </div>
            <div class="header-right">
                <span class="header-badge">{{ facturas.length }} facturas</span>
                <button v-if="auth.tienePermiso('facturacion:crear')" class="btn-primary" @click="abrirModal()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Nueva factura
                </button>
            </div>
        </div>

        <!-- Filtros -->
        <div class="filters-row">
            <div class="search-wrapper">
                <div class="search-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </div>
                <input v-model="filtros.search" type="text" class="search-input"
                    placeholder="Buscar por número, cliente o email..." @input="cargar" />
            </div>
            <select v-model="filtros.tipo" class="filter-select" @change="cargar">
                <option value="">Todos los tipos</option>
                <option value="consumidor_final">Consumidor Final</option>
                <option value="credito_fiscal">Crédito Fiscal</option>
            </select>
            <select v-model="filtros.estado" class="filter-select" @change="cargar">
                <option value="">Todos los estados</option>
                <option value="emitida">Emitida</option>
                <option value="anulada">Anulada</option>
            </select>
        </div>

        <!-- Loading / Error -->
        <div v-if="loading" class="state-box">
            <svg class="spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Cargando facturas...
        </div>
        <div v-else-if="errorGlobal" class="state-box error-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {{ errorGlobal }}
        </div>

        <!-- Tabla -->
        <div v-else class="table-card">
            <table class="fact-table">
                <thead>
                    <tr>
                        <th>Número</th>
                        <th>Tipo</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Subtotal</th>
                        <th>IVA</th>
                        <th>Turismo</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="f in facturas" :key="f.idFactura" :class="{ anulada: f.estado === 'anulada' }">
                        <td class="td-numero">{{ f.numeroFactura }}</td>
                        <td>
                            <span class="tipo-badge" :class="f.tipo">
                                {{ f.tipo === 'consumidor_final' ? 'Cons. Final' : 'Créd. Fiscal' }}
                            </span>
                        </td>
                        <td>
                            <div class="user-cell">
                                <div class="user-avatar">{{ f.clienteNombre.charAt(0) }}</div>
                                <div>
                                    <span class="cell-name">{{ f.clienteNombre }}</span>
                                    <span class="cell-sub">{{ f.clienteEmail }}</span>
                                </div>
                            </div>
                        </td>
                        <td class="td-date">{{ formatFecha(f.fechaEmision) }}</td>
                        <td class="td-money">${{ fmt(f.subtotalConDesc) }}</td>
                        <td class="td-money td-muted">${{ fmt(f.iva) }}</td>
                        <td class="td-money td-muted">${{ fmt(f.turismo) }}</td>
                        <td class="td-money td-total">${{ fmt(f.total) }}</td>
                        <td>
                            <span class="estado-badge" :class="f.estado">
                                <span class="status-dot"></span>
                                {{ f.estado === 'emitida' ? 'Emitida' : 'Anulada' }}
                            </span>
                        </td>
                        <td>
                            <div class="actions">
                                <button class="action-btn detail-btn" title="Ver / Descargar PDF"
                                    @click="abrirDetalle(f)">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        stroke-width="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                </button>
                                <button v-if="auth.tienePermiso('facturacion:anular') && f.estado === 'emitida'"
                                    class="action-btn deactivate-btn" title="Anular factura"
                                    @click="abrirModalAnular(f)">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        stroke-width="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="8" y1="12" x2="16" y2="12" />
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                    <tr v-if="facturas.length === 0">
                        <td colspan="10" class="empty-state">No se encontraron facturas</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Modal Nueva Factura -->
        <Transition name="modal">
            <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
                <div class="modal modal-xl">
                    <div class="modal-header">
                        <h2 class="modal-title">Nueva factura</h2>
                        <button class="modal-close" @click="cerrarModal">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    <div class="modal-body">

                        <!-- Tipo de factura -->
                        <p class="section-label">Tipo de documento</p>
                        <div class="tipo-selector">
                            <button class="tipo-option" :class="{ selected: form.tipo === 'consumidor_final' }"
                                @click="form.tipo = 'consumidor_final'">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <span class="tipo-option-label">Consumidor Final</span>
                                <span class="tipo-option-sub">Sin desglose de IVA</span>
                            </button>
                            <button class="tipo-option" :class="{ selected: form.tipo === 'credito_fiscal' }"
                                @click="form.tipo = 'credito_fiscal'">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                    <line x1="8" y1="21" x2="16" y2="21" />
                                    <line x1="12" y1="17" x2="12" y2="21" />
                                </svg>
                                <span class="tipo-option-label">Crédito Fiscal</span>
                                <span class="tipo-option-sub">IVA desglosado, requiere NIT</span>
                            </button>
                        </div>

                        <!-- Origen: desde reservación o manual -->
                        <p class="section-label">Origen</p>
                        <div class="origen-selector">
                            <button class="origen-option" :class="{ selected: origen === 'reservacion' }"
                                @click="setOrigen('reservacion')">
                                📅 Desde reservación
                            </button>
                            <button class="origen-option" :class="{ selected: origen === 'manual' }"
                                @click="setOrigen('manual')">
                                ✏️ Manual
                            </button>
                        </div>

                        <!-- Búsqueda de reservación -->
                        <div v-if="origen === 'reservacion'" class="field-group">
                            <label class="field-label">Reservación</label>
                            <SearchSelect v-model="form.reservacionId" :fetch-fn="buscarReservaciones"
                                value-key="idReservacion" label-key="label"
                                placeholder="Buscar por cliente o número de habitación..." :min-chars="2"
                                @select="onReservacionSelect">
                                <template #item="{ item }">
                                    <span class="ss-item-label">{{ item.label }}</span>
                                    <span class="ss-item-sub">{{ item.sub }}</span>
                                </template>
                            </SearchSelect>
                        </div>

                        <!-- Cliente -->
                        <p class="section-label">Cliente</p>
                        <div class="form-grid">
                            <div class="field-group" :class="origen === 'manual' ? '' : 'full-width'">
                                <label class="field-label">Cliente *</label>
                                <SearchSelect v-model="form.clienteId" :fetch-fn="buscarClientes"
                                    :initial-item="clienteInicial" value-key="idCliente" label-key="nombreCompleto"
                                    sub-label-key="email" placeholder="Buscar cliente..." :min-chars="2"
                                    :disabled="origen === 'reservacion' && !!form.reservacionId" />
                            </div>
                        </div>

                        <!-- Datos fiscales — solo crédito fiscal -->
                        <template v-if="form.tipo === 'credito_fiscal'">
                            <p class="section-label">Datos fiscales</p>
                            <div class="form-grid">
                                <div class="field-group">
                                    <label class="field-label">NIT *</label>
                                    <input v-model="form.clienteNit" type="text" class="field-input"
                                        placeholder="0000-000000-000-0" />
                                </div>
                                <div class="field-group">
                                    <label class="field-label">NRC</label>
                                    <input v-model="form.clienteNrc" type="text" class="field-input"
                                        placeholder="000000-0" />
                                </div>
                                <div class="field-group">
                                    <label class="field-label">Giro / Actividad</label>
                                    <input v-model="form.clienteGiro" type="text" class="field-input"
                                        placeholder="Ej: Comercio" />
                                </div>
                                <div class="field-group">
                                    <label class="field-label">Dirección fiscal</label>
                                    <input v-model="form.clienteDireccion" type="text" class="field-input"
                                        placeholder="Dirección" />
                                </div>
                            </div>
                        </template>

                        <!-- Ítems -->
                        <div class="items-header">
                            <p class="section-label" style="margin:0">Ítems</p>
                            <button class="btn-add-item" @click="agregarItem">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2.5">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Agregar ítem
                            </button>
                        </div>

                        <div class="items-table-wrapper">
                            <table class="items-table">
                                <thead>
                                    <tr>
                                        <th>Descripción</th>
                                        <th>Cant.</th>
                                        <th>Precio unit.</th>
                                        <th>Subtotal</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, i) in form.items" :key="i">
                                        <td>
                                            <input v-model="item.descripcion" type="text" class="item-input"
                                                placeholder="Descripción del servicio..." />
                                        </td>
                                        <td>
                                            <input v-model.number="item.cantidad" type="number" min="1"
                                                class="item-input item-num" @input="recalcularItem(item)" />
                                        </td>
                                        <td>
                                            <input v-model.number="item.precioUnit" type="number" min="0" step="0.01"
                                                class="item-input item-num" @input="recalcularItem(item)" />
                                        </td>
                                        <td class="item-subtotal">${{ fmt(item.cantidad * item.precioUnit) }}</td>
                                        <td>
                                            <button class="item-remove" @click="quitarItem(i)"
                                                :disabled="form.items.length === 1">
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                                    stroke="currentColor" stroke-width="2">
                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Resumen fiscal -->
                        <div class="resumen-fiscal">
                            <div class="resumen-row">
                                <span>Subtotal</span>
                                <span>${{ fmt(totales.subtotal) }}</span>
                            </div>
                            <div class="resumen-row iva">
                                <span>IVA (13%)</span>
                                <span>${{ fmt(totales.iva) }}</span>
                            </div>
                            <div class="resumen-row turismo">
                                <span>Contrib. Turismo (5%)</span>
                                <span>${{ fmt(totales.turismo) }}</span>
                            </div>
                            <div class="resumen-row total">
                                <span>TOTAL</span>
                                <span>${{ fmt(totales.total) }}</span>
                            </div>
                        </div>

                        <!-- Notas -->
                        <div class="field-group">
                            <label class="field-label">Notas</label>
                            <input v-model="form.notas" type="text" class="field-input" placeholder="Opcional" />
                        </div>

                        <div v-if="formError" class="form-error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {{ formError }}
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="btn-secondary" @click="cerrarModal">Cancelar</button>
                        <button class="btn-primary" :disabled="guardando" @click="guardar">
                            <span v-if="!guardando">Emitir factura</span>
                            <span v-else class="btn-loading">
                                <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                                Emitiendo...
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Modal Anular -->
        <Transition name="modal">
            <div v-if="modalAnular" class="modal-overlay" @click.self="cerrarModalAnular">
                <div class="modal">
                    <div class="modal-header">
                        <div>
                            <h2 class="modal-title">Anular factura</h2>
                            <p class="modal-subtitle">{{ facturaAnular?.numeroFactura }}</p>
                        </div>
                        <button class="modal-close" @click="cerrarModalAnular">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="anular-warning">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <path
                                    d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            Esta acción no se puede deshacer. La factura quedará marcada como anulada.
                        </div>
                        <div class="field-group">
                            <label class="field-label">Motivo de anulación *</label>
                            <input v-model="motivoAnulacion" type="text" class="field-input"
                                placeholder="Ingresa el motivo..." />
                        </div>
                        <div v-if="anularError" class="form-error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {{ anularError }}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" @click="cerrarModalAnular">Cancelar</button>
                        <button class="btn-danger" :disabled="anularLoading || !motivoAnulacion.trim()"
                            @click="confirmarAnulacion">
                            <span v-if="!anularLoading">Anular factura</span>
                            <span v-else class="btn-loading">
                                <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                                Anulando...
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Modal Detalle / PDF -->
        <Transition name="modal">
            <div v-if="modalDetalle" class="modal-overlay" @click.self="cerrarDetalle">
                <div class="modal modal-xl">
                    <div class="modal-header">
                        <div>
                            <h2 class="modal-title">{{ detalleFactura?.numeroFactura }}</h2>
                            <p class="modal-subtitle">{{ detalleFactura?.tipo === 'consumidor_final' ? 'Consumidor Final' :
                                'Crédito Fiscal' }}</p>
                        </div>
                        <div style="display:flex;gap:8px;align-items:center">
                            <button class="btn-primary" @click="descargarPDF" :disabled="generandoPDF">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                {{ generandoPDF ? 'Generando...' : 'Descargar PDF' }}
                            </button>
                            <button class="modal-close" @click="cerrarDetalle">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Contenido de la factura (este div se convierte en PDF) -->
                    <div class="modal-body">
                        <div id="factura-pdf-content" class="factura-doc">

                            <!-- Cabecera del documento -->
                            <div class="fdoc-header">
                                <div class="fdoc-empresa">
                                    <h2 class="fdoc-empresa-nombre">Hotel del Sistema</h2>
                                    <p>NIT: 0000-000000-000-0 &nbsp;·&nbsp; NRC: 000000-0</p>
                                    <p>San Salvador, El Salvador</p>
                                </div>
                                <div class="fdoc-numero">
                                    <div class="fdoc-tipo-label">
                                        {{ detalleFactura?.tipo === 'consumidor_final' ? 'FACTURA' : 'COMPROBANTE DE CRÉDITO FISCAL' }}
                                    </div>
                                    <div class="fdoc-num">{{ detalleFactura?.numeroFactura }}</div>
                                    <div class="fdoc-fecha">{{ formatFechaLarga(detalleFactura?.fechaEmision) }}</div>
                                    <span v-if="detalleFactura?.estado === 'anulada'"
                                        class="fdoc-anulada">ANULADA</span>
                                </div>
                            </div>

                            <div class="fdoc-divider"></div>

                            <!-- Datos del cliente -->
                            <div class="fdoc-cliente">
                                <div class="fdoc-cliente-col">
                                    <p class="fdoc-label">Cliente</p>
                                    <p class="fdoc-value">{{ detalleFactura?.clienteNombre }}</p>
                                    <p class="fdoc-sub">{{ detalleFactura?.clienteEmail }}</p>
                                    <p v-if="detalleFactura?.clienteDui" class="fdoc-sub">DUI: {{
                                        detalleFactura.clienteDui }}
                                    </p>
                                </div>
                                <div v-if="detalleFactura?.tipo === 'credito_fiscal'" class="fdoc-cliente-col">
                                    <p class="fdoc-label">Datos fiscales</p>
                                    <p v-if="detalleFactura.clienteNit" class="fdoc-sub">NIT: {{
                                        detalleFactura.clienteNit }}
                                    </p>
                                    <p v-if="detalleFactura.clienteNrc" class="fdoc-sub">NRC: {{
                                        detalleFactura.clienteNrc }}
                                    </p>
                                    <p v-if="detalleFactura.clienteGiro" class="fdoc-sub">Giro: {{
                                        detalleFactura.clienteGiro }}
                                    </p>
                                    <p v-if="detalleFactura.clienteDireccion" class="fdoc-sub">{{
                                        detalleFactura.clienteDireccion }}</p>
                                </div>
                                <div v-if="detalleFactura?.reservacion" class="fdoc-cliente-col">
                                    <p class="fdoc-label">Reservación</p>
                                    <p class="fdoc-sub">Hab. {{ detalleFactura.reservacion.habitacion.numero }} — {{
                                        detalleFactura.reservacion.habitacion.tipo.nombre }}</p>
                                    <p class="fdoc-sub">Check-in: {{
                                        formatFecha(detalleFactura.reservacion.fechaEntrada) }}</p>
                                    <p class="fdoc-sub">Check-out: {{
                                        formatFecha(detalleFactura.reservacion.fechaSalida) }}</p>
                                </div>
                            </div>

                            <div class="fdoc-divider"></div>

                            <!-- Tabla de ítems -->
                            <table class="fdoc-items">
                                <thead>
                                    <tr>
                                        <th>Descripción</th>
                                        <th class="text-right">Cant.</th>
                                        <th class="text-right">Precio unit.</th>
                                        <th class="text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in detalleFactura?.items" :key="item.idItem">
                                        <td>{{ item.descripcion }}</td>
                                        <td class="text-right">{{ item.cantidad }}</td>
                                        <td class="text-right">${{ fmt(item.precioUnit) }}</td>
                                        <td class="text-right">${{ fmt(item.subtotal) }}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div class="fdoc-divider"></div>

                            <!-- Totales -->
                            <div class="fdoc-totales">
                                <div class="fdoc-total-row">
                                    <span>Subtotal</span>
                                    <span>${{ fmt(detalleFactura?.subtotalConDesc) }}</span>
                                </div>
                                <div class="fdoc-total-row">
                                    <span>IVA (13%)</span>
                                    <span>${{ fmt(detalleFactura?.iva) }}</span>
                                </div>
                                <div class="fdoc-total-row">
                                    <span>Contrib. Especial Turismo (5%)</span>
                                    <span>${{ fmt(detalleFactura?.turismo) }}</span>
                                </div>
                                <div class="fdoc-total-row fdoc-grand-total">
                                    <span>TOTAL A PAGAR</span>
                                    <span>${{ fmt(detalleFactura?.total) }}</span>
                                </div>
                            </div>

                            <!-- Notas y motivo anulación -->
                            <div v-if="detalleFactura?.notas" class="fdoc-notas">
                                <strong>Notas:</strong> {{ detalleFactura.notas }}
                            </div>
                            <div v-if="detalleFactura?.motivoAnulacion" class="fdoc-anulacion-motivo">
                                <strong>Motivo de anulación:</strong> {{ detalleFactura.motivoAnulacion }}
                            </div>

                            <div class="fdoc-footer">
                                <p>Documento generado electrónicamente · {{ formatFechaLarga(new Date().toISOString())
                                    }}</p>
                            </div>
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
import { facturacionApi, clientesApi, reservacionesApi } from '../../services/api'
import SearchSelect from '../../components/SearchSelect.vue'

const auth = useAuthStore()

const facturas = ref<any[]>([])
const loading = ref(true)
const errorGlobal = ref('')
const filtros = reactive({ search: '', tipo: '', estado: '' })

// Modal nueva factura
const modalAbierto = ref(false)
const guardando = ref(false)
const formError = ref('')
const origen = ref<'reservacion' | 'manual'>('reservacion')
const clienteInicial = ref<any>(null)

const itemVacio = () => ({ descripcion: '', cantidad: 1, precioUnit: 0 })
const formVacio = () => ({
    tipo: 'consumidor_final' as 'consumidor_final' | 'credito_fiscal',
    clienteId: null as any,
    reservacionId: null as any,
    clienteNit: '', clienteNrc: '', clienteGiro: '', clienteDireccion: '',
    notas: '',
    items: [itemVacio()],
})
const form = ref(formVacio())

// Modal anular
const modalAnular = ref(false)
const facturaAnular = ref<any>(null)
const motivoAnulacion = ref('')
const anularLoading = ref(false)
const anularError = ref('')

// Modal detalle
const modalDetalle = ref(false)
const detalleFactura = ref<any>(null)
const generandoPDF = ref(false)

const IVA = 0.13
const TURISMO = 0.05

const totales = computed(() => {
    const subtotal = form.value.items.reduce((s, i) => s + (i.cantidad * i.precioUnit), 0)
    const iva = subtotal * IVA
    const turismo = subtotal * TURISMO
    const total = subtotal + iva + turismo
    return { subtotal, iva, turismo, total }
})

onMounted(() => cargar())

async function cargar() {
    try {
        loading.value = true
        errorGlobal.value = ''
        const params: any = {}
        if (filtros.search) params.search = filtros.search
        if (filtros.tipo) params.tipo = filtros.tipo
        if (filtros.estado) params.estado = filtros.estado
        const { data } = await facturacionApi.getAll(params)
        facturas.value = data
    } catch {
        errorGlobal.value = 'No se pudieron cargar las facturas'
    } finally {
        loading.value = false
    }
}

// Funciones de búsqueda
async function buscarClientes(search: string) {
    const { data } = await clientesApi.getAll(search)
    return data
        .filter((c: any) => c.activo)
        .map((c: any) => ({ ...c, nombreCompleto: `${c.nombre} ${c.apellido}` }))
}

async function buscarReservaciones(search: string) {
    const { data } = await reservacionesApi.getAll({ search })
    return data
        .filter((r: any) => ['completada', 'en_curso'].includes(r.estado))
        .map((r: any) => ({
            ...r,
            idReservacion: r.idReservacion,
            label: `#${r.idReservacion} — ${r.cliente.nombre} ${r.cliente.apellido}`,
            sub: `Hab. ${r.habitacion.numero} · ${formatFecha(r.fechaEntrada)} → ${formatFecha(r.fechaSalida)}`,
        }))
}

async function onReservacionSelect(item: any) {
    if (!item) {
        form.value.clienteId = null
        form.value.items = [itemVacio()]
        clienteInicial.value = null
        return
    }
    try {
        const { data } = await facturacionApi.getItemsDesdeReservacion(item.idReservacion)
        form.value.clienteId = data.cliente.idCliente
        form.value.items = data.items
        clienteInicial.value = {
            ...data.cliente,
            nombreCompleto: `${data.cliente.nombre} ${data.cliente.apellido}`,
        }
    } catch (e: any) {
        formError.value = e?.response?.data?.message ?? 'Error al cargar la reservación'
    }
}

function setOrigen(o: 'reservacion' | 'manual') {
    origen.value = o
    form.value.reservacionId = null
    form.value.clienteId = null
    form.value.items = [itemVacio()]
    clienteInicial.value = null
    formError.value = ''
}

// Ítems
function agregarItem() {
    form.value.items.push(itemVacio())
}

function quitarItem(i: number) {
    if (form.value.items.length > 1) form.value.items.splice(i, 1)
}

function recalcularItem(_item: any) {
    // totales se recalcula automáticamente vía computed
}

// Guardar
function abrirModal() {
    form.value = formVacio()
    clienteInicial.value = null
    origen.value = 'reservacion'
    formError.value = ''
    modalAbierto.value = true
}

function cerrarModal() { modalAbierto.value = false }

async function guardar() {
    guardando.value = true
    formError.value = ''
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
            items: form.value.items,
        }
        const { data } = await facturacionApi.create(payload)
        cerrarModal()
        cargar()
        // Abrir detalle automáticamente para descargar PDF
        abrirDetalle(data)
    } catch (e: any) {
        const msg = e?.response?.data?.message
        formError.value = Array.isArray(msg) ? msg[0] : (msg ?? 'Ocurrió un error')
    } finally {
        guardando.value = false
    }
}

// Anular
function abrirModalAnular(f: any) {
    facturaAnular.value = f
    motivoAnulacion.value = ''
    anularError.value = ''
    modalAnular.value = true
}

function cerrarModalAnular() { modalAnular.value = false }

async function confirmarAnulacion() {
    if (!motivoAnulacion.value.trim()) return
    anularLoading.value = true
    anularError.value = ''
    try {
        await facturacionApi.anular(facturaAnular.value.idFactura, { motivoAnulacion: motivoAnulacion.value })
        cerrarModalAnular()
        cargar()
    } catch (e: any) {
        anularError.value = e?.response?.data?.message ?? 'Error al anular'
    } finally {
        anularLoading.value = false
    }
}

// Detalle y PDF
function abrirDetalle(f: any) {
    detalleFactura.value = f
    modalDetalle.value = true
}

function cerrarDetalle() { modalDetalle.value = false }

async function descargarPDF() {
    generandoPDF.value = true
    try {
        // Carga dinámica de jsPDF + html2canvas
        const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
            import('jspdf'),
            import('html2canvas'),
        ])

        const el = document.getElementById('factura-pdf-content')
        if (!el) return

        const canvas = await html2canvas(el, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
        })

        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
        const pdfW = pdf.internal.pageSize.getWidth()
        const pdfH = (canvas.height * pdfW) / canvas.width

        pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH)
        pdf.save(`${detalleFactura.value?.numeroFactura}.pdf`)
    } catch (err) {
        console.error('Error generando PDF:', err)
    } finally {
        generandoPDF.value = false
    }
}

// Helpers
function fmt(val: any) { return Number(val ?? 0).toFixed(2) }

function formatFecha(fecha: string) {
    if (!fecha) return ''
    return new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatFechaLarga(fecha: string) {
    if (!fecha) return ''
    return new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

.facturacion-page {
    font-family: 'Sora', sans-serif;
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 1200px;
}

/* Header */
.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.page-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 4px;
    letter-spacing: -0.02em;
}

.page-subtitle {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 0;
    font-weight: 300;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.header-badge {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--accent);
    background: var(--accent-light);
    border: 1px solid var(--accent-border);
    border-radius: 99px;
    padding: 4px 14px;
}

/* Botones */
.btn-primary {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 16px;
    background: linear-gradient(135deg, #6366f1, #818cf8);
    color: white;
    border: none;
    border-radius: 9px;
    font-size: 0.85rem;
    font-weight: 500;
    font-family: 'Sora', sans-serif;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

.btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.btn-secondary {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 16px;
    background: var(--bg-card);
    color: var(--text-secondary);
    border: 1.5px solid var(--border);
    border-radius: 9px;
    font-size: 0.85rem;
    font-weight: 500;
    font-family: 'Sora', sans-serif;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-secondary:hover {
    background: var(--bg-hover);
}

.btn-danger {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 16px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 9px;
    font-size: 0.85rem;
    font-weight: 500;
    font-family: 'Sora', sans-serif;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-danger:hover:not(:disabled) {
    background: #dc2626;
}

.btn-danger:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.btn-loading {
    display: flex;
    align-items: center;
    gap: 6px;
}

/* Filtros */
.filters-row {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
}

.search-wrapper {
    position: relative;
    flex: 1;
    min-width: 200px;
}

.search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    display: flex;
    align-items: center;
}

.search-input {
    width: 100%;
    padding: 9px 12px 9px 36px;
    border: 1.5px solid var(--border);
    border-radius: 9px;
    font-size: 0.875rem;
    font-family: 'Sora', sans-serif;
    color: var(--text-primary);
    background: var(--bg-card);
    transition: all 0.2s;
    outline: none;
    box-sizing: border-box;
}

.search-input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.search-input::placeholder {
    color: var(--text-muted);
}

.filter-select {
    padding: 9px 12px;
    border: 1.5px solid var(--border);
    border-radius: 9px;
    font-size: 0.85rem;
    font-family: 'Sora', sans-serif;
    color: var(--text-primary);
    background: var(--bg-card);
    outline: none;
    cursor: pointer;
    transition: all 0.2s;
}

.filter-select:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

/* Estados */
.state-box {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 48px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 14px;
    color: var(--text-muted);
    font-size: 0.9rem;
}

.error-box {
    color: #ef4444;
    background: #fef2f2;
    border-color: #fecaca;
}

.spin {
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Tabla */
.table-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.fact-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
}

thead tr {
    background: var(--bg-app);
    border-bottom: 1px solid var(--border);
}

th {
    padding: 12px 16px;
    text-align: left;
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

tbody tr {
    border-bottom: 1px solid var(--border);
    transition: background 0.15s;
}

tbody tr:last-child {
    border-bottom: none;
}

tbody tr:hover {
    background: var(--bg-hover);
}

tbody tr.anulada {
    opacity: 0.55;
}

td {
    padding: 12px 16px;
    color: var(--text-primary);
    vertical-align: middle;
}

.td-numero {
    font-weight: 600;
    font-size: 0.82rem;
    color: var(--accent);
}

.td-date {
    color: var(--text-secondary);
    font-size: 0.82rem;
    white-space: nowrap;
}

.td-money {
    text-align: right;
    font-size: 0.85rem;
}

.td-muted {
    color: var(--text-muted);
}

.td-total {
    font-weight: 600;
    color: var(--text-primary);
}

.user-cell {
    display: flex;
    align-items: center;
    gap: 10px;
}

.user-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #a5b4fc);
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.cell-name {
    display: block;
    font-size: 0.85rem;
}

.cell-sub {
    display: block;
    font-size: 0.72rem;
    color: var(--text-muted);
    margin-top: 1px;
}

.tipo-badge {
    font-size: 0.72rem;
    font-weight: 500;
    padding: 3px 10px;
    border-radius: 99px;
    white-space: nowrap;
}

.tipo-badge.consumidor_final {
    background: #eff6ff;
    color: #2563eb;
    border: 1px solid #bfdbfe;
}

.tipo-badge.credito_fiscal {
    background: #f5f3ff;
    color: #7c3aed;
    border: 1px solid #ddd6fe;
}

.estado-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.72rem;
    font-weight: 500;
    padding: 3px 10px;
    border-radius: 99px;
}

.estado-badge.emitida {
    background: #f0fdf4;
    color: #16a34a;
    border: 1px solid #bbf7d0;
}

.estado-badge.anulada {
    background: #fef2f2;
    color: #ef4444;
    border: 1px solid #fecaca;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
}

.actions {
    display: flex;
    gap: 6px;
}

.action-btn {
    width: 30px;
    height: 30px;
    border-radius: 7px;
    border: 1.5px solid var(--border);
    background: var(--bg-card);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.18s;
    color: var(--text-muted);
}

.detail-btn:hover {
    background: #f5f3ff;
    border-color: #ddd6fe;
    color: #7c3aed;
}

.deactivate-btn:hover {
    background: #fef2f2;
    border-color: #fecaca;
    color: #ef4444;
}

.empty-state {
    text-align: center;
    padding: 48px;
    color: var(--text-muted);
    font-size: 0.9rem;
}

/* Modal */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
}

.modal {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 16px;
    width: 100%;
    max-width: 480px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
    overflow: hidden;
}

.modal-xl {
    max-width: 720px;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border);
}

.modal-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
}

.modal-subtitle {
    font-size: 0.78rem;
    color: var(--text-muted);
    margin: 2px 0 0;
    font-weight: 300;
}

.modal-close {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    border: 1.5px solid var(--border);
    background: var(--bg-card);
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.18s;
}

.modal-close:hover {
    background: #fef2f2;
    border-color: #fecaca;
    color: #ef4444;
}

.modal-body {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 72vh;
    overflow-y: auto;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px 20px;
    border-top: 1px solid var(--border);
}

/* Form */
.section-label {
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.field-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.full-width {
    grid-column: 1 / -1;
}

.field-label {
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--text-secondary);
}

.field-input {
    padding: 9px 12px;
    border: 1.5px solid var(--border);
    border-radius: 9px;
    font-size: 0.875rem;
    font-family: 'Sora', sans-serif;
    color: var(--text-primary);
    background: var(--bg-app);
    transition: all 0.2s;
    outline: none;
}

.field-input:focus {
    border-color: #6366f1;
    background: var(--bg-card);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.field-input::placeholder {
    color: var(--text-muted);
}

.form-error {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    color: #ef4444;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 8px 12px;
}

/* Tipo selector */
.tipo-selector {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.tipo-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px 12px;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    background: var(--bg-app);
    cursor: pointer;
    font-family: 'Sora', sans-serif;
    transition: all 0.18s;
    color: var(--text-muted);
}

.tipo-option:hover {
    border-color: #6366f1;
    background: var(--bg-hover);
    color: #6366f1;
}

.tipo-option.selected {
    border-color: #6366f1;
    background: #eef2ff;
    color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.tipo-option-label {
    font-size: 0.85rem;
    font-weight: 600;
}

.tipo-option-sub {
    font-size: 0.7rem;
    font-weight: 300;
    color: var(--text-muted);
    text-align: center;
}

.tipo-option.selected .tipo-option-sub {
    color: #818cf8;
}

/* Origen selector */
.origen-selector {
    display: flex;
    gap: 8px;
}

.origen-option {
    padding: 8px 16px;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    background: var(--bg-app);
    cursor: pointer;
    font-size: 0.82rem;
    font-family: 'Sora', sans-serif;
    color: var(--text-secondary);
    transition: all 0.18s;
}

.origen-option:hover {
    border-color: #6366f1;
    background: var(--bg-hover);
}

.origen-option.selected {
    border-color: #6366f1;
    background: #eef2ff;
    color: #6366f1;
    font-weight: 500;
}

/* Ítems */
.items-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.btn-add-item {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border: 1.5px solid var(--border);
    border-radius: 7px;
    background: var(--bg-app);
    color: var(--text-secondary);
    font-size: 0.78rem;
    font-family: 'Sora', sans-serif;
    cursor: pointer;
    transition: all 0.18s;
}

.btn-add-item:hover {
    border-color: #6366f1;
    color: #6366f1;
    background: var(--bg-hover);
}

.items-table-wrapper {
    border: 1.5px solid var(--border);
    border-radius: 9px;
    overflow: hidden;
}

.items-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.82rem;
}

.items-table thead tr {
    background: var(--bg-app);
    border-bottom: 1px solid var(--border);
}

.items-table th {
    padding: 8px 12px;
    text-align: left;
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.items-table tbody tr {
    border-bottom: 1px solid var(--border);
}

.items-table tbody tr:last-child {
    border-bottom: none;
}

.items-table td {
    padding: 6px 8px;
}

.item-input {
    width: 100%;
    padding: 7px 10px;
    border: 1.5px solid transparent;
    border-radius: 7px;
    font-size: 0.82rem;
    font-family: 'Sora', sans-serif;
    color: var(--text-primary);
    background: transparent;
    outline: none;
    transition: all 0.15s;
}

.item-input:focus {
    border-color: #6366f1;
    background: var(--bg-card);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.item-num {
    width: 80px;
    text-align: right;
}

.item-subtotal {
    text-align: right;
    font-weight: 500;
    color: var(--text-primary);
    padding: 6px 12px;
}

.item-remove {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: 1.5px solid transparent;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
}

.item-remove:hover:not(:disabled) {
    border-color: #fecaca;
    background: #fef2f2;
    color: #ef4444;
}

.item-remove:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

/* Resumen fiscal */
.resumen-fiscal {
    background: var(--bg-app);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.resumen-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: var(--text-secondary);
}

.resumen-row.iva {
    color: var(--text-muted);
    font-size: 0.8rem;
}

.resumen-row.turismo {
    color: var(--text-muted);
    font-size: 0.8rem;
}

.resumen-row.total {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    border-top: 1px solid var(--border);
    padding-top: 8px;
    margin-top: 2px;
}

/* Anular warning */
.anular-warning {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 9px;
    font-size: 0.82rem;
    color: #92400e;
}

/* Documento Factura (PDF) */
.factura-doc {
    background: white;
    color: #1a1a1a;
    font-family: 'Sora', sans-serif;
    padding: 40px;
    border-radius: 10px;
    border: 1px solid var(--border);
}

.fdoc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
}

.fdoc-empresa-nombre {
    font-size: 1.2rem;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 6px;
}

.fdoc-empresa p {
    font-size: 0.78rem;
    color: #555;
    margin: 2px 0;
}

.fdoc-numero {
    text-align: right;
}

.fdoc-tipo-label {
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6366f1;
    margin-bottom: 4px;
}

.fdoc-num {
    font-size: 1.3rem;
    font-weight: 700;
    color: #1a1a1a;
}

.fdoc-fecha {
    font-size: 0.78rem;
    color: #555;
    margin-top: 4px;
}

.fdoc-anulada {
    display: inline-block;
    margin-top: 8px;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #ef4444;
    border: 2px solid #ef4444;
    border-radius: 4px;
    padding: 2px 8px;
}

.fdoc-divider {
    height: 1px;
    background: #e5e7eb;
    margin: 16px 0;
}

.fdoc-cliente {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 4px;
}

.fdoc-cliente-col {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.fdoc-label {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #9ca3af;
    margin: 0 0 4px;
}

.fdoc-value {
    font-size: 0.88rem;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
}

.fdoc-sub {
    font-size: 0.78rem;
    color: #555;
    margin: 1px 0;
}

.fdoc-items {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.82rem;
    margin-top: 4px;
}

.fdoc-items thead tr {
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;
}

.fdoc-items th {
    padding: 10px 12px;
    text-align: left;
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
}

.fdoc-items tbody tr {
    border-bottom: 1px solid #f3f4f6;
}

.fdoc-items td {
    padding: 10px 12px;
    color: #374151;
}

.text-right {
    text-align: right;
}

.fdoc-totales {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-width: 280px;
    margin-left: auto;
    margin-top: 4px;
}

.fdoc-total-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.82rem;
    color: #6b7280;
}

.fdoc-grand-total {
    font-size: 1rem;
    font-weight: 700;
    color: #1a1a1a;
    border-top: 2px solid #e5e7eb;
    padding-top: 8px;
    margin-top: 4px;
}

.fdoc-notas {
    font-size: 0.78rem;
    color: #555;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 10px 14px;
}

.fdoc-anulacion-motivo {
    font-size: 0.78rem;
    color: #dc2626;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 10px 14px;
}

.fdoc-footer {
    margin-top: 24px;
    text-align: center;
    font-size: 0.7rem;
    color: #9ca3af;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.2s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
    transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
    transform: scale(0.95) translateY(10px);
}
</style>