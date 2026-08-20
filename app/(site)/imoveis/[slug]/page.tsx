import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { FavoriteButton } from "@/components/site/favorite-button";
import { PropertyGallery } from "@/components/site/property-gallery";
import { ShareButton } from "@/components/site/share-button";
import { SimuladorCard } from "@/components/site/simulador-card";
import { WhatsAppCta } from "@/components/site/whatsapp-cta";
import {
  Icone,
  IconeArea,
  IconeCheck,
  IconeDocumento,
  IconeMapa,
  IconeSeta,
  IconeSol,
  IconeTopografia,
} from "@/components/ui/icons";
import {
  CHECKLIST_TERRENO,
  COMERCIOS_PROXIMOS,
  CORRETORES,
  CTA_FICHA,
  DETALHES_TERRENO_PADRAO,
  EQUIPE_EXTRA,
} from "@/lib/content/site";
import { buscarImovelPorSlug, buscarSemelhantes, type ImovelFicha } from "@/lib/data/properties";
import {
  formatarBRL,
  localizacaoExibicao,
  mostraComodos,
  precoExibicao,
  resumir,
  rotuloTipoImovel,
} from "@/lib/format";
import { breadcrumbJsonLd, imovelJsonLd } from "@/lib/seo/jsonld";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/imoveis/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const imovel = await buscarImovelPorSlug(slug);

  // Ficha desativada ou inexistente não pode entrar no índice: o link já pode
  // ter circulado, e o que o visitante vê aqui é o not-found.
  if (!imovel) {
    return { title: "Imóvel não encontrado", robots: { index: false } };
  }

  const local = localizacaoExibicao(imovel);
  const caminho = `/imoveis/${imovel.slug}`;

  // Abre com preço e local em vez de cortar a descrição do zero: é o que o
  // visitante procura no resultado da busca, e a descrição do portal costuma
  // começar com texto genérico ("Excelente oportunidade...").
  const descricao = resumir(
    [
      `${rotuloTipoImovel(imovel.tipoImovel)} ${imovel.tipoTransacao === "venda" ? "à venda" : "para alugar"}${local ? ` em ${local}` : ""}`,
      `${precoExibicao(imovel)}${imovel.tipoTransacao === "aluguel" && !imovel.precoSobConsulta ? "/mês" : ""}`,
      imovel.descricao,
    ].join(". "),
    160,
  );

  const capa = imovel.fotos[0];

  return {
    title: `${imovel.titulo}${local ? ` — ${local}` : ""}`,
    description: descricao,
    alternates: { canonical: caminho },
    openGraph: {
      title: imovel.titulo,
      description: descricao,
      url: caminho,
      type: "article",
      images: capa
        ? [
            {
              url: capa.url,
              // 1200x630 é o que o WhatsApp e o Facebook esperam; declarar
              // evita que o preview apareça cortado ou como thumbnail pequeno.
              width: capa.width ?? 1200,
              height: capa.height ?? 630,
              alt: capa.altText ?? imovel.titulo,
            },
          ]
        : undefined,
    },
  };
}

