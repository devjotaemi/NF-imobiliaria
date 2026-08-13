"use server";

import { Prisma } from "@prisma/client";
import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { exigirUsuario } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { proximoReferenceCode, slugUnico } from "@/lib/data/property-admin";
import {
  EsquemaImovel,
  lerFormDataImovel,
  paraCamposPrisma,
} from "@/lib/validation/property";

export type EstadoFormulario = {
  erro?: string;
  errosPorCampo?: Record<string, string>;
};

/** Depois de mexer em imóvel, o site e a lista precisam refletir na hora. */
function revalidarTudo(slug?: string) {
  revalidatePath("/admin/imoveis");
  revalidatePath("/");
  if (slug) revalidatePath(`/imoveis/${slug}`);
}

// ---------------------------------------------------------------------------
// Criar / editar
// ---------------------------------------------------------------------------

export async function criarImovel(
  _estadoAnterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await exigirUsuario();

  const analise = EsquemaImovel.safeParse(lerFormDataImovel(formData));
  if (!analise.success) return erroDeValidacao(analise.error);

  const dados = analise.data;
  const urlsFotos = lerFotosPendentes(formData);
  let criado: { id: string; slug: string } | null = null;

  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const slug = await slugUnico(dados.titulo);
    const referenceCode = await proximoReferenceCode();

    try {
      criado = await db.property.create({
        data: {
          ...paraCamposPrisma(dados),
          slug,
          referenceCode,
          fotos: {
            create: urlsFotos.map((foto, indice) => ({
              url: foto.url,
              storageKey: foto.storageKey,
              ordem: indice,
            })),
          },
        },
        select: { id: true, slug: true },
      });
      break;
    } catch (erro) {
      if (!(erro instanceof Prisma.PrismaClientKnownRequestError) || erro.code !== "P2002") {
        throw erro;
      }
    }
  }

  if (!criado) {
    return { erro: "Houve outro cadastro ao mesmo tempo. Tente salvar novamente." };
  }

  revalidarTudo(criado.slug);
  redirect(`/admin/imoveis/${criado.id}?criado=1`);
}

export async function atualizarImovel(
  id: string,
  _estadoAnterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await exigirUsuario();

  const analise = EsquemaImovel.safeParse(lerFormDataImovel(formData));
  if (!analise.success) return erroDeValidacao(analise.error);

  const atual = await db.property.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!atual) return { erro: "Imóvel não encontrado" };

  // O slug NÃO é regerado ao editar o título: anúncios já publicados apontam
  // pra ele. Trocar é decisão manual, fora deste fluxo.
  await db.property.update({
    where: { id },
    data: paraCamposPrisma(analise.data),
  });

  revalidarTudo(atual.slug);
  return {};
}

// ---------------------------------------------------------------------------
// Ações rápidas da lista
// ---------------------------------------------------------------------------

export async function alternarDestaque(id: string) {
  await exigirUsuario();

  const imovel = await db.property.findUnique({
    where: { id },
    select: { destaque: true, slug: true },
  });
  if (!imovel) return;

  await db.property.update({
    where: { id },
    data: { destaque: !imovel.destaque },
  });

  revalidarTudo(imovel.slug);
}

export async function alternarAtivo(id: string) {
  await exigirUsuario();

  const imovel = await db.property.findUnique({
    where: { id },
    select: { ativo: true, slug: true },
  });
  if (!imovel) return;

  await db.property.update({ where: { id }, data: { ativo: !imovel.ativo } });

  revalidarTudo(imovel.slug);
}

/**
 * Exclusão de verdade. O caminho normal pra tirar do ar é desativar
 * (`ativo = false`), que preserva o histórico de cliques pra métrica.
 */
export async function excluirImovel(id: string, formData: FormData) {
  await exigirUsuario();
  const confirmacao = formData.get("confirmacao");
  if (typeof confirmacao !== "string" || confirmacao.trim().toLowerCase() !== "excluir") {
    throw new Error("Confirmação de exclusão inválida");
  }

  const imovel = await db.property.findUnique({
    where: { id },
    select: { slug: true, fotos: { select: { storageKey: true } } },
  });
  if (!imovel) return;

  await db.property.delete({ where: { id } });

  // Apaga os arquivos depois da linha: se falhar, sobra arquivo órfão no
  // storage — barato — em vez de registro apontando pra foto inexistente.
  await apagarDoBlob(imovel.fotos.map((foto) => foto.storageKey));

  revalidarTudo(imovel.slug);
  redirect("/admin/imoveis");
}

