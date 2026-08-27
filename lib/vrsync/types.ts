/**
 * Formato intermediário do feed VRSync.
 *
 * Existe pra separar duas coisas que mudam por motivos diferentes:
 *  - o nosso modelo de dados (muda quando o negócio muda);
 *  - o formato exigido pelo portal (muda quando o portal muda).
 *
 * Referência: https://developers.grupozap.com/feeds/vrsync/
 */

/** Valores aceitos em <PropertyType>. Formato "Categoria / Tipo". */
export type PropertyTypeVRSync =
  | "Residential / Apartment"
  | "Residential / Home"
  | "Residential / Condo"
  | "Residential / Village House"
  | "Residential / Farm Ranch"
  | "Residential / Penthouse"
  | "Residential / Flat"
  | "Residential / Kitnet"
  | "Residential / Studio"
  | "Residential / Loft"
  | "Residential / Sobrado"
  | "Residential / Agricultural"
  | "Residential / Land Lot"
  | "Commercial / Consultorio"
  | "Commercial / Industrial"
  | "Commercial / Building"
  | "Commercial / Garage"
  | "Commercial / Hotel"
  | "Commercial / Loja"
  | "Commercial / Land Lot"
  | "Commercial / Business"
  | "Commercial / Corporate Floor"
  | "Commercial / Office";

export type UsageTypeVRSync =
  | "Residential"
  | "Commercial"
  | "Residential / Commercial";

export type VRSyncFeedProperty = {
  listingId: string;
  title: string;
  /** URL da ficha NO NOSSO domínio — nunca aponta pra portal parceiro. */
  detailViewUrl: string;

  transactionType: "For Sale" | "For Rent";
  propertyType: PropertyTypeVRSync;
  usageType: UsageTypeVRSync;

  description: string;

  /** Em reais inteiros — VRSync não aceita decimal. */
  listPrice?: number;
  rentalPrice?: number;
  propertyAdministrationFee?: number;
  iptu?: number;
  iptuPeriod?: "Monthly" | "Yearly";

  livingAreaM2?: number;
  lotAreaM2?: number;

  bedrooms?: number;
  bathrooms?: number;
  suites?: number;
  parkingSpaces?: number;

  unitFloor?: number;
  floors?: number;
  buildings?: number;
  yearBuilt?: number;

  address: {
    neighborhood?: string;
    city: string;
    /** Sigla, vira o atributo abbreviation. */
    stateAbbreviation: string;
    /** Nome por extenso, vira o texto do elemento. */
    stateName: string;
    postalCode?: string;
  };

  features: string[];
  warranties: string[];

  photos: { url: string; caption?: string; primary: boolean }[];
};

/** Contato do anunciante — vai no <ContactInfo> de cada anúncio. */
export type ContatoAnunciante = {
  name: string;
  email: string;
  telephone: string;
};

/** Cabeçalho do arquivo — quem gerou o feed. */
export type CabecalhoFeed = {
  provider: string;
  email: string;
  contactName: string;
  telephone: string;
};
