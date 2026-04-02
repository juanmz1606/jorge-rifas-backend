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
npx prisma migrate deploy
```

Crea el administrador inicial:
```bash
curl -X POST http://localhost:3000/api/v1/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@rifas.com", "password": "tu_password"}'
```

## Desarrollo
```bash
npm run start:dev
```

El servidor corre en `http://localhost:3000`. Todas las rutas tienen el prefijo `/api/v1`.

## Endpoints principales

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /api/v1/auth/login | No | Iniciar sesión |
| POST | /api/v1/auth/setup | No | Crear admin inicial |
| GET | /api/v1/raffles | No | Listar rifas |
| GET | /api/v1/raffles/featured | No | Rifas destacadas |
| GET | /api/v1/raffles/:slug | No | Detalle de rifa |
| POST | /api/v1/raffles | Sí | Crear rifa |
| PATCH | /api/v1/raffles/:id/details | Sí | Editar rifa |
| PATCH | /api/v1/raffles/:id/status | Sí | Cambiar estado |
| DELETE | /api/v1/raffles/:id | Sí | Eliminar rifa |
| PATCH | /api/v1/raffles/tickets/:id/reserve | No | Reservar ticket (público) |
| PATCH | /api/v1/raffles/tickets/:id | Sí | Actualizar ticket |
| PATCH | /api/v1/raffles/tickets/:id/number | Sí | Cambiar número de ticket |
| POST | /api/v1/raffles/tickets | Sí | Agregar ticket |
| DELETE | /api/v1/raffles/tickets/:id | Sí | Eliminar ticket |
| GET | /api/v1/customers | Sí | Listar clientes |
| POST | /api/v1/customers | Sí | Crear cliente |
| GET | /api/v1/customers/:id | Sí | Detalle cliente |
| PATCH | /api/v1/customers/:id | Sí | Editar cliente |
| DELETE | /api/v1/customers/:id | Sí | Eliminar cliente |
| GET | /api/v1/settings | No | Obtener ajustes |
| PUT | /api/v1/settings | Sí | Actualizar ajustes |

## Deploy

Railway + Supabase (PostgreSQL). Ver variables de entorno en `.env.example`.