export default async function FichaImovelPage({
  params,
}: PageProps<"/imoveis/[slug]">) {
  const { slug } = await params;
  const imovel = await buscarImovelPorSlug(slug);

  // Não encontrado OU desativado no painel — desativar tira a página do ar
  // mesmo que o link já tenha sido compartilhado.
  if (!imovel) notFound();

  const semelhantes = await buscarSemelhantes(imovel);
  const ehTerreno = !mostraComodos(imovel.tipoImovel);

  // Mesma trilha do <Breadcrumb> logo abaixo. Se mudar lá, mude aqui: markup
  // que não bate com o que está na tela é o que o Google chama de spammy.
  const secao = ehTerreno
    ? { rotulo: "Terrenos + Construção", href: "/terrenos" }
    : { rotulo: "Imóveis", href: "/imoveis" };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-10">
      <JsonLd dados={imovelJsonLd(imovel)} />
      <JsonLd
        dados={breadcrumbJsonLd([
          { nome: "Início", url: "/" },
          { nome: secao.rotulo, url: secao.href },
          { nome: imovel.titulo },
        ])}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Breadcrumb imovel={imovel} ehTerreno={ehTerreno} />

        <div className="flex items-center gap-5">
          <FavoriteButton
            slug={imovel.slug}
            rotulo
            className="inline-flex items-center gap-2 text-sm font-medium text-tinta-500 transition hover:text-tinta"
          />
          <ShareButton titulo={imovel.titulo} />
        </div>
      </div>

      <div className="mt-5 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PropertyGallery
            fotos={imovel.fotos}
            titulo={imovel.titulo}
            selo={imovel.tipoTransacao === "venda" ? "À venda" : "Para alugar"}
          />

          <div className="mt-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage">
              {rotuloTipoImovel(imovel.tipoImovel)}
              {ehTerreno ? " + Construção" : ""}
            </p>

            <h1 className="mt-3 font-serif text-3xl leading-tight text-tinta sm:text-4xl">
              {imovel.titulo}
            </h1>

            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-tinta-500">
              <IconeMapa className="h-[18px] w-[18px] text-verde-700" />
              {localizacaoExibicao(imovel)}
              <LinkMapa imovel={imovel} className="text-verde-700 hover:underline" />
            </p>
          </div>

          <FaixaEspecificacoes imovel={imovel} ehTerreno={ehTerreno} />

          <SobreOImovel imovel={imovel} ehTerreno={ehTerreno} />

          <Detalhes imovel={imovel} ehTerreno={ehTerreno} />

          <Localizacao imovel={imovel} />
        </div>

        <aside className="lg:col-span-1">
          <div className="flex flex-col gap-5 lg:sticky lg:top-24">
            <PainelPreco imovel={imovel} />
            <SimuladorCard />
            {semelhantes.length > 0 && (
              <Semelhantes imoveis={semelhantes} ehTerreno={ehTerreno} />
            )}
          </div>
        </aside>
      </div>

      <FaixaCta ehTerreno={ehTerreno} slug={imovel.slug} />

      <CtaFixoMobile imovel={imovel} />
    </div>
  );
}

function Breadcrumb({
  imovel,
  ehTerreno,
}: {
  imovel: ImovelFicha;
  ehTerreno: boolean;
}) {
  const secao = ehTerreno
    ? { rotulo: "Terrenos + Construção", href: "/terrenos" }
    : { rotulo: "Imóveis", href: "/imoveis" };

  return (
    <nav aria-label="Você está em" className="text-sm text-tinta-400">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/" className="transition hover:text-tinta">
            Início
          </Link>
        </li>
        <li aria-hidden="true">›</li>
        <li>
          <Link href={secao.href} className="transition hover:text-tinta">
            {secao.rotulo}
          </Link>
        </li>
        <li aria-hidden="true">›</li>
        <li className="text-tinta">{imovel.titulo}</li>
      </ol>
    </nav>
  );
}

/**
 * Link pro mapa.
 *
 * Busca por endereço no Google Maps em vez de mapa embutido: mapa embutido
 * pede chave de API, cobra por carregamento e adiciona rastreador de terceiro
 * numa página que hoje não tem nenhum.
 */
