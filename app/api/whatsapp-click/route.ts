import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_ATRIBUICAO, desserializarAtribuicao } from "@/lib/attribution";
import {
  ehPlacementValido,
  registrarCliqueWhatsApp,
} from "@/lib/whatsapp/track-click";

/**
 * GET /api/whatsapp-click?imovel=<slug>&origem=<placement>
 *
 * Rota (e não Server Action) de propósito: precisa funcionar como <a href>
 * comum — sem JS, abrindo em nova aba, e devolvendo um redirect de verdade.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const slugImovel = searchParams.get("imovel");
  const origemBruta = searchParams.get("origem") ?? "ficha_cta";
  const placement = ehPlacementValido(origemBruta) ? origemBruta : "ficha_cta";

  const atribuicao = desserializarAtribuicao(
    request.cookies.get(COOKIE_ATRIBUICAO)?.value,
  );

  // registrarCliqueWhatsApp já absorve falha de banco internamente e devolve
  // uma URL válida de qualquer jeito — o redirect nunca depende do log.
  const { urlRedirecionamento } = await registrarCliqueWhatsApp({
    slugImovel,
    placement,
    atribuicao,
    referrer: request.headers.get("referer"),
    userAgent: request.headers.get("user-agent"),
  });

  const resposta = NextResponse.redirect(urlRedirecionamento, 302);
  // Sem isso, navegador/CDN podem cachear o redirect e os cliques seguintes
  // nunca chegariam ao servidor — a métrica silenciosamente pararia de contar.
  resposta.headers.set("Cache-Control", "no-store, max-age=0");
  return resposta;
}
