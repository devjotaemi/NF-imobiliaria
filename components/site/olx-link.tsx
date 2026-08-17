import { ehTrafegoPago } from "@/lib/attribution-server";
import { OLX_PERFIL_URL } from "@/lib/config";

/**
 * Link discreto pro perfil da NF na OLX.
 *
 * Duas regras, ambas vindas da decisão do conselho:
 *  - fica só no rodapé, sem peso visual — não é um segundo CTA;
 *  - some quando a visita veio de campanha paga. Mandar tráfego que a NF
 *    pagou pra uma plataforma concorrente foi o erro do projeto anterior.
 *
 * É Server Component de propósito: a decisão acontece antes do HTML sair, então
 * não existe o instante em que o link pisca na tela pra quem veio de anúncio.
 */
export async function OlxLink() {
  if (!OLX_PERFIL_URL) return null;
  if (await ehTrafegoPago()) return null;

  return (
    <a
      href={OLX_PERFIL_URL}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="text-sm text-slate-400 underline-offset-4 transition hover:text-slate-200 hover:underline"
    >
      Também estamos na OLX
    </a>
  );
}
