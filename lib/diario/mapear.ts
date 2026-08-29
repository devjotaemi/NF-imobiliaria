import { gerarSlug, rotuloTipoImovel } from "@/lib/format";
import { TIPOS_IMOVEL } from "@/lib/validation/property";

/**
 * Tradução do Diário Imóveis para o nosso schema.
 *
 * Separado do script de importação porque é a parte que dá errado em silêncio:
 * um tipo mapeado torto ou um preço lido do campo errado só aparece semanas
 * depois, num anúncio publicado com o dado errado. Aqui é lógica pura, sem
 * rede e sem banco — dá pra testar com um objeto na mão (`npm run verify`).
 *
 * ATENÇÃO: o portal é um agregador. Todo anúncio traz `clientId` do dono, e
 * este módulo NÃO filtra por dono — quem filtra é `scripts/importar-diario.ts`,
 * que só busca a página da própria NF. Se algum dia alguém apontar isto pra
 * listagem geral do portal, estará importando imóvel dos concorrentes: fotos,
 * descrição e WhatsApp deles sairiam no nosso site e, pior, no nosso feed
 * VRSync de volta pro mesmo portal.
 */

export type TipoImovel = (typeof TIPOS_IMOVEL)[number];

/** Formato do anúncio como o portal entrega dentro do `__NEXT_DATA__`. */
export type AnuncioDiario = {
  id: string;
  code: string;
  clientId: string;
  slug?: string | null;
  title?: string | null;
  propertyType?: string | null;
  transactionType?: string | null;
  isActive?: boolean | null;
  details?: {
    title?: string | null;
    description?: string | null;
    listPrice?: number | null;
    rentalPrice?: number | null;
    area?: number | null;
    bedroom?: number | null;
    bathroom?: number | null;
    garage?: number | null;
    suites?: number | null;
    floors?: number | null;
    unitFloor?: number | null;
    propertyAdministrationFee?: number | null;
    yearlyTax?: number | null;
  } | null;
  location?: {
    city?: string | null;
    state?: string | null;
    neighborhood?: string | null;
    postalCode?: string | null;
  } | null;
  gallery?: { id: string; url: string; position?: number | null; isThumbnail?: boolean | null }[] | null;
  /** Só a API de paginação preenche; o payload da página vem vazio. */
  features?: { id?: string; name?: string | null }[] | null;
};

/**
 * `propertyType` do portal -> enum `TipoImovel`.
 *
 * Levantado sobre ~225 anúncios reais do portal. O que não estiver aqui cai em
 * "outro" e o importador avisa — melhor um anúncio genérico e um alerta no
 * terminal do que um terreno cadastrado como apartamento.
 */
const TIPOS: Record<string, TipoImovel> = {
  "casa": "casa",
  "casa de vila": "casa",
  "casa de condomínio": "casa_condominio",
  "sobrado": "casa",
  "apartamento": "apartamento",
  "cobertura": "cobertura",
  "kitnet": "kitnet_studio",
  "studio": "kitnet_studio",
  "kitnet / studio": "kitnet_studio",
  "flat": "kitnet_studio",
  "terreno / lote / condomínio": "terreno",
  "terreno": "terreno",
  "lote": "terreno",
  "área comercial": "terreno",
  "fazenda / sítio / chácara": "chacara_sitio_fazenda",
  "chácara": "chacara_sitio_fazenda",
  "sítio": "chacara_sitio_fazenda",
  "fazenda": "chacara_sitio_fazenda",
  // Rancho, casa de represa e afins. O portal usa esse rótulo pra lazer rural,
  // que é o que "chácara/sítio" significa no nosso enum.
  "imóvel para lazer": "chacara_sitio_fazenda",
  "conjunto comercial / sala": "sala_comercial",
  "sala comercial": "sala_comercial",
  "loja / salão / ponto comercial": "loja",
  "loja": "loja",
  "galpão": "galpao",
  "galpão / depósito / armazém": "galpao",
  "imóvel comercial": "outro",
  // Casa usada como ponto comercial: nosso enum não tem equivalente, e forçar
  // "casa" faria ela aparecer no filtro de quem procura moradia.
  "casa comercial": "outro",
};

export function mapearTipo(bruto: string | null | undefined): {
  tipo: TipoImovel;
  reconhecido: boolean;
} {
  const chave = (bruto ?? "").trim().toLowerCase();
  const tipo = TIPOS[chave];
  return tipo ? { tipo, reconhecido: true } : { tipo: "outro", reconhecido: false };
}

