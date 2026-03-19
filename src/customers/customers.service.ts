import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCustomerDto) {
    const exists = await this.prisma.customer.findUnique({
      where: { phone: dto.phone },
    });
    if (exists) throw new ConflictException('Ya existe un cliente con ese teléfono');

    return this.prisma.customer.create({ data: dto });
  }

  async findAll(search?: string) {
    return this.prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
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
    return this.prisma.customer.findUnique({
      where: { id },
      include: {
        tickets: {
          include: {
            raffle: {
              select: { title: true, slug: true }
            }
          }
        }
      }
    })
  }

  async update(id: string, dto: UpdateCustomerDto) {
    return this.prisma.customer.update({
      where: { id },
      data: {
        ...dto,
        email: dto.email || null,
      }
    })
  }

  async remove(id: string) {
    await this.prisma.ticket.updateMany({
      where: { customerId: id },
      data: { status: 'AVAILABLE', customerId: null },
    })

    return this.prisma.customer.delete({ where: { id } })
  }
}