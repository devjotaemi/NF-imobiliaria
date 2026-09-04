/**
 * Verificação da lógica pura (sem banco).
 */
import "dotenv/config";
import assert from "node:assert/strict";

import { XMLParser, XMLValidator } from "fast-xml-parser";

import {
  atribuicaoDaUrl,
  desserializarAtribuicao,
  serializarAtribuicao,
} from "@/lib/attribution";
import {
  conferirSenha,
  criarTokenSessao,
  hashSenha,
  lerTokenSessao,
} from "@/lib/auth/session";
import {
  brlParaCentavos,
  centavosParaInput,
  escaparCsv,
  formatarBRL,
  gerarSlug,
  precoExibicao,
} from "@/lib/format";
import { parseFiltros, serializarFiltros } from "@/lib/data/filters";
import {
  desambiguarTitulos,
  encontrarTelefones,
  mapearAnuncio,
  mapearTransacao,
} from "@/lib/diario/mapear";
import { lerOpcoesImportacao } from "@/lib/diario/options";
import { EsquemaImovel } from "@/lib/validation/property";
import { mesParaData } from "@/lib/metrics-month";
import { gerarFeedVRSync } from "@/lib/vrsync/generate-feed";
import type { VRSyncFeedProperty } from "@/lib/vrsync/types";

let passou = 0;
const falhas: string[] = [];

function teste(nome: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passou++;
    })
    .catch((erro) => {
      falhas.push(`${nome}: ${erro instanceof Error ? erro.message : erro}`);
    });
}

