"use client";

import { useOptimistic, useTransition } from "react";

/**
 * Toggle de destaque/ativo direto na lista.
 *
 * É ação frequente ("marcar/desmarcar destaque"), então não faz sentido exigir
 * entrar no formulário. useOptimistic dá resposta imediata; se a ação falhar,
 * o React reverte sozinho no re-render.
 */
export function BotaoToggle({
  id,
  ligado,
  acao,
  rotulo,
}: {
  id: string;
  ligado: boolean;
  acao: (id: string) => Promise<void>;
  rotulo: string;
}) {
  const [otimista, setOtimista] = useOptimistic(ligado);
  const [pendente, iniciarTransicao] = useTransition();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={otimista}
      aria-label={`Marcar como ${rotulo}`}
      disabled={pendente}
      onClick={() =>
        iniciarTransicao(async () => {
          setOtimista(!otimista);
          await acao(id);
        })
      }
      className={`inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-60 ${
        otimista ? "bg-emerald-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          otimista ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
