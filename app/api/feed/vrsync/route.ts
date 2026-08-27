import { NextResponse } from "next/server";

import { contatoFeed } from "@/lib/config";
import { listarAtivosParaFeed } from "@/lib/data/properties";
import { gerarFeedVRSync } from "@/lib/vrsync/generate-feed";
import { mapearParaVRSync } from "@/lib/vrsync/map-property";

/**
 * Feed VRSync — a URL que você entrega ao Diário Imóveis (Classitudo).
 *
 * Eles não têm painel de upload: a equipe técnica cadastra esta URL no sistema
 * de leitura deles e o portal passa a buscar sozinho, no ritmo dele. Não existe
 * "enviar" nada, não precisa de cron do nosso lado — o XML é montado a partir
 * do banco no momento em que a URL é acessada.
 *
 * É export de mão única, não integração de API: por isso continua dentro do
 * escopo mesmo com o módulo da OLX congelado.
 *
 * Exporta TODOS os imóveis ativos (não só os em destaque): a vitrine da home é
 * curadoria, o feed é inventário.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const imoveis = await listarAtivosParaFeed();
  const contato = contatoFeed();

  const xml = gerarFeedVRSync(
    imoveis.map(mapearParaVRSync),
    {
      provider: "NF Negócios",
      email: contato.email,
      contactName: contato.nome,
      telephone: contato.telefone,
    },
    {
      name: contato.nome,
      email: contato.email,
      telephone: contato.telefone,
    },
  );

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Curto: o portal pode puxar a qualquer momento e precisa ver o estado atual.
      "Cache-Control": "public, max-age=300",
    },
  });
}
