import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Creando Roles
  const adminRol = await prisma.rol.upsert({
    where: { nombre: 'admin' },
    update: {},
    create: { nombre: 'admin' },
  });

  const userRol = await prisma.rol.upsert({
    where: { nombre: 'user' },
    update: {},
    create: { nombre: 'user' },
  });

  console.log('✔ Roles creados:', adminRol.nombre, userRol.nombre);

  // Creando Usuarios
  await prisma.usuario.upsert({
    where: { email: 'admin@misistema.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@misistema.com',
      contraseña: await bcrypt.hash('admin123', 10),
      rolId: adminRol.idRol,
    },
  });

  console.log('✔ Admin creado: admin@misistema.com / admin123');

  await prisma.usuario.upsert({
    where: { email: 'user@misistema.com' },
    update: {},
    create: {
      nombre: 'Usuario',
      email: 'user@misistema.com',
      contraseña: await bcrypt.hash('user123', 10),
      rolId: userRol.idRol,
    },
  });

  console.log('✔ Usuario creado: user@misistema.com / user123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
