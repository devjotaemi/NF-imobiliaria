/**
 * Construtores de JSON-LD (schema.org).
 *
 * É o que Google, ChatGPT, Claude e Gemini leem para entender o site como
 * dados, não como texto. Três regras que valem pra tudo aqui:
 *
 * 1. NUNCA emitir dado que não existe. Todo objeto passa por `omitirVazios()`
 *    antes de sair. Campo em branco some — não vira "" nem "não informado".
 *
 * 2. NUNCA emitir dado que não está visível na página. Markup que descreve
 *    coisa que o visitante não vê é a definição de spammy structured markup,
 *    e é causa de ação manual. Por isso `DETALHES_TERRENO_PADRAO` e
 *    `COMERCIOS_PROXIMOS` (site.ts) ficam de fora: são defaults de copy, não
 *    fatos do imóvel.
 *
 * 3. SEM `aggregateRating`. O Google não exibe rich result de avaliação
 *    auto-declarada em LocalBusiness/RealEstateAgent desde 2019, e emitir nota
 *    sem as avaliações visíveis na página é justamente o caso 2. As 66
 *    avaliações continuam valendo onde importa: no Google Business Profile,
 *    ligado a este site pelo `sameAs`.
 */

import { OLX_PERFIL_URL, SITE_URL, telefoneE164 } from "@/lib/config";
import { NEGOCIO, perfisPreenchidos } from "@/lib/content/negocio";
import { CONTATO } from "@/lib/content/site";
import type { TipoImovel, TipoTransacao } from "@/lib/data/filters";
import { resumir } from "@/lib/format";

/** Âncoras estáveis: deixam um nó referenciar o outro sem repetir o objeto. */
const ID_NEGOCIO = `${SITE_URL}/#negocio`;
const ID_SITE = `${SITE_URL}/#website`;

/* ------------------------------------------------------------- utilitário */

/**
 * Remove recursivamente tudo que não descreve nada: string vazia, null,
 * undefined, array vazio e objeto que sobrou só com `@type`.
 *
 * Preserva `0` e `false` de propósito — "0 vagas" é informação, "" não é.
 */
export function omitirVazios<T>(valor: T): T {
  return limpar(valor) as T;
}

function limpar(valor: unknown): unknown {
  if (valor instanceof Date) return valor.toISOString();

  if (Array.isArray(valor)) {
    const itens = valor.map(limpar).filter((item) => item !== undefined);
    return itens.length > 0 ? itens : undefined;
  }

  if (valor !== null && typeof valor === "object") {
    const saida: Record<string, unknown> = {};
    for (const [chave, bruto] of Object.entries(valor)) {
      const limpo = limpar(bruto);
      if (limpo !== undefined) saida[chave] = limpo;
    }
    // Só `@type` sobrando significa um nó sem conteúdo — melhor não emitir.
    const uteis = Object.keys(saida).filter((chave) => chave !== "@type");
    return uteis.length > 0 ? saida : undefined;
  }

  if (typeof valor === "string") {
    const texto = valor.trim();
    return texto.length > 0 ? texto : undefined;
  }

  if (valor === null) return undefined;

  return valor;
}

/** Caminho relativo -> URL absoluta. Structured data não aceita relativo. */
function absoluta(caminho: string): string {
  return caminho.startsWith("http") ? caminho : `${SITE_URL}${caminho}`;
}

/* ---------------------------------------------------------------- negócio */

/**
 * A NF como empresa. Vai no layout do site público, então aparece em qualquer
 * página de entrada — que é o que interessa quando uma LLM chega por um link
 * de ficha em vez da home.
 */
