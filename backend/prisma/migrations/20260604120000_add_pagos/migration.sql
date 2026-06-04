CREATE TYPE "EstadoPago" AS ENUM ('pendiente', 'aprobado', 'rechazado', 'reembolsado');

CREATE TYPE "MetodoPagoGateway" AS ENUM ('efectivo', 'tarjeta', 'transferencia', 'wallet', 'link_pago');

CREATE TYPE "ProveedorPago" AS ENUM ('simulado');

UPDATE "Habitacion" SET "cercaniasStr" = ARRAY[]::TEXT[] WHERE "cercaniasStr" IS NULL;

ALTER TABLE "Habitacion" ALTER COLUMN "cercaniasStr" SET DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Habitacion" ALTER COLUMN "cercaniasStr" SET NOT NULL;

CREATE TABLE "Pago" (
    "idPago" SERIAL NOT NULL,
    "referencia" TEXT NOT NULL,
    "proveedor" "ProveedorPago" NOT NULL DEFAULT 'simulado',
    "metodo" "MetodoPagoGateway" NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'pendiente',
    "monto" DECIMAL(10,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "autorizacion" TEXT,
    "ultimos4" TEXT,
    "titular" TEXT,
    "emailPagador" TEXT,
    "motivoRechazo" TEXT,
    "notas" TEXT,
    "metadata" JSONB,
    "reservacionId" INTEGER,
    "facturaId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("idPago")
);

CREATE UNIQUE INDEX "Pago_referencia_key" ON "Pago"("referencia");

ALTER TABLE "Pago" ADD CONSTRAINT "Pago_reservacionId_fkey" FOREIGN KEY ("reservacionId") REFERENCES "Reservacion"("idReservacion") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Pago" ADD CONSTRAINT "Pago_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("idFactura") ON DELETE SET NULL ON UPDATE CASCADE;