// ---------------------------------------------------------------------------
// Fotos
// ---------------------------------------------------------------------------

export async function adicionarFotos(id: string, formData: FormData) {
  await exigirUsuario();

  const novas = lerFotosPendentes(formData);
  if (novas.length === 0) return;

  const imovel = await db.property.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!imovel) return;

  const ultima = await db.propertyPhoto.findFirst({
    where: { propertyId: id },
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });
  const inicio = (ultima?.ordem ?? -1) + 1;

  await db.propertyPhoto.createMany({
    data: novas.map((foto, indice) => ({
      propertyId: id,
      url: foto.url,
      storageKey: foto.storageKey,
      ordem: inicio + indice,
    })),
  });

  revalidatePath(`/admin/imoveis/${id}`);
  revalidarTudo(imovel.slug);
}

export async function removerFoto(fotoId: string) {
  await exigirUsuario();

  const foto = await db.propertyPhoto.findUnique({
    where: { id: fotoId },
    select: {
      storageKey: true,
      propertyId: true,
      property: { select: { slug: true } },
    },
  });
  if (!foto) return;

  await db.propertyPhoto.delete({ where: { id: fotoId } });
  await apagarDoBlob([foto.storageKey]);

  revalidatePath(`/admin/imoveis/${foto.propertyId}`);
  revalidarTudo(foto.property.slug);
}

/** Move a foto para a primeira posição (vira a capa). */
export async function definirCapa(fotoId: string) {
  await exigirUsuario();

  const foto = await db.propertyPhoto.findUnique({
    where: { id: fotoId },
    select: { propertyId: true, property: { select: { slug: true } } },
  });
  if (!foto) return;

  const fotos = await db.propertyPhoto.findMany({
    where: { propertyId: foto.propertyId },
    orderBy: { ordem: "asc" },
    select: { id: true },
  });

  const reordenadas = [
    fotoId,
    ...fotos.map((f) => f.id).filter((id) => id !== fotoId),
  ];

  await db.$transaction(
    reordenadas.map((id, ordem) =>
      db.propertyPhoto.update({ where: { id }, data: { ordem } }),
    ),
  );

  revalidatePath(`/admin/imoveis/${foto.propertyId}`);
  revalidarTudo(foto.property.slug);
}

// ---------------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------------

/**
 * O uploader grava as fotos no Blob pela rota autenticada e devolve os
 * campos num hidden input JSON. Aqui só lemos o que já subiu.
 */
function lerFotosPendentes(
  formData: FormData,
): { url: string; storageKey: string }[] {
  const bruto = formData.get("fotosNovas");
  if (typeof bruto !== "string" || !bruto.trim()) return [];

  try {
    const lista = JSON.parse(bruto) as unknown;
    if (!Array.isArray(lista)) return [];

    return lista.flatMap((item) => {
      if (typeof item !== "object" || item === null) return [];
      const { url, storageKey } = item as Record<string, unknown>;
      if (typeof url !== "string" || typeof storageKey !== "string") return [];
      try {
        const endereco = new URL(url);
        if (
          endereco.protocol !== "https:" ||
          !endereco.hostname.endsWith(".public.blob.vercel-storage.com") ||
          !storageKey.startsWith("imoveis/") ||
          endereco.pathname.slice(1) !== storageKey
        ) {
          return [];
        }
      } catch {
        return [];
      }
      return [{ url, storageKey }];
    });
  } catch {
    return [];
  }
}

async function apagarDoBlob(chaves: string[]) {
  if (chaves.length === 0) return;
  try {
    await del(chaves);
  } catch (erro) {
    console.error("[blob] falha ao apagar arquivos:", erro);
  }
}

function erroDeValidacao(erro: {
  issues: { path: PropertyKey[]; message: string }[];
}): EstadoFormulario {
  const errosPorCampo: Record<string, string> = {};
  for (const issue of erro.issues) {
    const campo = String(issue.path[0] ?? "");
    if (campo && !errosPorCampo[campo]) errosPorCampo[campo] = issue.message;
  }
  return { erro: "Confira os campos destacados.", errosPorCampo };
}
