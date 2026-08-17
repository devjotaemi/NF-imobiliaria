import Link from "next/link";

import { FormGet } from "@/components/site/form-get";
import { IconeChevronBaixo, IconeLimpar } from "@/components/ui/icons";
import type { Filtros } from "@/lib/data/filters";
import { rotuloTipoImovel } from "@/lib/format";
import { TIPOS_IMOVEL } from "@/lib/validation/property";

/**
 * Filtros avançados do catálogo.
 *
 * Um `<form method="get">` e nada mais: sem estado, sem router.push. Funciona
 * com JavaScript desligado, o botão voltar do navegador desfaz o filtro, e a
 * URL resultante é compartilhável.
 *
 * Os "pills" de quantidade são radios escondidos com <label> estilizado via
 * `peer-checked` — mesma aparência do mockup, mas navegável por teclado e
 * marcável sem script.
 */
export function FiltersSidebar({
  filtros,
  contagemPorTipo,
  caracteristicas,
}: {
  filtros: Filtros;
  contagemPorTipo: Record<string, number>;
  caracteristicas: { nome: string; total: number }[];
}) {
  return (
    <FormGet action="/imoveis" className="flex flex-col gap-4">
      {/* Preserva o contexto vindo da barra de busca ao aplicar os filtros. */}
      {filtros.q && <input type="hidden" name="q" value={filtros.q} />}
      {filtros.transacao && (
        <input type="hidden" name="transacao" value={filtros.transacao} />
      )}
      {filtros.cidade && (
        <input type="hidden" name="cidade" value={filtros.cidade} />
      )}
      {filtros.bairro && (
        <input type="hidden" name="bairro" value={filtros.bairro} />
      )}
      {filtros.destaque && <input type="hidden" name="destaque" value="1" />}
      {filtros.ordenar !== "recentes" && (
        <input type="hidden" name="ordenar" value={filtros.ordenar} />
      )}
      {filtros.visao !== "grid" && (
        <input type="hidden" name="visao" value={filtros.visao} />
      )}

      <div className="rounded-2xl border border-linha bg-white p-5">
        <Link
          href="/imoveis"
          className="inline-flex items-center gap-2 rounded-full border border-linha px-3.5 py-2 text-sm font-medium text-tinta-500 transition hover:border-tinta-400 hover:text-tinta"
        >
          <IconeLimpar className="h-4 w-4" />
          Limpar filtros
        </Link>

        <h2 className="mt-5 font-medium text-tinta">Filtros avançados</h2>

        <Secao titulo="Tipo de imóvel" aberta>
          <ul className="flex flex-col gap-2.5">
            {TIPOS_IMOVEL.map((tipo) => {
              const total = contagemPorTipo[tipo] ?? 0;
              if (total === 0 && !filtros.tipos.includes(tipo)) return null;

              return (
                <li key={tipo}>
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-tinta">
                    <input
                      type="checkbox"
                      name="tipo"
                      value={tipo}
                      defaultChecked={filtros.tipos.includes(tipo)}
                      className="h-4 w-4 shrink-0 accent-verde-700"
                    />
                    {rotuloTipoImovel(tipo)}
                    <span className="text-tinta-400">({total})</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </Secao>

        <Secao titulo="Valor" aberta>
          <div className="flex items-end gap-3">
            <CampoNumero
              rotulo="Mínimo"
              name="precoMin"
              valor={filtros.precoMin}
              placeholder="R$ 0"
            />
            <CampoNumero
              rotulo="Máximo"
              name="precoMax"
              valor={filtros.precoMax}
              placeholder="R$ 5.000.000"
            />
          </div>
          <p className="mt-2 text-xs text-tinta-400">Valores em reais.</p>
        </Secao>

        <Secao titulo="Quartos" aberta>
          <Pilulas name="quartos" selecionado={filtros.quartos} />
        </Secao>

        <Secao titulo="Banheiros" aberta>
          <Pilulas name="banheiros" selecionado={filtros.banheiros} />
        </Secao>

        <Secao titulo="Vagas de garagem" aberta>
          <Pilulas name="vagas" selecionado={filtros.vagas} />
        </Secao>

        <Secao titulo="Área útil (m²)">
          <div className="flex items-end gap-3">
            <CampoNumero
              rotulo="Mínima"
              name="areaMin"
              valor={filtros.areaMin}
              placeholder="0"
            />
            <CampoNumero
              rotulo="Máxima"
              name="areaMax"
              valor={filtros.areaMax}
              placeholder="1000"
            />
          </div>
        </Secao>

        <Secao titulo="Condomínio">
          <CampoNumero
            rotulo="Até"
            name="condominioMax"
            valor={filtros.condominioMax}
            placeholder="R$ 1.500"
          />
        </Secao>

        <Secao titulo="IPTU">
          <CampoNumero
            rotulo="Até"
            name="iptuMax"
            valor={filtros.iptuMax}
            placeholder="R$ 3.000"
          />
        </Secao>

        {caracteristicas.length > 0 && (
          <Secao titulo="Características">
            <ul className="flex flex-col gap-2.5">
              {caracteristicas.map((item) => (
                <li key={item.nome}>
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-tinta">
                    <input
                      type="checkbox"
                      name="caracteristica"
                      value={item.nome}
                      defaultChecked={filtros.caracteristicas.includes(item.nome)}
                      className="h-4 w-4 shrink-0 accent-verde-700"
                    />
                    <span className="line-clamp-1">{item.nome}</span>
                    <span className="ml-auto text-tinta-400">({item.total})</span>
                  </label>
                </li>
              ))}
            </ul>
          </Secao>
        )}

        <button
          type="submit"
          className="mt-6 w-full rounded-xl bg-verde-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-verde-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-700"
        >
          Aplicar filtros
        </button>
      </div>
    </FormGet>
  );
}

/**
 * Accordion nativo. `<details>` abre e fecha sem JavaScript e já vem com a
 * semântica de expansível pros leitores de tela.
 */
function Secao({
  titulo,
  children,
  aberta = false,
}: {
  titulo: string;
  children: React.ReactNode;
  aberta?: boolean;
}) {
  return (
    <details open={aberta} className="group border-t border-linha py-4 first-of-type:mt-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-tinta marker:hidden">
        {titulo}
        <IconeChevronBaixo className="h-4 w-4 text-tinta-400 transition group-open:rotate-180" />
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

function CampoNumero({
  rotulo,
  name,
  valor,
  placeholder,
}: {
  rotulo: string;
  name: string;
  valor: number | null;
  placeholder: string;
}) {
  return (
    <label className="flex-1">
      <span className="text-xs text-tinta-400">{rotulo}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        name={name}
        defaultValue={valor ?? ""}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-linha px-3 py-2 text-sm text-tinta outline-none transition focus:border-verde-600 focus:ring-2 focus:ring-verde-100"
      />
    </label>
  );
}

/** 1 · 2 · 3 · 4 · 5+ — significa "no mínimo N". */
function Pilulas({
  name,
  selecionado,
}: {
  name: string;
  selecionado: number | null;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5].map((numero) => (
        <label key={numero} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={numero}
            defaultChecked={selecionado === numero}
            className="peer sr-only"
          />
          <span className="flex h-9 w-11 items-center justify-center rounded-lg border border-linha text-sm text-tinta transition hover:border-tinta-400 peer-checked:border-verde-700 peer-checked:bg-verde-700 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-verde-700">
            {numero === 5 ? "5+" : numero}
          </span>
        </label>
      ))}
    </div>
  );
}
