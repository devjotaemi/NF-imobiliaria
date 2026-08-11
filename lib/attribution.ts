/**
 * Atribuição de origem da visita.
 *
 * O problema que isso resolve: se cada link interno tivesse que carregar
 * `?utm_source=...` adiante (card da home -> ficha -> botão do WhatsApp), a
 * atribuição quebraria no primeiro link que alguém esquecesse de ajustar.
 *
 * Em vez disso a origem é capturada UMA vez, no `proxy.ts`, na primeira
 * resposta que o navegador recebe, e guardada num cookie. Quem precisa da
 * origem depois (o clique do WhatsApp, o link da OLX no rodapé) lê o cookie.
 *
 * Consequência prática: os CTAs podem ser links estáticos e simples.
 */

export const COOKIE_ATRIBUICAO = "nf_attr";

/** Janela de atribuição. Curta de propósito: interessa a sessão, não o histórico. */
export const ATRIBUICAO_MAX_AGE_SEGUNDOS = 90 * 60;

export type Atribuicao = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  /** Clique pago identificado por parâmetro do próprio anunciante. */
  clickId?: string;
  /** true = a visita veio de campanha paga. */
  pago: boolean;
};

export const ATRIBUICAO_VAZIA: Atribuicao = { pago: false };

/** Parâmetros de clique que, sozinhos, já provam tráfego pago. */
const PARAMS_CLICK_ID = ["gclid", "fbclid", "msclkid", "ttclid", "wbraid", "gbraid"];

/** utm_medium que significa mídia paga. */
const MEDIUMS_PAGOS = new Set([
  "cpc",
  "ppc",
  "paid",
  "paidsocial",
  "paid_social",
  "paid-social",
  "ads",
  "display",
  "cpm",
  "social_paid",
]);

/** Limite defensivo: cookie não é lugar pra texto longo vindo da URL. */
function limitar(valor: string | null): string | undefined {
  if (!valor) return undefined;
  const limpo = valor.trim().slice(0, 200);
  return limpo.length > 0 ? limpo : undefined;
}

/**
 * Extrai atribuição dos parâmetros da URL.
 * Devolve `null` quando não há nenhum sinal de campanha — nesse caso o cookie
 * existente NÃO deve ser sobrescrito (navegação interna não apaga a origem).
 */
export function atribuicaoDaUrl(params: URLSearchParams): Atribuicao | null {
  const utmSource = limitar(params.get("utm_source"));
  const utmMedium = limitar(params.get("utm_medium"));
  const utmCampaign = limitar(params.get("utm_campaign"));
  const utmContent = limitar(params.get("utm_content"));
  const utmTerm = limitar(params.get("utm_term"));

  let clickId: string | undefined;
  for (const nome of PARAMS_CLICK_ID) {
    const valor = limitar(params.get(nome));
    if (valor) {
      clickId = `${nome}:${valor}`;
      break;
    }
  }

  const temSinal =
    utmSource || utmMedium || utmCampaign || utmContent || utmTerm || clickId;
  if (!temSinal) return null;

  const pago = Boolean(clickId) || MEDIUMS_PAGOS.has((utmMedium ?? "").toLowerCase());

  return { utmSource, utmMedium, utmCampaign, utmContent, utmTerm, clickId, pago };
}

export function serializarAtribuicao(atribuicao: Atribuicao): string {
  return Buffer.from(JSON.stringify(atribuicao), "utf8").toString("base64url");
}

export function desserializarAtribuicao(bruto: string | undefined): Atribuicao {
  if (!bruto) return ATRIBUICAO_VAZIA;
  try {
    const json = Buffer.from(bruto, "base64url").toString("utf8");
    const dados = JSON.parse(json) as Partial<Atribuicao>;
    // Cookie vem do cliente: trate como dado não confiável, normalize.
    return {
      utmSource: limitar(dados.utmSource ?? null),
      utmMedium: limitar(dados.utmMedium ?? null),
      utmCampaign: limitar(dados.utmCampaign ?? null),
      utmContent: limitar(dados.utmContent ?? null),
      utmTerm: limitar(dados.utmTerm ?? null),
      clickId: limitar(dados.clickId ?? null),
      pago: dados.pago === true,
    };
  } catch {
    return ATRIBUICAO_VAZIA;
  }
}
