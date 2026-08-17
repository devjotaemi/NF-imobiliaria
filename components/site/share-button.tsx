"use client";

import { useState } from "react";

import { IconeCheck, IconeCompartilhar } from "@/components/ui/icons";

/**
 * Compartilhar a ficha.
 *
 * Usa a folha nativa do sistema quando existe (é o caminho do celular, onde o
 * WhatsApp aparece como primeira opção) e cai pra copiar o link no desktop.
 */
export function ShareButton({ titulo }: { titulo: string }) {
  const [copiado, setCopiado] = useState(false);

  async function compartilhar() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, url });
        return;
      } catch {
        // Usuário cancelou a folha de compartilhamento — não é erro.
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Clipboard negado: não há fallback melhor que não fazer nada.
    }
  }

  return (
    <button
      type="button"
      onClick={compartilhar}
      className="inline-flex items-center gap-2 text-sm font-medium text-tinta-500 transition hover:text-tinta"
    >
      {copiado ? (
        <IconeCheck className="h-[18px] w-[18px] text-verde-600" />
      ) : (
        <IconeCompartilhar className="h-[18px] w-[18px]" />
      )}
      {copiado ? "Link copiado" : "Compartilhar"}
    </button>
  );
}
