import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service';
import { CreateRaffleDto } from './dto/create-raffle.dto';
import { UpdateRaffleDto } from './dto/update-raffle.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RafflesService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) { }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  async create(dto: CreateRaffleDto) {
    const baseSlug = this.generateSlug(dto.title);
    let slug = baseSlug;
    let attempt = 1;

    while (await this.prisma.raffle.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${++attempt}`;
    }

    const { numbers, ...raffleData } = dto;

    const raffle = await this.prisma.raffle.create({
      data: {
        ...raffleData,
        slug,
        price: dto.price,
        drawDate: new Date(dto.drawDate),
        totalNumbers: numbers && numbers.length > 0 ? numbers.length : dto.totalNumbers,
      },
    });

    const ticketNumbers = numbers && numbers.length > 0
      ? numbers
      : Array.from({ length: dto.totalNumbers }, (_, i) => i + 1);

    await this.prisma.ticket.createMany({
      data: ticketNumbers.map(n => ({ number: n, raffleId: raffle.id })),
    });

    // === AUDITORÍA ===
    await this.auditLogService.log({
      action: 'RAFFLE_CREATED',
      entityType: 'Raffle',
      entityId: raffle.id,
      newValue: {
        id: raffle.id,
        title: raffle.title,
        slug: raffle.slug,
        totalNumbers: raffle.totalNumbers,
        price: raffle.price,
        drawDate: raffle.drawDate,
      },
      note: `Rifa creada: "${raffle.title}" con ${raffle.totalNumbers} números`,
    });

    return raffle;
  }

  async findAll() {
    return this.prisma.raffle.findMany({
      include: { images: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findFeatured() {
    return this.prisma.raffle.findMany({
      where: { featured: true, status: 'ACTIVE' },
      include: { images: true },
    });
  }

  async findBySlug(slug: string) {
    const raffle = await this.prisma.raffle.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { order: 'asc' } },
        tickets: {
          select: {
            id: true,
            number: true,
            status: true,
            customerId: true,
          },
          orderBy: { number: 'asc' },
        },
      },
    });

    if (!raffle) throw new NotFoundException('Rifa no encontrada');
    return raffle;
  }

  async update(id: string, dto: UpdateRaffleDto) {
    const oldRaffle = await this.prisma.raffle.findUnique({
      where: { id },
    });

    if (!oldRaffle) throw new NotFoundException('Rifa no encontrada');

    const data: any = { ...dto };
    delete data.updateSlug;

    if (dto.updateSlug && dto.title) {
      const baseSlug = this.generateSlug(dto.title);
      let slug = baseSlug;
      let attempt = 1;

      while (await this.prisma.raffle.findFirst({
        where: { slug, id: { not: id } }
      })) {
        slug = `${baseSlug}-${++attempt}`;
      }
      data.slug = slug;
    }

    const updatedRaffle = await this.prisma.raffle.update({
      where: { id },
      data: {
        ...data,
        price: data.price ? Number(data.price) : undefined,
      },
    });

    // === AUDITORÍA ===
    await this.auditLogService.log({
      action: 'RAFFLE_UPDATED',
      entityType: 'Raffle',
      entityId: id,
      oldValue: {
        id: oldRaffle.id,
        title: oldRaffle.title,
        slug: oldRaffle.slug,
        price: oldRaffle.price,
        drawDate: oldRaffle.drawDate,
        status: oldRaffle.status,
      },
      newValue: {
        id: updatedRaffle.id,
        title: updatedRaffle.title,
        slug: updatedRaffle.slug,
        price: updatedRaffle.price,
        drawDate: updatedRaffle.drawDate,
        status: updatedRaffle.status,
      },
      note: `Rifa actualizada: "${updatedRaffle.title}"`,
    });

    return updatedRaffle;
  }

  async findById(id: string) {
    const raffle = await this.prisma.raffle.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        tickets: {
          select: { id: true, number: true, status: true, customerId: true },
          orderBy: { number: 'asc' },
        },
      },
    })
    if (!raffle) throw new NotFoundException('Rifa no encontrada')
    return raffle
  }

  async updateTicketNumber(ticketId: string, number: number) {
    // Verificar que el ticket existe
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } })
    if (!ticket) throw new NotFoundException('Ticket no encontrado')

    // Verificar que el número no esté en uso en la misma rifa
    const exists = await this.prisma.ticket.findFirst({
      where: { raffleId: ticket.raffleId, number, id: { not: ticketId } }
    })
    if (exists) throw new ConflictException(`El número ${number} ya existe en esta rifa`)

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { number }
    })
  }

  async addTicket(raffleId: string, number: number) {
    const raffle = await this.prisma.raffle.findUnique({ where: { id: raffleId } })
    if (!raffle) throw new NotFoundException('Rifa no encontrada')

    if (number < 0) throw new BadRequestException('El número no puede ser negativo')


    const maxNumber = Math.pow(10, raffle.digitCount) - 1
    if (number > maxNumber) {
      throw new BadRequestException(
        `Con ${raffle.digitCount} cifras el número máximo es ${maxNumber}`
      )
    }
    const exists = await this.prisma.ticket.findFirst({
      where: { raffleId, number }
    })
    if (exists) throw new ConflictException(`El número ${number} ya existe en esta rifa`)

    const ticket = await this.prisma.ticket.create({
      data: { raffleId, number }
    })

    // Actualizar totalNumbers
    await this.prisma.raffle.update({
      where: { id: raffleId },
      data: { totalNumbers: { increment: 1 } }
    })

    return ticket
  }

  async deleteTicket(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        raffle: { select: { title: true } },
        customer: { select: { name: true } }
      }
    });

    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    if (ticket.status !== 'AVAILABLE') {
      throw new BadRequestException('Solo se pueden eliminar tickets disponibles');
    }

    const raffleTitle = ticket.raffle.title ?? 'Sin título';

    // === AUDITORÍA ===
    await this.auditLogService.log({
      action: 'TICKET_DELETED',
      entityType: 'Ticket',
      entityId: ticketId,
      oldValue: {
        ticketId: ticket.id,
        number: ticket.number,
        raffleId: ticket.raffleId,
        raffleTitle: raffleTitle,
        status: ticket.status,
        customerId: ticket.customerId,
        customerName: ticket.customer?.name ?? null,
      },
      note: `Ticket ${ticket.number} eliminado de la rifa "${raffleTitle}"`,
    });

    // Eliminación del ticket
    await this.prisma.ticket.delete({ where: { id: ticketId } });

    // Actualizar contador de números en la rifa
    await this.prisma.raffle.update({
      where: { id: ticket.raffleId },
      data: { totalNumbers: { decrement: 1 } }
    });

    return { success: true };
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'FINISHED') {
    return this.prisma.raffle.update({
      where: { id },
      data: { status },
    });
  }

  async reserveTicket(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } })
    if (!ticket) throw new NotFoundException('Ticket no encontrado')
    if (ticket.status !== 'AVAILABLE') throw new BadRequestException('Ticket no disponible')

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'RESERVED', reservedAt: new Date() },
    })
  }

  async reserveTicketsBatch(ticketIds: string[]) {
    const unique = [...new Set(ticketIds)];

    if (unique.length === 0) {
      throw new BadRequestException('Indica al menos un número');
    }
    if (unique.length > 40) {
      throw new BadRequestException('Máximo 40 números por reserva');
    }

    return this.prisma.$transaction(async (tx) => {
      // Usamos 'any' temporalmente para evitar los problemas de tipado estrictos de Prisma 7
      const prismaTx = tx as any;

      const tickets = await prismaTx.ticket.findMany({
        where: { id: { in: unique } },
        select: {
          id: true,
          raffleId: true,
          status: true,
          number: true,
        },
      });

      if (tickets.length !== unique.length) {
        throw new NotFoundException('Algún ticket no existe');
      }

      const raffleIds = [...new Set(tickets.map((t: any) => t.raffleId))];
      if (raffleIds.length !== 1) {
        throw new BadRequestException('Todos los números deben ser de la misma rifa');
      }

      const now = new Date();

      const result = await prismaTx.ticket.updateMany({
        where: {
          id: { in: unique },
          status: 'AVAILABLE'
        },
        data: {
          status: 'RESERVED',
          reservedAt: now
        },
      });

      if (result.count !== unique.length) {
        throw new ConflictException(
          'Uno o más números ya no estaban disponibles. Recarga e intenta de nuevo.',
        );
      }

      return prismaTx.ticket.findMany({
        where: { id: { in: unique } },
        orderBy: { number: 'asc' },
        select: {
          id: true,
          number: true,
          status: true,
          reservedAt: true,
          customerId: true,
        },
      });
    });
  }

  async reserveWithCustomer(ticketIds: string[], name: string, phone: string) {
    const unique = [...new Set(ticketIds)];
    if (unique.length === 0) throw new BadRequestException('Indica al menos un número');

    return this.prisma.$transaction(async (tx) => {
      const prismaTx = tx as any;

      let customer = await prismaTx.customer.findUnique({
        where: { phone },
        select: { id: true, name: true, phone: true }
      });

      const isNewCustomer = !customer;

      if (!customer) {
        customer = await prismaTx.customer.create({
          data: {
            name: `${name} - PENDIENTE`,
            phone,
            lugar: 'Sin especificar',
          },
          select: { id: true, name: true, phone: true }
        });
      }

      const tickets = await prismaTx.ticket.findMany({
        where: { id: { in: unique } },
        select: {
          id: true,
          number: true,
          status: true,
          raffleId: true,
        },
      });

      if (tickets.length !== unique.length) {
        throw new NotFoundException('Algún ticket no existe');
      }

      const raffle = await prismaTx.raffle.findUnique({
        where: { id: tickets[0].raffleId },
        select: { title: true },
      });

      const raffleTitle = raffle?.title ?? 'Sin título';

      const unavailable = tickets.filter((t: any) => t.status !== 'AVAILABLE');
      if (unavailable.length > 0) {
        throw new ConflictException('Uno o más números ya no están disponibles');
      }

      // === AUDITORÍA ===
      await this.auditLogService.log({
        action: 'TICKET_ASSIGNED',
        entityType: 'Ticket',
        entityId: unique.join(','),
        oldValue: tickets.map((t: any) => ({
          ticketId: t.id,
          number: t.number,
          previousStatus: t.status,
          raffleTitle,
        })),
        newValue: {
          status: 'RESERVED',
          customerId: customer.id,
          customerName: customer.name,
          isNewCustomer,
          raffleTitle,
        },
        note: `Asignados ${unique.length} tickets al cliente ${customer.name} en rifa "${raffleTitle}"`,
      });

      await prismaTx.ticket.updateMany({
        where: { id: { in: unique } },
        data: {
          status: 'RESERVED',
          customerId: customer.id,
          reservedAt: new Date(),
        }
      });

      return {
        customerId: customer.id,
        customerName: customer.name
      };
    });
  }

  async updateTicketStatus(
    ticketId: string,
    status: 'AVAILABLE' | 'RESERVED' | 'SOLD',
    customerId?: string,
    notes?: string,
  ) {
    const oldTicket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        customer: true,
        raffle: { select: { title: true, slug: true } },
      },
    });

    if (!oldTicket) throw new NotFoundException('Ticket no encontrado');

    // Si viene un nuevo customerId, busca el nombre también
    let newCustomerName: string | undefined;
    if (customerId) {
      const newCustomer = await this.prisma.customer.findUnique({
        where: { id: customerId },
        select: { name: true },
      });
      newCustomerName = newCustomer?.name;
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status,
        customerId: customerId ?? null,
        notes: notes !== undefined ? notes : undefined,
        reservedAt: status === 'RESERVED' ? new Date() : null,
      },
    });

    const action =
      status === 'AVAILABLE' ? 'TICKET_RELEASED' :
        status === 'SOLD' ? 'TICKET_SOLD' : 'TICKET_RESERVED';

    await this.auditLogService.log({
      action,
      entityType: 'Ticket',
      entityId: ticketId,
      oldValue: {
        numero: oldTicket.number,
        rifa: oldTicket.raffle.title,
        estado: oldTicket.status,
        cliente: oldTicket.customer?.name ?? null,
        notas: oldTicket.notes ?? null,
      },
      newValue: {
        numero: oldTicket.number,
        rifa: oldTicket.raffle.title,
        estado: status,
        cliente: newCustomerName ?? (status === 'AVAILABLE' ? null : oldTicket.customer?.name) ?? null,
        notas: notes !== undefined ? (notes || null) : oldTicket.notes,
      },
      note: `Ticket ${oldTicket.number} → ${status} en rifa "${oldTicket.raffle.title}"${newCustomerName ? ` · ${newCustomerName}` : ''}`,
    });

    return updatedTicket;
  }

  async assignCustomerToTicketsBatch(
    ticketIds: string[],
    customerId: string,
    status?: 'AVAILABLE' | 'RESERVED' | 'SOLD',
  ) {
    const unique = [...new Set(ticketIds)];
    if (unique.length === 0) {
      throw new BadRequestException('Indica al menos un ticket');
    }

    return this.prisma.$transaction(async (tx) => {
      const prismaTx = tx as any;

      const tickets = await prismaTx.ticket.findMany({
        where: { id: { in: unique } },
        select: {
          id: true,
          number: true,
          status: true,
          customerId: true,
          raffleId: true,
        },
      });

      if (tickets.length !== unique.length) {
        throw new NotFoundException('Uno o más tickets no existen');
      }

      const raffle = await prismaTx.raffle.findUnique({
        where: { id: tickets[0].raffleId },
        select: { title: true },
      });

      const customer = await prismaTx.customer.findUnique({
        where: { id: customerId },
        select: { name: true },
      });

      if (!customer) throw new NotFoundException('Cliente no encontrado');

      const raffleTitle = raffle?.title ?? 'Sin título';

      // === AUDITORÍA ===
      await this.auditLogService.log({
        action: status === 'AVAILABLE' ? 'TICKET_RELEASED' : 'TICKET_ASSIGNED',
        entityType: 'Ticket',
        entityId: unique.join(','),
        oldValue: tickets.map((t: any) => ({
          ticketId: t.id,
          number: t.number,                    // ← legible
          previousStatus: t.status,
          previousCustomerId: t.customerId,
        })),
        newValue: {
          status: status || 'RESERVED',
          customerId,                          // ID técnico
          customerName: customer.name,         // ← nombre legible
          raffleTitle,
        },
        note: status === 'AVAILABLE'
          ? `Liberados ${unique.length} tickets de la rifa "${raffleTitle}"`
          : `Asignados ${unique.length} tickets al cliente ${customer.name} en rifa "${raffleTitle}"`,
      });

      const updateData: any = { customerId };
      if (status) updateData.status = status;
      if (status === 'RESERVED') updateData.reservedAt = new Date();

      await prismaTx.ticket.updateMany({
        where: { id: { in: unique } },
        data: updateData,
      });

      return prismaTx.ticket.findMany({
        where: { id: { in: unique } },
        orderBy: { number: 'asc' },
        select: {
          id: true,
          number: true,
          status: true,
          customerId: true,
          reservedAt: true,
        },
      });
    });
  }

  async remove(id: string) {
    const raffle = await this.prisma.raffle.findUnique({
      where: { id },
      include: { tickets: { select: { id: true, number: true } } }
    });

    if (!raffle) throw new NotFoundException('Rifa no encontrada');

    // Auditoría antes de eliminar
    await this.auditLogService.log({
      action: 'RAFFLE_DELETED',
      entityType: 'Raffle',
      entityId: id,
      oldValue: {
        title: raffle.title,
        slug: raffle.slug,
        totalNumbers: raffle.totalNumbers,
        ticketsCount: raffle.tickets.length,
      },
      note: `Rifa eliminada: ${raffle.title} (${raffle.tickets.length} tickets)`,
    });

    return this.prisma.raffle.delete({ where: { id } });
  }
}