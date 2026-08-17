import { WhatsAppCta } from "@/components/site/whatsapp-cta";
import { Icone, IconeSeta } from "@/components/ui/icons";

/**
 * Card "Simule seu projeto".
 *
 * Não existe simulador de verdade: o valor depende de padrão de acabamento e
 * metragem, que só o corretor sabe. O botão leva pro WhatsApp, que é onde a
 * simulação realmente acontece — e onde o clique vira métrica de CPL.
 */
export function SimuladorCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl bg-verde-950 p-6 text-white ${className}`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
        <Icone nome="calculadora" className="h-5 w-5" />
      </span>

      <p className="mt-4 font-medium">Simule seu projeto</p>
      <p className="mt-2 text-sm leading-relaxed text-white/70">
        Descubra o investimento estimado para construir sua casa dos sonhos.
      </p>

      <WhatsAppCta
        origem="ficha_simular"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-verde-950 transition hover:bg-areia-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Simular agora
        <IconeSeta className="h-4 w-4" />
      </WhatsAppCta>
    </div>
  );
}
