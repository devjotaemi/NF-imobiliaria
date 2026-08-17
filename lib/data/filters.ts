import type { Prisma } from "@prisma/client";

import { TIPOS_IMOVEL, TIPOS_TRANSACAO } from "@/lib/validation/property";

/**
 * Filtros do catálogo.
 *
 * Toda a busca mora na URL — nada de estado em client component. Isso dá de
 * graça: link compartilhável, botão voltar funcionando, e o formulário de
 * filtro funcionando com JavaScript desligado (é um <form method="get">).
 *
 * Este módulo é puro de propósito (não importa `@/lib/db` nem `server-only`):
 * a página usa pra montar a consulta e a sidebar usa pra marcar os campos.
 */

export const POR_PAGINA = 12;

export const ORDENACOES = [
  { valor: "recentes", rotulo: "Mais recentes" },
  { valor: "menor_preco", rotulo: "Menor preço" },
  { valor: "maior_preco", rotulo: "Maior preço" },
  { valor: "maior_area", rotulo: "Maior área" },
] as const;

export type Ordenacao = (typeof ORDENACOES)[number]["valor"];
export type Visao = "grid" | "lista";
export type TipoImovel = (typeof TIPOS_IMOVEL)[number];
export type TipoTransacao = (typeof TIPOS_TRANSACAO)[number];

export type Filtros = {
  q: string | null;
  transacao: TipoTransacao | null;
  tipos: TipoImovel[];
  cidade: string | null;
  bairro: string | null;
  /** Valor cru do select de faixa ("300000-500000"), preservado pra remarcar. */
  faixa: string | null;
  precoMin: number | null;
  precoMax: number | null;
  quartos: number | null;
  banheiros: number | null;
  vagas: number | null;
  areaMin: number | null;
  areaMax: number | null;
  condominioMax: number | null;
  iptuMax: number | null;
  caracteristicas: string[];
  destaque: boolean;
  ordenar: Ordenacao;
  visao: Visao;
  pagina: number;
};

export type ParamsBrutos = Record<string, string | string[] | undefined>;

/* ------------------------------------------------------------- leitura */

function texto(params: ParamsBrutos, chave: string): string | null {
  const valor = params[chave];
  const bruto = Array.isArray(valor) ? valor[0] : valor;
  const limpo = bruto?.trim();
  return limpo ? limpo : null;
}

function lista(params: ParamsBrutos, chave: string): string[] {
  const valor = params[chave];
  if (valor === undefined) return [];
  const itens = Array.isArray(valor) ? valor : [valor];
  return Array.from(new Set(itens.map((item) => item.trim()).filter(Boolean)));
}

function inteiro(
  params: ParamsBrutos,
  chave: string,
  max: number,
): number | null {
  const bruto = texto(params, chave);
  if (bruto === null || !/^\d+$/.test(bruto)) return null;
  const numero = Number(bruto);
  if (!Number.isSafeInteger(numero) || numero <= 0) return null;
  return Math.min(numero, max);
}