/**
 * `transactionType` -> nosso enum.
 *
 * O portal serve o MESMO dado em duas grafias: a página do perfil manda
 * "For Rent" e a API de paginação manda "FOR_RENT". Normalizar antes de
 * comparar não é preciosismo — comparar cru classificou os aluguéis da
 * carteira como venda, e como o `listPrice` deles é nulo, todos apareceriam
 * como "Sob consulta" em vez do valor do aluguel.
 */
export function mapearTransacao(bruto: string | null | undefined): "venda" | "aluguel" {
  const normalizado = (bruto ?? "").trim().toLowerCase().replace(/[_-]+/g, " ");
  if (normalizado === "for rent") return "aluguel";
  if (normalizado === "for sale") return "venda";
  throw new Error(`Transação desconhecida no Diário Imóveis: ${bruto ?? "(vazio)"}`);
}

/** Reais inteiros -> centavos. O portal nunca manda fração. */
function centavos(reais: number | null | undefined): number | null {
  if (reais === null || reais === undefined) return null;
  if (!Number.isFinite(reais) || reais <= 0) return null;
  return Math.round(reais * 100);
}

/** Zero no portal significa "não informado", não "tem zero quartos". */
function inteiro(valor: number | null | undefined): number | null {
  if (valor === null || valor === undefined) return null;
  if (!Number.isFinite(valor) || valor <= 0) return null;
  return Math.trunc(valor);
}

const SEM_COMODOS = new Set<TipoImovel>(["terreno", "galpao"]);

/**
 * Bairros com nome feminino pedem "na", não "no".
 *
 * "Casa no Vila Toninho" denuncia texto gerado por máquina numa página que
 * precisa passar credibilidade.
 */
const BAIRRO_FEMININO =
  /^(vila|chácara|chacara|área|area|cidade|quinta|colina|estância|estancia|represa|aldeia|granja|fazenda|praia|ilha|serra)\b/i;

/**
 * O portal gera título automático ("Casa à venda, 120m²") — quinze desses no
 * catálogo viram quinze cards iguais e quinze <title> duplicados, que o Google
 * trata como conteúdo raso. Quando detectamos o padrão automático, compomos
 * "Casa no Jardim Tarraf". Título escrito à mão pelo corretor é preservado.
 */
export function montarTitulo(anuncio: AnuncioDiario): {
  titulo: string;
  composto: boolean;
} {
  const original = (anuncio.details?.title ?? anuncio.title ?? "").trim();
  const bairro = anuncio.location?.neighborhood?.trim();
  const automatico =
    /(à venda|a venda|para venda|para alugar|para aluguel|para loca[çc][ãa]o)\s*,/i.test(
      original,
    );

  if (!automatico || !bairro) {
    return { titulo: original, composto: false };
  }

  const { tipo } = mapearTipo(anuncio.propertyType);
  const preposicao = BAIRRO_FEMININO.test(bairro) ? "na" : "no";
  return {
    titulo: `${rotuloTipoImovel(tipo)} ${preposicao} ${bairro}`,
    composto: true,
  };
}

/**
 * Desfaz empate entre títulos compostos.
 *
 * "Casa no Residencial Regissol I" resolve a duplicação que vinha do portal,
 * mas cria outra quando a NF tem três casas no mesmo bairro. Aqui os repetidos
 * ganham o dado que os separa — "Casa de 3 quartos no Residencial Regissol I".
 *
 * Título escrito à mão pelo corretor nunca é tocado.
 */
export function desambiguarTitulos(itens: Mapeado[]): void {
  const grupos = new Map<string, Mapeado[]>();

  for (const item of itens) {
    if (!item.tituloComposto) continue;
    const chave = item.campos.titulo;
    grupos.set(chave, [...(grupos.get(chave) ?? []), item]);
  }

  for (const grupo of grupos.values()) {
    if (grupo.length < 2) continue;

    for (const item of grupo) {
      const { quartos, areaUtilM2, areaTerrenoM2 } = item.campos;
      const area = areaUtilM2 ?? areaTerrenoM2;

      const marcas: string[] = [];
      if (quartos) marcas.push(`${quartos} quarto${quartos > 1 ? "s" : ""}`);
      if (area) marcas.push(`${area}m²`);
      if (marcas.length === 0) continue;

      // Injeta antes da preposição: "Casa no X" -> "Casa de 3 quartos no X".
      item.campos.titulo = item.campos.titulo
        .replace(/ (no|na) /, ` de ${marcas.join(" e ")} $1 `)
        .slice(0, 150);

      // O slug acompanha o título novo — senão a URL diria "casa-no-regissol"
      // pra três imóveis e só o sufixo -2/-3 os separaria.
      item.slugBase = montarSlugBase(
        item.campos.titulo,
        item.campos.bairro,
        item.referenceCode,
      );
    }
  }
}

