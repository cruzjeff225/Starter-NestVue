import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { TipoCliente } from '@prisma/client';
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
            { documento: { contains: search, mode: 'insensitive' as const } },
            { telefono: { contains: search, mode: 'insensitive' as const } },
            { pais: { contains: search, mode: 'insensitive' as const } },
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
    const data = this.normalizeClienteData(dto);
    const existeEmail = await this.prisma.cliente.findUnique({
      where: { email: data.email },
    });
    if (existeEmail)
      throw new ConflictException('Ya existe un cliente con ese email');

    if (data.dui) {
      const existeDui = await this.prisma.cliente.findUnique({
        where: { dui: data.dui },
      });
      if (existeDui)
        throw new ConflictException('Ya existe un cliente con ese DUI');
    }

    return this.prisma.cliente.create({ data });
  }

  async update(idCliente: number, dto: UpdateClienteDto) {
    await this.findOne(idCliente);
    const data = this.normalizeClienteData(dto);

    if (data.email) {
      const existe = await this.prisma.cliente.findFirst({
        where: { email: data.email, NOT: { idCliente } },
      });
      if (existe) throw new ConflictException('Ese email ya esta en uso');
    }

    if (data.dui) {
      const existeDui = await this.prisma.cliente.findFirst({
        where: { dui: data.dui, NOT: { idCliente } },
      });
      if (existeDui) throw new ConflictException('Ese DUI ya esta en uso');
    }

    return this.prisma.cliente.update({
      where: { idCliente },
      data,
    });
  }

  async toggleActivo(idCliente: number) {
    const cliente = await this.findOne(idCliente);
    return this.prisma.cliente.update({
      where: { idCliente },
      data: { activo: !cliente.activo },
    });
  }

  private normalizeClienteData<T extends CreateClienteDto | UpdateClienteDto>(
    dto: T,
  ) {
    const data: any = { ...dto };

    if (data.tipoCliente === TipoCliente.nacional) {
      data.pais = 'El Salvador';
      data.documento = null;
    }

    if (data.tipoCliente === TipoCliente.extranjero) {
      data.dui = null;
      data.departamento = null;
      data.municipio = null;
      data.distrito = null;
    }

    return data;
  }
}
