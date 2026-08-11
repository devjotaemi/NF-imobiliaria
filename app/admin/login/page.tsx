import { redirect } from "next/navigation";

import { LoginForm } from "./login-form";
import { usuarioAtual } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export const metadata = { title: "Entrar no painel" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  if (await usuarioAtual()) redirect("/admin/imoveis");

  const { proximo } = await searchParams;
  const destino = typeof proximo === "string" ? proximo : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8">
        <h1 className="text-xl font-bold text-slate-900">NF Negócios</h1>
        <p className="mt-1 text-sm text-slate-600">Painel de imóveis</p>

        <LoginForm proximo={destino} />
      </div>
    </div>
  );
}