/** Slug legível e estável: título + bairro. A unicidade é resolvida no script. */
export function montarSlugBase(
  titulo: string,
  bairro: string | null,
  code: string,
): string {
  const base = gerarSlug(titulo);
  const slugBairro = bairro ? gerarSlug(bairro) : "";

  // Se o título já cita o bairro, repetir vira "casa-no-centro-centro".
  if (slugBairro && !base.includes(slugBairro)) {
    return gerarSlug(`${titulo} ${bairro}`);
  }
  return base || gerarSlug(code) || code.toLowerCase();
}

export type Problema =
  | { tipo: "descricao_curta"; detalhe: string }
  | { tipo: "sem_preco"; detalhe: string }
  | { tipo: "tipo_desconhecido"; detalhe: string }
  | { tipo: "sem_cidade"; detalhe: string }
  | { tipo: "sem_comodos"; detalhe: string }
  | { tipo: "sem_fotos"; detalhe: string }
  | { tipo: "telefone_na_descricao"; detalhe: string };

export type Mapeado = {
  referenceCode: string;
  slugBase: string;
  campos: {
    titulo: string;
    descricao: string;
    tipoTransacao: "venda" | "aluguel";
    tipoImovel: TipoImovel;
    precoCentavos: number | null;
    precoSobConsulta: boolean;
    condominioCentavos: number | null;
    iptuCentavos: number | null;
    iptuPeriodo: "mensal" | "anual" | null;
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
    caracteristicas: string[];
    garantiasAceitas: string[];
  };
  fotos: { url: string; ordem: number; altText: string }[];
  ativoNoPortal: boolean;
  tituloComposto: boolean;
  problemas: Problema[];
};

/** Descrição precisa de 50 a 3000 caracteres — é exigência do feed VRSync. */
const DESCRICAO_MIN = 50;
const DESCRICAO_MAX = 3000;

/**
 * Telefone escrito no meio da descrição.
 *
 * Importa porque contradiz a tese do site: o CTA do WhatsApp é a única saída
 * de conversão E a única coisa medida. Um número digitado no texto vira ligação
 * direta — o lead chega, mas não aparece no CPL, e a campanha que o trouxe
 * parece pior do que é.
 *
 * Cobre "(17) 99635-9490", "17 99635 9490" e "9105 1696". Não casa com
 * "1.380.000" nem com CEP, que quebram em blocos de 3.
 */
const TELEFONE =
  /\(\d{2}\)\s*\d{4,5}[-.\s]?\d{4}|\b\d{2}[\s.-]\d{4,5}[-.\s]\d{4}\b|\b\d{4,5}[-.\s]\d{4}\b/g;

export function encontrarTelefones(texto: string): string[] {
  return [...new Set(texto.match(TELEFONE) ?? [])];
}

