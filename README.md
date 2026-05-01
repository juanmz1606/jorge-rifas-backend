# Rifas Backend

API REST construida con NestJS + Prisma + PostgreSQL para la plataforma de rifas Echeverry Distribuidora.

## Stack

- NestJS + TypeScript
- Prisma 7 + PostgreSQL (Supabase)
- JWT para autenticación
- Cloudinary para imágenes

## Instalación

```bash
npm install
```

Crea un archivo `.env` basado en `.env.example` y configura tus variables de entorno.

Corre las migraciones:

```bash
npx prisma migrate deploy
```

Crea el administrador inicial (solo funciona si no existe ningún usuario):

```bash
curl -X POST http://localhost:3000/api/v1/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ejemplo.com", "password": "tu_password"}'
```

## Desarrollo

```bash
npm run start:dev
```

El servidor corre en `http://localhost:3000`. Todas las rutas tienen el prefijo `/api/v1`.

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de conexión a PostgreSQL (pooler de Supabase, puerto 6543) |
| `JWT_SECRET` | Clave secreta para firmar los tokens JWT |
| `JWT_EXPIRES_IN` | Duración del token (ej: `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud en Cloudinary |
| `CLOUDINARY_API_KEY` | API key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary |
| `ALLOWED_ORIGINS` | Orígenes permitidos para CORS, separados por coma |

## Endpoints

### Auth
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /auth/login | No | Iniciar sesión |
| POST | /auth/setup | No | Crear admin inicial (solo una vez) |

### Rifas
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /raffles | No | Listar todas las rifas |
| GET | /raffles/featured | No | Rifas destacadas activas |
| GET | /raffles/:slug | No | Detalle de rifa por slug |
| GET | /raffles/id/:id | Sí | Detalle de rifa por ID |
| POST | /raffles | Sí | Crear rifa |
| PATCH | /raffles/:id/details | Sí | Editar información de rifa |
| PATCH | /raffles/:id/status | Sí | Cambiar estado (ACTIVE/INACTIVE/FINISHED) |
| DELETE | /raffles/:id | Sí | Eliminar rifa y todos sus tickets |

### Tickets
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /raffles/tickets | Sí | Agregar ticket individual |
| POST | /raffles/tickets/reserve-batch | No | Reservar varios tickets (público) |
| POST | /raffles/tickets/reserve-with-customer | No | Reservar y crear cliente PENDIENTE (público) |
| PATCH | /raffles/tickets/batch/assign-customer | Sí | Asignar cliente a varios tickets |
| PATCH | /raffles/tickets/:id | Sí | Actualizar estado/cliente/notas de ticket |
| PATCH | /raffles/tickets/:id/reserve | No | Reservar ticket individual (público) |
| PATCH | /raffles/tickets/:id/number | Sí | Cambiar número de ticket |
| DELETE | /raffles/tickets/:id | Sí | Eliminar ticket (solo si está disponible) |

### Clientes
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /customers | Sí | Listar clientes (soporta ?search=) |
| POST | /customers | Sí | Crear cliente |
| GET | /customers/:id | Sí | Detalle de cliente con sus tickets |
| PATCH | /customers/:id | Sí | Editar cliente |
| DELETE | /customers/:id | Sí | Eliminar cliente y liberar sus tickets |

### Imágenes
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /images/upload/:raffleId | Sí | Subir imagen a Cloudinary |
| DELETE | /images/:imageId | Sí | Eliminar imagen |

### Ajustes
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /settings | No | Obtener todos los ajustes |
| PUT | /settings | Sí | Actualizar ajustes |

### Auditoría
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /audit-log | Sí | Listar logs (soporta filtros y paginación) |
| GET | /audit-log/count | Sí | Contar logs (mismos filtros) |

**Query params de `/audit-log`:** `entityType`, `entityId`, `action`, `search`, `fromDate`, `toDate`, `limit`, `page`

## Lógica de negocio

- Los tickets van numerados desde **0** hasta `totalNumbers - 1`
- Cada rifa puede configurar **3 o 4 cifras** (`digitCount`) para mostrar los números
- Al reservar con cliente (`reserve-with-customer`), si el teléfono ya existe se reutiliza el cliente existente; si no, se crea con el nombre `"Nombre - PENDIENTE"`
- Solo se pueden eliminar tickets en estado `AVAILABLE`
- Al eliminar un cliente, todos sus tickets quedan liberados (`AVAILABLE`)
- Los slugs se generan automáticamente desde el título; si hay duplicado se agrega sufijo `-2`, `-3`, etc.
- Todos los cambios relevantes quedan registrados en la tabla `AuditLog`

## Deploy

- **Backend:** Railway
- **Base de datos:** Supabase (PostgreSQL) — usar URL con pooler (puerto 6543) en `DATABASE_URL`
- **Imágenes:** Cloudinary