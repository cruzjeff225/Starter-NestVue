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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
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
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
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
            <svg class="spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Cargando facturas...
        </div>
        <div v-else-if="errorGlobal" class="state-box error-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {{ errorGlobal }}
        </div>

        <!-- Tabla -->
        <div v-else class="table-card">
            <table class="fact-table">
                <thead>
                    <tr>
                        <th>Número</th><th>Tipo</th><th>Cliente</th><th>Fecha</th>
                        <th>Subtotal</th><th>IVA</th><th>Turismo</th><th>Total</th>
                        <th>Estado</th><th>Acciones</th>
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
                                <button class="action-btn detail-btn" title="Ver / Descargar PDF" @click="abrirDetalle(f)">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                        <polyline points="14 2 14 8 20 8"/>
                                    </svg>
                                </button>
                                <button v-if="auth.tienePermiso('facturacion:anular') && f.estado === 'emitida'"
                                    class="action-btn deactivate-btn" title="Anular factura" @click="abrirModalAnular(f)">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
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

        <!-- ── Modal Nueva Factura ── -->
        <Transition name="modal">
            <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
                <div class="modal modal-xl">
                    <div class="modal-header">
                        <h2 class="modal-title">Nueva factura</h2>
                        <button class="modal-close" @click="cerrarModal">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">

                        <p class="section-label">Tipo de documento</p>
                        <div class="tipo-selector">
                            <button class="tipo-option" :class="{ selected: form.tipo === 'consumidor_final' }" @click="form.tipo = 'consumidor_final'">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                                </svg>
                                <span class="tipo-option-label">Consumidor Final</span>
                                <span class="tipo-option-sub">Sin desglose de IVA</span>
                            </button>
                            <button class="tipo-option" :class="{ selected: form.tipo === 'credito_fiscal' }" @click="form.tipo = 'credito_fiscal'">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                                    <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                                </svg>
                                <span class="tipo-option-label">Crédito Fiscal</span>
                                <span class="tipo-option-sub">IVA desglosado, requiere NIT</span>
                            </button>
                        </div>

                        <p class="section-label">Origen</p>
                        <div class="origen-selector">
                            <button class="origen-option" :class="{ selected: origen === 'reservacion' }" @click="setOrigen('reservacion')">
                                📅 Desde reservación
                            </button>
                            <button class="origen-option" :class="{ selected: origen === 'manual' }" @click="setOrigen('manual')">
                                ✏️ Manual
                            </button>
                        </div>

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

                        <p class="section-label">Cliente</p>
                        <div class="form-grid">
                            <div class="field-group full-width">
                                <label class="field-label">Cliente *</label>
                                <SearchSelect v-model="form.clienteId" :fetch-fn="buscarClientes"
                                    :initial-item="clienteInicial" value-key="idCliente" label-key="nombreCompleto"
                                    sub-label-key="email" placeholder="Buscar cliente..." :min-chars="2"
                                    :disabled="origen === 'reservacion' && !!form.reservacionId" />
                            </div>
                        </div>

                        <template v-if="form.tipo === 'credito_fiscal'">
                            <p class="section-label">Datos fiscales</p>
                            <div class="form-grid">
                                <div class="field-group">
                                    <label class="field-label">NIT *</label>
                                    <input v-model="form.clienteNit" type="text" class="field-input" placeholder="0000-000000-000-0" />
                                </div>
                                <div class="field-group">
                                    <label class="field-label">NRC</label>
                                    <input v-model="form.clienteNrc" type="text" class="field-input" placeholder="000000-0" />
                                </div>
                                <div class="field-group">
                                    <label class="field-label">Giro / Actividad</label>
                                    <input v-model="form.clienteGiro" type="text" class="field-input" placeholder="Ej: Comercio" />
                                </div>
                                <div class="field-group">
                                    <label class="field-label">Dirección fiscal</label>
                                    <input v-model="form.clienteDireccion" type="text" class="field-input" placeholder="Dirección" />
                                </div>
                            </div>
                        </template>

                        <div class="items-header">
                            <p class="section-label" style="margin:0">Ítems</p>
                            <button class="btn-add-item" @click="agregarItem">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                Agregar ítem
                            </button>
                        </div>

                        <div class="items-table-wrapper">
                            <table class="items-table">
                                <thead>
                                    <tr>
                                        <th>Descripción</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th><th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, i) in form.items" :key="i">
                                        <td><input v-model="item.descripcion" type="text" class="item-input" placeholder="Descripción del servicio..." /></td>
                                        <td><input v-model.number="item.cantidad" type="number" min="1" class="item-input item-num" /></td>
                                        <td><input v-model.number="item.precioUnit" type="number" min="0" step="0.01" class="item-input item-num" /></td>
                                        <td class="item-subtotal">${{ fmt(item.cantidad * item.precioUnit) }}</td>
                                        <td>
                                            <button class="item-remove" @click="quitarItem(i)" :disabled="form.items.length === 1">
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="resumen-fiscal">
                            <div class="resumen-row">
                                <span>Subtotal</span><span>${{ fmt(totales.subtotal) }}</span>
                            </div>
                            <div v-if="form.tipo === 'credito_fiscal'" class="resumen-row iva">
                                <span>IVA (13%)</span><span>${{ fmt(totales.iva) }}</span>
                            </div>
                            <div class="resumen-row turismo">
                                <span>Contrib. Turismo (5%)</span><span>${{ fmt(totales.turismo) }}</span>
                            </div>
                            <div class="resumen-row total">
                                <span>TOTAL</span><span>${{ fmt(totales.total) }}</span>
                            </div>
                        </div>

                        <div class="field-group">
                            <label class="field-label">Notas / Observaciones</label>
                            <input v-model="form.notas" type="text" class="field-input" placeholder="Opcional" />
                        </div>

                        <div v-if="formError" class="form-error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            {{ formError }}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" @click="cerrarModal">Cancelar</button>
                        <button class="btn-primary" :disabled="guardando" @click="guardar">
                            <span v-if="!guardando">Emitir factura</span>
                            <span v-else class="btn-loading">
                                <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                </svg>
                                Emitiendo...
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- ── Modal Anular ── -->
        <Transition name="modal">
            <div v-if="modalAnular" class="modal-overlay" @click.self="cerrarModalAnular">
                <div class="modal">
                    <div class="modal-header">
                        <div>
                            <h2 class="modal-title">Anular factura</h2>
                            <p class="modal-subtitle">{{ facturaAnular?.numeroFactura }}</p>
                        </div>
                        <button class="modal-close" @click="cerrarModalAnular">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="anular-warning">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            Esta acción no se puede deshacer. La factura quedará marcada como anulada.
                        </div>
                        <div class="field-group">
                            <label class="field-label">Motivo de anulación *</label>
                            <input v-model="motivoAnulacion" type="text" class="field-input" placeholder="Ingresa el motivo..." />
                        </div>
                        <div v-if="anularError" class="form-error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            {{ anularError }}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" @click="cerrarModalAnular">Cancelar</button>
                        <button class="btn-danger" :disabled="anularLoading || !motivoAnulacion.trim()" @click="confirmarAnulacion">
                            <span v-if="!anularLoading">Anular factura</span>
                            <span v-else class="btn-loading">
                                <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                </svg>
                                Anulando...
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- ── Modal Detalle / PDF ── -->
        <Transition name="modal">
            <div v-if="modalDetalle" class="modal-overlay" @click.self="cerrarDetalle">
                <div class="modal modal-pdf">
                    <div class="modal-header">
                        <div>
                            <h2 class="modal-title">{{ detalleFactura?.numeroFactura }}</h2>
                            <p class="modal-subtitle">{{ detalleFactura?.tipo === 'consumidor_final' ? 'Consumidor Final' : 'Crédito Fiscal' }}</p>
                        </div>
                        <div style="display:flex;gap:8px;align-items:center">
                            <button class="btn-primary" @click="descargarPDF" :disabled="generandoPDF">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                                {{ generandoPDF ? 'Generando...' : 'Descargar PDF' }}
                            </button>
                            <button class="modal-close" @click="cerrarDetalle">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="modal-body">
                        <!-- ══════════════════════════════════════════════
                             DOCUMENTO TRIBUTARIO ELECTRÓNICO
                             Formato: Ministerio de Hacienda El Salvador
                        ══════════════════════════════════════════════ -->
                        <div id="factura-pdf-content" class="dte-doc">

                            <!-- ── Título del documento ── -->
                            <div class="dte-titulo">
                                <p>DOCUMENTO DE CONSULTA PORTAL OPERATIVO</p>
                                <p>DOCUMENTO TRIBUTARIO ELECTRÓNICO</p>
                                <p class="dte-tipo-doc">{{ detalleFactura?.tipo === 'consumidor_final' ? 'FACTURA' : 'COMPROBANTE DE CRÉDITO FISCAL' }}</p>
                                <div v-if="detalleFactura?.estado === 'anulada'" class="dte-anulada-banner">
                                    ★ DOCUMENTO ANULADO ★
                                </div>
                            </div>

                            <!-- ── Fila de encabezado: códigos + modelo/transmisión ── -->
                            <div class="dte-encabezado">
                                <div class="dte-enc-izq">
                                    <div class="dte-enc-row">
                                        <span class="dte-enc-label">Código de generación:</span>
                                        <span class="dte-enc-val">{{ codigoGeneracion(detalleFactura) }}</span>
                                    </div>
                                    <div class="dte-enc-row">
                                        <span class="dte-enc-label">Número de control:</span>
                                        <span class="dte-enc-val">{{ numeroControl(detalleFactura) }}</span>
                                    </div>
                                    <div class="dte-enc-row">
                                        <span class="dte-enc-label">Sello de recepción:</span>
                                        <span class="dte-enc-val">{{ selloRecepcion(detalleFactura) }}</span>
                                    </div>
                                </div>
                                <div class="dte-enc-der">
                                    <div class="dte-enc-row">
                                        <span class="dte-enc-label">Modelo de facturación:</span>
                                        <span class="dte-enc-val">Modelo Facturación previo</span>
                                    </div>
                                    <div class="dte-enc-row">
                                        <span class="dte-enc-label">Tipo de transmisión:</span>
                                        <span class="dte-enc-val">Transmisión normal</span>
                                    </div>
                                    <div class="dte-enc-row">
                                        <span class="dte-enc-label">Fecha y hora de generación:</span>
                                        <span class="dte-enc-val">{{ formatFechaHora(detalleFactura?.fechaEmision) }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- ── Emisor / Receptor ── -->
                            <div class="dte-partes">
                                <!-- EMISOR -->
                                <div class="dte-parte">
                                    <div class="dte-parte-titulo">EMISOR</div>
                                    <p class="dte-parte-nombre">HOTEL DEL SISTEMA, S.A. DE C.V.</p>
                                    <p class="dte-parte-sub">CASA MATRIZ — SAN SALVADOR</p>
                                    <div class="dte-parte-grid">
                                        <span class="dte-pl">NIT</span><span class="dte-pv">0000-000000-000-0</span>
                                        <span class="dte-pl">NRC</span><span class="dte-pv">000000-0</span>
                                    </div>
                                    <div class="dte-parte-row"><span class="dte-pl">Actividad</span><span class="dte-pv">Servicios de hospedaje y turismo</span></div>
                                    <div class="dte-parte-row"><span class="dte-pl">Dirección</span><span class="dte-pv">San Salvador, El Salvador, C.A.</span></div>
                                    <div class="dte-parte-row"><span class="dte-pl">Teléfono</span><span class="dte-pv">0000-0000</span></div>
                                    <div class="dte-parte-row"><span class="dte-pl">Correo</span><span class="dte-pv">facturacion@hoteldelsistema.com</span></div>
                                    <div class="dte-parte-row"><span class="dte-pl">Tipo de establecimiento</span><span class="dte-pv">Casa Matriz</span></div>
                                </div>

                                <!-- RECEPTOR -->
                                <div class="dte-parte">
                                    <div class="dte-parte-titulo">RECEPTOR</div>
                                    <div class="dte-parte-row"><span class="dte-pl">Nombre</span><span class="dte-pv dte-pv-bold">{{ detalleFactura?.clienteNombre }}</span></div>
                                    <div class="dte-parte-row">
                                        <span class="dte-pl">Tipo de documento</span>
                                        <span class="dte-pv">{{ detalleFactura?.tipo === 'credito_fiscal' ? 'NIT' : 'DUI' }}</span>
                                    </div>
                                    <div class="dte-parte-row">
                                        <span class="dte-pl">No. documento identificación</span>
                                        <span class="dte-pv">{{ detalleFactura?.tipo === 'credito_fiscal' ? (detalleFactura?.clienteNit || '—') : (detalleFactura?.clienteDui || '—') }}</span>
                                    </div>
                                    <div class="dte-parte-row"><span class="dte-pl">Correo</span><span class="dte-pv">{{ detalleFactura?.clienteEmail }}</span></div>
                                    <template v-if="detalleFactura?.tipo === 'credito_fiscal'">
                                        <div class="dte-parte-row"><span class="dte-pl">NRC</span><span class="dte-pv">{{ detalleFactura?.clienteNrc || '—' }}</span></div>
                                        <div class="dte-parte-row"><span class="dte-pl">Giro</span><span class="dte-pv">{{ detalleFactura?.clienteGiro || '—' }}</span></div>
                                        <div class="dte-parte-row"><span class="dte-pl">Dirección</span><span class="dte-pv">{{ detalleFactura?.clienteDireccion || '—' }}</span></div>
                                    </template>
                                    <template v-if="detalleFactura?.reservacion">
                                        <div class="dte-parte-row"><span class="dte-pl">Reservación</span><span class="dte-pv">#{{ detalleFactura.reservacion.idReservacion }} — Hab. {{ detalleFactura.reservacion.habitacion.numero }}</span></div>
                                        <div class="dte-parte-row"><span class="dte-pl">Check-in</span><span class="dte-pv">{{ formatFecha(detalleFactura.reservacion.fechaEntrada) }}</span></div>
                                        <div class="dte-parte-row"><span class="dte-pl">Check-out</span><span class="dte-pv">{{ formatFecha(detalleFactura.reservacion.fechaSalida) }}</span></div>
                                    </template>
                                </div>
                            </div>

                            <!-- ── Tabla de ítems ── -->
                            <table class="dte-items">
                                <thead>
                                    <tr>
                                        <th class="tc">No.</th>
                                        <th class="tc">Cantidad</th>
                                        <th class="tc">Unidad</th>
                                        <th>Descripción</th>
                                        <th class="tr">Precio Unitario</th>
                                        <th class="tr">Otros montos no afectos</th>
                                        <th class="tr">Descuento por ítem</th>
                                        <th class="tr">Ventas no sujetas</th>
                                        <th class="tr">Ventas exentas</th>
                                        <th class="tr">Ventas gravadas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, i) in detalleFactura?.items" :key="item.idItem">
                                        <td class="tc">{{ i + 1 }}</td>
                                        <td class="tc">{{ item.cantidad }}</td>
                                        <td class="tc">Unidad</td>
                                        <td>{{ item.descripcion }}</td>
                                        <td class="tr">${{ fmt(item.precioUnit) }}</td>
                                        <td class="tr">$0</td>
                                        <td class="tr">$0</td>
                                        <td class="tr">$0</td>
                                        <td class="tr">$0</td>
                                        <td class="tr">${{ fmt(item.subtotal) }}</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="4" class="tr dte-suma-label">Suma de ventas:</td>
                                        <td class="tr">—</td>
                                        <td class="tr">$0</td>
                                        <td class="tr">$0</td>
                                        <td class="tr">$0</td>
                                        <td class="tr">$0</td>
                                        <td class="tr">${{ fmt(detalleFactura?.subtotalConDesc) }}</td>
                                    </tr>
                                </tfoot>
                            </table>

                            <!-- ── Totales ── -->
                            <div class="dte-totales-wrapper">
                                <div class="dte-totales">
                                    <div class="dte-tot-row">
                                        <span>Sumatoria de ventas:</span>
                                        <span>${{ fmt(detalleFactura?.subtotalConDesc) }}</span>
                                    </div>
                                    <div class="dte-tot-row">
                                        <span>Monto global Desc., Rebajas y otros a ventas no sujetas:</span>
                                        <span>$0</span>
                                    </div>
                                    <div class="dte-tot-row">
                                        <span>Monto global Desc., Rebajas y otros a ventas exentas:</span>
                                        <span>$0</span>
                                    </div>
                                    <div class="dte-tot-row">
                                        <span>Monto global Desc., Rebajas y otros a ventas gravadas:</span>
                                        <span>$0</span>
                                    </div>
                                    <div class="dte-tot-row">
                                        <span>Sub-Total:</span>
                                        <span>${{ fmt(detalleFactura?.subtotalConDesc) }}</span>
                                    </div>
                                    <div v-if="detalleFactura?.tipo === 'credito_fiscal'" class="dte-tot-row">
                                        <span>IVA (13%):</span>
                                        <span>${{ fmt(detalleFactura?.iva) }}</span>
                                    </div>
                                    <div class="dte-tot-row">
                                        <span>Contrib. Especial Turismo (5%):</span>
                                        <span>${{ fmt(detalleFactura?.turismo) }}</span>
                                    </div>
                                    <div class="dte-tot-row">
                                        <span>IVA retenido:</span>
                                        <span>$0</span>
                                    </div>
                                    <div class="dte-tot-row">
                                        <span>Retención renta:</span>
                                        <span>$0</span>
                                    </div>
                                    <div class="dte-tot-row">
                                        <span>Monto total de la operación:</span>
                                        <span>${{ fmt(detalleFactura?.total) }}</span>
                                    </div>
                                    <div class="dte-tot-row">
                                        <span>Total otros montos no afectos:</span>
                                        <span>$0</span>
                                    </div>
                                    <div class="dte-tot-row dte-tot-grand">
                                        <span>Total a pagar:</span>
                                        <span>${{ fmt(detalleFactura?.total) }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- ── Pie del documento ── -->
                            <div class="dte-pie">
                                <div class="dte-pie-row">
                                    <div class="dte-pie-col">
                                        <span class="dte-pl">Valor en letras:</span>
                                        <span class="dte-pv">{{ numeroALetras(Number(detalleFactura?.total ?? 0)) }}</span>
                                    </div>
                                    <div class="dte-pie-col">
                                        <span class="dte-pl">Condición de la operación:</span>
                                        <span class="dte-pv">Contado</span>
                                    </div>
                                </div>
                                <div v-if="detalleFactura?.notas" class="dte-pie-row">
                                    <span class="dte-pl">Observaciones:</span>
                                    <span class="dte-pv">{{ detalleFactura.notas }}</span>
                                </div>
                                <div v-if="detalleFactura?.motivoAnulacion" class="dte-pie-row dte-anulacion-row">
                                    <span class="dte-pl">Motivo de anulación:</span>
                                    <span class="dte-pv">{{ detalleFactura.motivoAnulacion }}</span>
                                </div>
                            </div>

                            <div class="dte-firmas">
                                <div class="dte-firma-col">
                                    <div class="dte-firma-linea"></div>
                                    <p>Responsable por parte del Emisor</p>
                                    <p class="dte-firma-sub">No. documento: _______________</p>
                                </div>
                                <div class="dte-firma-col">
                                    <div class="dte-firma-linea"></div>
                                    <p>Responsable por parte del Receptor</p>
                                    <p class="dte-firma-sub">No. documento: _______________</p>
                                </div>
                            </div>

                        </div>
                        <!-- FIN #factura-pdf-content -->
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

const modalAnular = ref(false)
const facturaAnular = ref<any>(null)
const motivoAnulacion = ref('')
const anularLoading = ref(false)
const anularError = ref('')

const modalDetalle = ref(false)
const detalleFactura = ref<any>(null)
const generandoPDF = ref(false)

const IVA = 0.13
const TURISMO = 0.05

const totales = computed(() => {
    const subtotal = form.value.items.reduce((s, i) => s + (i.cantidad * i.precioUnit), 0)
    const iva     = subtotal * IVA
    const turismo = subtotal * TURISMO
    const total   = subtotal + iva + turismo
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

function agregarItem() { form.value.items.push(itemVacio()) }
function quitarItem(i: number) { if (form.value.items.length > 1) form.value.items.splice(i, 1) }

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
        abrirDetalle(data)
    } catch (e: any) {
        const msg = e?.response?.data?.message
        formError.value = Array.isArray(msg) ? msg[0] : (msg ?? 'Ocurrió un error')
    } finally {
        guardando.value = false
    }
}

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

function abrirDetalle(f: any) { detalleFactura.value = f; modalDetalle.value = true }
function cerrarDetalle() { modalDetalle.value = false }

async function descargarPDF() {
    generandoPDF.value = true
    try {
        const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
            import('jspdf'),
            import('html2canvas'),
        ])
        const el = document.getElementById('factura-pdf-content')
        if (!el) return
        const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
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

// ── Helpers de encabezado (simulados) ─────────────────
function codigoGeneracion(f: any): string {
    if (!f) return ''
    const id = String(f.idFactura).padStart(8, '0')
    return `${id.slice(0,8)}-${id}A6-${id}A-${id}E0072`.toUpperCase().substring(0, 36)
}
function numeroControl(f: any): string {
    if (!f) return ''
    const prefix = f.tipo === 'consumidor_final' ? 'DTE-01' : 'DTE-03'
    const id = String(f.idFactura).padStart(15, '0')
    return `${prefix}-M001P001-${id}`
}
function selloRecepcion(f: any): string {
    if (!f) return ''
    const base = `${f.idFactura}${f.numeroFactura}`.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    return base.padEnd(32, 'X').substring(0, 32)
}

// ── Número a letras (dólares) ──────────────────────────
function numeroALetras(num: number): string {
    const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
        'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve']
    const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
    const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
        'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

    function grupo(n: number): string {
        if (n === 0) return ''
        if (n === 100) return 'cien'
        let r = ''
        const c = Math.floor(n / 100)
        const resto = n % 100
        if (c > 0) r += centenas[c] + (resto > 0 ? ' ' : '')
        if (resto < 20) r += unidades[resto]
        else {
            const d = Math.floor(resto / 10)
            const u = resto % 10
            r += decenas[d] + (u > 0 ? ' y ' + unidades[u] : '')
        }
        return r
    }

    const entero = Math.floor(num)
    const centavos = Math.round((num - entero) * 100)
    const miles = Math.floor(entero / 1000)
    const resto = entero % 1000

    let resultado = ''
    if (miles > 0) {
        resultado += (miles === 1 ? 'mil' : grupo(miles) + ' mil')
        if (resto > 0) resultado += ' '
    }
    if (resto > 0) resultado += grupo(resto)
    if (resultado === '') resultado = 'cero'

    const cStr = centavos > 0 ? ` con ${String(centavos).padStart(2, '0')}/100` : ' exactos'
    return (resultado.charAt(0).toUpperCase() + resultado.slice(1)) + ' dólares' + cStr
}

