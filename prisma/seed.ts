import "dotenv/config";
import { createInterface } from "node:readline/promises";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { hashSenha } from "../lib/auth/session";

/**
 * Cria o primeiro usuário do painel.
 *
 * Rode uma vez depois de aplicar as migrations:  npm run seed
 * A senha é pedida no terminal — não fica em arquivo nem no histórico de shell.
 */
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não definida. Preencha o .env.");
  }

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const terminal = createInterface({ input: process.stdin, output: process.stdout });

  try {
    const nome = (await terminal.question("Nome: ")).trim();
    const email = (await terminal.question("E-mail: ")).trim().toLowerCase();
    const senha = (await terminal.question("Senha (mín. 10 caracteres): ")).trim();

    if (!nome || !email) throw new Error("Nome e e-mail são obrigatórios.");
    if (senha.length < 10) throw new Error("Senha muito curta.");

    const usuario = await db.adminUser.upsert({
      where: { email },
      update: { nome, senhaHash: await hashSenha(senha) },
      create: { nome, email, senhaHash: await hashSenha(senha) },
      select: { email: true },
    });

    console.log(`\nUsuário pronto: ${usuario.email}`);
    console.log("Acesse /admin/login para entrar.");
  } finally {
    terminal.close();
    await db.$disconnect();
  }
}

main().catch((erro) => {
  console.error(erro instanceof Error ? erro.message : erro);
  process.exit(1);
});
