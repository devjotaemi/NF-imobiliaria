import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { CtaBand } from "@/components/site/cta-band";
import { FiltersSidebar } from "@/components/site/filters-sidebar";
import { PropertyCard } from "@/components/site/property-card";
import { SearchBar } from "@/components/site/search-bar";
import {
  IconeChevronBaixo,
  IconeChevronEsquerda,
  IconeChevronDireita,
  IconeGrade,
  IconeLista,
} from "@/components/ui/icons";
import { fotoDemo } from "@/lib/content/site";
import {
  contarFiltrosAtivos,
  ORDENACOES,
  parseFiltros,
  urlCatalogo,
  type Filtros,
} from "@/lib/data/filters";
import {
  buscarImoveis,
  contarAtivos,
  contarPorTipo,
  listarBairros,
  listarCaracteristicas,
  listarCidades,
} from "@/lib/data/properties";

export const dynamic = "force-dynamic";

/**
 * Metadata dinâmica só por causa do índice.
 *
 * Cada combinação de filtro é uma URL rastreável — tipo × quartos × bairro ×
 * preço × ordenação dá milhares de páginas quase idênticas competindo entre si.
 * Filtro aplicado vira `noindex, follow`: sai do índice, mas o Google continua
 * seguindo os links e chegando nas fichas (que são o que a gente quer ranquear).
 *
 * `noindex` no metadata em vez de `Disallow` no robots.txt de propósito: URL
 * bloqueada por robots ainda pode ser indexada sem conteúdo, porque o crawler
 * nunca lê a página pra descobrir que ela não deveria entrar.
 */
export async function generateMetadata({
  searchParams,
}: PageProps<"/imoveis">): Promise<Metadata> {
  const filtros = parseFiltros(await searchParams);

  // `ordenar` e `visao` não contam como filtro no contador da UI, mas geram
  // duplicata igual — a mesma lista em outra ordem continua sendo a mesma lista.
  const filtrado =
    contarFiltrosAtivos(filtros) > 0 ||
    filtros.ordenar !== "recentes" ||
    filtros.visao !== "grid";

  if (filtrado) {
    return {
      title: "Imóveis à venda e para alugar",
      description:
        "Encontre casas, apartamentos, terrenos e salas comerciais em Mirassol, São José do Rio Preto e região. Filtre por bairro, preço, quartos e área.",
      robots: { index: false, follow: true },
    };
  }

  return {
    title: "Imóveis à venda e para alugar em Mirassol e Rio Preto",
    description:
      "Encontre casas, apartamentos, terrenos e salas comerciais em Mirassol, São José do Rio Preto e região. Filtre por bairro, preço, quartos e área.",
    // Página 2+ aponta pra si mesma: canonical apontando tudo pra página 1
    // seria ignorado pelo Google e ainda esconderia o resto da carteira.
    alternates: {
      canonical: filtros.pagina > 1 ? `/imoveis?pagina=${filtros.pagina}` : "/imoveis",
    },
  };
}

