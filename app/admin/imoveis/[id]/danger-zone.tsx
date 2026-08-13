"use client";

import { useState } from "react";

import { excluirImovel } from "../actions";

/**
 * Exclusão permanente.
 *
 * O caminho normal pra tirar do ar é o toggle "ativo" — que preserva o
 * histórico de cliques. Isto aqui é escape hatch, então exige confirmação
 * digitada em vez de um clique só.
 */
export function ZonaPerigo({ id, titulo }: { id: string; titulo: string }) {
  const [aberto, setAberto] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");

  const liberado = confirmacao.trim().toLowerCase() === "excluir";

  return (
    <section className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h2 className="font-semibold text-red-900">Excluir imóvel</h2>
      <p className="mt-1 text-sm text-red-800">
        Para apenas tirar do site, use o botão <strong>Ativo</strong> na lista —
        isso preserva o histórico de cliques nas métricas. Excluir apaga o
        cadastro e as fotos definitivamente.
      </p>

      {!aberto ? (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
        >
          Quero excluir
        </button>
      ) : (
        <form
          action={excluirImovel.bind(null, id)}
          className="mt-4 flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1 text-sm text-red-900">
            Digite <strong>excluir</strong> para confirmar a remoção de &ldquo;
            {titulo}&rdquo;:
            <input
              name="confirmacao"
              value={confirmacao}
              onChange={(evento) => setConfirmacao(evento.target.value)}
              className="w-full max-w-xs rounded-lg border border-red-300 px-3 py-2"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!liberado}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              Excluir definitivamente
            </button>
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                setConfirmacao("");
              }}
              className="rounded-lg px-4 py-2 text-sm text-red-800 hover:bg-red-100"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
