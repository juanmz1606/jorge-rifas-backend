import "dotenv/config";
import { defineConfig, env } from "@prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  // Usamos la DATABASE_URL que tengas activa en el .env para las migraciones
  datasource: {
    url: env("DATABASE_URL"),
  },
});