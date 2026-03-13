import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const token = this.jwt.sign({ sub: user.id, role: user.role });

    return { token };
  }

  async createInitialAdmin(email: string, password: string) {
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) return { message: 'Admin ya existe' };

    const hashed = await bcrypt.hash(password, 10);
    await this.prisma.user.create({
      data: { email, password: hashed },
    });

    return { message: 'Admin creado correctamente' };
  }
}