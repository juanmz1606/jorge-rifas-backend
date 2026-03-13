import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('settings')
export class SettingsController {
  constructor(private settings: SettingsService) {}

  // Pública — el frontend la usa para mostrar nombre, redes, etc
  @Get()
  getAll() {
    return this.settings.getAll();
  }

  // Protegida — solo el admin puede cambiar settings
  @UseGuards(JwtAuthGuard)
  @Put()
  setMany(@Body() data: Record<string, string>) {
    return this.settings.setMany(data);
  }
}