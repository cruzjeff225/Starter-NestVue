import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prismaService';
import { CreateClienteDto } from './dto/createClienteDto';
import { UpdateClienteDto } from './dto/updateClienteDto';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    const where = search
      ? {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' as const } },
            { apellido: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { dui: { contains: search, mode: 'insensitive' as const } },
            { telefono: { contains: search, mode: 'insensitive' as const } },
            {
              departamento: { contains: search, mode: 'insensitive' as const },
            },
            { municipio: { contains: search, mode: 'insensitive' as const } },
            { distrito: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return this.prisma.cliente.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
    });
  }

  async findOne(idCliente: number) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { idCliente },
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return cliente;
  }

  async create(dto: CreateClienteDto) {
    const existeEmail = await this.prisma.cliente.findUnique({
      where: { email: dto.email },
    });
    if (existeEmail)
      throw new ConflictException('Ya existe un cliente con ese email');

    if (dto.dui) {
      const existeDui = await this.prisma.cliente.findUnique({
        where: { dui: dto.dui },
      });
      if (existeDui)
        throw new ConflictException('Ya existe un cliente con ese DUI');
    }

    return this.prisma.cliente.create({ data: dto });
  }

  async update(idCliente: number, dto: UpdateClienteDto) {
    await this.findOne(idCliente);

    if (dto.email) {
      const existe = await this.prisma.cliente.findFirst({
        where: { email: dto.email, NOT: { idCliente } },
      });
      if (existe) throw new ConflictException('Ese email ya está en uso');
    }

    if (dto.dui) {
      const existeDui = await this.prisma.cliente.findFirst({
        where: { dui: dto.dui, NOT: { idCliente } },
      });
      if (existeDui) throw new ConflictException('Ese DUI ya está en uso');
    }

    return this.prisma.cliente.update({
      where: { idCliente },
      data: dto,
    });
  }

  async toggleActivo(idCliente: number) {
    const cliente = await this.findOne(idCliente);
    return this.prisma.cliente.update({
      where: { idCliente },
      data: { activo: !cliente.activo },
    });
  }
}
