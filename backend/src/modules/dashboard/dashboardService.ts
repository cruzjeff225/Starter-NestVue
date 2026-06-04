import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prismaService';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      habitacionesDisponibles,
      reservacionesActivas,
      facturasMes,
      clientesTotal,
    ] = await this.prisma.$transaction([
      this.prisma.habitacion.count({
        where: { estado: 'disponible', activo: true },
      }),
      this.prisma.reservacion.count({
        where: { estado: { in: ['confirmada', 'en_curso'] } },
      }),
      this.prisma.factura.count({
        where: {
          estado: 'emitida',
          fechaEmision: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      this.prisma.cliente.count({ where: { activo: true } }),
    ]);

    return {
      habitacionesDisponibles,
      reservacionesActivas,
      facturasMes,
      clientesTotal,
    };
  }
}