function LinkMapa({
  imovel,
  className = "",
  children = "Ver no mapa",
}: {
  imovel: ImovelFicha;
  className?: string;
  children?: React.ReactNode;
}) {
  const endereco = [imovel.bairro, imovel.cidade, imovel.estado, imovel.cep]
    .filter(Boolean)
    .join(", ");

  return (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}

function FaixaEspecificacoes({
  imovel,
  ehTerreno,
}: {
  imovel: ImovelFicha;
  ehTerreno: boolean;
}) {
  const itens: { icone: React.ReactNode; valor: string; rotulo: string }[] = [];

  if (ehTerreno) {
    const area = imovel.areaTerrenoM2 ?? imovel.areaUtilM2;
    if (area) {
      itens.push({
        icone: <IconeArea />,
        valor: `${area}m²`,
        rotulo: "Área total",
      });
    }
    itens.push({
      icone: <IconeTopografia />,
      valor: DETALHES_TERRENO_PADRAO.topografia,
      rotulo: "Topografia",
    });
    itens.push({
      icone: <IconeSol />,
      valor: DETALHES_TERRENO_PADRAO.posicaoSolar,
      rotulo: "Posição solar",
    });
    itens.push({
      icone: <IconeDocumento />,
      valor: DETALHES_TERRENO_PADRAO.prontoParaConstruir,
      rotulo: `Documentação ${DETALHES_TERRENO_PADRAO.documentacao.toLowerCase()}`,
    });
  } else {
    if (imovel.quartos)
      itens.push({
        icone: <Icone nome="casa" />,
        valor: String(imovel.quartos),
        rotulo: imovel.quartos === 1 ? "Quarto" : "Quartos",
      });
    if (imovel.suites)
      itens.push({
        icone: <Icone nome="casa" />,
        valor: String(imovel.suites),
        rotulo: imovel.suites === 1 ? "Suíte" : "Suítes",
      });
    if (imovel.banheiros)
      itens.push({
        icone: <Icone nome="casa" />,
        valor: String(imovel.banheiros),
        rotulo: imovel.banheiros === 1 ? "Banheiro" : "Banheiros",
      });
    if (imovel.vagas)
      itens.push({
        icone: <Icone nome="casa" />,
        valor: String(imovel.vagas),
        rotulo: imovel.vagas === 1 ? "Vaga" : "Vagas",
      });
    if (imovel.areaUtilM2)
      itens.push({
        icone: <IconeArea />,
        valor: `${imovel.areaUtilM2}m²`,
        rotulo: "Área útil",
      });
  }

  if (itens.length === 0) return null;

  return (
    <ul className="mt-6 flex flex-wrap gap-x-10 gap-y-5 border-y border-linha py-5">
      {itens.map((item) => (
        <li key={item.rotulo} className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-linha text-verde-700">
            {item.icone}
          </span>
          <span>
            <span className="block text-sm font-medium text-tinta">
              {item.valor}
            </span>
            <span className="block text-xs text-tinta-500">{item.rotulo}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function SobreOImovel({
  imovel,
  ehTerreno,
}: {
  imovel: ImovelFicha;
  ehTerreno: boolean;
}) {
  // Diferenciais cadastrados vencem o texto padrão de terreno — quando o
  // corretor escreveu algo específico, é isso que o visitante precisa ler.
  const bullets =
    imovel.caracteristicas.length > 0
      ? imovel.caracteristicas
      : ehTerreno
        ? CHECKLIST_TERRENO
        : [];

  return (
    <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <h2 className="font-medium text-tinta">Sobre o imóvel</h2>

        {/* whitespace-pre-line preserva as quebras que o corretor digitou */}
        <p className="mt-3 whitespace-pre-line leading-relaxed text-tinta-500">
          {imovel.descricao}
        </p>

        {bullets.length > 0 && (
          <ul className="mt-5 flex flex-col gap-2.5">
            {bullets.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-tinta">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-verde-100 text-verde-700">
                  <IconeCheck className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>

      <CardMapa imovel={imovel} />
    </section>
  );
}

/**
 * Painel do mapa.
 *
 * Desenho em CSS, não imagem estática: mapa estático de verdade exige chave de
 * API do Google/Mapbox, que a NF ainda não tem. O botão leva pro mapa real.
 */
function CardMapa({ imovel }: { imovel: ImovelFicha }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-linha bg-areia-100 lg:aspect-auto lg:min-h-56">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(#e4e1da 1px, transparent 1px), linear-gradient(90deg, #e4e1da 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-24 w-40 -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-lg bg-verde-100/60"
      />

      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-verde-700">
        <IconeMapa className="h-9 w-9" />
      </span>

      <LinkMapa
        imovel={imovel}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-linha bg-white px-5 py-2.5 text-sm font-medium text-tinta shadow-sm transition hover:border-tinta-400"
      />
    </div>
  );
}

function Detalhes({
  imovel,
  ehTerreno,
}: {
  imovel: ImovelFicha;
  ehTerreno: boolean;
}) {
  const linhas: { rotulo: string; valor: string }[] = [];

  const adicionar = (rotulo: string, valor: string | number | null) => {
    if (valor !== null && valor !== undefined && valor !== "") {
      linhas.push({ rotulo, valor: String(valor) });
    }
  };

  adicionar("Tipo", rotuloTipoImovel(imovel.tipoImovel));
  adicionar(
    "Negócio",
    imovel.tipoTransacao === "venda" ? "Venda" : "Aluguel",
  );

  if (ehTerreno) {
    adicionar("Finalidade", DETALHES_TERRENO_PADRAO.finalidade);
    adicionar("Topografia", DETALHES_TERRENO_PADRAO.topografia);
    adicionar("Posição solar", DETALHES_TERRENO_PADRAO.posicaoSolar);
    adicionar("Documentação", DETALHES_TERRENO_PADRAO.documentacao);
  } else {
    adicionar("Quartos", imovel.quartos);
    adicionar("Suítes", imovel.suites);
    adicionar("Banheiros", imovel.banheiros);
    adicionar("Vagas", imovel.vagas);
    adicionar("Andar", imovel.andar);
    adicionar("Ano de construção", imovel.anoConstrucao);
  }

  adicionar(
    "Área total",
    imovel.areaTerrenoM2 ? `${imovel.areaTerrenoM2}m²` : null,
  );
  adicionar("Área útil", imovel.areaUtilM2 ? `${imovel.areaUtilM2}m²` : null);
  adicionar(
    "Condomínio",
    imovel.condominioCentavos ? formatarBRL(imovel.condominioCentavos) : "–",
  );
  adicionar(
    "IPTU",
    imovel.iptuCentavos
      ? `${formatarBRL(imovel.iptuCentavos)}/${imovel.iptuPeriodo === "anual" ? "ano" : "mês"}`
      : "–",
  );

  return (
    <section className="mt-10 border-t border-linha pt-7">
      <h2 className="font-medium text-tinta">
        {ehTerreno ? "Detalhes do terreno" : "Detalhes do imóvel"}
      </h2>

      <dl className="mt-5 grid gap-x-10 gap-y-3.5 sm:grid-cols-2">
        {linhas.map((linha) => (
          <div
            key={linha.rotulo}
            className="flex items-baseline justify-between gap-4 text-sm"
          >
            <dt className="text-tinta-500">{linha.rotulo}</dt>
            <dd className="text-right font-medium text-tinta">{linha.valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Localizacao({ imovel }: { imovel: ImovelFicha }) {
  return (
    <section className="mt-10 border-t border-linha pt-7">
      <h2 className="font-medium text-tinta">Localização</h2>

      <p className="mt-4 flex items-center gap-2 text-sm text-tinta-500">
        <IconeMapa className="h-[18px] w-[18px] text-verde-700" />
        {localizacaoExibicao(imovel)}
      </p>

      {/*
        Tempos aproximados de deslocamento, iguais pra toda a carteira. Não são
        medidos por imóvel — servem pra dar noção de bairro estruturado.
      */}
      <ul className="mt-5 flex flex-wrap gap-x-9 gap-y-4">
        {COMERCIOS_PROXIMOS.map((comercio) => (
          <li key={comercio.nome} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-linha text-verde-700">
              <Icone nome={comercio.icone} />
            </span>
            <span>
              <span className="block text-sm text-tinta">{comercio.nome}</span>
              <span className="block text-xs text-tinta-500">
                {comercio.tempo}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PainelPreco({ imovel }: { imovel: ImovelFicha }) {
  const aluguel = imovel.tipoTransacao === "aluguel";

  return (
    <div className="rounded-2xl border border-linha bg-white p-6">
      <p className="text-sm text-tinta-500">
        {aluguel ? "Valor do aluguel" : "Valor de venda"}
      </p>

      <p className="mt-1.5 font-serif text-4xl text-tinta">
        {precoExibicao(imovel)}
        {aluguel && !imovel.precoSobConsulta && (
          <span className="ml-1 text-base text-tinta-500">/mês</span>
        )}
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-linha pt-4 text-sm">
        <div>
          <dt className="text-tinta-500">Condomínio</dt>
          <dd className="mt-0.5 font-medium text-tinta">
            {imovel.condominioCentavos
              ? formatarBRL(imovel.condominioCentavos)
              : "–"}
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-tinta-500">
            IPTU {imovel.iptuPeriodo === "anual" ? "(anual)" : "(mensal)"}
          </dt>
          <dd className="mt-0.5 font-medium text-tinta">
            {imovel.iptuCentavos ? formatarBRL(imovel.iptuCentavos) : "–"}
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-col gap-2.5">
        {/* CTA principal — a única saída de conversão da página. */}
        <WhatsAppCta
          slugImovel={imovel.slug}
          origem="ficha_cta"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-verde-700 px-6 py-3.5 font-semibold text-white transition hover:bg-verde-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-700"
        >
          Quero mais informações
        </WhatsAppCta>

        <WhatsAppCta
          slugImovel={imovel.slug}
          origem="ficha_agendar"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-linha px-6 py-3.5 font-semibold text-tinta transition hover:border-verde-600 hover:text-verde-700"
        >
          Agendar visita
        </WhatsAppCta>
      </div>

      <div className="mt-6 border-t border-linha pt-5">
        <p className="text-sm font-medium text-tinta">Atendimento rápido</p>
        <p className="mt-1 text-sm text-tinta-500">
          Fale agora com um especialista
        </p>

        <div className="mt-4 flex items-center gap-3">
          <ul className="flex -space-x-2.5">
            {CORRETORES.map((corretor) => (
              <li
                key={corretor.iniciais}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-[0.65rem] font-semibold text-white ring-2 ring-white ${corretor.cor}`}
              >
                {corretor.iniciais}
              </li>
            ))}
          </ul>
          <span className="flex h-9 items-center rounded-full bg-areia-100 px-2.5 text-xs font-medium text-tinta">
            +{EQUIPE_EXTRA}
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-tinta-500">
            <span className="h-2 w-2 rounded-full bg-verde-500" />
            Online
          </span>
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-tinta-400">
        Código do imóvel: {imovel.referenceCode}
      </p>
    </div>
  );
}

function Semelhantes({
  imoveis,
  ehTerreno,
}: {
  imoveis: Awaited<ReturnType<typeof buscarSemelhantes>>;
  ehTerreno: boolean;
}) {
  return (
    <div className="rounded-2xl border border-linha bg-white p-6">
      <h2 className="font-medium text-tinta">Imóveis semelhantes</h2>

      <ul className="mt-4 flex flex-col gap-4">
        {imoveis.map((imovel) => (
          <li key={imovel.id}>
            <Link
              href={`/imoveis/${imovel.slug}`}
              className="group flex gap-3.5 rounded-xl transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-700"
            >
              <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-areia-100">
                {imovel.fotos[0] ? (
                  <Image
                    src={imovel.fotos[0].url}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-tinta">
                  {imovel.titulo}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-tinta-500">
                  {localizacaoExibicao(imovel)}
                </p>
                {imovel.areaUtilM2 && (
                  <p className="mt-1 text-xs text-tinta-500">
                    {imovel.areaUtilM2}m²
                  </p>
                )}
                <p className="mt-1 text-sm font-semibold text-sage">
                  {precoExibicao(imovel)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={ehTerreno ? "/imoveis?tipo=terreno" : "/imoveis"}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-linha px-4 py-3 text-sm font-medium text-tinta transition hover:border-tinta-400"
      >
        {ehTerreno ? "Ver todos os terrenos" : "Ver todos os imóveis"}
      </Link>
    </div>
  );
}

function FaixaCta({ ehTerreno, slug }: { ehTerreno: boolean; slug: string }) {
  return (
    <section className="relative mt-12 overflow-hidden rounded-3xl bg-verde-950">
      <Image
        src={CTA_FICHA.imagem}
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-verde-950 via-verde-950/85 to-transparent" />

      <div className="relative max-w-lg px-6 py-12 text-white sm:px-10">
        <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
          {ehTerreno ? (
            <>
              Transforme este terreno
              <br />
              na <em className="text-verde-300">casa dos seus sonhos</em>
            </>
          ) : (
            <>
              Vamos encontrar
              <br />o <em className="text-verde-300">seu próximo lar</em>
            </>
          )}
        </h2>

        <p className="mt-4 text-white/75">
          {ehTerreno
            ? "Nossos especialistas podem te ajudar em todo o processo de construção."
            : "Nossos especialistas respondem suas dúvidas e agendam a visita."}
        </p>

        <WhatsAppCta
          slugImovel={slug}
          origem="ficha_atendimento"
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-verde-500 px-7 py-3.5 font-semibold text-white transition hover:bg-verde-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Falar com especialista
        </WhatsAppCta>
      </div>
    </section>
  );
}

/** No celular o painel lateral sai da tela — o CTA precisa continuar alcançável. */
function CtaFixoMobile({ imovel }: { imovel: ImovelFicha }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-linha bg-white/95 p-3 backdrop-blur lg:hidden">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-tinta-500">
          {imovel.tipoTransacao === "venda" ? "Valor de venda" : "Aluguel"}
        </p>
        <p className="truncate font-semibold text-tinta">
          {precoExibicao(imovel)}
        </p>
      </div>

      <WhatsAppCta
        slugImovel={imovel.slug}
        origem="ficha_cta_fixo"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-verde-700 px-5 py-3 font-semibold text-white transition hover:bg-verde-800"
      >
        Tenho interesse
        <IconeSeta className="h-4 w-4" />
      </WhatsAppCta>
    </div>
  );
}
