import { NextResponse, type NextRequest } from "next/server";

import {
  ATRIBUICAO_MAX_AGE_SEGUNDOS,
  COOKIE_ATRIBUICAO,
  atribuicaoDaUrl,
  serializarAtribuicao,
} from "@/lib/attribution";
import { COOKIE_SESSAO, lerTokenSessao } from "@/lib/auth/session";

// Next.js 16 renomeou `middleware.ts` para `proxy.ts` (mesma função, runtime Node).
//
// Duas responsabilidades, ambas precisam rodar antes da página:
//   1. Capturar a origem da visita (UTM/click id) num cookie, na primeira
//      resposta — garante que o dado já existe antes de qualquer clique.
//   2. Barrar /admin sem sessão válida.

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const resposta = ehRotaAdminProtegida(pathname)
    ? guardaAdmin(request)
    : NextResponse.next();

  // Só grava quando a URL traz sinal de campanha. Navegação interna sem UTM
  // não pode apagar a origem já registrada.
  const atribuicao = atribuicaoDaUrl(searchParams);
  if (atribuicao) {
    resposta.cookies.set(COOKIE_ATRIBUICAO, serializarAtribuicao(atribuicao), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ATRIBUICAO_MAX_AGE_SEGUNDOS,
    });
  }

  return resposta;
}

function ehRotaAdminProtegida(pathname: string): boolean {
  if (!pathname.startsWith("/admin")) return false;
  // A tela de login é justamente onde quem não tem sessão precisa chegar.
  return pathname !== "/admin/login";
}

function guardaAdmin(request: NextRequest) {
  const token = request.cookies.get(COOKIE_SESSAO)?.value;

  if (lerTokenSessao(token)) return NextResponse.next();

  // Checagem otimista: o layout do admin revalida no servidor. Isso aqui só
  // evita renderizar a tela pra quem claramente não está logado.
  const destino = new URL("/admin/login", request.url);
  destino.searchParams.set("proximo", request.nextUrl.pathname);
  return NextResponse.redirect(destino);
}

export const config = {
  // Roda no site e no admin, mas fora de assets estáticos e das rotas de API
  // (a rota do WhatsApp lê o cookie que já foi gravado na visita à página).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)"],
};
