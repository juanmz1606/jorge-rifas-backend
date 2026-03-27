import { Controller, Get, Post, Body, Param, Patch, UseGuards, Delete } from '@nestjs/common';
import { RafflesService } from './raffles.service';
import { CreateRaffleDto } from './dto/create-raffle.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('raffles')
export class RafflesController {
  constructor(private raffles: RafflesService) { }

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
  @Patch(':id/details')
  update(@Param('id') id: string, @Body() dto: Partial<CreateRaffleDto>) {
    return this.raffles.update(id, dto)
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
  @Patch('tickets/:ticketId/number')
  updateTicketNumber(
    @Param('ticketId') ticketId: string,
    @Body('number') number: number,
  ) {
    return this.raffles.updateTicketNumber(ticketId, number)
  }

  @UseGuards(JwtAuthGuard)
  @Post('tickets')
  addTicket(@Body('raffleId') raffleId: string, @Body('number') number: number) {
    return this.raffles.addTicket(raffleId, number)
  }

  @UseGuards(JwtAuthGuard)
  @Delete('tickets/:ticketId')
  deleteTicket(@Param('ticketId') ticketId: string) {
    return this.raffles.deleteTicket(ticketId)
  }

  @Patch('tickets/:ticketId/reserve')
  reserveTicket(@Param('ticketId') ticketId: string) {
    return this.raffles.reserveTicket(ticketId)
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

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.raffles.remove(id)
  }
}