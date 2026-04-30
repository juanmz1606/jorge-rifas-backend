import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Registra una entrada en la tabla de auditoría
   */
  async log({
    action,
    entityType,
    entityId,
    oldValue,
    newValue,
    note,
    userId,        // ya puede venir como undefined
  }: {
    action: string;
    entityType: 'Ticket' | 'Customer' | 'Raffle';
    entityId: string;
    oldValue?: any;
    newValue?: any;
    note?: string;
    userId?: string;     // ← Asegúrate que sea opcional
  }) {
    return this.prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        oldValue: oldValue ? this.sanitizeValue(oldValue) : null,
        newValue: newValue ? this.sanitizeValue(newValue) : null,
        note: note?.trim() || null,
        userId,                    // ← Prisma ya lo aceptará
      },
    });
  }

  /**
   * Sanitiza los valores antes de guardarlos en Json para evitar datos demasiado grandes
   * o información sensible innecesaria.
   */
  private sanitizeValue(value: any): any {
    if (!value) return null;

    // Si es un array o objeto grande, puedes limitar profundidad si lo deseas
    try {
      const str = JSON.stringify(value);
      if (str.length > 50000) { // ~50KB límite razonable
        return {
          _note: 'Value too large, truncated',
          originalLength: str.length,
        };
      }
      return value;
    } catch {
      return { _error: 'Could not serialize value' };
    }
  }

  /**
   * Obtiene el historial de auditoría con filtros
   */
  async findMany({
    entityType,
    entityId,
    action,
    fromDate,
    toDate,
    limit = 50,
    page = 1,
    search,
  }: {
    entityType?: string;
    entityId?: string;
    action?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    page?: number;
    search?: string;
  }) {
    const skip = (page - 1) * limit;

    return this.prisma.auditLog.findMany({
      where: {
        ...(entityType && { entityType }),
        ...(entityId && { entityId }),
        ...(action && { action }),
        ...(fromDate && { createdAt: { gte: fromDate } }),
        ...(toDate && { createdAt: { lte: toDate } }),
        ...(entityType && { entityType }),
        ...(action && { action }),
        ...(search && { note: { contains: search, mode: 'insensitive' } }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip,
    });
  }

  /**
   * Cuenta el total de registros para paginación
   */
  async count({
    entityType,
    entityId,
    action,
    fromDate,
    toDate,
  }: {
    entityType?: string;
    entityId?: string;
    action?: string;
    fromDate?: Date;
    toDate?: Date;
  }) {
    return this.prisma.auditLog.count({
      where: {
        ...(entityType && { entityType }),
        ...(entityId && { entityId }),
        ...(action && { action }),
        ...(fromDate && { createdAt: { gte: fromDate } }),
        ...(toDate && { createdAt: { lte: toDate } }),
      },
    });
  }

  /**
   * Obtiene el historial de un entidad específica (útil para ver detalle de un cliente o ticket)
   */
  async findByEntity(entityType: string, entityId: string, limit = 30) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}