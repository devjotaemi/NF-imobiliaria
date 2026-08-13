"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type FotoEnviada = {
  url: string;
  storageKey: string;
  nome: string;
};

// O limite da função da Vercel é 4,5 MB. Deixamos uma margem para o
// multipart/form-data, que acrescenta alguns bytes à requisição.
const TAMANHO_MAXIMO_FOTO = 4 * 1024 * 1024;

/**
 * Envia as fotos pela rota autenticada do próprio site e guarda as URLs num
 * campo escondido — o Server Action que salva o imóvel só lê esse campo.
 *
 * O envio direto do navegador para `vercel.com/api/blob` está devolvendo 400
 * sem cabeçalho CORS para este projeto. A rota local evita esse bloqueio.
 */
export function PhotoUploader({ nomeCampo = "fotosNovas" }: { nomeCampo?: string }) {
  const [fotos, setFotos] = useState<FotoEnviada[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function aoSelecionar(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(evento.target.files ?? []);
    if (arquivos.length === 0) return;

    setEnviando(true);
    setErro(null);

    try {
      const arquivoGrande = arquivos.find(
        (arquivo) => arquivo.size > TAMANHO_MAXIMO_FOTO,
      );
      if (arquivoGrande) {
        throw new Error(
          `\"${arquivoGrande.name}\" passa de 4 MB. Reduza a foto e tente novamente.`,
        );
      }

      // Uma de cada vez reduz o pico de memória da função e deixa o erro
      // apontar precisamente qual arquivo não pôde ser salvo.
      for (const arquivo of arquivos) {
        const formulario = new FormData();
        formulario.set("foto", arquivo);

        const resposta = await fetch("/api/admin/upload", {
          method: "POST",
          body: formulario,
        });
        const resultado = (await resposta.json()) as
          | FotoEnviada
          | { error?: string };

        if (!resposta.ok || !("url" in resultado)) {
          throw new Error(
            "error" in resultado && resultado.error
              ? resultado.error
              : `Falha ao enviar \"${arquivo.name}\".`,
          );
        }

        setFotos((atual) => [...atual, resultado]);
      }
    } catch (causa) {
      setErro(
        causa instanceof Error
          ? `Falha no upload: ${causa.message}`
          : "Falha no upload",
      );
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remover(storageKey: string) {
    setFotos((atual) => atual.filter((foto) => foto.storageKey !== storageKey));
  }

  return (
    <div className="flex flex-col gap-3">
      {/* O que o Server Action lê. */}
      <input type="hidden" name={nomeCampo} value={JSON.stringify(fotos)} />

      <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={aoSelecionar}
          disabled={enviando}
          className="hidden"
        />
        {enviando ? "Enviando..." : "Adicionar fotos"}
      </label>

      <p className="text-xs text-slate-500">Até 4 MB por foto.</p>

      {erro && (
        <p role="alert" className="text-sm text-red-600">
          {erro}
        </p>
      )}

      {fotos.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {fotos.map((foto) => (
            <li
              key={foto.storageKey}
              className="relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200"
            >
              <Image
                src={foto.url}
                alt={foto.nome}
                fill
                sizes="200px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => remover(foto.storageKey)}
                aria-label={`Remover ${foto.nome}`}
                className="absolute right-1 top-1 rounded bg-slate-900/80 px-2 py-0.5 text-xs text-white transition hover:bg-red-600"
              >
                remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
