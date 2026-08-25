import { NextResponse, type NextRequest } from "next/server";

import { usuarioAtual } from "@/lib/auth/current-user";
import { cliquesCrus, intervaloDoMes } from "@/lib/data/metrics";
import { escaparCsv } from "@/lib/format";
import { mesParaData } from "@/lib/metrics-month";

/**
 * CSV dos cliques do mês.
 *
 * É Route Handler (e não Server Action) porque precisa devolver um arquivo com
 * Content-Disposition — Server Action devolve payload RSC, não download.
 *
 * A ideia é essa: em vez de crescer a tela de métricas até virar dashboard,
 * exporta o dado cru e quem quiser cruza numa planilha.
 */
export async function GET(request: NextRequest) {
  if (!(await usuarioAtual())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const mes = request.nextUrl.searchParams.get("mes");
  const referencia = mes === null ? new Date() : mesParaData(mes);
  if (!referencia) {
    return NextResponse.json({ error: "Mês inválido" }, { status: 400 });
  }
  const { inicio, fim } = intervaloDoMes(referencia);

  const cliques = await cliquesCrus(inicio, fim);

  const cabecalho = [
    "data_hora",
    "imovel_slug",
    "imovel_titulo",
    "origem_no_site",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "referrer",
  ];

  const linhas = cliques.map((clique) => [
    clique.createdAt.toISOString(),
    clique.propertySlugSnapshot ?? "",
    clique.propertyTituloSnapshot ?? "",
    clique.placement,
    clique.utmSource ?? "",
    clique.utmMedium ?? "",
    clique.utmCampaign ?? "",
    clique.utmContent ?? "",
    clique.utmTerm ?? "",
    clique.referrer ?? "",
  ]);

  // BOM no início pro Excel abrir acentuação corretamente.
  const csv =
    "﻿" +
    [cabecalho, ...linhas]
      .map((linha) => linha.map(escaparCsv).join(","))
      .join("\r\n");

  const nomeArquivo = `cliques-whatsapp-${mes ?? "mes-atual"}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      "Cache-Control": "no-store",
    },
  });
}

