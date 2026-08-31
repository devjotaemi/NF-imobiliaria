"use client";

import { useEffect, useState } from "react";

import { IconeFechar } from "@/components/ui/icons";

const PALAVRAS_CHAVE =
  "A NF Negócios é uma imobiliária em Mirassol, SP, especializada em casas à venda, apartamentos à venda, terrenos à venda e imóveis para alugar em Mirassol e região. Atuamos com venda de imóveis e aluguel de imóveis em São José do Rio Preto, Bady Bassitt, Cedral e Guapiaçu, oferecendo casas em condomínio fechado, apartamentos, coberturas, kitnets, studios, salas comerciais, lojas, galpões, terrenos, chácaras, sítios e fazendas. Para quem quer comprar terreno e construir, temos a linha Terreno + Construção: escolha do terreno, projeto personalizado de casa e construção acompanhada, sem burocracia, do primeiro contato até a entrega das chaves. Nossos corretores de imóveis em Mirassol, credenciados pelo CRECI, cuidam de toda a negociação imobiliária, avaliação de imóveis, documentação e financiamento imobiliário, com atendimento humano direto pelo WhatsApp. Também ajudamos proprietários que querem anunciar imóvel para vender ou alugar com mais visibilidade e segurança na região de São José do Rio Preto. Seja para investir em imóvel, comprar a casa própria, alugar apartamento perto do centro ou encontrar o terreno ideal para construir, a NF Negócios Imobiliários reúne oportunidades em Mirassol e nas cidades vizinhas, com histórico de centenas de famílias atendidas e imóveis vendidos na região.";

/**
 * O parágrafo fica sempre no HTML — só a visibilidade alterna por CSS — porque
 * montá-lo condicionalmente em JSX (`{aberto && ...}`) faria o texto não
 * existir no DOM até o clique, e um crawler nunca chegaria a lê-lo.
 */
export function SeoKeywordsButton() {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((valor) => !valor)}
        aria-expanded={aberto}
        aria-label="Palavras-chave sobre a NF Negócios"
        className="text-[10px] text-white/10 transition hover:text-white/40 focus-visible:text-white/60"
      >
        seo
      </button>

      <div
        className={`absolute bottom-full right-0 z-10 mb-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-verde-900 p-4 text-xs leading-relaxed text-white/50 shadow-lg ${
          aberto ? "block" : "hidden"
        }`}
      >
        <button
          type="button"
          onClick={() => setAberto(false)}
          aria-label="Fechar"
          className="absolute right-3 top-3 text-white/40 transition hover:text-white"
        >
          <IconeFechar className="h-3.5 w-3.5" />
        </button>
        <p className="pr-5">{PALAVRAS_CHAVE}</p>
      </div>
    </div>
  );
}
