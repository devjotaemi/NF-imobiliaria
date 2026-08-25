import { db } from "@/lib/db";
import { whatsappNumero } from "@/lib/config";
import type { Atribuicao } from "@/lib/attribution";

/**
 * Clique rastreado do WhatsApp — a ÚNICA saída de conversão do site.
 *
 * Contrato desenhado pra receber a lógica já validada pelo conselho: quem for
 * portar o código antigo troca o miolo de `registrarCliqueWhatsApp` mantendo
 * esta assinatura, e nada no resto do site precisa mudar.
 *
 * Ordem importa: registra primeiro, redireciona depois. As duas coisas
 * acontecem na mesma requisição, então não existe "clique contado mas WhatsApp
 * não abriu" nem o contrário.
 */

/**
 * Onde no site o clique aconteceu.
 *
 * Cada valor é uma dimensão do relatório de CPL — só entra aqui posição que
 * valha a pena separar na hora de ler o número. Adicionar é seguro; renomear
 * não é: o histórico em `WhatsAppClick.placement` guarda a string crua.
 */
export type Placement =
  | "home_grid_card"
  | "home_hero"
  | "home_anuncie"
  | "catalogo_rodape"
  | "terrenos_hero"
  | "terrenos_cta"
  | "ficha_cta"
  | "ficha_cta_fixo"
  | "ficha_agendar"
  | "ficha_atendimento"
  | "ficha_simular"
  | "rodape"
  | "rodape_newsletter";

const PLACEMENTS_VALIDOS = new Set<Placement>([
  "home_grid_card",
  "home_hero",
  "home_anuncie",
  "catalogo_rodape",
  "terrenos_hero",
  "terrenos_cta",
  "ficha_cta",
  "ficha_cta_fixo",
  "ficha_agendar",
  "ficha_atendimento",
  "ficha_simular",
  "rodape",
  "rodape_newsletter",
]);

export function ehPlacementValido(valor: string): valor is Placement {
  return PLACEMENTS_VALIDOS.has(valor as Placement);
}

export type EntradaClique = {
  /** slug do imóvel, ou null pra CTA genérico (rodapé) */
  slugImovel: string | null;
  placement: Placement;
  atribuicao: Atribuicao;
  referrer?: string | null;
  userAgent?: string | null;
};

export type ResultadoClique = {
  /** URL final do WhatsApp, pronta pro redirect. */
  urlRedirecionamento: string;
};

export async function registrarCliqueWhatsApp(
  entrada: EntradaClique,
): Promise<ResultadoClique> {
  // Só registra imóvel que existe e está ativo — número de CPL confiável
  // depende de não contar clique pra imóvel fantasma.
  let imovel: {
    id: string;
    slug: string;
    titulo: string;
    referenceCode: string;
  } | null = null;

  try {
    if (entrada.slugImovel) {
      imovel = await db.property.findFirst({
        where: { slug: entrada.slugImovel, ativo: true },
        select: { id: true, slug: true, titulo: true, referenceCode: true },
      });
    }
  } catch (erro) {
    console.error("[whatsapp-click] falha ao buscar imóvel:", erro);
  }

  // A URL é montada ANTES de gravar: se o banco estiver fora, o visitante
  // ainda chega no WhatsApp. Perder a métrica é ruim; perder o lead é pior.
  const urlRedirecionamento = montarUrlWhatsApp(imovel);

  const { atribuicao } = entrada;

  try {
    await db.whatsAppClick.create({
      data: {
        propertyId: imovel?.id ?? null,
        // Snapshot: se o imóvel for excluído depois, o histórico de CPL continua legível.
        propertySlugSnapshot: imovel?.slug ?? entrada.slugImovel ?? null,
        propertyTituloSnapshot: imovel?.titulo ?? null,
        placement: entrada.placement,
        utmSource: atribuicao.utmSource ?? null,
        utmMedium: atribuicao.utmMedium ?? null,
        utmCampaign: atribuicao.utmCampaign ?? null,
        utmContent: atribuicao.utmContent ?? null,
        utmTerm: atribuicao.utmTerm ?? null,
        referrer: entrada.referrer ?? null,
        userAgentRaw: entrada.userAgent?.slice(0, 500) ?? null,
      },
    });
  } catch (erro) {
    console.error("[whatsapp-click] falha ao registrar clique:", erro);
  }

  return { urlRedirecionamento };
}

function montarUrlWhatsApp(
  imovel: { titulo: string; referenceCode: string } | null,
): string {
  const mensagem = imovel
    ? `Olá! Tenho interesse no imóvel ${imovel.referenceCode} — ${imovel.titulo}.`
    : "Olá! Vim pelo site e gostaria de mais informações.";

  return `https://wa.me/${whatsappNumero()}?text=${encodeURIComponent(mensagem)}`;
}