export function negocioJsonLd() {
  const { endereco, geo } = NEGOCIO;
  const streetAddress = [endereco.logradouro, endereco.numero]
    .filter(Boolean)
    .join(", ");

  return omitirVazios({
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": ID_NEGOCIO,
    name: NEGOCIO.nomeExibicao,
    legalName: NEGOCIO.nomeLegal,
    description: `Imobiliária em ${endereco.cidade}/${endereco.estado}. Casas, apartamentos, terrenos e salas comerciais para compra e locação em ${NEGOCIO.areaServed.slice(0, 2).join(" e ")}.`,
    url: SITE_URL,
    logo: absoluta("/icon.png"),
    image: absoluta("/icon.png"),
    telephone: telefoneE164(),
    email: CONTATO.email,
    priceRange: NEGOCIO.faixaPreco,
    currenciesAccepted: "BRL",
    knowsLanguage: "pt-BR",
    // CRECI é o registro profissional do setor — quando preenchido, é o sinal
    // mais forte de legitimidade que dá pra dar em structured data.
    identifier: NEGOCIO.creci,
    taxID: NEGOCIO.cnpj,
    address: {
      "@type": "PostalAddress",
      streetAddress,
      addressLocality: endereco.cidade,
      addressRegion: endereco.estado,
      postalCode: endereco.cep,
      addressCountry: "BR",
    },
    // Só sai se o par estiver completo: latitude solta não localiza nada.
    geo:
      geo.latitude && geo.longitude
        ? {
            "@type": "GeoCoordinates",
            latitude: geo.latitude,
            longitude: geo.longitude,
          }
        : undefined,
    openingHoursSpecification: NEGOCIO.horarios.map((horario) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: horario.dias,
      opens: horario.abre,
      closes: horario.fecha,
    })),
    areaServed: NEGOCIO.areaServed.map((cidade) => ({
      "@type": "City",
      name: cidade,
    })),
    // `sameAs` é o que amarra este site ao Google Business Profile, e é por
    // esse fio que as avaliações chegam sem precisar de aggregateRating aqui.
    sameAs: [...perfisPreenchidos(), OLX_PERFIL_URL],
  });
}

/** O site em si + a caixa de busca, pra quem entende `SearchAction`. */
export function websiteJsonLd() {
  return omitirVazios({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": ID_SITE,
    url: SITE_URL,
    name: NEGOCIO.nomeExibicao,
    inLanguage: "pt-BR",
    publisher: { "@id": ID_NEGOCIO },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/imoveis?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  });
}

/* ------------------------------------------------------------ breadcrumbs */

export type ItemTrilha = { nome: string; url?: string };

/**
 * Espelha a trilha que já é renderizada visualmente nas páginas. O último item
 * vai sem `item` por convenção — é a página atual, não um link.
 */
export function breadcrumbJsonLd(itens: ItemTrilha[]) {
  return omitirVazios({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: itens.map((item, indice) => ({
      "@type": "ListItem",
      position: indice + 1,
      name: item.nome,
      item: item.url ? absoluta(item.url) : undefined,
    })),
  });
}

/* ----------------------------------------------------------------- imóvel */

/**
 * Tipo do banco -> tipo do schema.org.
 *
 * Comercial e terreno caem em `Place` porque o schema.org não tem tipo próprio
 * pra lote nem pra sala comercial — e forçar `House` num terreno seria mentir
 * pro crawler. `Place` aceita endereço, foto e `additionalProperty`, que é tudo
 * que esses casos precisam.
 */
const TIPO_PARA_SCHEMA: Record<TipoImovel, string> = {
  apartamento: "Apartment",
  casa: "House",
  casa_condominio: "House",
  cobertura: "Apartment",
  kitnet_studio: "Apartment",
  sala_comercial: "Place",
  loja: "Place",
  galpao: "Place",
  terreno: "Place",
  chacara_sitio_fazenda: "Place",
  outro: "Place",
};

/** `numberOfBedrooms`, `floorSize` e afins só existem em `Accommodation`. */
const ACOMODACOES = new Set(["Apartment", "House"]);

/**
 * Aceita qualquer objeto com estes campos — `ImovelFicha` do Prisma serve.
 * Estruturado em vez de importado pra não amarrar o schema ao shape do ORM.
 */
type ImovelSchema = {
  slug: string;
  titulo: string;
  descricao: string;
  tipoTransacao: TipoTransacao;
  tipoImovel: TipoImovel;
  precoCentavos: number | null;
  precoSobConsulta: boolean;
  bairro: string | null;
  cidade: string;
  estado: string;
  cep: string | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  areaUtilM2: number | null;
  areaTerrenoM2: number | null;
  anoConstrucao: number | null;
  caracteristicas: string[];
  createdAt: Date;
  fotos: { url: string }[];
};

