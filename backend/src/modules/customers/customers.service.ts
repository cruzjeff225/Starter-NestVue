import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prismaService'
import { CreateCustomerDto } from './dto/create-customer.dto'
import { UpdateCustomerDto } from './dto/update-customer.dto'

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  // ✅ Crear cliente
  async create(dto: CreateCustomerDto) {
    // validar email único
    const existe = await this.prisma.customer.findUnique({
      where: { email: dto.email },
    })

    if (existe) {
      throw new BadRequestException('El email ya está registrado')
    }

    return this.prisma.customer.create({
      data: dto,
    })
  }

  // ✅ Listar clientes
  async findAll(search?: string) {
    return this.prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { telefono: { contains: search } },
            ],
          }
        : {},
      orderBy: { creadoEn: 'desc' },
    })
  }

  // ✅ Obtener uno
  async findOne(id: number) {
    const cliente = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        reservas: {
          include: {
            room: true,
          },
        },
      },
    })

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado')
    }

    return cliente
  }

  // ✅ Actualizar
  async update(id: number, dto: UpdateCustomerDto) {
    await this.findOne(id)

    return this.prisma.customer.update({
      where: { id },
      data: dto,
    })
  }

  // ✅ Eliminar (soft delete recomendado)
  async remove(id: number) {
    await this.findOne(id)

    return this.prisma.customer.update({
      where: { id },
      data: { activo: false },
    })
  }

  // ✅ Toggle activo
  async toggleActivo(id: number) {
    const cliente = await this.findOne(id)

    return this.prisma.customer.update({
      where: { id },
      data: { activo: !cliente.activo },
    })
  }
}