// ── Formatters ─────────────────────────────────────────
function fmt(val: any) { return Number(val ?? 0).toFixed(2) }

function formatFecha(fecha: string) {
    if (!fecha) return ''
    return new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatFechaHora(fecha: string) {
    if (!fecha) return ''
    return new Date(fecha).toLocaleString('es-SV', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    })
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

.facturacion-page { font-family: 'Sora', sans-serif; display: flex; flex-direction: column; gap: 24px; max-width: 1200px; }

/* ── Header ── */
.page-header { display: flex; align-items: center; justify-content: space-between; }
.page-title { font-size: 1.5rem; font-weight: 600; color: var(--text-primary); margin: 0 0 4px; letter-spacing: -0.02em; }
.page-subtitle { font-size: 0.85rem; color: var(--text-muted); margin: 0; font-weight: 300; }
.header-right { display: flex; align-items: center; gap: 12px; }
.header-badge { font-size: 0.8rem; font-weight: 500; color: var(--accent); background: var(--accent-light); border: 1px solid var(--accent-border); border-radius: 99px; padding: 4px 14px; }

/* ── Botones ── */
.btn-primary { display: flex; align-items: center; gap: 6px; padding: 9px 16px; background: linear-gradient(135deg, #6366f1, #818cf8); color: white; border: none; border-radius: 9px; font-size: 0.85rem; font-weight: 500; font-family: 'Sora', sans-serif; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
.btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(99,102,241,0.4); }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-secondary { display: flex; align-items: center; gap: 6px; padding: 9px 16px; background: var(--bg-card); color: var(--text-secondary); border: 1.5px solid var(--border); border-radius: 9px; font-size: 0.85rem; font-weight: 500; font-family: 'Sora', sans-serif; cursor: pointer; transition: all 0.2s; }
.btn-secondary:hover { background: var(--bg-hover); }
.btn-danger { display: flex; align-items: center; gap: 6px; padding: 9px 16px; background: #ef4444; color: white; border: none; border-radius: 9px; font-size: 0.85rem; font-weight: 500; font-family: 'Sora', sans-serif; cursor: pointer; transition: all 0.2s; }
.btn-danger:hover:not(:disabled) { background: #dc2626; }
.btn-danger:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-loading { display: flex; align-items: center; gap: 6px; }

/* ── Filtros ── */
.filters-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.search-wrapper { position: relative; flex: 1; min-width: 200px; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); display: flex; align-items: center; }
.search-input { width: 100%; padding: 9px 12px 9px 36px; border: 1.5px solid var(--border); border-radius: 9px; font-size: 0.875rem; font-family: 'Sora', sans-serif; color: var(--text-primary); background: var(--bg-card); transition: all 0.2s; outline: none; box-sizing: border-box; }
.search-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
.search-input::placeholder { color: var(--text-muted); }
.filter-select { padding: 9px 12px; border: 1.5px solid var(--border); border-radius: 9px; font-size: 0.85rem; font-family: 'Sora', sans-serif; color: var(--text-primary); background: var(--bg-card); outline: none; cursor: pointer; transition: all 0.2s; }
.filter-select:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }

/* ── Estado ── */
.state-box { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 48px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; color: var(--text-muted); font-size: 0.9rem; }
.error-box { color: #ef4444; background: #fef2f2; border-color: #fecaca; }
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Tabla listado ── */
.table-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.fact-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
thead tr { background: var(--bg-app); border-bottom: 1px solid var(--border); }
th { padding: 12px 16px; text-align: left; font-size: 0.72rem; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
tbody tr { border-bottom: 1px solid var(--border); transition: background 0.15s; }
tbody tr:last-child { border-bottom: none; }
tbody tr:hover { background: var(--bg-hover); }
tbody tr.anulada { opacity: 0.55; }
td { padding: 12px 16px; color: var(--text-primary); vertical-align: middle; }
.td-numero { font-weight: 600; font-size: 0.82rem; color: var(--accent); }
.td-date { color: var(--text-secondary); font-size: 0.82rem; white-space: nowrap; }
.td-money { text-align: right; font-size: 0.85rem; }
.td-muted { color: var(--text-muted); }
.td-total { font-weight: 600; }
.user-cell { display: flex; align-items: center; gap: 10px; }
.user-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg,#6366f1,#a5b4fc); color: white; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cell-name { display: block; font-size: 0.85rem; }
.cell-sub { display: block; font-size: 0.72rem; color: var(--text-muted); margin-top: 1px; }
.tipo-badge { font-size: 0.72rem; font-weight: 500; padding: 3px 10px; border-radius: 99px; white-space: nowrap; }
.tipo-badge.consumidor_final { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
.tipo-badge.credito_fiscal { background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; }
.estado-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 0.72rem; font-weight: 500; padding: 3px 10px; border-radius: 99px; }
.estado-badge.emitida { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.estado-badge.anulada { background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.actions { display: flex; gap: 6px; }
.action-btn { width: 30px; height: 30px; border-radius: 7px; border: 1.5px solid var(--border); background: var(--bg-card); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.18s; color: var(--text-muted); }
.detail-btn:hover { background: #f5f3ff; border-color: #ddd6fe; color: #7c3aed; }
.deactivate-btn:hover { background: #fef2f2; border-color: #fecaca; color: #ef4444; }
.empty-state { text-align: center; padding: 48px; color: var(--text-muted); font-size: 0.9rem; }

/* ── Modal base ── */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.35); overflow: hidden; }
.modal-xl { max-width: 720px; }
.modal-pdf { max-width: 900px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid var(--border); }
.modal-title { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0; }
.modal-subtitle { font-size: 0.78rem; color: var(--text-muted); margin: 2px 0 0; font-weight: 300; }
.modal-close { width: 28px; height: 28px; border-radius: 7px; border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.18s; }
.modal-close:hover { background: #fef2f2; border-color: #fecaca; color: #ef4444; }
.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; max-height: 80vh; overflow-y: auto; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px 20px; border-top: 1px solid var(--border); }

/* ── Form ── */
.section-label { font-size: 0.72rem; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin: 0; }
.form-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }
.field-group { display: flex; flex-direction: column; gap: 5px; }
.full-width { grid-column: 1/-1; }
.field-label { font-size: 0.78rem; font-weight: 500; color: var(--text-secondary); }
.field-input { padding: 9px 12px; border: 1.5px solid var(--border); border-radius: 9px; font-size: 0.875rem; font-family: 'Sora', sans-serif; color: var(--text-primary); background: var(--bg-app); transition: all 0.2s; outline: none; }
.field-input:focus { border-color: #6366f1; background: var(--bg-card); box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
.field-input::placeholder { color: var(--text-muted); }
.form-error { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 8px 12px; }
.tipo-selector { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.tipo-option { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 12px; border: 1.5px solid var(--border); border-radius: 10px; background: var(--bg-app); cursor: pointer; font-family: 'Sora', sans-serif; transition: all 0.18s; color: var(--text-muted); }
.tipo-option:hover { border-color: #6366f1; background: var(--bg-hover); color: #6366f1; }
.tipo-option.selected { border-color: #6366f1; background: #eef2ff; color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
.tipo-option-label { font-size: 0.85rem; font-weight: 600; }
.tipo-option-sub { font-size: 0.7rem; font-weight: 300; color: var(--text-muted); text-align: center; }
.tipo-option.selected .tipo-option-sub { color: #818cf8; }
.origen-selector { display: flex; gap: 8px; }
.origen-option { padding: 8px 16px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--bg-app); cursor: pointer; font-size: 0.82rem; font-family: 'Sora', sans-serif; color: var(--text-secondary); transition: all 0.18s; }
.origen-option:hover { border-color: #6366f1; background: var(--bg-hover); }
.origen-option.selected { border-color: #6366f1; background: #eef2ff; color: #6366f1; font-weight: 500; }
.items-header { display: flex; align-items: center; justify-content: space-between; }
.btn-add-item { display: flex; align-items: center; gap: 5px; padding: 6px 12px; border: 1.5px solid var(--border); border-radius: 7px; background: var(--bg-app); color: var(--text-secondary); font-size: 0.78rem; font-family: 'Sora', sans-serif; cursor: pointer; transition: all 0.18s; }
.btn-add-item:hover { border-color: #6366f1; color: #6366f1; background: var(--bg-hover); }
.items-table-wrapper { border: 1.5px solid var(--border); border-radius: 9px; overflow: hidden; }
.items-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.items-table thead tr { background: var(--bg-app); border-bottom: 1px solid var(--border); }
.items-table th { padding: 8px 12px; text-align: left; font-size: 0.7rem; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.items-table tbody tr { border-bottom: 1px solid var(--border); }
.items-table tbody tr:last-child { border-bottom: none; }
.items-table td { padding: 6px 8px; }
.item-input { width: 100%; padding: 7px 10px; border: 1.5px solid transparent; border-radius: 7px; font-size: 0.82rem; font-family: 'Sora', sans-serif; color: var(--text-primary); background: transparent; outline: none; transition: all 0.15s; }
.item-input:focus { border-color: #6366f1; background: var(--bg-card); box-shadow: 0 0 0 2px rgba(99,102,241,0.1); }
.item-num { width: 80px; text-align: right; }
.item-subtotal { text-align: right; font-weight: 500; padding: 6px 12px; }
.item-remove { width: 26px; height: 26px; border-radius: 6px; border: 1.5px solid transparent; background: transparent; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.item-remove:hover:not(:disabled) { border-color: #fecaca; background: #fef2f2; color: #ef4444; }
.item-remove:disabled { opacity: 0.3; cursor: not-allowed; }
.resumen-fiscal { background: var(--bg-app); border: 1px solid var(--border); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.resumen-row { display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-secondary); }
.resumen-row.iva { color: var(--text-muted); font-size: 0.8rem; }
.resumen-row.turismo { color: var(--text-muted); font-size: 0.8rem; }
.resumen-row.total { font-size: 1rem; font-weight: 600; color: var(--text-primary); border-top: 1px solid var(--border); padding-top: 8px; margin-top: 2px; }
.anular-warning { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 9px; font-size: 0.82rem; color: #92400e; }

/* ══════════════════════════════════════════════════════
   DOCUMENTO TRIBUTARIO ELECTRÓNICO — Estilos PDF
   Fondo blanco, tipografía negra, independiente del tema
══════════════════════════════════════════════════════ */
.dte-doc {
    background: #fff;
    color: #111;
    font-family: Arial, sans-serif;
    font-size: 9px;
    padding: 24px 28px;
    border: 1px solid #ccc;
    border-radius: 4px;
    line-height: 1.4;
}

/* Título */
.dte-titulo {
    text-align: center;
    margin-bottom: 10px;
    border-bottom: 2px solid #111;
    padding-bottom: 8px;
}
.dte-titulo p { margin: 2px 0; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
.dte-tipo-doc { font-size: 11px !important; font-weight: 700 !important; margin-top: 4px !important; }
.dte-anulada-banner { margin-top: 6px; display: inline-block; background: #ef4444; color: white; font-size: 10px; font-weight: 700; padding: 3px 16px; border-radius: 3px; letter-spacing: 0.1em; }

/* Encabezado códigos */
.dte-encabezado {
    display: flex;
    gap: 24px;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #ccc;
}
.dte-enc-izq { flex: 1; }
.dte-enc-der { flex: 1; text-align: right; }
.dte-enc-row { margin-bottom: 3px; }
.dte-enc-label { font-weight: 700; font-size: 8px; }
.dte-enc-val { font-size: 8px; margin-left: 4px; word-break: break-all; }

/* Partes emisor / receptor */
.dte-partes {
    display: flex;
    gap: 0;
    border: 1px solid #999;
    margin-bottom: 10px;
}
.dte-parte {
    flex: 1;
    padding: 8px 10px;
}
.dte-parte:first-child { border-right: 1px solid #999; }
.dte-parte-titulo {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: #111;
    color: #fff;
    padding: 2px 6px;
    margin: -8px -10px 6px;
    text-align: center;
}
.dte-parte-nombre { font-size: 9px; font-weight: 700; margin: 0 0 2px; text-transform: uppercase; }
.dte-parte-sub { font-size: 8px; color: #555; margin: 0 0 4px; }
.dte-parte-grid { display: grid; grid-template-columns: auto 1fr; gap: 1px 8px; margin-bottom: 2px; }
.dte-parte-row { display: flex; gap: 4px; margin-bottom: 1px; flex-wrap: wrap; }
.dte-pl { font-weight: 700; font-size: 8px; white-space: nowrap; }
.dte-pv { font-size: 8px; color: #222; }
.dte-pv-bold { font-weight: 700; }

/* Tabla de ítems */
.dte-items {
    width: 100%;
    border-collapse: collapse;
    font-size: 8px;
    margin-bottom: 6px;
}
.dte-items th {
    background: #f0f0f0;
    border: 1px solid #aaa;
    padding: 4px 5px;
    text-align: center;
    font-weight: 700;
    font-size: 7.5px;
    text-transform: uppercase;
}
.dte-items td {
    border: 1px solid #ccc;
    padding: 4px 5px;
    vertical-align: middle;
}
.dte-items tfoot td {
    background: #f8f8f8;
    font-weight: 700;
    border: 1px solid #aaa;
}
.dte-suma-label { text-align: right; font-size: 8px; }
.tc { text-align: center; }
.tr { text-align: right; }

/* Totales */
.dte-totales-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 10px;
}
.dte-totales {
    width: 55%;
    border: 1px solid #aaa;
}
.dte-tot-row {
    display: flex;
    justify-content: space-between;
    padding: 3px 8px;
    border-bottom: 1px solid #e5e5e5;
    font-size: 8px;
}
.dte-tot-row:last-child { border-bottom: none; }
.dte-tot-grand {
    font-weight: 700;
    font-size: 9px;
    background: #111;
    color: #fff;
    padding: 5px 8px;
}

/* Pie */
.dte-pie {
    border: 1px solid #aaa;
    padding: 6px 10px;
    margin-bottom: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 8px;
    background: #fafafa;
}
.dte-pie-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: baseline; }
.dte-pie-col { display: flex; gap: 6px; flex: 1; }
.dte-anulacion-row { color: #dc2626; }

/* Firmas */
.dte-firmas {
    display: flex;
    gap: 40px;
    margin-top: 20px;
    padding-top: 4px;
}
.dte-firma-col {
    flex: 1;
    text-align: center;
    font-size: 8px;
}
.dte-firma-linea {
    border-top: 1px solid #555;
    margin-bottom: 4px;
}
.dte-firma-sub { color: #666; margin-top: 2px; }

/* ── Transitions ── */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: transform 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: scale(0.95) translateY(10px); }
</style>