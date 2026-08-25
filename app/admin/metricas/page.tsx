import { FormularioGasto } from "./spend-form";
import { exigirUsuario } from "@/lib/auth/current-user";
import {
  campanhasConhecidas,
  cliquesPorImovel,
  intervaloDoMes,
  resumoPorCampanha,
} from "@/lib/data/metrics";
import { formatarBRL } from "@/lib/format";
import { mesParaData } from "@/lib/metrics-month";

export const dynamic = "force-dynamic";

export const metadata = { title: "Métricas" };

export default async function MetricasPage({
  searchParams,
}: PageProps<"/admin/metricas">) {
  await exigirUsuario();

  const { mes } = await searchParams;
  const referencia = mesParaData(typeof mes === "string" ? mes : "") ?? new Date();
  const mesSelecionado = `${referencia.getUTCFullYear()}-${String(referencia.getUTCMonth() + 1).padStart(2, "0")}`;
  const { inicio, fim } = intervaloDoMes(referencia);

  const [linhas, porImovel, campanhas] = await Promise.all([
    resumoPorCampanha(inicio, fim),
    cliquesPorImovel(inicio, fim),
    campanhasConhecidas(),
  ]);

  const totalCliques = linhas.reduce((soma, linha) => soma + linha.cliques, 0);
  const totalGasto = linhas.reduce(
    (soma, linha) => soma + (linha.gastoCentavos ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Métricas</h1>
          <p className="mt-1 text-sm text-slate-600">
            Cliques no WhatsApp por campanha e custo por lead.
          </p>
        </div>

        <form className="flex items-end gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Mês</span>
            <input
              type="month"
              name="mes"
              defaultValue={mesSelecionado}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
          >
            Ver
          </button>
          <a
            href={`/api/admin/metrics/export?mes=${mesSelecionado}`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
          >
            Baixar CSV
          </a>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Cartao rotulo="Cliques no WhatsApp" valor={String(totalCliques)} />
        <Cartao rotulo="Investido" valor={formatarBRL(totalGasto) || "R$ 0"} />
        <Cartao
          rotulo="CPL médio"
          valor={
            totalCliques > 0 && totalGasto > 0
              ? formatarBRL(Math.round(totalGasto / totalCliques))
              : "—"
          }
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Campanha</th>
              <th className="px-4 py-3 text-right">Cliques</th>
              <th className="px-4 py-3 text-right">Gasto</th>
              <th className="px-4 py-3 text-right">CPL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {linhas.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Nenhum clique registrado neste mês.
                </td>
              </tr>
            ) : (
              linhas.map((linha) => (
                <tr key={linha.campanha}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {linha.campanha}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {linha.cliques}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {linha.gastoCentavos === null
                      ? "—"
                      : formatarBRL(linha.gastoCentavos)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {linha.cplCentavos === null
                      ? "—"
                      : formatarBRL(linha.cplCentavos)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Lançar gasto da campanha</h2>
        <p className="mt-1 text-sm text-slate-600">
          O CPL só aparece depois que o investimento do mês é informado. O nome
          precisa bater com o <code>utm_campaign</code> usado no anúncio.
        </p>
        <FormularioGasto
          mesPadrao={mesSelecionado}
          campanhasConhecidas={campanhas}
        />
      </section>

      {porImovel.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <h2 className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Cliques por imóvel
          </h2>
          <ul className="divide-y divide-slate-100">
            {porImovel.map((item) => (
              <li
                key={item.titulo}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="truncate text-slate-700">{item.titulo}</span>
                <span className="font-semibold text-slate-900">
                  {item.cliques}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Cartao({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{rotulo}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{valor}</p>
    </div>
  );
}

