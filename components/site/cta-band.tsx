import { WhatsAppCta } from "@/components/site/whatsapp-cta";
import { Icone } from "@/components/ui/icons";
import type { Placement } from "@/lib/whatsapp/track-click";

/**
 * Faixa escura de chamada, no fim do catálogo e da página de terrenos.
 *
 * O botão é sempre o CTA rastreado — a faixa muda de texto, nunca de destino.
 */
export function CtaBand({
  titulo,
  texto,
  rotulo,
  origem,
  icone = "headset",
}: {
  titulo: string;
  texto: string;
  rotulo: string;
  origem: Placement;
  icone?: string;
}) {
  return (
    <section className="rounded-3xl bg-verde-950 px-6 py-8 text-white sm:px-10">
      <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10">
          <Icone nome={icone} className="h-6 w-6" />
        </span>

        <div className="flex-1">
          <h2 className="text-lg font-medium">{titulo}</h2>
          <p className="mt-1 max-w-2xl text-sm text-white/70">{texto}</p>
        </div>

        <WhatsAppCta
          origem={origem}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-verde-500 px-6 py-3 font-semibold text-white transition hover:bg-verde-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {rotulo}
        </WhatsAppCta>
      </div>
    </section>
  );
}
