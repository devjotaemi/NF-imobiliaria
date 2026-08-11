import Link from "next/link";

import { sair } from "./login/actions";
import { usuarioAtual } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export const metadata = { title: "Painel — NF Negócios" };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const usuario = await usuarioAtual();

  // Sem sessão cai aqui só na tela de login (o proxy já redireciona o resto).
  // Renderizar sem a casca evita mostrar navegação pra quem não entrou.
  if (!usuario) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-bold text-slate-900">NF Negócios</span>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/admin/imoveis"
                className="text-slate-600 transition hover:text-slate-900"
              >
                Imóveis
              </Link>
              <Link
                href="/admin/metricas"
                className="text-slate-600 transition hover:text-slate-900"
              >
                Métricas
              </Link>
              <Link
                href="/"
                target="_blank"
                className="text-slate-600 transition hover:text-slate-900"
              >
                Ver site ↗
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">
              {usuario.nome}
            </span>
            <form action={sair}>
              <button
                type="submit"
                className="text-sm text-slate-600 underline-offset-4 transition hover:text-slate-900 hover:underline"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
