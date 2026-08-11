"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { entrar, type EstadoLogin } from "./actions";

const ESTADO_INICIAL: EstadoLogin = {};

export function LoginForm({ proximo }: { proximo?: string }) {
  const [estado, acao] = useActionState(entrar, ESTADO_INICIAL);

  return (
    <form action={acao} className="mt-6 flex flex-col gap-4">
      {proximo && <input type="hidden" name="proximo" value={proximo} />}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">E-mail</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          className="rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">Senha</span>
        <input
          name="senha"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
        />
      </label>

      {estado.erro && (
        <p role="alert" className="text-sm text-red-600">
          {estado.erro}
        </p>
      )}

      <BotaoEntrar />
    </form>
  );
}

function BotaoEntrar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
    >
      {pending ? "Entrando..." : "Entrar"}
    </button>
  );
}