/** Remove o telefone e limpa a pontuação órfã que sobra ("Ligue:  ." vira "Ligue."). */
export function limparTelefones(texto: string): string {
  return texto
    .replace(TELEFONE, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([.,;:!?])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function mapearAnuncio(
  anuncio: AnuncioDiario,
  prefixo: string,
  opcoes: { limparTelefone?: boolean } = {},
): Mapeado {
  const problemas: Problema[] = [];
  const detalhes = anuncio.details ?? {};
  const local = anuncio.location ?? {};

  const { tipo, reconhecido } = mapearTipo(anuncio.propertyType);
  if (!reconhecido) {
    problemas.push({
      tipo: "tipo_desconhecido",
      detalhe: `"${anuncio.propertyType ?? "(vazio)"}" virou "outro"`,
    });
  }

  const tipoTransacao = mapearTransacao(anuncio.transactionType);
  const { titulo, composto } = montarTitulo(anuncio);

  let descricao = (detalhes.description ?? "").trim();

  const telefones = encontrarTelefones(descricao);
  if (telefones.length > 0) {
    problemas.push({
      tipo: "telefone_na_descricao",
      detalhe: opcoes.limparTelefone
        ? `removido: ${telefones.join(", ")}`
        : telefones.join(", "),
    });
    if (opcoes.limparTelefone) descricao = limparTelefones(descricao);
  }

  if (descricao.length > DESCRICAO_MAX) {
    descricao = `${descricao.slice(0, DESCRICAO_MAX - 1).trimEnd()}…`;
  }
  if (descricao.length < DESCRICAO_MIN) {
    problemas.push({
      tipo: "descricao_curta",
      detalhe: `${descricao.length} caracteres (o feed exige ${DESCRICAO_MIN})`,
    });
  }

  // Venda lê listPrice, locação lê rentalPrice. Trocar os dois é o erro mais
  // caro possível aqui: publicaria uma casa de R$ 450.000 por R$ 1.300.
  const preco =
    tipoTransacao === "aluguel"
      ? centavos(detalhes.rentalPrice)
      : centavos(detalhes.listPrice);

  if (preco === null) {
    problemas.push({ tipo: "sem_preco", detalhe: "vai entrar como sob consulta" });
  }

  const cidade = (local.city ?? "").trim();
  if (!cidade) {
    problemas.push({ tipo: "sem_cidade", detalhe: "cidade é obrigatória no feed" });
  }

  const area = inteiro(detalhes.area);
  const semComodos = SEM_COMODOS.has(tipo) || tipo === "chacara_sitio_fazenda";

  // Parte do acervo está no portal sem quarto/banheiro/vaga preenchidos. O card
  // e a ficha ficam com uma linha de specs vazia, o que passa impressão de site
  // quebrado — e o filtro por quartos nunca alcança esse imóvel.
  if (
    !semComodos &&
    !inteiro(detalhes.bedroom) &&
    !inteiro(detalhes.bathroom) &&
    !inteiro(detalhes.garage)
  ) {
    problemas.push({
      tipo: "sem_comodos",
      detalhe: "portal não tem quartos/banheiros/vagas — preencha no /admin",
    });
  }

  const iptu = centavos(detalhes.yearlyTax);

  const fotos = [...(anuncio.gallery ?? [])]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((foto, indice) => ({
      url: foto.url,
      ordem: indice,
      altText: `${titulo} — foto ${indice + 1}`,
    }));

  if (fotos.length === 0) {
    problemas.push({
      tipo: "sem_fotos",
      detalhe: "nenhuma imagem no portal — o card fica com o bloco 'Sem foto'",
    });
  }

  // `features` só vem preenchido pela API de paginação. Alimenta o filtro
  // "Características" do catálogo, que fica escondido quando ninguém tem.
  const caracteristicas = Array.from(
    new Set(
      (anuncio.features ?? [])
        .map((f) => f.name?.trim())
        .filter((nome): nome is string => Boolean(nome)),
    ),
  );

  return {
    referenceCode: `${prefixo}${anuncio.code}`,
    slugBase: montarSlugBase(titulo, local.neighborhood?.trim() || null, anuncio.code),
    ativoNoPortal: anuncio.isActive !== false,
    tituloComposto: composto,
    problemas,
    fotos,
    campos: {
      titulo: titulo.slice(0, 150),
      descricao,
      tipoTransacao,
      tipoImovel: tipo,
      precoCentavos: preco,
      precoSobConsulta: preco === null,
      condominioCentavos: centavos(detalhes.propertyAdministrationFee),
      iptuCentavos: iptu,
      iptuPeriodo: iptu === null ? null : "anual",
      bairro: local.neighborhood?.trim() || null,
      cidade,
      estado: (local.state ?? "SP").trim().toUpperCase().slice(0, 2),
      cep: local.postalCode?.replace(/\D/g, "") || null,
      quartos: semComodos ? null : inteiro(detalhes.bedroom),
      suites: semComodos ? null : inteiro(detalhes.suites),
      banheiros: semComodos ? null : inteiro(detalhes.bathroom),
      vagas: semComodos ? null : inteiro(detalhes.garage),
      // Terreno e chácara medem lote, não área construída.
      areaUtilM2: semComodos ? null : area,
      areaTerrenoM2: semComodos ? area : null,
      andar: inteiro(detalhes.unitFloor),
      totalAndares: inteiro(detalhes.floors),
      caracteristicas,
      garantiasAceitas: [],
    },
  };
}
