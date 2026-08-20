import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Carousel } from "@/components/site/carousel";
import { PropertyCard } from "@/components/site/property-card";
import { SearchBar } from "@/components/site/search-bar";
import { WhatsAppCta } from "@/components/site/whatsapp-cta";
import {
  Icone,
  IconeCasa,
  IconeChevronDireita,
  IconeMais,
  IconePlay,
  IconeSeta,
} from "@/components/ui/icons";
import {
  ANUNCIE,
  capaBairro,
  FAMILIAS_PROVA_SOCIAL,
  HERO_HOME,
  SELOS,
} from "@/lib/content/site";
import {
  listarBairros,
  listarBairrosComContagem,
  listarCidades,
  listarDestaques,
} from "@/lib/data/properties";
import { BOTAO_PRIMARIO, SOBRANCELHA } from "@/lib/ui/botao";

// Lê banco e cookie a cada requisição: o painel marca "destaque" e aparece aqui
// no refresh seguinte, sem cache intermediário pra invalidar.
export const dynamic = "force-dynamic";

// `title` absoluto pra escapar do template "%s | NF Negócios" — na home o nome
// da marca já está no título, e repetir gastaria caracteres do resultado.
export const metadata: Metadata = {
  title: {
    absolute: "NF Negócios — Imobiliária em Mirassol e São José do Rio Preto",
  },
  description:
    "Imobiliária em Mirassol/SP com casas, apartamentos, terrenos e salas comerciais à venda e para alugar em Mirassol, São José do Rio Preto e região. Atendimento direto pelo WhatsApp.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [destaques, bairrosComContagem, cidades, bairros] = await Promise.all([
    listarDestaques(),
    listarBairrosComContagem(5),
    listarCidades(),
    listarBairros(),
  ]);

  return (
    <>
      <Hero />

      <div className="relative z-10 mx-auto -mt-10 max-w-7xl px-4 sm:px-6 lg:-mt-12 lg:px-8">
        <SearchBar variante="home" cidades={cidades} bairros={bairros} />
      </div>

      <Selos />

      <Destaques destaques={destaques} />

      <Bairros bairros={bairrosComContagem} />

      <Anuncie />
    </>
  );
}

/**
 * Hero.
 *
 * A margem negativa puxa a seção pra baixo do header transparente (que é
 * sticky e portanto ocupa espaço no fluxo). O padding devolve o espaço por
 * dentro, então o texto nunca fica escondido atrás do menu.
 */
function Hero() {
  return (
    <section className="relative -mt-[76px] overflow-hidden bg-verde-950 pt-[76px] text-white">
      <Image
        src={HERO_HOME.imagem}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-verde-950 via-verde-950/85 to-verde-950/30" />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 lg:px-8 lg:pb-28 lg:pt-20">
        <h1 className="max-w-2xl font-serif text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
          Mais que imóveis,
          <br />
          realizamos <em className="text-verde-300">planos.</em>
        </h1>

        <p className="mt-6 max-w-md text-lg text-white/75">
          Encontre o imóvel ideal para viver, investir ou construir o futuro que
          você imagina.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <WhatsAppCta
            origem="home_hero"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-verde-500 px-7 py-3.5 font-semibold text-white transition hover:bg-verde-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          />
          <Link
            href="/imoveis"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-7 py-3.5 font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
          >
            <IconePlay className="h-4 w-4" />
            Ver imóveis
          </Link>
        </div>

        <div className="mt-10 flex items-center gap-4">
          <Avatares />
          <p className="max-w-[16rem] text-sm text-white/70">
            {HERO_HOME.provaSocial}
          </p>
        </div>
      </div>

      <AtalhosLaterais />
    </section>
  );
}

/** Trilho vertical do canto direito do hero. Só no desktop, como no desenho. */
function AtalhosLaterais() {
  const atalhos = [
    { rotulo: "Comprar", href: "/imoveis?transacao=venda", icone: <IconeCasa /> },
    { rotulo: "Alugar", href: "/imoveis?transacao=aluguel", icone: <Icone nome="chave" /> },
    { rotulo: "Anunciar", href: "/#anunciar", icone: <IconeMais /> },
  ];

  return (
    <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white/95 shadow-lg backdrop-blur lg:flex">
      {atalhos.map((atalho, indice) => (
        <Link
          key={atalho.rotulo}
          href={atalho.href}
          className={`flex w-24 flex-col items-center gap-1.5 px-3 py-4 text-xs font-medium text-tinta transition hover:bg-areia-100 ${
            indice > 0 ? "border-t border-linha" : ""
          }`}
        >
          <span className="text-verde-700">{atalho.icone}</span>
          {atalho.rotulo}
        </Link>
      ))}
    </div>
  );
}

export function Avatares({ claro = true }: { claro?: boolean }) {
  return (
    <ul className="flex -space-x-2.5">
      {FAMILIAS_PROVA_SOCIAL.map((foto, indice) => (
        <li
          key={foto}
          className={`relative h-9 w-9 overflow-hidden rounded-full ring-2 ${
            claro ? "ring-verde-950" : "ring-white"
          }`}
        >
          <Image
            src={foto}
            alt=""
            fill
            sizes="36px"
            className="object-cover"
            priority={indice === 0}
          />
        </li>
      ))}
    </ul>
  );
}

