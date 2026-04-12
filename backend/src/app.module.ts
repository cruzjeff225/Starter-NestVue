import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prismaModule';
import { AuthModule } from './modules/auth/authModule';
import { UsersModule } from './modules/users/usersModule';
import { PermissionsModule } from './modules/permissions/permissionsModule';
import { RolesModule } from './modules/roles/rolesModule';
import { ClientesModule } from './modules/clientes/clientesModule';
import { HabitacionesModule } from './modules/rooms/habitacionesModule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PermissionsModule,
    RolesModule,
    ClientesModule,
    HabitacionesModule,
  ],
})
export class AppModule {}
