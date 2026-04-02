import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'rifas',
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder }, (error, result) => {
          if (error || !result) return reject(error);
          resolve(result.secure_url);
        })
        .end(file.buffer);
    });
  }

  async deleteImage(url: string): Promise<void> {
    const publicId = this.extractPublicId(url);
    await cloudinary.uploader.destroy(publicId);
  }

  private extractPublicId(url: string): string {
    const matches = url.match(/\/(?:v\d+\/)?(.+)\.[^.]+$/)
    return matches ? matches[1] : url
  }
}