import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prismaModule';
import { AuthModule } from './modules/auth/authModule';
import { UsersModule } from './modules/users/usersModule';
import { PermissionsModule } from './modules/permissions/permissionsModule';
import { RolesModule } from './modules/roles/rolesModule';
import { RoomsModule } from './modules/rooms/rooms.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ReservationsModule } from './modules/reservations/reservations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PermissionsModule,
    RolesModule,
    RoomsModule,
    CustomersModule,
    ReservationsModule
  ],
})
export class AppModule {}
