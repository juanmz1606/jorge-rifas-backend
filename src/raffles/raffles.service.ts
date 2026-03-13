import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRaffleDto } from './dto/create-raffle.dto';

@Injectable()
export class RafflesService {
  constructor(private prisma: PrismaService) {}

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
    const slug = this.generateSlug(dto.title);

    const raffle = await this.prisma.raffle.create({
      data: {
        ...dto,
        slug,
        price: dto.price,
        drawDate: new Date(dto.drawDate),
      },
    });

    // Genera los tickets automáticamente
    const tickets = Array.from({ length: dto.totalNumbers }, (_, i) => ({
      number: i + 1,
      raffleId: raffle.id,
    }));

    await this.prisma.ticket.createMany({ data: tickets });

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
          orderBy: { number: 'asc' },
          select: {
            id: true,
            number: true,
            status: true,
          },
        },
      },
    });

    if (!raffle) throw new NotFoundException('Rifa no encontrada');
    return raffle;
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'FINISHED') {
    return this.prisma.raffle.update({
      where: { id },
      data: { status },
    });
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
}