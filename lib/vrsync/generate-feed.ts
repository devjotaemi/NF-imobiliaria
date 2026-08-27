import type {
  CabecalhoFeed,
  ContatoAnunciante,
  VRSyncFeedProperty,
} from "@/lib/vrsync/types";

/**
 * Gerador do feed VRSync (padrão Grupo OLX / VivaReal / ZAP).
 *
 * O Diário Imóveis (Classitudo / Diário da Região) não tem formato próprio —
 * lê este padrão de mercado. Portanto a fonte da verdade é a documentação
 * oficial do Grupo OLX:
 *   https://developers.grupozap.com/feeds/vrsync/examples.html
 *   https://developers.grupozap.com/feeds/vrsync/elements/details.html
 *
 * ⚠ A ORDEM DOS ELEMENTOS IMPORTA. O XSD declara `sequence`, então um elemento
 * fora de posição reprova o arquivo inteiro mesmo com XML bem-formado. A ordem
 * abaixo segue o exemplo oficial — não reordene por estética.
 *
 * Ordem dentro de <Listing>:
 *   ListingID, Title, TransactionType, PublicationType, DetailViewUrl,
 *   Media, Details, Location, ContactInfo
 */

const NAMESPACE = "http://www.vivareal.com/schemas/1.0/VRSync";
const XSI = "http://www.w3.org/2001/XMLSchema-instance";
const SCHEMA_LOCATION = `${NAMESPACE} http://xml.vivareal.com/vrsync.xsd`;

