import { Controller, Get, Post, Body, Param, Patch, UseGuards, Delete } from '@nestjs/common';
import { RafflesService } from './raffles.service';
import { CreateRaffleDto } from './dto/create-raffle.dto';
import { ReserveTicketsBatchDto } from './dto/reserve-tickets-batch.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateRaffleDto } from './dto/update-raffle.dto';

@Controller('raffles')
export class RafflesController {
  constructor(private raffles: RafflesService) { }

  @Get()
  findAll() {
    return this.raffles.findAll();
  }

  @Get('featured')
  findFeatured() {
    return this.raffles.findFeatured();
  }

  @UseGuards(JwtAuthGuard)
  @Get('id/:id')
  findById(@Param('id') id: string) {
    return this.raffles.findById(id)
  }

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

  /** Público: reservar varios números disponibles a la vez (misma rifa). */
  @Post('tickets/reserve-batch')
  reserveTicketsBatch(@Body() dto: ReserveTicketsBatchDto) {
    return this.raffles.reserveTicketsBatch(dto.ticketIds)
  }

  @UseGuards(JwtAuthGuard)
  @Post('tickets')
  addTicket(@Body('raffleId') raffleId: string, @Body('number') number: number) {
    return this.raffles.addTicket(raffleId, number)
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.raffles.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/details')
  update(@Param('id') id: string, @Body() dto: UpdateRaffleDto) {
    return this.raffles.update(id, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.raffles.remove(id)
  }

  @Patch('tickets/:ticketId/reserve')
  reserveTicket(@Param('ticketId') ticketId: string) {
    return this.raffles.reserveTicket(ticketId)
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
  @Patch('tickets/:ticketId')
  updateTicket(
    @Param('ticketId') ticketId: string,
    @Body('status') status: 'AVAILABLE' | 'RESERVED' | 'SOLD',
    @Body('customerId') customerId?: string,
  ) {
    return this.raffles.updateTicketStatus(ticketId, status, customerId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('tickets/:ticketId')
  deleteTicket(@Param('ticketId') ticketId: string) {
    return this.raffles.deleteTicket(ticketId)
  }
}