-- CreateEnum
CREATE TYPE "EstadoHabitacion" AS ENUM ('disponible', 'ocupada', 'reservada', 'mantenimiento');

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

-- CreateIndex
CREATE UNIQUE INDEX "TipoHabitacion_nombre_key" ON "TipoHabitacion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Habitacion_numero_key" ON "Habitacion"("numero");

-- AddForeignKey
ALTER TABLE "Habitacion" ADD CONSTRAINT "Habitacion_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "TipoHabitacion"("idTipo") ON DELETE RESTRICT ON UPDATE CASCADE;
