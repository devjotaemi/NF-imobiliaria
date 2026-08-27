import { SITE_URL } from "@/lib/config";
import type {
  PropertyTypeVRSync,
  UsageTypeVRSync,
  VRSyncFeedProperty,
} from "@/lib/vrsync/types";

/**
 * Cola entre o nosso banco e o formato do feed.
 *
 * Os valores de PropertyType são fechados pelo padrão VRSync — não dá pra
 * inventar. Ver lib/vrsync/types.ts para a lista completa aceita.
 */

const TIPO_PARA_VRSYNC: Record<string, PropertyTypeVRSync> = {
  apartamento: "Residential / Apartment",
  casa: "Residential / Home",
  casa_condominio: "Residential / Condo",
  cobertura: "Residential / Penthouse",
  kitnet_studio: "Residential / Kitnet",
  sala_comercial: "Commercial / Office",
  loja: "Commercial / Loja",
  galpao: "Commercial / Industrial",
  terreno: "Residential / Land Lot",
  chacara_sitio_fazenda: "Residential / Farm Ranch",
  outro: "Residential / Home",
};

const TIPOS_COMERCIAIS = new Set(["sala_comercial", "loja", "galpao"]);

/**
 * O <State> leva a sigla no atributo e o nome por extenso no texto.
 * Guardamos só a sigla, então precisamos deste mapa.
 */
const NOME_DO_ESTADO: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapa",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceara",
  DF: "Distrito Federal",
  ES: "Espirito Santo",
  GO: "Goias",
  MA: "Maranhao",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Para",
  PB: "Paraiba",
  PR: "Parana",
  PE: "Pernambuco",
  PI: "Piaui",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondonia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "Sao Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

type ImovelComFotos = {
  referenceCode: string;
  slug: string;
  titulo: string;
  descricao: string;
  tipoTransacao: string;
  tipoImovel: string;
  precoCentavos: number | null;
  condominioCentavos: number | null;
  iptuCentavos: number | null;
  iptuPeriodo: string | null;
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
  andar: number | null;
  totalAndares: number | null;
  torres: number | null;
  anoConstrucao: number | null;
  caracteristicas: string[];
  garantiasAceitas: string[];
  fotos: { url: string; altText: string | null }[];
};

/** Centavos -> reais inteiros (VRSync não aceita decimal). */
function paraReais(centavos: number | null): number | undefined {
  if (centavos === null || centavos <= 0) return undefined;
  return Math.round(centavos / 100);
}

function opcional(valor: number | null): number | undefined {
  return valor === null || valor <= 0 ? undefined : valor;
}

export function mapearParaVRSync(imovel: ImovelComFotos): VRSyncFeedProperty {
  const venda = imovel.tipoTransacao === "venda";
  const preco = paraReais(imovel.precoCentavos);
  const uf = imovel.estado.toUpperCase();

  const usageType: UsageTypeVRSync = TIPOS_COMERCIAIS.has(imovel.tipoImovel)
    ? "Commercial"
    : "Residential";

  // Terreno comercial tem valor próprio no padrão.
  const propertyType: PropertyTypeVRSync =
    imovel.tipoImovel === "terreno" && usageType === "Commercial"
      ? "Commercial / Land Lot"
      : (TIPO_PARA_VRSYNC[imovel.tipoImovel] ?? "Residential / Home");

  return {
    listingId: imovel.referenceCode,
    title: imovel.titulo,
    // Sempre o nosso domínio. Mandar o tráfego do feed pra outro portal seria
    // repetir exatamente o erro que o conselho barrou.
    detailViewUrl: `${SITE_URL}/imoveis/${imovel.slug}`,

    transactionType: venda ? "For Sale" : "For Rent",
    propertyType,
    usageType,

    description: imovel.descricao,

    listPrice: venda ? preco : undefined,
    rentalPrice: venda ? undefined : preco,
    propertyAdministrationFee: paraReais(imovel.condominioCentavos),
    iptu: paraReais(imovel.iptuCentavos),
    iptuPeriod:
      imovel.iptuCentavos === null
        ? undefined
        : imovel.iptuPeriodo === "anual"
          ? "Yearly"
          : "Monthly",

    livingAreaM2: opcional(imovel.areaUtilM2),
    lotAreaM2: opcional(imovel.areaTerrenoM2),

    bedrooms: opcional(imovel.quartos),
    bathrooms: opcional(imovel.banheiros),
    suites: opcional(imovel.suites),
    parkingSpaces: opcional(imovel.vagas),

    unitFloor: opcional(imovel.andar),
    floors: opcional(imovel.totalAndares),
    buildings: opcional(imovel.torres),
    yearBuilt: opcional(imovel.anoConstrucao),

    address: {
      neighborhood: imovel.bairro ?? undefined,
      city: imovel.cidade,
      stateAbbreviation: uf,
      stateName: NOME_DO_ESTADO[uf] ?? uf,
      postalCode: imovel.cep ?? undefined,
    },

    features: imovel.caracteristicas,
    warranties: venda ? [] : imovel.garantiasAceitas,

    photos: imovel.fotos.map((foto, indice) => ({
      url: foto.url,
      caption: foto.altText ?? undefined,
      primary: indice === 0,
    })),
  };
}
