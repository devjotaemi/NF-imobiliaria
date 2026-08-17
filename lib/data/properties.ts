import { cache } from "react";

import { db } from "@/lib/db";
import {
  montarOrderBy,
  montarWhere,
  POR_PAGINA,
  type Filtros,
  type TipoImovel,
} from "@/lib/data/filters";

/**
 * Leituras de imóvel usadas pelo site público.
 *
 * Sem camada de cache de propósito: volume de imobiliária regional. Uma
 * consulta no Postgres por pageview é irrelevante, e em troca não existe cache
 * pra invalidar — marcar "destaque" no painel aparece na home no refresh
 * seguinte, sem etapa intermediária que possa falhar.
 */

/** Campos que a vitrine (card) precisa — não puxa descrição nem galeria inteira. */
const SELECT_CARD = {
  id: true,
  slug: true,
  titulo: true,
  tipoTransacao: true,
  tipoImovel: true,
  precoCentavos: true,
  precoSobConsulta: true,
  bairro: true,
  cidade: true,
  estado: true,
  quartos: true,
  suites: true,
  banheiros: true,
  vagas: true,
  areaUtilM2: true,
  // Terreno não preenche areaUtilM2 — sem isto o card do lote fica sem metragem.
  areaTerrenoM2: true,
  fotos: {
    select: { url: true, altText: true },
    orderBy: { ordem: "asc" },
    take: 1, // só a capa
  },
} as const;

export type ImovelCard = Awaited<ReturnType<typeof listarDestaques>>[number];

