import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { RafflesService } from './raffles.service';
import { CreateRaffleDto } from './dto/create-raffle.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('raffles')
export class RafflesController {
  constructor(private raffles: RafflesService) {}

  // Rutas públicas
  @Get()
  findAll() {
    return this.raffles.findAll();
  }

  @Get('featured')
  findFeatured() {
    return this.raffles.findFeatured();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.raffles.findBySlug(slug);
  }

  // Rutas protegidas (solo admin)
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateRaffleDto) {
    return this.raffles.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'ACTIVE' | 'INACTIVE' | 'FINISHED',
  ) {
    return this.raffles.updateStatus(id, status);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('tickets/:ticketId')
  updateTicket(
    @Param('ticketId') ticketId: string,
    @Body('status') status: 'AVAILABLE' | 'RESERVED' | 'SOLD',
    @Body('customerId') customerId?: string,
  ) {
    return this.raffles.updateTicketStatus(ticketId, status, customerId);
  }
}