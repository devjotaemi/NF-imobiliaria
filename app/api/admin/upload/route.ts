import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { usuarioAtual } from "@/lib/auth/current-user";

const TIPOS_DE_IMAGEM = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const TAMANHO_MAXIMO_FOTO = 4 * 1024 * 1024;

/**
 * Recebe a foto no mesmo domínio do painel e a grava no Blob no servidor.
 *
 * O fluxo de upload direto do SDK chama `vercel.com/api/blob`, que neste
 * projeto responde sem CORS. Centralizar o PUT aqui contorna o problema e
 * mantém o token BLOB_READ_WRITE_TOKEN fora do navegador.
 */
export async function POST(request: Request) {
  try {
    const usuario = await usuarioAtual();
    if (!usuario) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const formulario = await request.formData();
    const foto = formulario.get("foto");
    if (!(foto instanceof File)) {
      return NextResponse.json(
        { error: "Selecione uma foto para enviar." },
        { status: 400 },
      );
    }

    if (!TIPOS_DE_IMAGEM.has(foto.type)) {
      return NextResponse.json(
        { error: "Formato inválido. Envie JPG, PNG, WebP ou AVIF." },
        { status: 400 },
      );
    }

    if (foto.size > TAMANHO_MAXIMO_FOTO) {
      return NextResponse.json(
        { error: "A foto deve ter no máximo 4 MB." },
        { status: 413 },
      );
    }

    const blob = await put(`imoveis/${nomeSeguro(foto.name)}`, foto, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({
      url: blob.url,
      storageKey: blob.pathname,
      nome: foto.name,
    });
  } catch (erro) {
    console.error("[upload] falha ao enviar foto:", erro);
    const mensagem =
      erro instanceof Error && erro.message.includes("BLOB_READ_WRITE_TOKEN")
        ? "O armazenamento de fotos não está configurado."
        : "Não foi possível enviar a foto. Tente novamente.";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }
}

function nomeSeguro(nome: string) {
  const limpo = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return limpo || "foto";
}
