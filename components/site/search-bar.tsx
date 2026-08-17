import { FormGet } from "@/components/site/form-get";
import { IconeBusca } from "@/components/ui/icons";
import { FAIXAS_PRECO } from "@/lib/content/site";
import type { Filtros } from "@/lib/data/filters";
import { rotuloTipoImovel } from "@/lib/format";
import { TIPOS_IMOVEL } from "@/lib/validation/property";

/**
 * Barra de busca do site.
 *
 * `<form method="get">` apontando pro catálogo. O navegador monta a
 * querystring, o catálogo lê de `searchParams`, e o resultado é um link que dá
 * pra colar no WhatsApp. Filtra sem JavaScript — o `FormGet` só enxuga os
 * parâmetros vazios da URL quando há script disponível.
 *
 * Três variantes porque as três páginas pedem colunas diferentes, mas todas
 * escrevem nos mesmos parâmetros de `lib/data/filters.ts`.
 */
export function SearchBar({
  variante = "catalogo",
  filtros,
  cidades,
  bairros,
  className = "",
}: {
  variante?: "home" | "catalogo" | "terrenos";
  filtros?: Filtros;
  cidades: string[];
  bairros: string[];
  className?: string;
}) {
  const rotuloBotao = variante === "terrenos" ? "Buscar terrenos" : "Buscar imóveis";

  return (
    <FormGet
      action="/imoveis"
      className={`flex flex-col gap-2 rounded-2xl border border-linha bg-white p-2.5 shadow-[0_20px_50px_-32px_rgba(18,48,30,0.5)] lg:flex-row lg:items-stretch lg:gap-0 lg:rounded-full lg:p-2 ${className}`}
    >
      {variante === "home" && (
        <Campo rotulo="" className="lg:flex-[1.6]">
          <div className="flex items-center gap-2.5 px-1">
            <IconeBusca className="h-[18px] w-[18px] shrink-0 text-tinta-400" />
            <input
              type="search"
              name="q"
              defaultValue={filtros?.q ?? ""}
              placeholder="Buscar por cidade, bairro ou referência"
              className="w-full bg-transparent py-1.5 text-sm text-tinta outline-none placeholder:text-tinta-400"
            />
          </div>
        </Campo>
      )}

      {variante === "catalogo" && (
        <Campo rotulo="O que você procura?">
          <Select name="transacao" valor={filtros?.transacao ?? ""}>
            <option value="">Todos</option>
            <option value="venda">Comprar</option>
            <option value="aluguel">Alugar</option>
          </Select>
        </Campo>
      )}

      {variante !== "terrenos" && (
        <Campo rotulo="Tipo de imóvel">
          <Select name="tipo" valor={filtros?.tipos[0] ?? ""}>
            <option value="">Todos</option>
            {TIPOS_IMOVEL.map((tipo) => (
              <option key={tipo} value={tipo}>
                {rotuloTipoImovel(tipo)}
              </option>
            ))}
          </Select>
        </Campo>
      )}

      {variante === "terrenos" && (
        // Na vertical de terrenos o próprio tipo é a pergunta de abertura —
        // não faz sentido perguntar "comprar ou alugar" antes disso.
        <Campo rotulo="O que você procura?">
          <Select name="tipo" valor={filtros?.tipos[0] ?? "terreno"}>
            <option value="terreno">Terrenos</option>
            <option value="chacara_sitio_fazenda">Chácaras e sítios</option>
            <option value="">Todos</option>
          </Select>
        </Campo>
      )}

      {variante === "home" && (
        <Campo rotulo="Finalidade">
          <Select name="transacao" valor={filtros?.transacao ?? ""}>
            <option value="">Todos</option>
            <option value="venda">Comprar</option>
            <option value="aluguel">Alugar</option>
          </Select>
        </Campo>
      )}

      {variante !== "home" && (
        <Campo rotulo="Cidade">
          <Select name="cidade" valor={filtros?.cidade ?? ""}>
            <option value="">Todas</option>
            {cidades.map((cidade) => (
              <option key={cidade} value={cidade}>
                {cidade}
              </option>
            ))}
          </Select>
        </Campo>
      )}

      {variante !== "home" && (
        <Campo rotulo="Bairro">
          <Select name="bairro" valor={filtros?.bairro ?? ""}>
            <option value="">Todos</option>
            {bairros.map((bairro) => (
              <option key={bairro} value={bairro}>
                {bairro}
              </option>
            ))}
          </Select>
        </Campo>
      )}

      <Campo rotulo="Faixa de preço" ultimo>
        <Select name="faixa" valor={filtros?.faixa ?? ""}>
          {FAIXAS_PRECO.map((faixa) => (
            <option key={faixa.rotulo} value={faixa.valor}>
              {faixa.rotulo}
            </option>
          ))}
        </Select>
      </Campo>

      <button
        type="submit"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-verde-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-verde-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-700 lg:rounded-full"
      >
        <IconeBusca className="h-[18px] w-[18px]" />
        {rotuloBotao}
      </button>
    </FormGet>
  );
}

function Campo({
  rotulo,
  children,
  ultimo = false,
  className = "",
}: {
  rotulo: string;
  children: React.ReactNode;
  ultimo?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex-1 px-2 py-1.5 lg:px-4 lg:py-1 ${
        ultimo ? "" : "lg:border-r lg:border-linha"
      } ${className}`}
    >
      {rotulo && (
        <p className="text-[0.7rem] font-medium text-tinta-400">{rotulo}</p>
      )}
      {children}
    </div>
  );
}

function Select({
  name,
  valor,
  children,
}: {
  name: string;
  valor: string;
  children: React.ReactNode;
}) {
  return (
    <select
      name={name}
      defaultValue={valor}
      className="-ml-0.5 w-full cursor-pointer appearance-none bg-transparent bg-[length:14px] bg-[right_center] bg-no-repeat py-1 pr-6 text-sm text-tinta outline-none"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236B6B66' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
    >
      {children}
    </select>
  );
}
