"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  COOKIE_SESSAO,
  SESSAO_MAX_AGE_SEGUNDOS,
  conferirSenha,
  criarTokenSessao,
} from "@/lib/auth/session";
import { db } from "@/lib/db";

const EsquemaLogin = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
  proximo: z.string().optional(),
});

export type EstadoLogin = { erro?: string };

export async function entrar(
  _estadoAnterior: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const analise = EsquemaLogin.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
    proximo: formData.get("proximo") ?? undefined,
  });

  if (!analise.success) {
    return { erro: analise.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { email, senha, proximo } = analise.data;

  const usuario = await db.adminUser.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, senhaHash: true },
  });

  // Mensagem genérica de propósito: não confirma se o e-mail existe.
  const generico = { erro: "E-mail ou senha incorretos" };
  if (!usuario) return generico;
  if (!(await conferirSenha(senha, usuario.senhaHash))) return generico;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_SESSAO, criarTokenSessao(usuario.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSAO_MAX_AGE_SEGUNDOS,
  });

  // Só aceita caminho interno — evita open redirect via ?proximo=
  const destino =
    proximo && proximo.startsWith("/admin") ? proximo : "/admin/imoveis";
  redirect(destino);
}

export async function sair() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_SESSAO);
  redirect("/admin/login");
}
