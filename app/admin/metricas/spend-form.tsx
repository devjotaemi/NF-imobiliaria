"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { salvarGasto, type EstadoGasto } from "./actions";

const ESTADO_INICIAL: EstadoGasto = {};

export function FormularioGasto({
  mesPadrao,
  campanhasConhecidas,
}: {
  mesPadrao: string;
  campanhasConhecidas: string[];
}) {
  const [estado, acao] = useActionState(salvarGasto, ESTADO_INICIAL);

  return (
    <form action={acao} className="mt-4 flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Campanha</span>
        <input
          name="campanha"
          required
          list="campanhas-conhecidas"
          placeholder="ex.: meta-jan-apartamentos"
          className="w-64 rounded-lg border border-slate-300 px-3 py-2"
        />
        {/* Sugere o que já apareceu nos cliques — reduz erro de digitação,
            que é o que mais estraga o CPL na prática. */}
        <datalist id="campanhas-conhecidas">
          {campanhasConhecidas.map((campanha) => (
            <option key={campanha} value={campanha} />
          ))}
        </datalist>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Investido (R$)</span>
        <input
          name="valor"
          required
          inputMode="decimal"
          placeholder="1.500,00"
          className="w-40 rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Mês</span>
        <input
          type="month"
          name="mes"
          defaultValue={mesPadrao}
          required
          className="rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>

      <BotaoSalvar />

      {estado.erro && (
        <p role="alert" className="w-full text-sm text-red-600">
          {estado.erro}
        </p>
      )}
      {estado.ok && (
        <p className="w-full text-sm text-emerald-700">Gasto salvo.</p>
      )}
    </form>
  );
}

function BotaoSalvar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
    >
      {pending ? "Salvando..." : "Salvar"}
    </button>
  );
}
