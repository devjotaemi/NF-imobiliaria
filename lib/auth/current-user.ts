import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { COOKIE_SESSAO, lerTokenSessao } from "@/lib/auth/session";
import { db } from "@/lib/db";

export type UsuarioAdmin = {
  id: string;
  nome: string;
  email: string;
};

/** Usuário logado, ou null. Confere o token E se o usuário ainda existe. */
export async function usuarioAtual(): Promise<UsuarioAdmin | null> {
  const cookieStore = await cookies();
  const userId = lerTokenSessao(cookieStore.get(COOKIE_SESSAO)?.value);
  if (!userId) return null;

  // O proxy só valida a assinatura do cookie. Aqui conferimos no banco: um
  // usuário removido não continua entrando com um token ainda válido.
  return db.adminUser.findUnique({
    where: { id: userId },
    select: { id: true, nome: true, email: true },
  });
}

/**
 * Exige sessão. Use no topo de toda página e Server Action do /admin.
 *
 * O proxy já barra o acesso, mas ele é uma checagem otimista — esta é a que
 * realmente protege os dados.
 */
export async function exigirUsuario(): Promise<UsuarioAdmin> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/admin/login");
  return usuario;
}
