"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Carrossel horizontal com scroll-snap.
 *
 * A rolagem em si é CSS — sem JavaScript o visitante ainda arrasta a trilha
 * com o dedo ou com a barra. O script só existe pros pontinhos: qual está
 * ativo e para onde eles levam.
 *
 * Os cards continuam sendo Server Components; entram aqui como `children`.
 */
export function Carousel({
  children,
  total,
  rotulo,
}: {
  children: React.ReactNode;
  total: number;
  rotulo: string;
}) {
  const trilha = useRef<HTMLUListElement>(null);
  const [ativo, setAtivo] = useState(0);

  const aoRolar = useCallback(() => {
    const elemento = trilha.current;
    if (!elemento) return;

    const primeiro = elemento.firstElementChild as HTMLElement | null;
    if (!primeiro) return;

    const largura = primeiro.offsetWidth + 24; // 24 = gap-6
    setAtivo(Math.round(elemento.scrollLeft / largura));
  }, []);

  useEffect(() => {
    const elemento = trilha.current;
    if (!elemento) return;
    elemento.addEventListener("scroll", aoRolar, { passive: true });
    return () => elemento.removeEventListener("scroll", aoRolar);
  }, [aoRolar]);

  function irPara(indice: number) {
    const elemento = trilha.current;
    const alvo = elemento?.children[indice] as HTMLElement | undefined;
    if (!elemento || !alvo) return;
    elemento.scrollTo({ left: alvo.offsetLeft - elemento.offsetLeft, behavior: "smooth" });
  }

  return (
    <div>
      <ul
        ref={trilha}
        aria-label={rotulo}
        className="sem-barra flex snap-x snap-mandatory gap-6 overflow-x-auto pb-1"
      >
        {children}
      </ul>

      {total > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: total }, (_, indice) => (
            <button
              key={indice}
              type="button"
              onClick={() => irPara(indice)}
              aria-label={`Ir para o item ${indice + 1} de ${total}`}
              aria-current={indice === ativo}
              className={`h-2 rounded-full transition-all ${
                indice === ativo
                  ? "w-6 bg-verde-700"
                  : "w-2 bg-linha hover:bg-tinta-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