function medida(nome: string, valor: number | null, unidade?: string) {
  if (valor === null || valor <= 0) return undefined;
  return {
    "@type": "PropertyValue",
    name: nome,
    value: valor,
    unitCode: unidade,
  };
}

export function imovelJsonLd(imovel: ImovelSchema) {
  const url = `${SITE_URL}/imoveis/${imovel.slug}`;
  const tipoSchema = TIPO_PARA_SCHEMA[imovel.tipoImovel] ?? "Place";
  const ehAcomodacao = ACOMODACOES.has(tipoSchema);
  const ehVenda = imovel.tipoTransacao === "venda";

  // "Sob consulta" não tem preço — e Offer sem preço não informa nada, some.
  const preco =
    imovel.precoSobConsulta || !imovel.precoCentavos
      ? null
      : imovel.precoCentavos / 100;

  return omitirVazios({
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `${url}#anuncio`,
    url,
    name: imovel.titulo,
    description: resumir(imovel.descricao, 300),
    datePosted: imovel.createdAt,
    inLanguage: "pt-BR",
    image: imovel.fotos.map((foto) => foto.url),
    provider: { "@id": ID_NEGOCIO },

    about: {
      "@type": tipoSchema,
      name: imovel.titulo,
      address: {
        "@type": "PostalAddress",
        // Sem `streetAddress`: o banco não guarda logradouro do imóvel, e o
        // feed VRSync já declara bairro como granularidade máxima pública
        // (displayAddress="Neighborhood"). O bairro vai em additionalProperty.
        addressLocality: imovel.cidade,
        addressRegion: imovel.estado,
        postalCode: imovel.cep,
        addressCountry: "BR",
      },
      numberOfBedrooms: ehAcomodacao ? (imovel.quartos ?? undefined) : undefined,
      numberOfBathroomsTotal: ehAcomodacao
        ? (imovel.banheiros ?? undefined)
        : undefined,
      yearBuilt: ehAcomodacao ? (imovel.anoConstrucao ?? undefined) : undefined,
      floorSize:
        ehAcomodacao && imovel.areaUtilM2
          ? {
              "@type": "QuantitativeValue",
              value: imovel.areaUtilM2,
              unitCode: "MTK", // metro quadrado, UN/CEFACT
            }
          : undefined,
      amenityFeature: imovel.caracteristicas.map((nome) => ({
        "@type": "LocationFeatureSpecification",
        name: nome,
        value: true,
      })),
      additionalProperty: [
        imovel.bairro
          ? { "@type": "PropertyValue", name: "Bairro", value: imovel.bairro }
          : undefined,
        medida("Área do terreno", imovel.areaTerrenoM2, "MTK"),
        !ehAcomodacao ? medida("Área útil", imovel.areaUtilM2, "MTK") : undefined,
        medida("Suítes", imovel.suites),
        medida("Vagas de garagem", imovel.vagas),
      ],
    },

    offers:
      preco === null
        ? undefined
        : {
            "@type": "Offer",
            url,
            priceCurrency: "BRL",
            availability: "https://schema.org/InStock",
            businessFunction: ehVenda
              ? "http://purl.org/goodrelations/v1#Sell"
              : "http://purl.org/goodrelations/v1#LeaseOut",
            seller: { "@id": ID_NEGOCIO },
            // Aluguel precisa dizer "por mês", senão R$ 3.000 lê como preço
            // de venda. MON é o código UN/CEFACT de mês.
            ...(ehVenda
              ? { price: preco }
              : {
                  priceSpecification: {
                    "@type": "UnitPriceSpecification",
                    price: preco,
                    priceCurrency: "BRL",
                    referenceQuantity: {
                      "@type": "QuantitativeValue",
                      value: 1,
                      unitCode: "MON",
                    },
                  },
                }),
          },
  });
}
