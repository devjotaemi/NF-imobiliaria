import { IconeWhatsApp } from "@/components/ui/icons";
import type { Placement } from "@/lib/whatsapp/track-click";

/**
 * O único CTA do site.
 *
 * É um <a href> comum apontando pra rota de redirecionamento — sem onClick,
 * sem beacon. Funciona sem JS e não tem corrida entre "registrou o clique" e
 * "abriu o WhatsApp".
 *
 * Repare que não carrega UTM na URL: a origem da visita já está no cookie
 * gravado pelo proxy, e a rota lê de lá.
 */
export function WhatsAppCta({
  slugImovel,
  origem,
  children,
  className,
}: {
  slugImovel?: string | null;
  origem: Placement;
  children?: React.ReactNode;
  className?: string;
}) {
  const params = new URLSearchParams({ origem });
  if (slugImovel) params.set("imovel", slugImovel);

  return (
    <a
      href={`/api/whatsapp-click?${params.toString()}`}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      }
    >
      <IconeWhatsApp className="h-5 w-5 shrink-0 fill-current" />
      {children ?? "Falar no WhatsApp"}
    </a>
  );
}
