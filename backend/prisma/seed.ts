import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Un solo permiso especial que da acceso total al sistema.
  const permisoSuperadmin = await prisma.permiso.upsert({
    where: { nombre: 'superadmin:todo' },
    update: {},
    create: { nombre: 'superadmin:todo' },
  });
  console.log('✔ Permiso superadmin:todo creado');

  // Rol superadmin
  const rolSuperadmin = await prisma.rol.upsert({
    where: { nombre: 'superadmin' },
    update: {},
    create: { nombre: 'superadmin' },
  });
  console.log('✔ Rol superadmin creado');

  // Asignar permiso al rol
  await prisma.rolPermiso.upsert({
    where: {
      rolId_permisoId: {
        rolId: rolSuperadmin.idRol,
        permisoId: permisoSuperadmin.idPermiso,
      },
    },
    update: {},
    create: {
      rolId: rolSuperadmin.idRol,
      permisoId: permisoSuperadmin.idPermiso,
    },
  });
  console.log('✔ Permiso asignado al rol superadmin');

  // Usuario superadmin
  await prisma.usuario.upsert({
    where: { email: 'superadmin@misistema.com' },
    update: {},
    create: {
      nombre: 'Super Administrador',
      email: 'superadmin@misistema.com',
      contraseña: await bcrypt.hash('superadmin123', 10),
      rolId: rolSuperadmin.idRol,
    },
  });
  console.log('✔ Usuario superadmin creado');

  console.log('─────────────────────────────────────────────');
  console.log('superadmin@misistema.com / superadmin123  -  superadmin');
  console.log('─────────────────────────────────────────────');
  console.log(
    'Desde aquí creamos los demás roles, permisos y usuarios en la UI.',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
