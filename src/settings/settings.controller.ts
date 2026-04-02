import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('settings')
export class SettingsController {
  constructor(private settings: SettingsService) {}

  @Get()
  getAll() {
    return this.settings.getAll();
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  setMany(@Body() data: Record<string, string>) {
    return this.settings.setMany(data);
  }
}