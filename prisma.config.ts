import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 moveu a connection string do schema.prisma pra cá.
// Isso vale pro CLI (migrate/studio); no runtime quem conecta é o adapter
// em lib/db.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
