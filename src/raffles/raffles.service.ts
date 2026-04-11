import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service';
import { CreateRaffleDto } from './dto/create-raffle.dto';
import { UpdateRaffleDto } from './dto/update-raffle.dto';

@Injectable()
export class RafflesService {
  constructor(private prisma: PrismaService) { }

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
    const slug = this.generateSlug(dto.title)
    const { numbers, ...raffleData } = dto  // ← separa numbers del resto

    const raffle = await this.prisma.raffle.create({
      data: {
        ...raffleData,
        slug,
        price: dto.price,
        drawDate: new Date(dto.drawDate),
        totalNumbers: numbers && numbers.length > 0 ? numbers.length : dto.totalNumbers,
      },
    })

    const ticketNumbers = numbers && numbers.length > 0
      ? numbers
      : Array.from({ length: dto.totalNumbers }, (_, i) => i + 1)

    const tickets = ticketNumbers.map(n => ({
      number: n,
      raffleId: raffle.id,
    }))

    await this.prisma.ticket.createMany({ data: tickets })

    return raffle
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
    const data: any = { ...dto }
    delete data.updateSlug

    if (dto.updateSlug && dto.title) {
      data.slug = await this.generateSlug(dto.title)
    }

    return this.prisma.raffle.update({
      where: { id },
      data: {
        ...data,
        price: data.price ? Number(data.price) : undefined,
      },
    })
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
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } })
    if (!ticket) throw new NotFoundException('Ticket no encontrado')
    if (ticket.status !== 'AVAILABLE') throw new BadRequestException('Solo se pueden eliminar tickets disponibles')

    await this.prisma.ticket.delete({ where: { id: ticketId } })

    await this.prisma.raffle.update({
      where: { id: ticket.raffleId },
      data: { totalNumbers: { decrement: 1 } }
    })

    return { success: true }
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
    const unique = [...new Set(ticketIds)]
    if (unique.length === 0) {
      throw new BadRequestException('Indica al menos un número')
    }
    if (unique.length > 40) {
      throw new BadRequestException('Máximo 40 números por reserva')
    }

    return this.prisma.$transaction(async (tx) => {
      const tickets = await tx.ticket.findMany({
        where: { id: { in: unique } },
      })
      if (tickets.length !== unique.length) {
        throw new NotFoundException('Algún ticket no existe')
      }
      const raffleIds = [...new Set(tickets.map((t) => t.raffleId))]
      if (raffleIds.length !== 1) {
        throw new BadRequestException('Todos los números deben ser de la misma rifa')
      }
      const now = new Date()
      const result = await tx.ticket.updateMany({
        where: { id: { in: unique }, status: 'AVAILABLE' },
        data: { status: 'RESERVED', reservedAt: now },
      })
      if (result.count !== unique.length) {
        throw new ConflictException(
          'Uno o más números ya no estaban disponibles. Recarga e intenta de nuevo.',
        )
      }
      return tx.ticket.findMany({
        where: { id: { in: unique } },
        orderBy: { number: 'asc' },
      })
    })
  }

  async updateTicketStatus(
    ticketId: string,
    status: 'AVAILABLE' | 'RESERVED' | 'SOLD',
    customerId?: string,
  ) {
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status,
        customerId: customerId ?? null,
        reservedAt: status === 'RESERVED' ? new Date() : null,
      },
    });
  }

  async assignCustomerToTicketsBatch(
    ticketIds: string[],
    customerId: string,
    status?: 'AVAILABLE' | 'RESERVED' | 'SOLD',
  ) {
    const unique = [...new Set(ticketIds)]
    if (unique.length === 0) {
      throw new BadRequestException('Indica al menos un ticket')
    }

    return this.prisma.$transaction(async (tx) => {
      // Validar que todos los tickets existen
      const tickets = await tx.ticket.findMany({
        where: { id: { in: unique } },
      })
      if (tickets.length !== unique.length) {
        throw new NotFoundException('Uno o más tickets no existen')
      }

      // Validar que el cliente existe
      const customer = await tx.customer.findUnique({ where: { id: customerId } })
      if (!customer) throw new NotFoundException('Cliente no encontrado')

      // Actualizar tickets
      const updateData: any = { customerId }
      if (status) updateData.status = status
      if (status === 'RESERVED') updateData.reservedAt = new Date()

      const result = await tx.ticket.updateMany({
        where: { id: { in: unique } },
        data: updateData,
      })

      return tx.ticket.findMany({
        where: { id: { in: unique } },
        orderBy: { number: 'asc' },
      })
    })
  }

  async remove(id: string) {
    return this.prisma.raffle.delete({ where: { id } })
  }
}