export function parseFiltros(params: ParamsBrutos): Filtros {
  const transacao = texto(params, "transacao");
  const ordenar = texto(params, "ordenar");
  const visao = texto(params, "visao");

  const faixa = texto(params, "faixa");
  const [faixaMin, faixaMax] = (faixa ?? "").split("-");

  // O select de faixa e os dois campos numéricos escrevem no mesmo filtro.
  // Quem digitou um número explícito ganha do preset.
  const precoMin = inteiro(params, "precoMin", 1_000_000_000) ?? numeroOuNulo(faixaMin);
  const precoMax = inteiro(params, "precoMax", 1_000_000_000) ?? numeroOuNulo(faixaMax);

  return {
    q: texto(params, "q"),
    transacao: ehTransacao(transacao) ? transacao : null,
    tipos: lista(params, "tipo").filter(ehTipoImovel),
    cidade: texto(params, "cidade"),
    bairro: texto(params, "bairro"),
    faixa,
    precoMin,
    precoMax,
    quartos: limitar(inteiro(params, "quartos", 5), 5),
    banheiros: limitar(inteiro(params, "banheiros", 5), 5),
    vagas: limitar(inteiro(params, "vagas", 5), 5),
    areaMin: inteiro(params, "areaMin", 10_000_000),
    areaMax: inteiro(params, "areaMax", 10_000_000),
    condominioMax: inteiro(params, "condominioMax", 1_000_000),
    iptuMax: inteiro(params, "iptuMax", 1_000_000),
    caracteristicas: lista(params, "caracteristica"),
    destaque: texto(params, "destaque") === "1",
    ordenar: ehOrdenacao(ordenar) ? ordenar : "recentes",
    visao: visao === "lista" ? "lista" : "grid",
    pagina: Math.max(1, inteiro(params, "pagina", 9999) ?? 1),
  };
}

function numeroOuNulo(valor: string | undefined): number | null {
  if (!valor) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

function limitar(valor: number | null, max: number): number | null {
  return valor === null ? null : Math.min(valor, max);
}

function ehTransacao(valor: string | null): valor is TipoTransacao {
  return valor !== null && (TIPOS_TRANSACAO as readonly string[]).includes(valor);
}

function ehTipoImovel(valor: string): valor is TipoImovel {
  return (TIPOS_IMOVEL as readonly string[]).includes(valor);
}

function ehOrdenacao(valor: string | null): valor is Ordenacao {
  return (
    valor !== null && ORDENACOES.some((ordenacao) => ordenacao.valor === valor)
  );
}

/* --------------------------------------------------------------- consulta */

/** Reais -> centavos, que é como o banco guarda dinheiro. */
const centavos = (reais: number | null) => (reais === null ? null : reais * 100);

export function montarWhere(filtros: Filtros): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = { ativo: true };

  if (filtros.transacao) where.tipoTransacao = filtros.transacao;
  if (filtros.tipos.length > 0) where.tipoImovel = { in: filtros.tipos };
  if (filtros.cidade) where.cidade = filtros.cidade;
  if (filtros.bairro) where.bairro = filtros.bairro;
  if (filtros.destaque) where.destaque = true;

  if (filtros.q) {
    // Busca livre por cidade, bairro, título ou código do anúncio — é o que o
    // visitante digita quando chega com uma referência na mão.
    where.OR = [
      { titulo: { contains: filtros.q, mode: "insensitive" } },
      { bairro: { contains: filtros.q, mode: "insensitive" } },
      { cidade: { contains: filtros.q, mode: "insensitive" } },
      { referenceCode: { contains: filtros.q, mode: "insensitive" } },
    ];
  }

  const precoMin = centavos(filtros.precoMin);
  const precoMax = centavos(filtros.precoMax);
  if (precoMin !== null || precoMax !== null) {
    where.precoCentavos = {
      ...(precoMin !== null && { gte: precoMin }),
      ...(precoMax !== null && { lte: precoMax }),
    };
  }

  const condominioMax = centavos(filtros.condominioMax);
  if (condominioMax !== null) where.condominioCentavos = { lte: condominioMax };

  const iptuMax = centavos(filtros.iptuMax);
  if (iptuMax !== null) where.iptuCentavos = { lte: iptuMax };

  // Cômodos são mínimos: "3 quartos" quer dizer 3 ou mais.
  if (filtros.quartos !== null) where.quartos = { gte: filtros.quartos };
  if (filtros.banheiros !== null) where.banheiros = { gte: filtros.banheiros };
  if (filtros.vagas !== null) where.vagas = { gte: filtros.vagas };

  if (filtros.areaMin !== null || filtros.areaMax !== null) {
    where.areaUtilM2 = {
      ...(filtros.areaMin !== null && { gte: filtros.areaMin }),
      ...(filtros.areaMax !== null && { lte: filtros.areaMax }),
    };
  }

  if (filtros.caracteristicas.length > 0) {
    where.caracteristicas = { hasEvery: filtros.caracteristicas };
  }

  return where;
}

