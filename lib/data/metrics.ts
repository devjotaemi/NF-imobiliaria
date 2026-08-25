import "server-only";

import { db } from "@/lib/db";

/**
 * Métrica de CPL.
 *
 * O escopo pede duas coisas em tensão: "decisão por dado" e "sem dashboard
 * analítico". A resolução é esta: cliques agrupados por campanha, gasto
 * lançado à mão, CPL calculado. Nada de gráfico, funil ou tempo real.
 */

export type LinhaCampanha = {
  campanha: string;
  cliques: number;
  gastoCentavos: number | null;
  cplCentavos: number | null;
};

/** Rótulo pra clique que chegou sem utm_campaign (tráfego direto/orgânico). */
export const SEM_CAMPANHA = "(sem campanha)";

export function intervaloDoMes(referencia: Date) {
  const inicio = new Date(
    Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth(), 1),
  );
  const fim = new Date(
    Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth() + 1, 1),
  );
  return { inicio, fim };
}

export async function resumoPorCampanha(
  inicio: Date,
  fim: Date,
): Promise<LinhaCampanha[]> {
  const [cliques, gastos] = await Promise.all([
    db.whatsAppClick.groupBy({
      by: ["utmCampaign"],
      where: { createdAt: { gte: inicio, lt: fim } },
      _count: { _all: true },
    }),
    db.campaignSpend.findMany({
      where: { mesReferencia: { gte: inicio, lt: fim } },
      select: { campanha: true, valorCentavos: true },
    }),
  ]);

  const gastoPorCampanha = new Map(
    gastos.map((gasto) => [gasto.campanha, gasto.valorCentavos]),
  );

  const linhas = new Map<string, LinhaCampanha>();

  for (const grupo of cliques) {
    const campanha = grupo.utmCampaign ?? SEM_CAMPANHA;
    linhas.set(campanha, {
      campanha,
      cliques: grupo._count._all,
      gastoCentavos: null,
      cplCentavos: null,
    });
  }

  // Campanha com gasto lançado mas zero clique também precisa aparecer —
  // é justamente o caso que indica dinheiro queimado.
  for (const [campanha, valor] of gastoPorCampanha) {
    const linha = linhas.get(campanha);
    if (linha) {
      linha.gastoCentavos = valor;
    } else {
      linhas.set(campanha, {
        campanha,
        cliques: 0,
        gastoCentavos: valor,
        cplCentavos: null,
      });
    }
  }

  for (const linha of linhas.values()) {
    linha.cplCentavos =
      linha.gastoCentavos !== null && linha.cliques > 0
        ? Math.round(linha.gastoCentavos / linha.cliques)
        : null;
  }

  return [...linhas.values()].sort((a, b) => b.cliques - a.cliques);
}

/** Quais imóveis puxaram clique no período — útil pra curadoria da vitrine. */
export async function cliquesPorImovel(inicio: Date, fim: Date) {
  const grupos = await db.whatsAppClick.groupBy({
    by: ["propertyTituloSnapshot"],
    where: { createdAt: { gte: inicio, lt: fim } },
    _count: { _all: true },
    orderBy: { _count: { id: "desc" } },
    take: 20,
  });

  return grupos.map((grupo) => ({
    titulo: grupo.propertyTituloSnapshot ?? "(sem imóvel)",
    cliques: grupo._count._all,
  }));
}

/** Linhas cruas pro CSV — quem quiser ir além analisa numa planilha. */
export async function cliquesCrus(inicio: Date, fim: Date) {
  return db.whatsAppClick.findMany({
    where: { createdAt: { gte: inicio, lt: fim } },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      propertySlugSnapshot: true,
      propertyTituloSnapshot: true,
      placement: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      utmContent: true,
      utmTerm: true,
      referrer: true,
    },
  });
}

/** Nomes de campanha já vistos — evita erro de digitação no lançamento do gasto. */
export async function campanhasConhecidas(): Promise<string[]> {
  const grupos = await db.whatsAppClick.groupBy({
    by: ["utmCampaign"],
    where: { utmCampaign: { not: null } },
  });
  return grupos
    .map((grupo) => grupo.utmCampaign)
    .filter((campanha): campanha is string => Boolean(campanha))
    .sort();
}
