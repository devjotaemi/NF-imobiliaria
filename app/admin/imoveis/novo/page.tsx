import Link from "next/link";

import {
  PropertyForm,
  VALORES_PADRAO,
} from "@/components/admin/property-form";
import { exigirUsuario } from "@/lib/auth/current-user";
import { criarImovel } from "../actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Novo imóvel" };

export default async function NovoImovelPage() {
  await exigirUsuario();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/imoveis"
          className="text-sm text-slate-600 underline-offset-4 hover:underline"
        >
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Novo imóvel</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <PropertyForm acao={criarImovel} valores={VALORES_PADRAO} modo="novo" />
      </div>
    </div>
  );
}