function Selos() {
  return (
    <section id="sobre" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <ul className="grid gap-8 rounded-3xl bg-areia-100 px-6 py-8 sm:grid-cols-2 sm:px-10 lg:grid-cols-4">
        {SELOS.map((selo) => (
          <li key={selo.titulo} className="flex gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-verde-100 text-verde-700">
              <Icone nome={selo.icone} />
            </span>
            <div>
              <p className="font-medium text-tinta">{selo.titulo}</p>
              <p className="mt-1 text-sm leading-relaxed text-tinta-500">
                {selo.texto}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Destaques({
  destaques,
}: {
  destaques: Awaited<ReturnType<typeof listarDestaques>>;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <CabecalhoSecao
        sobrancelha="Destaques"
        titulo={
          <>
            Imóveis que podem
            <br />
            ser o seu <em className="not-italic text-sage">próximo lar.</em>
          </>
        }
        acao={{ rotulo: "Ver todos os imóveis", href: "/imoveis" }}
      />

      {destaques.length === 0 ? (
        <EstadoVazio />
      ) : (
        <div className="mt-8">
          <Carousel total={destaques.length} rotulo="Imóveis em destaque">
            {destaques.map((imovel, indice) => (
              <li
                key={imovel.id}
                className="w-[80%] shrink-0 snap-start sm:w-[45%] lg:w-[calc((100%-72px)/4)]"
              >
                <PropertyCard imovel={imovel} prioridade={indice < 4} />
              </li>
            ))}
          </Carousel>
        </div>
      )}
    </section>
  );
}

function Bairros({
  bairros,
}: {
  bairros: { bairro: string; total: number }[];
}) {
  if (bairros.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-verde-950 px-6 py-10 text-white sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-verde-300">
              Bairros
            </p>
            <h2 className="mt-3 font-serif text-3xl leading-[1.15] sm:text-4xl">
              Encontre imóveis
              <br />
              nos <em className="text-verde-300">melhores bairros.</em>
            </h2>
          </div>

          <Link
            href="/imoveis"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-medium transition hover:border-white/60 hover:bg-white/10"
          >
            Ver todos os bairros
          </Link>
        </div>

        <ul className="sem-barra mt-8 flex snap-x gap-4 overflow-x-auto pb-1">
          {bairros.map((item) => (
            <li key={item.bairro} className="w-44 shrink-0 snap-start">
              <Link
                href={`/imoveis?bairro=${encodeURIComponent(item.bairro)}`}
                className="group block overflow-hidden rounded-2xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-verde-900">
                  <Image
                    src={capaBairro(item.bairro)}
                    alt=""
                    fill
                    sizes="176px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="mt-3 text-sm font-medium">{item.bairro}</p>
                <p className="text-xs text-white/60">
                  {item.total} {item.total === 1 ? "imóvel" : "imóveis"}
                </p>
              </Link>
            </li>
          ))}

          <li className="w-44 shrink-0 snap-start">
            <Link
              href="/imoveis"
              className="group flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border border-white/20 transition hover:border-white/50 hover:bg-white/5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-verde-950 transition group-hover:scale-110">
                <IconeChevronDireita className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium">Mais bairros</span>
              <span className="text-xs text-white/60">Ver todos</span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}

function Anuncie() {
  return (
    <section
      id="anunciar"
      className="mx-auto max-w-7xl px-4 py-10 pb-16 sm:px-6 lg:px-8"
    >
      <div className="grid items-center gap-10 rounded-3xl bg-areia-100 px-6 py-10 sm:px-10 lg:grid-cols-2 lg:py-12">
        <div>
          <p className={SOBRANCELHA}>Anuncie seu imóvel</p>
          <h2 className="mt-3 font-serif text-3xl leading-[1.15] text-tinta sm:text-4xl">
            Anuncie seu imóvel com
            <br />
            quem <em className="not-italic text-sage">realmente entende.</em>
          </h2>
          <p className="mt-4 max-w-md text-tinta-500">
            Mais visibilidade, mais segurança e mais chances de fechar negócio
            rápido.
          </p>

          <WhatsAppCta origem="home_anuncie" className={`mt-7 ${BOTAO_PRIMARIO}`}>
            Quero anunciar meu imóvel
          </WhatsAppCta>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-areia-200">
            <Image
              src={ANUNCIE.imagem}
              alt="Fachada de imóvel anunciado pela NF Negócios"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>

          <div className="mt-4 rounded-2xl border border-linha bg-white p-5 lg:absolute lg:-right-4 lg:bottom-6 lg:mt-0 lg:w-56">
            <p className="text-sm font-medium text-tinta">Alcance real</p>
            <p className="mt-1 text-xs text-tinta-500">
              Seu imóvel visto pelas pessoas certas.
            </p>
            <p className="mt-4 font-serif text-4xl text-verde-700">
              {ANUNCIE.visualizacoes}
            </p>
            <p className="text-xs text-tinta-500">visualizações em média</p>
            <div className="mt-4 flex items-center gap-2.5">
              <Avatares claro={false} />
              <span className="text-xs text-tinta-500">
                {ANUNCIE.imoveisVendidos}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CabecalhoSecao({
  sobrancelha,
  titulo,
  acao,
}: {
  sobrancelha: string;
  titulo: React.ReactNode;
  acao?: { rotulo: string; href: string };
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className={SOBRANCELHA}>{sobrancelha}</p>
        <h2 className="mt-3 font-serif text-3xl leading-[1.15] text-tinta sm:text-4xl">
          {titulo}
        </h2>
      </div>

      {acao && (
        <Link
          href={acao.href}
          className="inline-flex items-center gap-2 rounded-full border border-linha bg-white px-5 py-2.5 text-sm font-medium text-tinta transition hover:border-tinta-400"
        >
          {acao.rotulo}
          <IconeSeta className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function EstadoVazio() {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-linha bg-white p-12 text-center">
      <p className="font-medium text-tinta">
        Nenhum imóvel em destaque no momento.
      </p>
      <p className="mt-2 text-sm text-tinta-500">
        Marque imóveis como destaque no painel para que apareçam aqui.
      </p>
    </div>
  );
}
