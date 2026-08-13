import Image from "next/image";
import Link from "next/link";

import { BotaoToggle } from "./toggle-button";
import { exigirUsuario } from "@/lib/auth/current-user";
import { listarImoveisAdmin } from "@/lib/data/property-admin";
import { localizacaoExibicao, precoExibicao, rotuloTipoImovel } from "@/lib/format";
import { alternarAtivo, alternarDestaque } from "./actions";

export const dynamic = "force-dynamic";

export default async function ListaImoveisPage() {
  await exigirUsuario();
  const imoveis = await listarImoveisAdmin();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Imóveis</h1>
          <p className="mt-1 text-sm text-slate-600">
            {imoveis.length} cadastrados ·{" "}
            {imoveis.filter((i) => i.destaque && i.ativo).length} na vitrine
          </p>
        </div>
        <Link
          href="/admin/imoveis/novo"
          className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-800"
        >
          Novo imóvel
        </Link>
      </div>

      {imoveis.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
          Nenhum imóvel cadastrado ainda.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Imóvel</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3 text-center">Cliques</th>
                <th className="px-4 py-3 text-center">Destaque</th>
                <th className="px-4 py-3 text-center">Ativo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {imoveis.map((imovel) => (
                <tr key={imovel.id} className="align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-slate-100">
                        {imovel.fotos[0] && (
                          <Image
                            src={imovel.fotos[0].url}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {imovel.titulo}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {imovel.referenceCode} ·{" "}
                          {rotuloTipoImovel(imovel.tipoImovel)} ·{" "}
                          {localizacaoExibicao(imovel)}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {precoExibicao(imovel)}
                    <span className="block text-xs text-slate-400">
                      {imovel.tipoTransacao === "venda" ? "Venda" : "Aluguel"}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center text-slate-700">
                    {imovel._count.cliques}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <BotaoToggle
                      id={imovel.id}
                      ligado={imovel.destaque}
                      acao={alternarDestaque}
                      rotulo="destaque"
                    />
                  </td>

                  <td className="px-4 py-3 text-center">
                    <BotaoToggle
                      id={imovel.id}
                      ligado={imovel.ativo}
                      acao={alternarAtivo}
                      rotulo="ativo"
                    />
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link
                      href={`/admin/imoveis/${imovel.id}`}
                      className="text-slate-600 underline-offset-4 transition hover:text-slate-900 hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
