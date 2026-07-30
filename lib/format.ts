/** Formatação pt-BR usada no site e no painel. */

export function formatarBRL(centavos: number | null | undefined): string {
  if (centavos === null || centavos === undefined) return "";
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Converte o que o corretor digita em centavos.
 * Aceita "450000", "450.000", "450.000,00" e "R$ 450.000,00".
 * Devolve null pra entrada vazia ou inválida.
 */
export function brlParaCentavos(entrada: string): number | null {
  const texto = entrada.trim().replace(/^R\$\s*/i, "").trim();
  if (!texto) return null;

  const formatoBrasileiro = /^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/;
  const decimalComPonto = /^\d+\.\d{1,2}$/;
  if (!formatoBrasileiro.test(texto) && !decimalComPonto.test(texto)) {
    return null;
  }

  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : decimalComPonto.test(texto)
      ? texto
      : texto.replace(/\./g, "");
  const centavos = Math.round(Number(normalizado) * 100);
  return Number.isSafeInteger(centavos) && centavos <= 2_147_483_647
    ? centavos
    : null;
}

/** Centavos -> valor pra preencher input de texto (sem símbolo de moeda). */
export function centavosParaInput(centavos: number | null | undefined): string {
  if (centavos === null || centavos === undefined) return "";
  return (centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/** Preço do imóvel já resolvendo "sob consulta". */
export function precoExibicao(imovel: {
  precoCentavos: number | null;
  precoSobConsulta: boolean;
}): string {
  if (imovel.precoSobConsulta || imovel.precoCentavos === null) {
    return "Sob consulta";
  }
  return formatarBRL(imovel.precoCentavos);
}

export function localizacaoExibicao(imovel: {
  bairro: string | null;
  cidade: string;
  estado: string;
}): string {
  return [imovel.bairro, imovel.cidade, imovel.estado]
    .filter(Boolean)
    .join(", ");
}

/**
 * Corta texto no limite de palavra, pra meta description e JSON-LD.
 *
 * Um `slice(0, 160)` cru corta no meio da palavra ("apartamento com vista pa")
 * e é isso que aparece no resultado do Google. Aqui volta até o último espaço
 * e fecha com reticências.
 */
export function resumir(texto: string, max: number): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (limpo.length <= max) return limpo;

  // -1 pra abrir espaço pro caractere de reticências.
  const cortado = limpo.slice(0, max - 1);
  const ultimoEspaco = cortado.lastIndexOf(" ");

  // Palavra única maior que o limite: não há espaço pra voltar, corta seco.
  const base = ultimoEspaco > 0 ? cortado.slice(0, ultimoEspaco) : cortado;
  return `${base.replace(/[,.;:—-]$/, "")}…`;
}

/**
 * Gera slug a partir do título. Usado só na criação — editar o título depois
 * NÃO regenera o slug, senão links de anúncio já publicados quebram.
 */
export function gerarSlug(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

const ROTULO_TIPO_IMOVEL: Record<string, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  casa_condominio: "Casa em condomínio",
  cobertura: "Cobertura",
  kitnet_studio: "Kitnet / Studio",
  sala_comercial: "Sala comercial",
  loja: "Loja",
  galpao: "Galpão",
  terreno: "Terreno",
  chacara_sitio_fazenda: "Chácara / Sítio / Fazenda",
  outro: "Outro",
};

export function rotuloTipoImovel(tipo: string): string {
  return ROTULO_TIPO_IMOVEL[tipo] ?? tipo;
}

/** Tipos sem cômodos — não faz sentido mostrar quartos/banheiros num terreno. */
const SEM_COMODOS = new Set(["terreno", "galpao"]);

export function mostraComodos(tipoImovel: string): boolean {
  return !SEM_COMODOS.has(tipoImovel);
}

/** Impede que valores vindos de anúncios ou campanhas virem fórmulas no Excel. */
export function escaparCsv(valor: string): string {
  const seguro = /^[\t\r\n ]*[=+\-@]/.test(valor) ? `'${valor}` : valor;
  return `"${seguro.replace(/"/g, '""')}"`;
}
