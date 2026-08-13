import "server-only";

import { db } from "@/lib/db";
import { gerarSlug } from "@/lib/format";

/** Próximo código de referência (NF-0001, NF-0002...). */
export async function proximoReferenceCode(): Promise<string> {
  const existentes = await db.property.findMany({
    where: { referenceCode: { startsWith: "NF-" } },
    select: { referenceCode: true },
  });

  let maior = 0;
  for (const imovel of existentes) {
    const codigo = /^NF-(\d+)$/.exec(imovel.referenceCode);
    if (codigo) maior = Math.max(maior, Number(codigo[1]));
  }

  return `NF-${String(maior + 1).padStart(4, "0")}`;
}

/**
 * Slug único a partir do título. Se já existe, vira "-2", "-3"...
 *
 * `ignorarId` permite que um imóvel mantenha o próprio slug ao ser editado.
 */
export async function slugUnico(
  titulo: string,
  ignorarId?: string,
): Promise<string> {
  const base = gerarSlug(titulo) || "imovel";

  for (let tentativa = 1; tentativa <= 50; tentativa++) {
    const candidato = tentativa === 1 ? base : `${base}-${tentativa}`;
    const existente = await db.property.findUnique({
      where: { slug: candidato },
      select: { id: true },
    });
    if (!existente || existente.id === ignorarId) return candidato;
  }

  // Saída improvável, mas melhor que loop infinito.
  return `${base}-${Date.now()}`;
}

/** Lista do painel: inclui inativos, com a foto de capa. */
export async function listarImoveisAdmin() {
  return db.property.findMany({
    orderBy: [{ destaque: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      referenceCode: true,
      titulo: true,
      tipoTransacao: true,
      tipoImovel: true,
      precoCentavos: true,
      precoSobConsulta: true,
      bairro: true,
      cidade: true,
      estado: true,
      destaque: true,
      ativo: true,
      updatedAt: true,
      fotos: { select: { url: true }, orderBy: { ordem: "asc" }, take: 1 },
      _count: { select: { cliques: true } },
    },
  });
}

export type ImovelAdmin = Awaited<
  ReturnType<typeof listarImoveisAdmin>
>[number];

export async function buscarImovelAdmin(id: string) {
  return db.property.findUnique({
    where: { id },
    include: { fotos: { orderBy: { ordem: "asc" } } },
  });
}

export type ImovelAdminDetalhe = NonNullable<
  Awaited<ReturnType<typeof buscarImovelAdmin>>
>;
