import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) { }

  async create(dto: CreateCustomerDto) {
    const exists = await this.prisma.customer.findUnique({
      where: { phone: dto.phone },
    });
    if (exists) throw new ConflictException('Ya existe un cliente con ese teléfono');

    const customer = await this.prisma.customer.create({ data: dto });

    // === AUDITORÍA ===
    await this.auditLogService.log({
      action: 'CUSTOMER_CREATED',
      entityType: 'Customer',
      entityId: customer.id,
      newValue: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        lugar: customer.lugar,
      },
      note: `Cliente creado: ${customer.name} (${customer.phone})`,
    });

    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const oldCustomer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!oldCustomer) throw new NotFoundException('Cliente no encontrado');

    const updatedCustomer = await this.prisma.customer.update({
      where: { id },
      data: { ...dto },
    });

    // === AUDITORÍA ===
    await this.auditLogService.log({
      action: 'CUSTOMER_UPDATED',
      entityType: 'Customer',
      entityId: id,
      oldValue: {
        id: oldCustomer.id,
        name: oldCustomer.name,
        phone: oldCustomer.phone,
        lugar: oldCustomer.lugar,
      },
      newValue: {
        id: updatedCustomer.id,
        name: updatedCustomer.name,
        phone: updatedCustomer.phone,
        lugar: updatedCustomer.lugar,
      },
      note: `Cliente actualizado: "${updatedCustomer.name}" (${updatedCustomer.phone})`,
    });

    return updatedCustomer;
  }

  async remove(id: string) {
    // Buscar el cliente y sus tickets antes de modificar nada
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        tickets: {
          select: {
            id: true,
            number: true,
            raffleId: true,
            status: true,
          },
        },
      },
    });

    if (!customer) throw new NotFoundException('Cliente no encontrado');

    const ticketCount = customer.tickets.length;
    const raffleTitle = customer.tickets[0]?.raffleId
      ? (await this.prisma.raffle.findUnique({
        where: { id: customer.tickets[0].raffleId },
        select: { title: true }
      }))?.title ?? 'Sin título'
      : 'Sin rifa';

    // === AUDITORÍA ===
    await this.auditLogService.log({
      action: 'CUSTOMER_DELETED',
      entityType: 'Customer',
      entityId: id,
      oldValue: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        lugar: customer.lugar,
        ticketsCount: ticketCount,
        ticketNumbers: customer.tickets.map((t) => t.number),
      },
      note: `Cliente eliminado: ${customer.name} (${customer.phone}). Se liberaron ${ticketCount} tickets.`,
    });

    // Liberar todos los tickets del cliente
    await this.prisma.ticket.updateMany({
      where: { customerId: id },
      data: {
        status: 'AVAILABLE',
        customerId: null,
        reservedAt: null,
      },
    });

    // Eliminar el cliente
    return this.prisma.customer.delete({ where: { id } });
  }

  // Métodos de consulta (sin cambios necesarios)
  async findAll(search?: string) {
    return this.prisma.customer.findMany({
      where: search
        ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            { lugar: { contains: search, mode: 'insensitive' } },
          ],
        }
        : undefined,
      include: {
        tickets: {
          include: { raffle: { select: { title: true, slug: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        tickets: {
          include: {
            raffle: {
              select: { title: true, slug: true, digitCount: true },
            },
          },
        },
      },
    });
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return customer;
  }
}