export default async function CatalogoPage({
  searchParams,
}: PageProps<"/imoveis">) {
  const filtros = parseFiltros(await searchParams);

  const [
    { itens, total, paginas },
    contagemPorTipo,
    caracteristicas,
    cidades,
    bairros,
    totalAtivos,
  ] = await Promise.all([
    buscarImoveis(filtros),
    contarPorTipo(filtros),
    listarCaracteristicas(),
    listarCidades(),
    listarBairros(filtros.cidade),
    contarAtivos(),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-areia-50">
        <div className="absolute inset-y-0 right-0 hidden w-[46%] lg:block">
          <Image
            src={fotoDemo("photo-1586023492125-27b2c045efd7", 1200)}
            alt=""
            fill
            priority
            sizes="46vw"
            className="object-cover"
          />
          {/* Degradê pro texto continuar legível onde a foto encosta nele. */}
          <div className="absolute inset-0 bg-gradient-to-r from-areia-50 via-areia-50/40 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8">
          <Breadcrumb />

          <h1 className="mt-6 max-w-xl font-serif text-4xl leading-[1.1] text-tinta sm:text-5xl">
            Encontre o imóvel
            <br />
            ideal <em className="not-italic text-sage">para você.</em>
          </h1>

          <p className="mt-5 max-w-md text-tinta-500">
            São mais de {totalAtivos.toLocaleString("pt-BR")} imóveis
            disponíveis em São José do Rio Preto e região.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SearchBar
          variante="catalogo"
          filtros={filtros}
          cidades={cidades}
          bairros={bairros}
          className="relative z-10"
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside>
            <FiltersSidebar
              filtros={filtros}
              contagemPorTipo={contagemPorTipo}
              caracteristicas={caracteristicas}
            />
          </aside>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-tinta-500">
                <strong className="font-semibold text-tinta">
                  {total.toLocaleString("pt-BR")}
                </strong>{" "}
                {total === 1 ? "imóvel encontrado" : "imóveis encontrados"}
              </p>

              {/* flex-wrap: no celular "Ordenar por" + grade/lista não cabem
                  na mesma linha e empurrariam a coluna inteira pra fora. */}
              <div className="flex flex-wrap items-center gap-3">
                <Ordenador filtros={filtros} />
                <AlternaVisao filtros={filtros} />
              </div>
            </div>

            {itens.length === 0 ? (
              <SemResultado />
            ) : (
              <ul
                className={`mt-6 ${
                  filtros.visao === "lista"
                    ? "flex flex-col gap-4"
                    : "grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
                }`}
              >
                {itens.map((imovel, indice) => (
                  <li key={imovel.id} className="flex">
                    <div className="flex-1">
                      <PropertyCard
                        imovel={imovel}
                        variante={filtros.visao}
                        prioridade={indice < 3}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {paginas > 1 && <Paginacao filtros={filtros} paginas={paginas} />}
          </div>
        </div>

        <div className="mt-12">
          <CtaBand
            titulo="Não encontrou o que procura?"
            texto="Fale agora com um especialista e receba opções personalizadas."
            rotulo="Falar no WhatsApp"
            origem="catalogo_rodape"
          />
        </div>
      </div>
    </>
  );
}

function Breadcrumb() {
  return (
    <nav aria-label="Você está em" className="text-sm text-tinta-400">
      <ol className="flex items-center gap-2">
        <li>
          <Link href="/" className="transition hover:text-tinta">
            Início
          </Link>
        </li>
        <li aria-hidden="true">›</li>
        <li className="text-tinta">Imóveis</li>
      </ol>
    </nav>
  );
}

/**
 * Ordenação como menu de links dentro de um <details>.
 *
 * Um <select> precisaria de JavaScript pra enviar ao trocar de opção. Links
 * navegam sozinhos e mantêm a página funcionando sem script.
 */
function Ordenador({ filtros }: { filtros: Filtros }) {
  const atual =
    ORDENACOES.find((opcao) => opcao.valor === filtros.ordenar) ?? ORDENACOES[0];

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-linha bg-white px-4 py-2.5 text-sm text-tinta marker:hidden">
        <span className="hidden text-tinta-500 sm:inline">Ordenar por:</span>
        {atual.rotulo}
        <IconeChevronBaixo className="h-4 w-4 text-tinta-400 transition group-open:rotate-180" />
      </summary>

      <ul className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-linha bg-white py-1 shadow-lg">
        {ORDENACOES.map((opcao) => (
          <li key={opcao.valor}>
            <Link
              href={urlCatalogo(filtros, { ordenar: opcao.valor })}
              className={`block px-4 py-2.5 text-sm transition hover:bg-areia-50 ${
                opcao.valor === filtros.ordenar
                  ? "font-medium text-verde-700"
                  : "text-tinta"
              }`}
            >
              {opcao.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

function AlternaVisao({ filtros }: { filtros: Filtros }) {
  const base =
    "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm transition";
  const ativo = "border-verde-700 bg-verde-50 text-verde-700 font-medium";
  const inativo = "border-linha bg-white text-tinta-500 hover:text-tinta";

  return (
    <div className="flex gap-2">
      <Link
        href={urlCatalogo(filtros, { visao: "grid" })}
        aria-current={filtros.visao === "grid"}
        className={`${base} ${filtros.visao === "grid" ? ativo : inativo}`}
      >
        <IconeGrade className="h-4 w-4" />
        Grid
      </Link>
      <Link
        href={urlCatalogo(filtros, { visao: "lista" })}
        aria-current={filtros.visao === "lista"}
        className={`${base} ${filtros.visao === "lista" ? ativo : inativo}`}
      >
        <IconeLista className="h-4 w-4" />
        Lista
      </Link>
    </div>
  );
}

function SemResultado() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-linha bg-white p-12 text-center">
      <p className="font-medium text-tinta">
        Nenhum imóvel bate com esses filtros.
      </p>
      <p className="mt-2 text-sm text-tinta-500">
        Tente ampliar a faixa de preço ou remover algum filtro.
      </p>
      <Link
        href="/imoveis"
        className="mt-5 inline-flex items-center justify-center rounded-full bg-verde-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-verde-800"
      >
        Limpar filtros
      </Link>
    </div>
  );
}

/** 1 · 2 · 3 · … · última. Sempre mostra a primeira, a última e a vizinhança. */
function paginasVisiveis(atual: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const numeros = new Set([1, total, atual, atual - 1, atual + 1]);
  if (atual <= 3) [2, 3, 4].forEach((n) => numeros.add(n));
  if (atual >= total - 2) [total - 3, total - 2, total - 1].forEach((n) => numeros.add(n));

  const ordenadas = [...numeros]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);

  const saida: (number | "gap")[] = [];
  let anterior = 0;
  for (const numero of ordenadas) {
    if (anterior && numero - anterior > 1) saida.push("gap");
    saida.push(numero);
    anterior = numero;
  }
  return saida;
}

function Paginacao({
  filtros,
  paginas,
}: {
  filtros: Filtros;
  paginas: number;
}) {
  const atual = Math.min(filtros.pagina, paginas);
  const base =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm transition";

  return (
    <nav aria-label="Paginação" className="mt-10 flex justify-center">
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          {atual > 1 ? (
            <Link
              href={urlCatalogo(filtros, { pagina: atual - 1 })}
              aria-label="Página anterior"
              className={`${base} border-linha bg-white text-tinta hover:border-tinta-400`}
            >
              <IconeChevronEsquerda className="h-4 w-4" />
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className={`${base} border-linha bg-white text-tinta-400 opacity-50`}
            >
              <IconeChevronEsquerda className="h-4 w-4" />
            </span>
          )}
        </li>

        {paginasVisiveis(atual, paginas).map((item, indice) =>
          item === "gap" ? (
            <li key={`gap-${indice}`} className="px-1 text-tinta-400">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={urlCatalogo(filtros, { pagina: item })}
                aria-current={item === atual ? "page" : undefined}
                className={`${base} ${
                  item === atual
                    ? "border-verde-700 bg-verde-700 font-medium text-white"
                    : "border-linha bg-white text-tinta hover:border-tinta-400"
                }`}
              >
                {item}
              </Link>
            </li>
          ),
        )}

        <li>
          {atual < paginas ? (
            <Link
              href={urlCatalogo(filtros, { pagina: atual + 1 })}
              aria-label="Próxima página"
              className={`${base} border-linha bg-white text-tinta hover:border-tinta-400`}
            >
              <IconeChevronDireita className="h-4 w-4" />
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className={`${base} border-linha bg-white text-tinta-400 opacity-50`}
            >
              <IconeChevronDireita className="h-4 w-4" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
