import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RafflesModule } from './raffles/raffles.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ImagesModule } from './images/images.module';
import { CustomersModule } from './customers/customers.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    RafflesModule,
    CloudinaryModule,
    ImagesModule,
    CustomersModule,
    SettingsModule,
  ],
})
export class AppModule {}