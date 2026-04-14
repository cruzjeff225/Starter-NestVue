/*
  Warnings:

  - You are about to drop the column `activo` on the `Reservacion` table. All the data in the column will be lost.
  - You are about to drop the column `descripcion` on the `Reservacion` table. All the data in the column will be lost.
  - You are about to drop the column `fecha` on the `Reservacion` table. All the data in the column will be lost.
  - Added the required column `fechaEntrada` to the `Reservacion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fechaSalida` to the `Reservacion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `habitacionId` to the `Reservacion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precioNoche` to the `Reservacion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalCalculado` to the `Reservacion` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoReservacion" AS ENUM ('pendiente', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_show');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('efectivo', 'tarjeta', 'transferencia', 'otro');

-- DropIndex
DROP INDEX "Reservacion_clienteId_idx";

-- AlterTable
ALTER TABLE "Reservacion" DROP COLUMN "activo",
DROP COLUMN "descripcion",
DROP COLUMN "fecha",
ADD COLUMN     "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "descuento" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "estado" "EstadoReservacion" NOT NULL DEFAULT 'pendiente',
ADD COLUMN     "fechaEntrada" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "fechaSalida" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "habitacionId" INTEGER NOT NULL,
ADD COLUMN     "metodoPago" "MetodoPago" NOT NULL DEFAULT 'efectivo',
ADD COLUMN     "motivoCancelacion" TEXT,
ADD COLUMN     "notas" TEXT,
ADD COLUMN     "numHuespedes" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "precioNoche" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "totalCalculado" DECIMAL(10,2) NOT NULL;

-- AddForeignKey
ALTER TABLE "Reservacion" ADD CONSTRAINT "Reservacion_habitacionId_fkey" FOREIGN KEY ("habitacionId") REFERENCES "Habitacion"("idHabitacion") ON DELETE RESTRICT ON UPDATE CASCADE;
