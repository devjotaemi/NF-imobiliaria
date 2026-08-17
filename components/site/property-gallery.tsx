"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  IconeChevronDireita,
  IconeChevronEsquerda,
  IconeFechar,
} from "@/components/ui/icons";

type Foto = {
  id: string;
  url: string;
  altText: string | null;
};

const THUMBS = 4;

/**
 * Galeria da ficha: mosaico de foto grande + miniaturas, com lightbox.
 *
 * Client component pela seleção, pelas setas e pelo overlay. A primeira foto
 * entra com `priority` porque é o maior elemento acima da dobra — é ela que o
 * LCP mede numa página que existe pra converter tráfego pago.
 */
export function PropertyGallery({
  fotos,
  titulo,
  selo,
}: {
  fotos: Foto[];
  titulo: string;
  selo?: string;
}) {
  const [ativa, setAtiva] = useState(0);
  const [ampliada, setAmpliada] = useState(false);

  const total = fotos.length;

  const avancar = useCallback(
    (passo: number) => setAtiva((atual) => (atual + passo + total) % total),
    [total],
  );

  if (total === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-2xl bg-areia-100 text-tinta-400">
        Sem fotos
      </div>
    );
  }

  const principal = fotos[Math.min(ativa, total - 1)];
  const miniaturas = fotos.slice(1, 1 + THUMBS);
  const restantes = total - 1 - miniaturas.length;

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-areia-100 lg:aspect-[16/11]">
          <Image
            src={principal.url}
            alt={principal.altText ?? titulo}
            fill
            priority
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover"
          />

          <button
            type="button"
            onClick={() => setAmpliada(true)}
            className="absolute inset-0 cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white"
            aria-label="Ampliar fotos"
          />

          {selo && (
            <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-verde-950/85 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
              {selo}
            </span>
          )}

          {total > 1 && (
            <>
              <Seta
                direcao="anterior"
                onClick={() => avancar(-1)}
                className="left-4"
              />
              <Seta
                direcao="proxima"
                onClick={() => avancar(1)}
                className="right-4"
              />
            </>
          )}

          <span className="pointer-events-none absolute bottom-4 left-4 rounded-lg bg-verde-950/80 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            {ativa + 1} / {total}
          </span>
        </div>

        {miniaturas.length > 0 && (
          <ul className="grid grid-cols-2 gap-3">
            {miniaturas.map((foto, indice) => {
              const posicao = indice + 1;
              const ultima = indice === miniaturas.length - 1;
              const mostrarContador = ultima && restantes > 0;

              return (
                <li key={foto.id}>
                  <button
                    type="button"
                    onClick={() =>
                      mostrarContador ? setAmpliada(true) : setAtiva(posicao)
                    }
                    aria-label={
                      mostrarContador
                        ? `Ver todas as ${total} fotos`
                        : `Ver foto ${posicao + 1} de ${total}`
                    }
                    className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-areia-100 transition hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-700 lg:aspect-square"
                  >
                    <Image
                      src={foto.url}
                      alt=""
                      fill
                      sizes="160px"
                      className="object-cover"
                    />

                    {mostrarContador && (
                      <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-verde-950/70 text-white backdrop-blur-[2px]">
                        <span className="text-lg font-semibold">
                          +{restantes}
                        </span>
                        <span className="text-[0.7rem]">
                          Ver todas as fotos
                        </span>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {ampliada && (
        <Lightbox
          fotos={fotos}
          titulo={titulo}
          ativa={ativa}
          aoTrocar={setAtiva}
          aoFechar={() => setAmpliada(false)}
        />
      )}
    </>
  );
}

function Seta({
  direcao,
  onClick,
  className,
}: {
  direcao: "anterior" | "proxima";
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direcao === "anterior" ? "Foto anterior" : "Próxima foto"}
      className={`absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-tinta shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${className}`}
    >
      {direcao === "anterior" ? (
        <IconeChevronEsquerda className="h-5 w-5" />
      ) : (
        <IconeChevronDireita className="h-5 w-5" />
      )}
    </button>
  );
}

function Lightbox({
  fotos,
  titulo,
  ativa,
  aoTrocar,
  aoFechar,
}: {
  fotos: Foto[];
  titulo: string;
  ativa: number;
  aoTrocar: (indice: number) => void;
  aoFechar: () => void;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const total = fotos.length;
  const ativaAtual = useRef(ativa);
  const trocarAtual = useRef(aoTrocar);
  const fecharAtual = useRef(aoFechar);

  useEffect(() => {
    ativaAtual.current = ativa;
    trocarAtual.current = aoTrocar;
    fecharAtual.current = aoFechar;
  }, [ativa, aoTrocar, aoFechar]);

  useEffect(() => {
    // Devolve o foco pra onde estava quando o overlay fechar.
    const anterior = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    caixa.current?.focus();

    const anteriorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") fecharAtual.current();
      if (evento.key === "ArrowLeft") {
        trocarAtual.current((ativaAtual.current - 1 + total) % total);
      }
      if (evento.key === "ArrowRight") {
        trocarAtual.current((ativaAtual.current + 1) % total);
      }
    }

    window.addEventListener("keydown", aoTeclar);
    return () => {
      window.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = anteriorOverflow;
      anterior?.focus();
    };
  }, [total]);

  const foto = fotos[ativa];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Fotos de ${titulo}`}
      tabIndex={-1}
      ref={caixa}
      className="fixed inset-0 z-[60] flex flex-col bg-verde-950/95 p-4 outline-none backdrop-blur-sm sm:p-8"
    >
      <div className="flex items-center justify-between text-white">
        <span className="text-sm">
          {ativa + 1} / {total}
        </span>
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar galeria"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
        >
          <IconeFechar />
        </button>
      </div>

      <div className="relative mt-4 flex-1">
        <Image
          src={foto.url}
          alt={foto.altText ?? titulo}
          fill
          sizes="100vw"
          className="object-contain"
        />
      </div>

      {total > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => aoTrocar((ativa - 1 + total) % total)}
            aria-label="Foto anterior"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <IconeChevronEsquerda />
          </button>
          <button
            type="button"
            onClick={() => aoTrocar((ativa + 1) % total)}
            aria-label="Próxima foto"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <IconeChevronDireita />
          </button>
        </div>
      )}
    </div>
  );
}