/** Vitrine da home: curadoria manual, não listagem automática. */
export async function listarDestaques() {
  return db.property.findMany({
    where: { destaque: true, ativo: true },
    select: SELECT_CARD,
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Ficha do imóvel. Retorna null se não existe OU se está desativado.
 *
 * `cache()` do React porque a página da ficha pede o mesmo imóvel duas vezes:
 * uma no `generateMetadata` e outra no componente. Isso deduplica dentro do
 * mesmo render — não é cache entre requisições, então a decisão lá em cima
 * (sem camada de cache, painel reflete no refresh seguinte) continua valendo.
 */
export const buscarImovelPorSlug = cache(async (slug: string) => {
  return db.property.findFirst({
    where: { slug, ativo: true },
    include: {
      fotos: { orderBy: { ordem: "asc" } },
    },
  });
});

export type ImovelFicha = NonNullable<
  Awaited<ReturnType<typeof buscarImovelPorSlug>>
>;

/** Todos os imóveis ativos, com a galeria inteira — usado pelo feed VRSync. */
export async function listarAtivosParaFeed() {
  return db.property.findMany({
    where: { ativo: true },
    include: { fotos: { orderBy: { ordem: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Versão enxuta pro sitemap: só o que vira <url> no XML.
 *
 * Separada do feed de propósito — o sitemap precisa de slug, data e a capa,
 * e puxar a galeria inteira de 200+ imóveis pra usar três campos é I/O jogado
 * fora a cada requisição do Googlebot.
 */
export async function listarParaSitemap() {
  return db.property.findMany({
    where: { ativo: true },
    select: {
      slug: true,
      updatedAt: true,
      fotos: { select: { url: true }, orderBy: { ordem: "asc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
}

/* --------------------------------------------------------------- catálogo */

/**
 * Página do catálogo.
 *
 * Uma transação com os dois SELECTs: a contagem precisa enxergar exatamente o
 * mesmo conjunto que a listagem, senão "1.243 imóveis" e a paginação divergem
 * quando alguém cadastra algo no meio da requisição.
 */
export async function buscarImoveis(filtros: Filtros) {
  const where = montarWhere(filtros);

  const [itens, total] = await db.$transaction([
    db.property.findMany({
      where,
      select: SELECT_CARD,
      orderBy: montarOrderBy(filtros.ordenar),
      skip: (filtros.pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    db.property.count({ where }),
  ]);

  return { itens, total, paginas: Math.ceil(total / POR_PAGINA) };
}

/**
 * Contagem por tipo pra sidebar — "Apartamento (542)".
 *
 * Ignora o próprio filtro de tipo de propósito: se o visitante marcou "Casa",
 * os outros tipos precisam continuar mostrando quantos existem, senão todos
 * apareceriam zerados e as caixas ficariam inúteis.
 */
export async function contarPorTipo(filtros: Filtros) {
  const grupos = await db.property.groupBy({
    by: ["tipoImovel"],
    where: montarWhere({ ...filtros, tipos: [] }),
    _count: { _all: true },
  });

  return Object.fromEntries(
    grupos.map((grupo) => [grupo.tipoImovel, grupo._count._all]),
  ) as Record<string, number>;
}

export async function contarAtivos() {
  return db.property.count({ where: { ativo: true } });
}

/** Cidades com imóvel ativo — alimenta os selects de busca. */
export async function listarCidades() {
  const grupos = await db.property.groupBy({
    by: ["cidade"],
    where: { ativo: true },
    orderBy: { cidade: "asc" },
  });
  return grupos.map((grupo) => grupo.cidade);
}

/** Bairros com imóvel ativo, opcionalmente de uma cidade só. */
export async function listarBairros(cidade?: string | null) {
  const grupos = await db.property.groupBy({
    by: ["bairro"],
    where: { ativo: true, bairro: { not: null }, ...(cidade && { cidade }) },
    orderBy: { bairro: "asc" },
  });
  return grupos
    .map((grupo) => grupo.bairro)
    .filter((bairro): bairro is string => Boolean(bairro));
}

/** Bairros mais cheios — faixa "Encontre imóveis nos melhores bairros". */
export async function listarBairrosComContagem(limite = 5) {
  const grupos = await db.property.groupBy({
    by: ["bairro"],
    where: { ativo: true, bairro: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { bairro: "desc" } },
    take: limite,
  });

  return grupos
    .filter((grupo): grupo is typeof grupo & { bairro: string } =>
      Boolean(grupo.bairro),
    )
    .map((grupo) => ({ bairro: grupo.bairro, total: grupo._count._all }));
}

/**
 * Características distintas dos imóveis ativos, das mais comuns pras raras.
 *
 * Agregado em JS porque `caracteristicas` é `String[]` — o Postgres agruparia
 * o array inteiro como valor, não elemento a elemento.
 */
export async function listarCaracteristicas(limite = 12) {
  const linhas = await db.property.findMany({
    where: { ativo: true },
    select: { caracteristicas: true },
  });

  const contagem = new Map<string, number>();
  for (const linha of linhas) {
    for (const item of linha.caracteristicas) {
      contagem.set(item, (contagem.get(item) ?? 0) + 1);
    }
  }

  return [...contagem.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([nome, total]) => ({ nome, total }));
}

/* ------------------------------------------------------- blocos auxiliares */

/**
 * "Imóveis semelhantes" da ficha: mesma cidade e mesmo tipo, menos ele mesmo.
 *
 * Se não houver nenhum do mesmo tipo, cai pra qualquer imóvel da cidade — um
 * bloco vazio no fim da ficha é pior que uma sugestão menos parecida.
 */
export async function buscarSemelhantes(
  imovel: { id: string; cidade: string; tipoImovel: TipoImovel },
  limite = 3,
) {
  const base = { ativo: true, id: { not: imovel.id }, cidade: imovel.cidade };

  const mesmoTipo = await db.property.findMany({
    where: { ...base, tipoImovel: imovel.tipoImovel },
    select: SELECT_CARD,
    orderBy: { updatedAt: "desc" },
    take: limite,
  });

  if (mesmoTipo.length >= limite) return mesmoTipo;

  const complemento = await db.property.findMany({
    where: {
      ...base,
      tipoImovel: { not: imovel.tipoImovel },
    },
    select: SELECT_CARD,
    orderBy: { updatedAt: "desc" },
    take: limite - mesmoTipo.length,
  });

  return [...mesmoTipo, ...complemento];
}

/** Vitrine da página de terrenos. */
export async function listarTerrenos(limite = 8) {
  return db.property.findMany({
    where: { ativo: true, tipoImovel: "terreno" },
    select: SELECT_CARD,
    orderBy: [{ destaque: "desc" }, { updatedAt: "desc" }],
    take: limite,
  });
}