export function montarOrderBy(
  ordenar: Ordenacao,
): Prisma.PropertyOrderByWithRelationInput {
  switch (ordenar) {
    case "menor_preco":
      return { precoCentavos: { sort: "asc", nulls: "last" } };
    case "maior_preco":
      return { precoCentavos: { sort: "desc", nulls: "last" } };
    case "maior_area":
      return { areaUtilM2: { sort: "desc", nulls: "last" } };
    default:
      return { updatedAt: "desc" };
  }
}

/* ------------------------------------------------------------ serialização */

/**
 * Filtros -> querystring, com sobrescrita pontual.
 *
 * Usado pelos links de paginação, ordenação e alternância grade/lista, que
 * precisam trocar UM parâmetro e preservar todos os outros.
 */
export function serializarFiltros(
  filtros: Filtros,
  sobrescrever: Partial<Filtros> = {},
): string {
  const f = { ...filtros, ...sobrescrever };
  const params = new URLSearchParams();

  if (f.q) params.set("q", f.q);
  if (f.transacao) params.set("transacao", f.transacao);
  for (const tipo of f.tipos) params.append("tipo", tipo);
  if (f.cidade) params.set("cidade", f.cidade);
  if (f.bairro) params.set("bairro", f.bairro);
  if (f.faixa) params.set("faixa", f.faixa);
  if (f.precoMin !== null) params.set("precoMin", String(f.precoMin));
  if (f.precoMax !== null) params.set("precoMax", String(f.precoMax));
  if (f.quartos !== null) params.set("quartos", String(f.quartos));
  if (f.banheiros !== null) params.set("banheiros", String(f.banheiros));
  if (f.vagas !== null) params.set("vagas", String(f.vagas));
  if (f.areaMin !== null) params.set("areaMin", String(f.areaMin));
  if (f.areaMax !== null) params.set("areaMax", String(f.areaMax));
  if (f.condominioMax !== null)
    params.set("condominioMax", String(f.condominioMax));
  if (f.iptuMax !== null) params.set("iptuMax", String(f.iptuMax));
  for (const item of f.caracteristicas) params.append("caracteristica", item);
  if (f.destaque) params.set("destaque", "1");
  if (f.ordenar !== "recentes") params.set("ordenar", f.ordenar);
  if (f.visao !== "grid") params.set("visao", f.visao);
  if (f.pagina > 1) params.set("pagina", String(f.pagina));

  const texto = params.toString();
  return texto ? `?${texto}` : "";
}

export function urlCatalogo(
  filtros: Filtros,
  sobrescrever: Partial<Filtros> = {},
): string {
  // Qualquer mudança de filtro volta pra página 1 — senão o visitante cai numa
  // página que não existe mais no conjunto novo e vê a lista vazia.
  const semPagina = { pagina: 1, ...sobrescrever };
  return `/imoveis${serializarFiltros(filtros, semPagina)}`;
}

/** Quantos filtros o visitante aplicou — alimenta o contador do botão mobile. */
export function contarFiltrosAtivos(filtros: Filtros): number {
  let total = 0;
  if (filtros.q) total++;
  if (filtros.transacao) total++;
  if (filtros.cidade) total++;
  if (filtros.bairro) total++;
  if (filtros.precoMin !== null || filtros.precoMax !== null) total++;
  if (filtros.quartos !== null) total++;
  if (filtros.banheiros !== null) total++;
  if (filtros.vagas !== null) total++;
  if (filtros.areaMin !== null || filtros.areaMax !== null) total++;
  if (filtros.condominioMax !== null) total++;
  if (filtros.iptuMax !== null) total++;
  if (filtros.destaque) total++;
  return total + filtros.tipos.length + filtros.caracteristicas.length;
}
