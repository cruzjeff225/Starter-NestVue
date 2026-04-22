-- CreateEnum
CREATE TYPE "EstadoHabitacion" AS ENUM ('disponible', 'ocupada', 'reservada', 'mantenimiento');

-- CreateEnum
CREATE TYPE "EstadoReservacion" AS ENUM ('pendiente', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_show');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('efectivo', 'tarjeta', 'transferencia', 'otro');

-- CreateEnum
CREATE TYPE "TipoFactura" AS ENUM ('consumidor_final', 'credito_fiscal');

-- CreateEnum
CREATE TYPE "EstadoFactura" AS ENUM ('emitida', 'anulada');

-- CreateTable
CREATE TABLE "Rol" (
    "idRol" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("idRol")
);

-- CreateTable
CREATE TABLE "Permiso" (
    "idPermiso" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Permiso_pkey" PRIMARY KEY ("idPermiso")
);

-- CreateTable
CREATE TABLE "RolPermiso" (
    "rolId" INTEGER NOT NULL,
    "permisoId" INTEGER NOT NULL,

    CONSTRAINT "RolPermiso_pkey" PRIMARY KEY ("rolId","permisoId")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "idUsuario" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contraseña" TEXT NOT NULL,
    "rolId" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("idUsuario")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "idCliente" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "distrito" TEXT NOT NULL,
    "dui" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("idCliente")
);

-- CreateTable
CREATE TABLE "TipoHabitacion" (
    "idTipo" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "precioBase" DECIMAL(10,2) NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "TipoHabitacion_pkey" PRIMARY KEY ("idTipo")
);

-- CreateTable
CREATE TABLE "Habitacion" (
    "idHabitacion" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "piso" INTEGER NOT NULL,
    "capacidad" INTEGER NOT NULL DEFAULT 2,
    "estado" "EstadoHabitacion" NOT NULL DEFAULT 'disponible',
    "amenidades" TEXT[],
    "imagenUrl" TEXT,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "tipoId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Habitacion_pkey" PRIMARY KEY ("idHabitacion")
);

-- CreateTable
CREATE TABLE "Reservacion" (
    "idReservacion" SERIAL NOT NULL,
    "fechaEntrada" TIMESTAMP(3) NOT NULL,
    "fechaSalida" TIMESTAMP(3) NOT NULL,
    "numHuespedes" INTEGER NOT NULL DEFAULT 1,
    "estado" "EstadoReservacion" NOT NULL DEFAULT 'pendiente',
    "metodoPago" "MetodoPago" NOT NULL DEFAULT 'efectivo',
    "precioNoche" DECIMAL(10,2) NOT NULL,
    "descuento" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "totalCalculado" DECIMAL(10,2) NOT NULL,
    "notas" TEXT,
    "motivoCancelacion" TEXT,
    "clienteId" INTEGER NOT NULL,
    "habitacionId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservacion_pkey" PRIMARY KEY ("idReservacion")
);

-- CreateTable
CREATE TABLE "Factura" (
    "idFactura" SERIAL NOT NULL,
    "numeroFactura" TEXT NOT NULL,
    "tipo" "TipoFactura" NOT NULL,
    "estado" "EstadoFactura" NOT NULL DEFAULT 'emitida',
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteNombre" TEXT NOT NULL,
    "clienteEmail" TEXT NOT NULL,
    "clienteDui" TEXT,
    "clienteNit" TEXT,
    "clienteNrc" TEXT,
    "clienteGiro" TEXT,
    "clienteDireccion" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "subtotalConDesc" DECIMAL(10,2) NOT NULL,
    "iva" DECIMAL(10,2) NOT NULL,
    "turismo" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "motivoAnulacion" TEXT,
    "notas" TEXT,
    "clienteId" INTEGER NOT NULL,
    "reservacionId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Factura_pkey" PRIMARY KEY ("idFactura")
);

-- CreateTable
CREATE TABLE "ItemFactura" (
    "idItem" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precioUnit" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "facturaId" INTEGER NOT NULL,

    CONSTRAINT "ItemFactura_pkey" PRIMARY KEY ("idItem")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rol_nombre_key" ON "Rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Permiso_nombre_key" ON "Permiso"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_email_key" ON "Cliente"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_dui_key" ON "Cliente"("dui");

-- CreateIndex
CREATE UNIQUE INDEX "TipoHabitacion_nombre_key" ON "TipoHabitacion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Habitacion_numero_key" ON "Habitacion"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_numeroFactura_key" ON "Factura"("numeroFactura");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_reservacionId_key" ON "Factura"("reservacionId");

-- AddForeignKey
ALTER TABLE "RolPermiso" ADD CONSTRAINT "RolPermiso_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("idRol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolPermiso" ADD CONSTRAINT "RolPermiso_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "Permiso"("idPermiso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("idRol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habitacion" ADD CONSTRAINT "Habitacion_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "TipoHabitacion"("idTipo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservacion" ADD CONSTRAINT "Reservacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("idCliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservacion" ADD CONSTRAINT "Reservacion_habitacionId_fkey" FOREIGN KEY ("habitacionId") REFERENCES "Habitacion"("idHabitacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("idCliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_reservacionId_fkey" FOREIGN KEY ("reservacionId") REFERENCES "Reservacion"("idReservacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemFactura" ADD CONSTRAINT "ItemFactura_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("idFactura") ON DELETE RESTRICT ON UPDATE CASCADE;
