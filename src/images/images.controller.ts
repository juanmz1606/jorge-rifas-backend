import {
  Controller,
  Post,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ImagesService } from './images.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('images')
export class ImagesController {
  constructor(private images: ImagesService) { }

  @Post('upload/:raffleId')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  upload(
    @Param('raffleId') raffleId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('order') order?: string,
  ) {
    if (!file) throw new BadRequestException('No se proporcionó ningún archivo')
    return this.images.uploadRaffleImage(raffleId, file, order ? parseInt(order) : 0)
  }

  @Delete(':imageId')
  delete(@Param('imageId') imageId: string) {
    return this.images.deleteRaffleImage(imageId);
  }
}