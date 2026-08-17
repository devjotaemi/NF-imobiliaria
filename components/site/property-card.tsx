import Image from "next/image";
import Link from "next/link";

import { FavoriteButton } from "@/components/site/favorite-button";
import { IconeSeta } from "@/components/ui/icons";
import {
  localizacaoExibicao,
  mostraComodos,
  precoExibicao,
} from "@/lib/format";
import type { ImovelCard } from "@/lib/data/properties";

/**
 * Card do imóvel.
 *
 * Duas variantes pelo mesmo componente: `grid` (vitrine e catálogo) e `lista`
 * (alternativa do catálogo). Separar em dois arquivos duplicaria a lógica de
 * preço, specs e selo de transação, que é onde os erros aparecem.
 */
export function PropertyCard({
  imovel,
  variante = "grid",
  prioridade = false,
}: {
  imovel: ImovelCard;
  variante?: "grid" | "lista";
  prioridade?: boolean;
}) {
  if (variante === "lista") return <CardLista imovel={imovel} />;

  return (
    <Link
      href={`/imoveis/${imovel.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-linha bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(18,48,30,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-700"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-areia-100">
        <Foto imovel={imovel} prioridade={prioridade} />
        <SeloTransacao imovel={imovel} />
        <div className="absolute right-3 top-3">
          <FavoriteButton slug={imovel.slug} />
        </div>
        <SeloArea imovel={imovel} />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 font-medium text-tinta">{imovel.titulo}</h3>

        <Specs imovel={imovel} className="mt-2" />

        <p className="mt-1.5 line-clamp-1 text-sm text-tinta-500">
          {localizacaoExibicao(imovel)}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <Preco imovel={imovel} />
          <span className="inline-flex items-center gap-1.5 text-sm text-tinta-500 transition group-hover:text-verde-700">
            Ver detalhes
            <IconeSeta className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function CardLista({ imovel }: { imovel: ImovelCard }) {
  return (
    <Link
      href={`/imoveis/${imovel.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-linha bg-white transition hover:shadow-[0_18px_40px_-24px_rgba(18,48,30,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-700 sm:flex-row"
    >
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-areia-100 sm:aspect-auto sm:w-72">
        <Foto imovel={imovel} />
        <SeloTransacao imovel={imovel} />
        <div className="absolute right-3 top-3">
          <FavoriteButton slug={imovel.slug} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-medium text-tinta">{imovel.titulo}</h3>
        <Specs imovel={imovel} className="mt-2" />
        <p className="mt-1.5 text-sm text-tinta-500">
          {localizacaoExibicao(imovel)}
        </p>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5">
          <Preco imovel={imovel} />
          <span className="inline-flex items-center gap-1.5 text-sm text-tinta-500 transition group-hover:text-verde-700">
            Ver detalhes
            <IconeSeta className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Foto({
  imovel,
  prioridade = false,
}: {
  imovel: ImovelCard;
  prioridade?: boolean;
}) {
  const capa = imovel.fotos[0];

  if (!capa) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-tinta-400">
        Sem foto
      </div>
    );
  }

  return (
    <Image
      src={capa.url}
      alt={capa.altText ?? imovel.titulo}
      fill
      priority={prioridade}
      sizes="(min-width: 1280px) 25vw, (min-width: 768px) 40vw, 100vw"
      className="object-cover transition duration-500 group-hover:scale-105"
    />
  );
}

function SeloTransacao({ imovel }: { imovel: ImovelCard }) {
  return (
    <span className="absolute left-3 top-3 rounded-full bg-verde-950/85 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-white backdrop-blur">
      {imovel.tipoTransacao === "venda" ? "À venda" : "Para alugar"}
    </span>
  );
}

/** Terreno não tem área útil — o número que importa nele é o do lote. */
function areaExibicao(imovel: ImovelCard): number | null {
  return imovel.areaUtilM2 ?? imovel.areaTerrenoM2;
}

function SeloArea({ imovel }: { imovel: ImovelCard }) {
  const area = areaExibicao(imovel);
  if (!area) return null;

  return (
    <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-tinta backdrop-blur">
      {area}m²
    </span>
  );
}

function Specs({
  imovel,
  className = "",
}: {
  imovel: ImovelCard;
  className?: string;
}) {
  const itens: string[] = [];
  const plural = (n: number, singular: string, plural: string) =>
    `${n} ${n === 1 ? singular : plural}`;

  // Terreno não tem cômodos, e a metragem dele já aparece no selo sobre a
  // foto — repetir aqui deixaria "450m²" duas vezes no mesmo card.
  if (!mostraComodos(imovel.tipoImovel)) return null;

  if (imovel.quartos) itens.push(plural(imovel.quartos, "quarto", "quartos"));
  if (imovel.suites) itens.push(plural(imovel.suites, "suíte", "suítes"));
  if (imovel.banheiros)
    itens.push(plural(imovel.banheiros, "banheiro", "banheiros"));
  if (imovel.vagas) itens.push(plural(imovel.vagas, "vaga", "vagas"));

  const area = areaExibicao(imovel);
  if (area) itens.push(`${area}m²`);

  if (itens.length === 0) return null;

  return (
    <ul className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-tinta-500 ${className}`}>
      {itens.map((item, indice) => (
        <li key={item} className="flex items-center gap-2">
          {indice > 0 && <span aria-hidden="true" className="text-linha">•</span>}
          {item}
        </li>
      ))}
    </ul>
  );
}

function Preco({ imovel }: { imovel: ImovelCard }) {
  return (
    <p className="text-lg font-semibold text-sage">
      {precoExibicao(imovel)}
      {imovel.tipoTransacao === "aluguel" && !imovel.precoSobConsulta && (
        <span className="ml-1 text-sm font-normal text-tinta-500">/mês</span>
      )}
    </p>
  );
}
