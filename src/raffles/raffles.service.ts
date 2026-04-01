import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service';
import { CreateRaffleDto } from './dto/create-raffle.dto';

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

  async update(id: string, dto: any) {
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
    if (!ticket) throw new Error('Ticket no encontrado')
    if (ticket.status !== 'AVAILABLE') throw new Error('Ticket no disponible')

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'RESERVED' },
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

  async remove(id: string) {
    return this.prisma.raffle.delete({ where: { id } })
  }
}