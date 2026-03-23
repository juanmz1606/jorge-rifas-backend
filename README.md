# Rifas Backend

API REST construida con NestJS + Prisma + PostgreSQL para la plataforma de rifas.

## Stack

- NestJS + TypeScript
- Prisma 6 + PostgreSQL
- JWT para autenticación
- Cloudinary para imágenes

## Instalación
```bash
npm install
```

Crea un archivo `.env` basado en `.env.example` y configura tus variables.

Corre las migraciones:
```bash
npx prisma migrate dev
```

Crea el administrador inicial:
```bash
curl -X POST http://localhost:3000/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@rifas.com", "password": "tu_password"}'
```

## Desarrollo
```bash
npm run start:dev
```

El servidor corre en `http://localhost:3000`.

## Endpoints principales

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /auth/login | No | Iniciar sesión |
| GET | /raffles | No | Listar rifas |
| GET | /raffles/:slug | No | Detalle de rifa |
| POST | /raffles | Sí | Crear rifa |
| PATCH | /raffles/:id/details | Sí | Editar rifa |
| DELETE | /raffles/:id | Sí | Eliminar rifa |
| PATCH | /raffles/tickets/:id/reserve | No | Reservar ticket (público) |
| PATCH | /raffles/tickets/:id | Sí | Actualizar ticket (admin) |
| GET | /customers | Sí | Listar clientes |
| POST | /customers | Sí | Crear cliente |
| GET | /settings | No | Obtener ajustes |
| PUT | /settings | Sí | Actualizar ajustes |

## Deploy

Railway + Supabase (PostgreSQL). Ver variables de entorno en `.env.example`.