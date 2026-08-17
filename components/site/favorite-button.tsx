"use client";

import { useSyncExternalStore } from "react";

import { IconeCoracao } from "@/components/ui/icons";

const CHAVE = "nf:favoritos";
const EVENTO = "nf:favoritos-mudou";

/**
 * Favoritar imóvel.
 *
 * Guarda no navegador, não no banco: o site não tem login, e um favorito por
 * sessão já resolve o "quero comparar depois". Não gera lead nem métrica — o
 * único evento que interessa continua sendo o clique no WhatsApp.
 *
 * O localStorage é lido por `useSyncExternalStore`, não por efeito: ele é um
 * store externo de verdade, e é assim que o React quer que se leia um. De
 * quebra, favoritar num card atualiza o coração de todos os outros na mesma
 * tela — é para isso que serve o evento `nf:favoritos-mudou`.
 */

function assinar(aoMudar: () => void) {
  // `storage` cobre outra aba; o evento próprio cobre esta mesma aba, já que
  // o navegador não dispara `storage` pra quem escreveu.
  window.addEventListener("storage", aoMudar);
  window.addEventListener(EVENTO, aoMudar);
  return () => {
    window.removeEventListener("storage", aoMudar);
    window.removeEventListener(EVENTO, aoMudar);
  };
}

/** String crua, não array: o snapshot precisa ser estável entre renders. */
function instantaneo(): string {
  try {
    return window.localStorage.getItem(CHAVE) ?? "";
  } catch {
    // localStorage bloqueado (navegação privada em alguns navegadores):
    // favorito é conveniência, não pode derrubar a página.
    return "";
  }
}

function instantaneoServidor(): string {
  return "";
}

function decodificar(bruto: string): string[] {
  if (!bruto) return [];
  try {
    const lista: unknown = JSON.parse(bruto);
    return Array.isArray(lista)
      ? lista.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function FavoriteButton({
  slug,
  rotulo = false,
  className,
}: {
  slug: string;
  rotulo?: boolean;
  className?: string;
}) {
  const bruto = useSyncExternalStore(
    assinar,
    instantaneo,
    instantaneoServidor,
  );
  const favorito = decodificar(bruto).includes(slug);

  function alternar(evento: React.MouseEvent) {
    // O card inteiro é um <Link>; sem isto o clique no coração navegaria.
    evento.preventDefault();
    evento.stopPropagation();

    const atuais = decodificar(instantaneo());
    const novos = atuais.includes(slug)
      ? atuais.filter((item) => item !== slug)
      : [...atuais, slug];

    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(novos));
    } catch {
      // Sem persistência não há o que sincronizar — o botão simplesmente não muda.
      return;
    }
    window.dispatchEvent(new Event(EVENTO));
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={favorito}
      aria-label={favorito ? "Remover dos favoritos" : "Favoritar imóvel"}
      className={
        className ??
        "flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-tinta shadow-sm backdrop-blur transition hover:bg-white"
      }
    >
      <IconeCoracao
        preenchido={favorito}
        className={`h-[18px] w-[18px] transition ${favorito ? "text-verde-600" : ""}`}
      />
      {rotulo && <span className="text-sm font-medium">Favoritar</span>}
    </button>
  );
}
