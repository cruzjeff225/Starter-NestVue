CREATE TYPE "TipoCliente" AS ENUM ('nacional', 'extranjero');

ALTER TABLE "Cliente"
ADD COLUMN "tipoCliente" "TipoCliente" NOT NULL DEFAULT 'nacional',
ADD COLUMN "pais" TEXT DEFAULT 'El Salvador',
ADD COLUMN "documento" TEXT,
ALTER COLUMN "departamento" DROP NOT NULL,
ALTER COLUMN "municipio" DROP NOT NULL,
ALTER COLUMN "distrito" DROP NOT NULL,
ALTER COLUMN "dui" DROP NOT NULL;
