/**
 * Configuração lida do ambiente, num lugar só.
 *
 * Regra: nada de `process.env.X` espalhado pelo código — quando falta uma
 * variável, o erro tem que ser óbvio e apontar o nome certo.
 */

function obrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(
      `Variável de ambiente ausente: ${nome}. Veja .env.example e preencha o .env.`,
    );
  }
  return valor;
}

/** Segredo de assinatura do cookie de sessão do painel. */
export function sessionSecret(): string {
  return obrigatoria("SESSION_SECRET");
}

/** Número do WhatsApp da NF (só dígitos, com DDI+DDD). */
export function whatsappNumero(): string {
  const bruto = obrigatoria("WHATSAPP_NUMERO");
  const digitos = bruto.replace(/\D/g, "");
  if (digitos.length < 12) {
    throw new Error(
      `WHATSAPP_NUMERO inválido ("${bruto}"). Use DDI+DDD+número, só dígitos. Ex.: 5511999998888`,
    );
  }
  return digitos;
}

/**
 * O mesmo número, formatado pra aparecer no header e no rodapé.
 *
 * Tolerante de propósito: se a variável faltar, devolve string vazia e o
 * componente esconde a pílula — um telefone ausente não pode derrubar o site
 * inteiro, ao contrário do CTA (esse sim precisa falhar alto).
 */
export function telefoneExibicao(): string {
  const digitos = (process.env.WHATSAPP_NUMERO || "").replace(/\D/g, "");
  const semDdi = digitos.startsWith("55") ? digitos.slice(2) : digitos;
  if (semDdi.length < 10) return "";

  const ddd = semDdi.slice(0, 2);
  const numero = semDdi.slice(2);
  const meio = numero.length > 8 ? numero.slice(0, 5) : numero.slice(0, 4);
  return `(${ddd}) ${meio}-${numero.slice(meio.length)}`;
}

/**
 * O mesmo número em E.164 (+5517999998888), que é o formato que o schema.org
 * espera em `telephone`. Tolerante como o `telefoneExibicao`: sem a variável,
 * devolve vazio e o campo some do JSON-LD em vez de sair pela metade.
 */
export function telefoneE164(): string {
  const digitos = (process.env.WHATSAPP_NUMERO || "").replace(/\D/g, "");
  return digitos.length >= 12 ? `+${digitos}` : "";
}

/**
 * URL do perfil da OLX. Opcional de propósito: enquanto o cliente não passar
 * o link, o rodapé simplesmente não mostra nada — em vez de quebrar o site.
 */
export const OLX_PERFIL_URL = process.env.NEXT_PUBLIC_OLX_PERFIL_URL || "";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * Contato que vai dentro do XML do feed (cabeçalho + contato do anunciante
 * em cada anúncio). Não é o CTA do site — é o dado que o portal exibe/usa.
 */
export function contatoFeed() {
  const telefone = process.env.FEED_TELEFONE || whatsappNumeroOuVazio();
  return {
    nome: process.env.FEED_NOME || "NF Negócios",
    email: process.env.FEED_EMAIL || "",
    telefone,
  };
}

/** Versão tolerante: o feed não deve quebrar por causa de telefone ausente. */
function whatsappNumeroOuVazio(): string {
  try {
    return whatsappNumero();
  } catch {
    return "";
  }
}
