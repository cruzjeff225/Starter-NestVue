import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Permisos
  const nombresPermisos = [
    'usuarios:leer',
    'usuarios:crear',
    'usuarios:editar',
    'usuarios:editar_rol',
    'usuarios:toggle_activo',
  ];

  for (const nombre of nombresPermisos) {
    await prisma.permiso.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }
  console.log('✔ Permisos creados');

  // Roles
  const adminReadonly = await prisma.rol.upsert({
    where: { nombre: 'admin_readonly' },
    update: {},
    create: { nombre: 'admin_readonly' },
  });

  const adminEditor = await prisma.rol.upsert({
    where: { nombre: 'admin_editor' },
    update: {},
    create: { nombre: 'admin_editor' },
  });

  const adminFull = await prisma.rol.upsert({
    where: { nombre: 'admin_full' },
    update: {},
    create: { nombre: 'admin_full' },
  });

  const userRol = await prisma.rol.upsert({
    where: { nombre: 'user' },
    update: {},
    create: { nombre: 'user' },
  });

  console.log('✔ Roles creados');

  // Permisos por rol
  const todosLosPermisos = await prisma.permiso.findMany();
  const getPermiso = (nombre: string) =>
    todosLosPermisos.find((p) => p.nombre === nombre)!;

  // admin_readonly - solo leer
  const permisosReadonly = ['usuarios:leer'];
  for (const p of permisosReadonly) {
    await prisma.rolPermiso.upsert({
      where: {
        rolId_permisoId: {
          rolId: adminReadonly.idRol,
          permisoId: getPermiso(p).idPermiso,
        },
      },
      update: {},
      create: {
        rolId: adminReadonly.idRol,
        permisoId: getPermiso(p).idPermiso,
      },
    });
  }

  // admin_editor - leer + crear + editar
  const permisosEditor = ['usuarios:leer', 'usuarios:crear', 'usuarios:editar'];
  for (const p of permisosEditor) {
    await prisma.rolPermiso.upsert({
      where: {
        rolId_permisoId: {
          rolId: adminEditor.idRol,
          permisoId: getPermiso(p).idPermiso,
        },
      },
      update: {},
      create: {
        rolId: adminEditor.idRol,
        permisoId: getPermiso(p).idPermiso,
      },
    });
  }

  // admin_full - todos los permisos
  for (const p of nombresPermisos) {
    await prisma.rolPermiso.upsert({
      where: {
        rolId_permisoId: {
          rolId: adminFull.idRol,
          permisoId: getPermiso(p).idPermiso,
        },
      },
      update: {},
      create: {
        rolId: adminFull.idRol,
        permisoId: getPermiso(p).idPermiso,
      },
    });
  }

  // user - sin permisos sobre usuarios
  console.log('✔ Permisos asignados a roles');

  // ── Usuarios iniciales ──────────────────────────────────
  await prisma.usuario.upsert({
    where: { email: 'admin@misistema.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@misistema.com',
      contraseña: await bcrypt.hash('admin123', 10),
      rolId: adminFull.idRol,
    },
  });

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

  console.log('✔ Usuarios creados');
  console.log('─────────────────────────────────────────');
  console.log('admin@misistema.com / admin123  →  admin_full');
  console.log('user@misistema.com  / user123   →  user');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