async function main() {
  // ---------------------------------------------------------------- slug
  await teste("slug tira acento e pontuação", () => {
    assert.equal(
      gerarSlug("Apartamento 3 Quartos — Jardim Paulista, São Paulo!"),
      "apartamento-3-quartos-jardim-paulista-sao-paulo",
    );
  });

  await teste("slug não deixa hífen sobrando nas pontas", () => {
    assert.equal(gerarSlug("  --- Casa ---  "), "casa");
  });

  // ------------------------------------------------------------- dinheiro
  await teste("preço em formato pt-BR vira centavos", () => {
    assert.equal(brlParaCentavos("450.000"), 45_000_000);
    assert.equal(brlParaCentavos("450.000,00"), 45_000_000);
    assert.equal(brlParaCentavos("R$ 1.234,56"), 123_456);
    assert.equal(brlParaCentavos("2500"), 250_000);
    assert.equal(brlParaCentavos(""), null);
    assert.equal(brlParaCentavos("abc"), null);
  });

  await teste("dinheiro malformado não vira preço válido", () => {
    assert.equal(brlParaCentavos("-5"), null);
    assert.equal(brlParaCentavos("abc45"), null);
    assert.equal(brlParaCentavos("1,234"), null);
    assert.equal(brlParaCentavos("1.000.000.000"), null);
  });

  await teste("CSV preserva aspas e neutraliza fórmulas", () => {
    assert.equal(escaparCsv('Casa "Azul"'), '"Casa ""Azul"""');
    assert.equal(escaparCsv("=1+1"), '"\'=1+1"');
    assert.equal(escaparCsv("  @SUM(1)"), '"\'  @SUM(1)"');
  });

  await teste("mês de métricas aceita só ano e mês válidos", () => {
    assert.equal(mesParaData("2026-09")?.toISOString(), "2026-09-01T00:00:00.000Z");
    assert.equal(mesParaData("2026-13"), null);
    assert.equal(mesParaData("2026-00"), null);
    assert.equal(mesParaData("2026-9"), null);
  });

  await teste("filtros ignoram números inválidos e preservam os válidos", () => {
    const invalidos = parseFiltros({ quartos: "-3", precoMin: "R$500", pagina: "2abc" });
    assert.equal(invalidos.quartos, null);
    assert.equal(invalidos.precoMin, null);
    assert.equal(invalidos.pagina, 1);

    const validos = parseFiltros({ quartos: "3", precoMin: "500000", pagina: "2" });
    assert.equal(validos.quartos, 3);
    assert.equal(validos.precoMin, 500000);
    assert.equal(validos.pagina, 2);
    assert.match(serializarFiltros(validos), /quartos=3/);
  });

  await teste("centavos voltam pro input sem perder valor", () => {
    assert.equal(brlParaCentavos(centavosParaInput(45_000_000)), 45_000_000);
    assert.equal(brlParaCentavos(centavosParaInput(123_456)), 123_456);
  });

  await teste("sob consulta ignora o preço", () => {
    assert.equal(
      precoExibicao({ precoCentavos: 45_000_000, precoSobConsulta: true }),
      "Sob consulta",
    );
    assert.match(
      precoExibicao({ precoCentavos: 45_000_000, precoSobConsulta: false }),
      /450\.000/,
    );
    assert.equal(formatarBRL(null), "");
  });

  // ----------------------------------------------------------- atribuição
  await teste("gclid sozinho já marca tráfego pago", () => {
    const attr = atribuicaoDaUrl(new URLSearchParams("gclid=ABC123"));
    assert.ok(attr);
    assert.equal(attr.pago, true);
  });

  await teste("utm_medium=cpc marca tráfego pago", () => {
    const attr = atribuicaoDaUrl(
      new URLSearchParams("utm_source=meta&utm_medium=cpc&utm_campaign=jan"),
    );
    assert.ok(attr);
    assert.equal(attr.pago, true);
    assert.equal(attr.utmCampaign, "jan");
  });

  await teste("newsletter orgânica NÃO é tráfego pago", () => {
    const attr = atribuicaoDaUrl(
      new URLSearchParams("utm_source=news&utm_medium=email"),
    );
    assert.ok(attr);
    assert.equal(attr.pago, false);
  });

  await teste("URL sem sinal de campanha devolve null (não apaga o cookie)", () => {
    assert.equal(atribuicaoDaUrl(new URLSearchParams("pagina=2")), null);
    assert.equal(atribuicaoDaUrl(new URLSearchParams("")), null);
  });

  await teste("atribuição sobrevive ao round-trip do cookie", () => {
    const original = atribuicaoDaUrl(
      new URLSearchParams("utm_source=meta&utm_medium=cpc&utm_campaign=jan"),
    );
    assert.ok(original);
    const voltou = desserializarAtribuicao(serializarAtribuicao(original));
    assert.deepEqual(voltou.utmCampaign, "jan");
    assert.equal(voltou.pago, true);
  });

  await teste("cookie corrompido não derruba o site", () => {
    const vazio = desserializarAtribuicao("lixo-que-nao-e-base64!!");
    assert.equal(vazio.pago, false);
    assert.equal(desserializarAtribuicao(undefined).pago, false);
  });

  await teste("cookie forjado não consegue se declarar pago com lixo", () => {
    const forjado = Buffer.from(JSON.stringify({ pago: "sim" })).toString(
      "base64url",
    );
    // pago só é true quando é exatamente o booleano true
    assert.equal(desserializarAtribuicao(forjado).pago, false);
  });

  // -------------------------------------------------------------- sessão
  await teste("token de sessão válido devolve o id do usuário", () => {
    const token = criarTokenSessao("usuario-123");
    assert.equal(lerTokenSessao(token), "usuario-123");
  });

  await teste("token com assinatura adulterada é rejeitado", () => {
    const token = criarTokenSessao("usuario-123");
    const [corpo] = token.split(".");
    assert.equal(lerTokenSessao(`${corpo}.assinaturaFalsa`), null);
  });

  await teste("payload adulterado é rejeitado (troca de usuário)", () => {
    const token = criarTokenSessao("usuario-123");
    const assinatura = token.split(".")[1];
    const payloadFalso = Buffer.from(
      JSON.stringify({ sub: "admin", exp: Math.floor(Date.now() / 1000) + 999 }),
    ).toString("base64url");
    assert.equal(lerTokenSessao(`${payloadFalso}.${assinatura}`), null);
  });

  await teste("token malformado ou ausente é rejeitado", () => {
    assert.equal(lerTokenSessao(undefined), null);
    assert.equal(lerTokenSessao(""), null);
    assert.equal(lerTokenSessao("semponto"), null);
  });

  // --------------------------------------------------------------- senha
  await teste("senha correta confere e senha errada não", async () => {
    const hash = await hashSenha("umaSenhaBemLonga123");
    assert.equal(await conferirSenha("umaSenhaBemLonga123", hash), true);
    assert.equal(await conferirSenha("outraCoisa", hash), false);
  });

  await teste("hashes da mesma senha são diferentes (salt aleatório)", async () => {
    const a = await hashSenha("mesmaSenha123");
    const b = await hashSenha("mesmaSenha123");
    assert.notEqual(a, b);
    assert.equal(await conferirSenha("mesmaSenha123", a), true);
    assert.equal(await conferirSenha("mesmaSenha123", b), true);
  });

  await teste("hash em formato inesperado não passa", async () => {
    assert.equal(await conferirSenha("x", "formato-invalido"), false);
    assert.equal(await conferirSenha("x", "md5$aa$bb"), false);
  });

  // ---------------------------------------------------------- validação
  await teste("imóvel válido passa e converte tipos", () => {
    const entrada = {
      titulo: "Apartamento 3 quartos",
      descricao: "d".repeat(60),
      tipoTransacao: "venda",
      tipoImovel: "apartamento",
      preco: "450.000",
      precoSobConsulta: null,
      condominio: "",
      iptu: "",
      iptuPeriodo: "mensal",
      bairro: "Centro",
      cidade: "Campinas",
      estado: "sp",
      cep: "",
      quartos: "3",
      suites: "",
      banheiros: "2",
      vagas: "",
      areaUtilM2: "80",
      areaTerrenoM2: "",
      andar: "",
      totalAndares: "",
      torres: "",
      anoConstrucao: "",
      caracteristicas: "piscina\nportaria 24h\n\npiscina",
      garantiasAceitas: "",
      destaque: "on",
      ativo: "on",
    };
    const resultado = EsquemaImovel.safeParse(entrada);

    assert.ok(resultado.success, JSON.stringify(resultado.error?.issues));
    const dados = resultado.data;
    assert.equal(dados.preco, 45_000_000);
    assert.equal(dados.estado, "SP", "UF deve virar maiúscula");
    assert.equal(dados.quartos, 3);
    assert.equal(dados.suites, null, "campo vazio deve virar null");
    assert.equal(dados.destaque, true);
    assert.deepEqual(
      dados.caracteristicas,
      ["piscina", "portaria 24h"],
      "deve remover vazios e duplicatas",
    );
    assert.equal(EsquemaImovel.safeParse({ ...entrada, preco: "abc45" }).success, false);
    assert.equal(EsquemaImovel.safeParse({ ...entrada, quartos: "1e2" }).success, false);
  });

  await teste("descrição curta demais é barrada (exigência do feed)", () => {
    const resultado = EsquemaImovel.safeParse({
      titulo: "Casa boa",
      descricao: "curta",
      tipoTransacao: "venda",
      tipoImovel: "casa",
      preco: "",
      precoSobConsulta: null,
      condominio: "",
      iptu: "",
      iptuPeriodo: "mensal",
      bairro: "",
      cidade: "Campinas",
      estado: "SP",
      cep: "",
      quartos: "",
      suites: "",
      banheiros: "",
      vagas: "",
      areaUtilM2: "",
      areaTerrenoM2: "",
      andar: "",
      totalAndares: "",
      torres: "",
      anoConstrucao: "",
      caracteristicas: "",
      garantiasAceitas: "",
      destaque: null,
      ativo: "on",
    });
    assert.equal(resultado.success, false);
  });

  await teste("UF com mais de 2 letras é barrada", () => {
    const base = {
      titulo: "Casa boa demais",
      descricao: "d".repeat(60),
      tipoTransacao: "venda",
      tipoImovel: "casa",
      preco: "",
      precoSobConsulta: null,
      condominio: "",
      iptu: "",
      iptuPeriodo: "mensal",
      bairro: "",
      cidade: "Campinas",
      estado: "São Paulo",
      cep: "",
      quartos: "",
      suites: "",
      banheiros: "",
      vagas: "",
      areaUtilM2: "",
      areaTerrenoM2: "",
      andar: "",
      totalAndares: "",
      torres: "",
      anoConstrucao: "",
      caracteristicas: "",
      garantiasAceitas: "",
      destaque: null,
      ativo: "on",
    };
    assert.equal(EsquemaImovel.safeParse(base).success, false);
  });

  // -------------------------------------------------------------- VRSync
  const imovelFeed: VRSyncFeedProperty = {
    listingId: "NF-0001",
    title: 'Casa "Bela" & Ampla <Centro>',
    detailViewUrl: "https://nfnegocios.com.br/imoveis/casa-bela?a=1&b=2",
    transactionType: "For Sale",
    propertyType: "Residential / Home",
    usageType: "Residential",
    description: "Linha 1\nLinha 2 com & e <tag> e ]]> tentando fechar CDATA",
    listPrice: 450_000,
    propertyAdministrationFee: 980,
    iptu: 1_200,
    iptuPeriod: "Yearly",
    livingAreaM2: 120,
    lotAreaM2: 200,
    bedrooms: 3,
    bathrooms: 2,
    suites: 1,
    parkingSpaces: 2,
    address: {
      neighborhood: "Centro & Adjacências",
      city: "Campinas",
      stateAbbreviation: "SP",
      stateName: "Sao Paulo",
      postalCode: "13000-000",
    },
    features: ["Piscina", "Churrasqueira & Forno"],
    warranties: [],
    photos: [
      { url: "https://blob.example.com/a.jpg?w=1&h=2", primary: true },
      { url: "https://blob.example.com/b.jpg", caption: 'Sala "grande"', primary: false },
    ],
  };

  const CABECALHO = {
    provider: "NF Negócios",
    email: "contato@nf.com.br",
    contactName: "NF",
    telephone: "17 99105-1696",
  };
  const CONTATO = {
    name: "NF Negócios",
    email: "contato@nf.com.br",
    telephone: "17 99105-1696",
  };

  const xml = gerarFeedVRSync([imovelFeed], CABECALHO, CONTATO);

  await teste("feed VRSync é XML bem-formado", () => {
    const resultado = XMLValidator.validate(xml);
    assert.equal(
      resultado,
      true,
      typeof resultado === "object" ? JSON.stringify(resultado.err) : "inválido",
    );
  });

  await teste("root declara namespace e schemaLocation do VRSync", () => {
    assert.ok(
      xml.includes('xmlns="http://www.vivareal.com/schemas/1.0/VRSync"'),
      "namespace VRSync obrigatório",
    );
    assert.ok(xml.includes("xsi:schemaLocation="), "schemaLocation obrigatório");
  });

  await teste("Header tem Provider/Email/ContactName/PublishDate/Telephone", () => {
    for (const tag of [
      "Provider",
      "Email",
      "ContactName",
      "PublishDate",
      "Telephone",
    ]) {
      assert.ok(xml.includes(`<${tag}>`), `Header sem <${tag}>`);
    }
  });

  await teste("PublishDate sem milissegundos e sem sufixo Z", () => {
    const data = xml.match(/<PublishDate>([^<]+)<\/PublishDate>/)?.[1] ?? "";
    assert.match(
      data,
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/,
      `formato inesperado: ${data}`,
    );
  });

  // A ordem é o que realmente reprova no XSD (sequence), então é o que testamos.
  await teste("ordem dentro de <Listing> segue o schema", () => {
    const posicoes = [
      "<ListingID>",
      "<Title>",
      "<TransactionType>",
      "<PublicationType>",
      "<DetailViewUrl>",
      "<Media>",
      "<Details>",
      "<Location ",
      "<ContactInfo>",
    ].map((tag) => {
      const indice = xml.indexOf(tag);
      assert.notEqual(indice, -1, `faltou ${tag}`);
      return { tag, indice };
    });

    for (let i = 1; i < posicoes.length; i++) {
      assert.ok(
        posicoes[i].indice > posicoes[i - 1].indice,
        `${posicoes[i].tag} deveria vir depois de ${posicoes[i - 1].tag}`,
      );
    }
  });

  await teste("Media vem antes de Details (erro clássico)", () => {
    assert.ok(
      xml.indexOf("<Media>") < xml.indexOf("<Details>"),
      "Media tem que preceder Details",
    );
  });

  await teste("UsageType vem antes de PropertyType", () => {
    assert.ok(xml.indexOf("<UsageType>") < xml.indexOf("<PropertyType>"));
  });

  await teste("ordem dentro de <Details> segue o exemplo oficial", () => {
    const esperada = [
      "<UsageType>",
      "<PropertyType>",
      "<Description>",
      "<ListPrice",
      "<LotArea",
      "<LivingArea",
      "<PropertyAdministrationFee",
      "<Bedrooms>",
      "<Bathrooms>",
      "<Garage ",
      "<Features>",
    ].map((tag) => {
      const indice = xml.indexOf(tag);
      assert.notEqual(indice, -1, `faltou ${tag}`);
      return { tag, indice };
    });

    for (let i = 1; i < esperada.length; i++) {
      assert.ok(
        esperada[i].indice > esperada[i - 1].indice,
        `${esperada[i].tag} deveria vir depois de ${esperada[i - 1].tag}`,
      );
    }
  });

  await teste("PropertyType usa valor do vocabulário oficial", () => {
    const valor = xml.match(/<PropertyType>([^<]+)<\/PropertyType>/)?.[1] ?? "";
    assert.match(
      valor,
      /^(Residential|Commercial) \/ .+/,
      `PropertyType inválido: "${valor}"`,
    );
  });

  await teste("valores monetários levam currency=\"BRL\"", () => {
    for (const tag of ["ListPrice", "PropertyAdministrationFee", "Iptu"]) {
      const trecho = xml.match(new RegExp(`<${tag}[^>]*>`))?.[0] ?? "";
      assert.ok(
        trecho.includes('currency="BRL"'),
        `<${tag}> sem currency="BRL": ${trecho}`,
      );
    }
  });

  await teste("Iptu carrega o período", () => {
    assert.ok(xml.includes('period="Yearly"'));
  });

  await teste("áreas levam unit=\"square metres\"", () => {
    for (const tag of ["LivingArea", "LotArea"]) {
      const trecho = xml.match(new RegExp(`<${tag}[^>]*>`))?.[0] ?? "";
      assert.ok(
        trecho.includes('unit="square metres"'),
        `<${tag}> sem unit: ${trecho}`,
      );
    }
  });

  await teste("State leva sigla no atributo e nome por extenso no texto", () => {
    assert.ok(
      xml.includes('<State abbreviation="SP">Sao Paulo</State>'),
      "State fora do formato do schema",
    );
  });

  await teste("ContactInfo do anunciante está presente", () => {
    assert.ok(xml.includes("<ContactInfo>"));
    assert.ok(xml.includes("<Name>NF Negócios</Name>"));
  });

  await teste("feed escapa caracteres perigosos e preserva os dados", () => {
    const parser = new XMLParser({ ignoreAttributes: false, cdataPropName: "cdata" });
    const arvore = parser.parse(xml);
    const listing = arvore.ListingDataFeed.Listings.Listing;

    assert.equal(listing.ListingID, "NF-0001");
    assert.equal(
      listing.Title,
      'Casa "Bela" & Ampla <Centro>',
      "título deve voltar idêntico depois do escape",
    );
    assert.equal(
      listing.DetailViewUrl,
      "https://nfnegocios.com.br/imoveis/casa-bela?a=1&b=2",
      "URL com & deve sobreviver",
    );
    assert.equal(listing.Details.ListPrice["#text"], 450000);
    assert.equal(listing.Details.Bedrooms, 3);
    assert.equal(listing.Location.City, "Campinas");
    assert.equal(listing.Location.Neighborhood, "Centro & Adjacências");
  });

  await teste("CDATA da descrição não é quebrado por ']]>' no texto", () => {
    const parser = new XMLParser();
    const descricao = parser.parse(xml).ListingDataFeed.Listings.Listing.Details.Description;
    assert.equal(descricao, imovelFeed.description);
    assert.ok(xml.includes("]]]]><![CDATA[>"));
  });

  await teste("aluguel usa RentalPrice, não ListPrice", () => {
    const xmlAluguel = gerarFeedVRSync(
      [
        {
          ...imovelFeed,
          transactionType: "For Rent",
          listPrice: undefined,
          rentalPrice: 3_500,
        },
      ],
      CABECALHO,
      CONTATO,
    );
    assert.ok(
      xmlAluguel.includes('<RentalPrice currency="BRL">3500</RentalPrice>'),
    );
    assert.ok(!xmlAluguel.includes("<ListPrice"));
  });

  await teste("feed vazio ainda é XML válido", () => {
    const vazio = gerarFeedVRSync([], CABECALHO, CONTATO);
    assert.equal(XMLValidator.validate(vazio), true);
  });

  // ------------------------------------------- importação do Diário Imóveis
  const anuncioBase = {
    id: "abc",
    code: "X1",
    clientId: "nf",
    propertyType: "Casa",
    transactionType: "For Sale",
    isActive: true,
    details: {
      title: "Casa à venda, 120m²",
      description: "d".repeat(200),
      listPrice: 450_000,
      rentalPrice: 0,
      area: 120,
      bedroom: 3,
      bathroom: 2,
      garage: 2,
      suites: 1,
      yearlyTax: 1_200,
      propertyAdministrationFee: 0,
    },
    location: { city: "Mirassol", state: "sp", neighborhood: "Jardim Laguna" },
    gallery: [
      { id: "f2", url: "https://s3/2.webp", position: 1 },
      { id: "f1", url: "https://s3/1.webp", position: 0 },
    ],
  };

  await teste("venda lê listPrice e ignora rentalPrice", () => {
    const m = mapearAnuncio(anuncioBase, "DI-");
    assert.equal(m.campos.precoCentavos, 45_000_000);
    assert.equal(m.campos.tipoTransacao, "venda");
    assert.equal(m.campos.precoSobConsulta, false);
  });

  await teste("locação lê rentalPrice e NÃO o preço de venda", () => {
    // O erro mais caro possível: publicar casa de R$ 450.000 por R$ 1.300.
    const m = mapearAnuncio(
      {
        ...anuncioBase,
        transactionType: "For Rent",
        details: { ...anuncioBase.details, rentalPrice: 1_300 },
      },
      "DI-",
    );
    assert.equal(m.campos.tipoTransacao, "aluguel");
    assert.equal(m.campos.precoCentavos, 130_000);
  });

  await teste("sem preço vira sob consulta em vez de R$ 0", () => {
    const m = mapearAnuncio(
      { ...anuncioBase, details: { ...anuncioBase.details, listPrice: 0 } },
      "DI-",
    );
    assert.equal(m.campos.precoCentavos, null);
    assert.equal(m.campos.precoSobConsulta, true);
  });

  await teste("terreno mede lote, não área útil", () => {
    const m = mapearAnuncio(
      { ...anuncioBase, propertyType: "Terreno / Lote / Condomínio" },
      "DI-",
    );
    assert.equal(m.campos.tipoImovel, "terreno");
    assert.equal(m.campos.areaTerrenoM2, 120);
    assert.equal(m.campos.areaUtilM2, null);
    assert.equal(m.campos.quartos, null, "terreno não tem quartos");
  });

  await teste("tipo desconhecido vira 'outro' e avisa", () => {
    const m = mapearAnuncio({ ...anuncioBase, propertyType: "Iglu" }, "DI-");
    assert.equal(m.campos.tipoImovel, "outro");
    assert.ok(m.problemas.some((p) => p.tipo === "tipo_desconhecido"));
  });

  await teste("zero do portal significa 'não informado'", () => {
    const m = mapearAnuncio(
      { ...anuncioBase, details: { ...anuncioBase.details, garage: 0, suites: 0 } },
      "DI-",
    );
    assert.equal(m.campos.vagas, null);
    assert.equal(m.campos.suites, null);
  });

  await teste("estado vira sigla de 2 letras maiúsculas", () => {
    const m = mapearAnuncio(anuncioBase, "DI-");
    assert.equal(m.campos.estado, "SP");
  });

  await teste("IPTU do portal é anual", () => {
    const m = mapearAnuncio(anuncioBase, "DI-");
    assert.equal(m.campos.iptuCentavos, 120_000);
    assert.equal(m.campos.iptuPeriodo, "anual");
  });

  await teste("fotos entram na ordem do portal, não na do array", () => {
    const m = mapearAnuncio(anuncioBase, "DI-");
    assert.equal(m.fotos[0].url, "https://s3/1.webp");
    assert.equal(m.fotos[1].url, "https://s3/2.webp");
  });

  await teste("título automático do portal é recomposto com o bairro", () => {
    const m = mapearAnuncio(anuncioBase, "DI-");
    assert.equal(m.campos.titulo, "Casa no Jardim Laguna");
    assert.equal(m.tituloComposto, true);
  });

  await teste("bairro feminino usa 'na'", () => {
    const m = mapearAnuncio(
      { ...anuncioBase, location: { ...anuncioBase.location, neighborhood: "Vila Redentora" } },
      "DI-",
    );
    assert.equal(m.campos.titulo, "Casa na Vila Redentora");
  });

  await teste("título escrito à mão é preservado", () => {
    const m = mapearAnuncio(
      {
        ...anuncioBase,
        details: { ...anuncioBase.details, title: "Sobrado dos sonhos no Damha" },
      },
      "DI-",
    );
    assert.equal(m.campos.titulo, "Sobrado dos sonhos no Damha");
    assert.equal(m.tituloComposto, false);
  });

  await teste("títulos repetidos ganham o dado que os separa", () => {
    const a = mapearAnuncio(anuncioBase, "DI-");
    const b = mapearAnuncio(
      {
        ...anuncioBase,
        code: "X2",
        details: { ...anuncioBase.details, bedroom: 2, area: 90 },
      },
      "DI-",
    );
    assert.equal(a.campos.titulo, b.campos.titulo, "antes: iguais");
    desambiguarTitulos([a, b]);
    assert.notEqual(a.campos.titulo, b.campos.titulo);
    assert.notEqual(a.slugBase, b.slugBase, "o slug acompanha o título");
    assert.ok(a.campos.titulo.includes("3 quartos"));
  });

  await teste("descrição acima de 3000 caracteres é cortada pro feed", () => {
    const m = mapearAnuncio(
      { ...anuncioBase, details: { ...anuncioBase.details, description: "x".repeat(4000) } },
      "DI-",
    );
    assert.ok(m.campos.descricao.length <= 3000);
  });

  await teste("telefone na descrição é detectado", () => {
    const m = mapearAnuncio(
      {
        ...anuncioBase,
        details: {
          ...anuncioBase.details,
          description: `Ótima casa. Ligue (17) 99635-9490. ${"d".repeat(100)}`,
        },
      },
      "DI-",
    );
    assert.ok(m.problemas.some((p) => p.tipo === "telefone_na_descricao"));
    assert.ok(m.campos.descricao.includes("99635-9490"), "sem a flag, mantém");
  });

  await teste("--limpar-telefone tira o número mas preserva o texto", () => {
    const m = mapearAnuncio(
      {
        ...anuncioBase,
        details: {
          ...anuncioBase.details,
          description: `Ótima casa. Ligue (17) 99635-9490. ${"d".repeat(100)}`,
        },
      },
      "DI-",
      { limparTelefone: true },
    );
    assert.ok(!m.campos.descricao.includes("99635-9490"));
    assert.ok(m.campos.descricao.startsWith("Ótima casa."));
  });

  await teste("imóvel sem cômodos no portal é sinalizado", () => {
    const m = mapearAnuncio(
      {
        ...anuncioBase,
        details: { ...anuncioBase.details, bedroom: 0, bathroom: 0, garage: 0 },
      },
      "DI-",
    );
    assert.ok(m.problemas.some((p) => p.tipo === "sem_comodos"));
  });

  await teste("terreno sem cômodos NÃO é sinalizado", () => {
    const m = mapearAnuncio(
      {
        ...anuncioBase,
        propertyType: "Terreno / Lote / Condomínio",
        details: { ...anuncioBase.details, bedroom: 0, bathroom: 0, garage: 0 },
      },
      "DI-",
    );
    assert.ok(!m.problemas.some((p) => p.tipo === "sem_comodos"));
  });

  // O portal serve os mesmos dados em DOIS formatos: a página do perfil manda
  // "For Rent" e a API de paginação manda "FOR_RENT". Importar pela API sem
  // tratar isso classificava os aluguéis como venda.
  await teste("FOR_RENT (formato da API) é aluguel", () => {
    const m = mapearAnuncio(
      {
        ...anuncioBase,
        transactionType: "FOR_RENT",
        details: { ...anuncioBase.details, listPrice: null, rentalPrice: 1_300 },
      },
      "DI-",
    );
    assert.equal(m.campos.tipoTransacao, "aluguel");
    assert.equal(m.campos.precoCentavos, 130_000, "tem que ler o rentalPrice");
    assert.equal(m.campos.precoSobConsulta, false, "não pode virar sob consulta");
  });

  await teste("FOR_SALE (formato da API) é venda", () => {
    const m = mapearAnuncio({ ...anuncioBase, transactionType: "FOR_SALE" }, "DI-");
    assert.equal(m.campos.tipoTransacao, "venda");
    assert.equal(m.campos.precoCentavos, 45_000_000);
  });

  await teste("as três grafias de aluguel dão no mesmo", () => {
    for (const grafia of ["FOR_RENT", "For Rent", "for rent", "for_rent"]) {
      const m = mapearAnuncio({ ...anuncioBase, transactionType: grafia }, "DI-");
      assert.equal(m.campos.tipoTransacao, "aluguel", `falhou em "${grafia}"`);
    }
  });

  await teste("transação desconhecida do portal interrompe a importação", () => {
    assert.throws(() => mapearTransacao("FOR_LEASE"), /Transação desconhecida/);
    assert.throws(() => mapearTransacao(null), /Transação desconhecida/);
  });

  await teste("opções do importador aceitam as flags documentadas", () => {
    const opcoes = lerOpcoesImportacao(
      ["--dry-run", "--rascunho", "--fotos=blob", "--destaques=8", "--slug=nf-imoveis"],
      "perfil-padrao",
    );
    assert.equal(opcoes.dryRun, true);
    assert.equal(opcoes.rascunho, true);
    assert.equal(opcoes.modoFotos, "blob");
    assert.equal(opcoes.destaques, 8);
    assert.equal(opcoes.slug, "nf-imoveis");
  });

  await teste("erro em flag do importador não vira gravação acidental", () => {
    assert.throws(() => lerOpcoesImportacao(["--dryrun"], "perfil"), /desconhecida/);
    assert.throws(() => lerOpcoesImportacao(["--fotos=outro"], "perfil"), /desconhecida/);
    assert.throws(() => lerOpcoesImportacao(["--destaques=-1"], "perfil"), /inteiro/);
    assert.throws(() => lerOpcoesImportacao(["--slug="], "perfil"), /slug/);
  });

  await teste("'Imóvel para lazer' não cai em 'outro'", () => {
    const m = mapearAnuncio({ ...anuncioBase, propertyType: "Imóvel para lazer" }, "DI-");
    assert.equal(m.campos.tipoImovel, "chacara_sitio_fazenda");
    assert.ok(!m.problemas.some((p) => p.tipo === "tipo_desconhecido"));
  });

  await teste("'Casa Comercial' e 'Sobrado' são reconhecidos", () => {
    const comercial = mapearAnuncio(
      { ...anuncioBase, propertyType: "Casa Comercial" },
      "DI-",
    );
    assert.ok(!comercial.problemas.some((p) => p.tipo === "tipo_desconhecido"));

    const sobrado = mapearAnuncio({ ...anuncioBase, propertyType: "Sobrado" }, "DI-");
    assert.equal(sobrado.campos.tipoImovel, "casa");
  });

  await teste("features do portal viram características", () => {
    const m = mapearAnuncio(
      {
        ...anuncioBase,
        features: [
          { id: "1", name: "Academia" },
          { id: "2", name: "Piscina" },
          { id: "3", name: "Academia" },
          { id: "4", name: "" },
        ],
      },
      "DI-",
    );
    assert.deepEqual(m.campos.caracteristicas, ["Academia", "Piscina"]);
  });

  await teste("anúncio sem foto nenhuma é sinalizado", () => {
    const m = mapearAnuncio({ ...anuncioBase, gallery: [] }, "DI-");
    assert.equal(m.fotos.length, 0);
    assert.ok(m.problemas.some((p) => p.tipo === "sem_fotos"));
  });

  await teste("preço não confunde com número solto na descrição", () => {
    // "1.380.000" e CEP não podem virar telefone.
    assert.equal(encontrarTelefones("Casa por R$ 1.380.000, CEP 15085-520").length, 0);
  });

  // ------------------------------------------------------------- relatório
  console.log(`\n${passou} verificações passaram.`);
  if (falhas.length > 0) {
    console.error(`\n${falhas.length} FALHARAM:\n`);
    for (const falha of falhas) console.error(`  ✗ ${falha}`);
    process.exit(1);
  }
  console.log("Tudo certo.");
}

main();