export function gerarFeedVRSync(
  imoveis: VRSyncFeedProperty[],
  cabecalho: CabecalhoFeed,
  contato: ContatoAnunciante,
): string {
  const listings = imoveis
    .map((imovel) => montarListing(imovel, contato))
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed xmlns="${NAMESPACE}" xmlns:xsi="${XSI}" xsi:schemaLocation="${SCHEMA_LOCATION}">
  <Header>
    <Provider>${esc(cabecalho.provider)}</Provider>
    <Email>${esc(cabecalho.email)}</Email>
    <ContactName>${esc(cabecalho.contactName)}</ContactName>
    <PublishDate>${dataPublicacao()}</PublishDate>
    <Telephone>${esc(cabecalho.telephone)}</Telephone>
  </Header>
  <Listings>
${listings}
  </Listings>
</ListingDataFeed>`;
}

function montarListing(
  imovel: VRSyncFeedProperty,
  contato: ContatoAnunciante,
): string {
  const l: string[] = [];

  l.push(`    <Listing>`);
  l.push(`      <ListingID>${esc(imovel.listingId)}</ListingID>`);
  l.push(`      <Title>${esc(imovel.title)}</Title>`);
  l.push(`      <TransactionType>${imovel.transactionType}</TransactionType>`);
  l.push(`      <PublicationType>STANDARD</PublicationType>`);
  l.push(`      <DetailViewUrl>${esc(imovel.detailViewUrl)}</DetailViewUrl>`);

  // Media vem ANTES de Details no schema.
  if (imovel.photos.length > 0) {
    l.push(`      <Media>`);
    for (const foto of imovel.photos) {
      const caption = foto.caption ? ` caption="${esc(foto.caption)}"` : "";
      const primary = foto.primary ? ` primary="true"` : "";
      l.push(
        `        <Item medium="image"${caption}${primary}>${esc(foto.url)}</Item>`,
      );
    }
    l.push(`      </Media>`);
  }

  l.push(`      <Details>`);
  l.push(`        <UsageType>${imovel.usageType}</UsageType>`);
  l.push(`        <PropertyType>${imovel.propertyType}</PropertyType>`);
  // CDATA: descrição é texto livre digitado pelo corretor.
  l.push(
    `        <Description><![CDATA[${limparCdata(imovel.description)}]]></Description>`,
  );

  // Ordem copiada do exemplo oficial:
  //   ListPrice -> LotArea -> LivingArea -> PropertyAdministrationFee -> cômodos
  // Os elementos que o exemplo não mostra (RentalPrice, Iptu, Suites, andares,
  // YearBuilt, Warranties) ficam junto dos irmãos semânticos.
  dinheiro(l, "ListPrice", imovel.listPrice);
  dinheiro(l, "RentalPrice", imovel.rentalPrice);
  if (imovel.iptu !== undefined) {
    l.push(
      `        <Iptu currency="BRL" period="${imovel.iptuPeriod ?? "Monthly"}">${imovel.iptu}</Iptu>`,
    );
  }

  area(l, "LotArea", imovel.lotAreaM2);
  area(l, "LivingArea", imovel.livingAreaM2);

  dinheiro(l, "PropertyAdministrationFee", imovel.propertyAdministrationFee);

  numero(l, "Bedrooms", imovel.bedrooms);
  numero(l, "Bathrooms", imovel.bathrooms);
  numero(l, "Suites", imovel.suites);

  if (imovel.parkingSpaces !== undefined) {
    l.push(
      `        <Garage type="Parking Space">${imovel.parkingSpaces}</Garage>`,
    );
  }

  numero(l, "UnitFloor", imovel.unitFloor);
  numero(l, "Floors", imovel.floors);
  numero(l, "Buildings", imovel.buildings);
  numero(l, "YearBuilt", imovel.yearBuilt);

  if (imovel.features.length > 0) {
    l.push(`        <Features>`);
    for (const item of imovel.features) {
      l.push(`          <Feature>${esc(item)}</Feature>`);
    }
    l.push(`        </Features>`);
  }

  if (imovel.warranties.length > 0) {
    l.push(`        <Warranties>`);
    for (const item of imovel.warranties) {
      l.push(`          <Warranty>${esc(item)}</Warranty>`);
    }
    l.push(`        </Warranties>`);
  }

  l.push(`      </Details>`);

  l.push(`      <Location displayAddress="Neighborhood">`);
  l.push(`        <Country abbreviation="BR">Brasil</Country>`);
  l.push(
    `        <State abbreviation="${esc(imovel.address.stateAbbreviation)}">${esc(imovel.address.stateName)}</State>`,
  );
  l.push(`        <City>${esc(imovel.address.city)}</City>`);
  if (imovel.address.neighborhood) {
    l.push(
      `        <Neighborhood>${esc(imovel.address.neighborhood)}</Neighborhood>`,
    );
  }
  if (imovel.address.postalCode) {
    l.push(`        <PostalCode>${esc(imovel.address.postalCode)}</PostalCode>`);
  }
  l.push(`      </Location>`);

  l.push(`      <ContactInfo>`);
  l.push(`        <Name>${esc(contato.name)}</Name>`);
  l.push(`        <Email>${esc(contato.email)}</Email>`);
  l.push(`        <Telephone>${esc(contato.telephone)}</Telephone>`);
  l.push(`      </ContactInfo>`);

  l.push(`    </Listing>`);

  return l.join("\n");
}

/** Valores monetários: inteiro + currency="BRL" obrigatório. */
function dinheiro(linhas: string[], tag: string, valor: number | undefined) {
  if (valor === undefined) return;
  linhas.push(`        <${tag} currency="BRL">${valor}</${tag}>`);
}

/** Áreas: inteiro + unit="square metres" obrigatório. */
function area(linhas: string[], tag: string, valor: number | undefined) {
  if (valor === undefined) return;
  linhas.push(`        <${tag} unit="square metres">${valor}</${tag}>`);
}

function numero(linhas: string[], tag: string, valor: number | undefined) {
  if (valor === undefined) return;
  linhas.push(`        <${tag}>${valor}</${tag}>`);
}

/** O exemplo oficial usa data local sem milissegundos e sem sufixo Z. */
function dataPublicacao(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "");
}

/** Escapa os caracteres que quebrariam o XML. */
function esc(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Divide o CDATA sem mudar o texto que o leitor de XML recebe. */
function limparCdata(valor: string): string {
  return valor.replace(/\]\]>/g, "]]]]><![CDATA[>");
}
