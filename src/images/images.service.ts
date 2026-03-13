import { Injectable, NotFoundException } from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ImagesService {
  constructor(
    private cloudinary: CloudinaryService,
    private prisma: PrismaService,
  ) {}

  async uploadRaffleImage(
    raffleId: string,
    file: Express.Multer.File,
    order: number = 0,
  ) {
    const raffle = await this.prisma.raffle.findUnique({
      where: { id: raffleId },
    });
    if (!raffle) throw new NotFoundException('Rifa no encontrada');

    const url = await this.cloudinary.uploadImage(file, 'rifas');

    return this.prisma.raffleImage.create({
      data: { url, order, raffleId },
    });
  }

  async deleteRaffleImage(imageId: string) {
    const image = await this.prisma.raffleImage.findUnique({
      where: { id: imageId },
    });
    if (!image) throw new NotFoundException('Imagen no encontrada');

    await this.cloudinary.deleteImage(image.url);
    await this.prisma.raffleImage.delete({ where: { id: imageId } });

    return { message: 'Imagen eliminada correctamente' };
  }
}