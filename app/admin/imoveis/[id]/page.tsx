import Link from "next/link";
import { notFound } from "next/navigation";

import { GerenciadorFotos } from "./photo-manager";
import { ZonaPerigo } from "./danger-zone";
import { atualizarImovel } from "../actions";
import { exigirUsuario } from "@/lib/auth/current-user";
import { buscarImovelAdmin } from "@/lib/data/property-admin";
import { centavosParaInput } from "@/lib/format";
import {
  PropertyForm,
  type ValoresImovel,
} from "@/components/admin/property-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Editar imóvel" };

export default async function EditarImovelPage({
  params,
  searchParams,
}: PageProps<"/admin/imoveis/[id]">) {
  await exigirUsuario();

  const { id } = await params;
  const imovel = await buscarImovelAdmin(id);
  if (!imovel) notFound();

  const { criado } = await searchParams;

  const valores: ValoresImovel = {
    titulo: imovel.titulo,
    descricao: imovel.descricao,
    tipoTransacao: imovel.tipoTransacao,
    tipoImovel: imovel.tipoImovel,
    preco: centavosParaInput(imovel.precoCentavos),
    precoSobConsulta: imovel.precoSobConsulta,
    condominio: centavosParaInput(imovel.condominioCentavos),
    iptu: centavosParaInput(imovel.iptuCentavos),
    iptuPeriodo: imovel.iptuPeriodo ?? "mensal",
    bairro: imovel.bairro ?? "",
    cidade: imovel.cidade,
    estado: imovel.estado,
    cep: imovel.cep ?? "",
    quartos: textoNumero(imovel.quartos),
    suites: textoNumero(imovel.suites),
    banheiros: textoNumero(imovel.banheiros),
    vagas: textoNumero(imovel.vagas),
    areaUtilM2: textoNumero(imovel.areaUtilM2),
    areaTerrenoM2: textoNumero(imovel.areaTerrenoM2),
    andar: textoNumero(imovel.andar),
    totalAndares: textoNumero(imovel.totalAndares),
    torres: textoNumero(imovel.torres),
    anoConstrucao: textoNumero(imovel.anoConstrucao),
    caracteristicas: imovel.caracteristicas.join("\n"),
    garantiasAceitas: imovel.garantiasAceitas.join("\n"),
    destaque: imovel.destaque,
    ativo: imovel.ativo,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/imoveis"
          className="text-sm text-slate-600 underline-offset-4 hover:underline"
        >
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          {imovel.titulo}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {imovel.referenceCode} ·{" "}
          <Link
            href={`/imoveis/${imovel.slug}`}
            target="_blank"
            className="underline-offset-4 hover:underline"
          >
            /imoveis/{imovel.slug} ↗
          </Link>
        </p>
      </div>

      {criado && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Imóvel cadastrado. Agora ele já pode ser marcado como destaque.
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-slate-900">Fotos</h2>
        <GerenciadorFotos imovelId={imovel.id} fotos={imovel.fotos} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        {/* bind fixa o id no Server Action, mantendo o form funcional sem JS.
            O uploader fica fora: na edição as fotos têm ação imediata. */}
        <PropertyForm
          acao={atualizarImovel.bind(null, imovel.id)}
          valores={valores}
          modo="editar"
          mostrarUploader={false}
        />
      </section>

      <ZonaPerigo id={imovel.id} titulo={imovel.titulo} />
    </div>
  );
}

function textoNumero(valor: number | null): string {
  return valor === null ? "" : String(valor);
}
