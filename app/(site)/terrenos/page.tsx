import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Carousel } from "@/components/site/carousel";
import { CtaBand } from "@/components/site/cta-band";
import { PropertyCard } from "@/components/site/property-card";
import { SearchBar } from "@/components/site/search-bar";
import { SimuladorCard } from "@/components/site/simulador-card";
import { WhatsAppCta } from "@/components/site/whatsapp-cta";
import { Icone, IconeSeta } from "@/components/ui/icons";
import {
  HERO_TERRENOS,
  PASSOS_TERRENO,
  PILARES_TERRENO,
  PROJETOS_INSPIRADORES,
} from "@/lib/content/site";
import { listarBairros, listarCidades, listarTerrenos } from "@/lib/data/properties";
import { BOTAO_PRIMARIO, SOBRANCELHA } from "@/lib/ui/botao";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terreno + Construção em Mirassol e Rio Preto",
  description:
    "Terrenos em ótimas localizações com projeto personalizado e construção sem burocracia em Mirassol, São José do Rio Preto e região. Fale com a NF Negócios pelo WhatsApp.",
  alternates: { canonical: "/terrenos" },
};

export default async function TerrenosPage() {
  const [terrenos, cidades, bairros] = await Promise.all([
    listarTerrenos(8),
    listarCidades(),
    listarBairros(),
  ]);

  return (
    <>
      <Hero />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SearchBar variante="terrenos" cidades={cidades} bairros={bairros} />
      </div>

      <Vitrine terrenos={terrenos} />

      <ComoFunciona />

      <Projetos />

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <CtaBand
          titulo="Vamos tirar seu projeto do papel?"
          texto="Fale com um de nossos especialistas e descubra como é fácil realizar o sonho da casa própria."
          rotulo="Falar com especialista"
          origem="terrenos_cta"
          icone="projeto"
        />
      </div>
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-areia-50">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className={SOBRANCELHA}>Terreno + Construção</p>

            <h1 className="mt-4 font-serif text-4xl leading-[1.08] text-tinta sm:text-5xl lg:text-6xl">
              O lugar perfeito
              <br />
              para construir seus
              <br />
              <em className="not-italic text-sage">melhores planos.</em>
            </h1>

            <p className="mt-6 max-w-md text-tinta-500">
              Terrenos em ótimas localizações com projetos personalizados e
              construção sem burocracia.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <WhatsAppCta
                origem="terrenos_hero"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-verde-500 px-7 py-3.5 font-semibold text-white transition hover:bg-verde-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-500"
              />
              <Link
                href="#como-funciona"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-linha bg-white px-7 py-3.5 font-semibold text-tinta transition hover:border-tinta-400"
              >
                Como funciona
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-areia-200">
              <Image
                src={HERO_TERRENOS.imagem}
                alt="Casa moderna construída pela NF Negócios"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>

            <SimuladorCard className="mt-4 lg:absolute lg:-bottom-8 lg:right-0 lg:mt-0 lg:w-64" />
          </div>
        </div>

        <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PILARES_TERRENO.map((pilar) => (
            <li key={pilar.titulo} className="flex gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-verde-100 text-verde-700">
                <Icone nome={pilar.icone} />
              </span>
              <div>
                <p className="font-medium text-tinta">{pilar.titulo}</p>
                <p className="mt-1 text-sm leading-relaxed text-tinta-500">
                  {pilar.texto}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Vitrine({
  terrenos,
}: {
  terrenos: Awaited<ReturnType<typeof listarTerrenos>>;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className={SOBRANCELHA}>Terrenos em destaque</p>
          <h2 className="mt-3 font-serif text-3xl leading-[1.15] text-tinta sm:text-4xl">
            Encontre o terreno ideal
            <br />
            para <em className="not-italic text-sage">seu projeto</em>
          </h2>
        </div>

        <Link
          href="/imoveis?tipo=terreno"
          className="inline-flex items-center gap-2 rounded-full border border-linha bg-white px-5 py-2.5 text-sm font-medium text-tinta transition hover:border-tinta-400"
        >
          Ver todos os terrenos
          <IconeSeta className="h-4 w-4" />
        </Link>
      </div>

      {terrenos.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-linha bg-white p-12 text-center">
          <p className="font-medium text-tinta">
            Nenhum terreno cadastrado no momento.
          </p>
          <p className="mt-2 text-sm text-tinta-500">
            Cadastre imóveis do tipo “Terreno” no painel para que apareçam aqui.
          </p>
        </div>
      ) : (
        <div className="mt-8">
          <Carousel total={terrenos.length} rotulo="Terrenos em destaque">
            {terrenos.map((imovel) => (
              <li
                key={imovel.id}
                className="w-[80%] shrink-0 snap-start sm:w-[45%] lg:w-[calc((100%-72px)/4)]"
              >
                <PropertyCard imovel={imovel} />
              </li>
            ))}
          </Carousel>
        </div>
      )}
    </section>
  );
}

function ComoFunciona() {
  return (
    <section
      id="como-funciona"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
        <div>
          <p className={SOBRANCELHA}>Como funciona</p>
          <h2 className="mt-3 font-serif text-3xl leading-[1.15] text-tinta sm:text-4xl">
            Do terreno à casa
            <br />
            dos <em className="not-italic text-sage">seus sonhos</em>
          </h2>
        </div>

        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PASSOS_TERRENO.map((passo, indice) => (
            <li key={passo.titulo} className="relative">
              {/* Linha que costura os passos no desktop. */}
              {indice < PASSOS_TERRENO.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-14 right-0 top-6 hidden border-t border-dashed border-linha lg:block"
                />
              )}

              <div className="relative flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-linha bg-white text-verde-700">
                  <Icone nome={passo.icone} />
                </span>
                <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-verde-950 text-xs font-semibold text-white">
                  {indice + 1}
                </span>
              </div>

              <p className="mt-4 font-medium text-tinta">{passo.titulo}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-tinta-500">
                {passo.texto}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Projetos() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
        <div>
          <p className={SOBRANCELHA}>Projetos inspiradores</p>
          <h2 className="mt-3 font-serif text-3xl leading-[1.15] text-tinta sm:text-4xl">
            Projetos que unem{" "}
            <em className="not-italic text-sage">design, conforto</em> e
            funcionalidade
          </h2>

          <WhatsAppCta origem="terrenos_cta" className={`mt-7 ${BOTAO_PRIMARIO}`}>
            Ver todos os projetos
            <IconeSeta className="h-4 w-4" />
          </WhatsAppCta>
        </div>

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROJETOS_INSPIRADORES.map((projeto) => (
            <li
              key={projeto.nome}
              className="overflow-hidden rounded-2xl border border-linha bg-white"
            >
              <div className="relative aspect-[4/3] bg-areia-100">
                <Image
                  src={projeto.imagem}
                  alt={projeto.nome}
                  fill
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-tinta">{projeto.nome}</p>
                <p className="mt-1 text-xs text-tinta-500">{projeto.resumo}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
