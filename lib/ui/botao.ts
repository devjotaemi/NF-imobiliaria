/**
 * Classes dos botões em um lugar só.
 *
 * São constantes de string em vez de um componente <Button> porque os botões do
 * site são metade <Link>, metade <a> externo (o CTA do WhatsApp precisa ser
 * âncora comum pra funcionar sem JS) e metade <button> de formulário. Um
 * componente único teria que abstrair os três — a string resolve sem camada.
 */

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2";

/** Verde escuro cheio — ação principal da tela. */
export const BOTAO_PRIMARIO = `${BASE} bg-verde-700 px-6 py-3 text-white hover:bg-verde-800 focus-visible:outline-verde-700`;

/** Verde claro cheio — usado nos CTAs de WhatsApp sobre fundo claro. */
export const BOTAO_WHATSAPP = `${BASE} bg-verde-500 px-6 py-3 text-white hover:bg-verde-600 focus-visible:outline-verde-500`;

/** Contorno — ação secundária ao lado de um primário. */
export const BOTAO_CONTORNO = `${BASE} border border-linha bg-white px-6 py-3 text-tinta hover:border-tinta-400 hover:bg-areia-50 focus-visible:outline-verde-700`;

/** Contorno sobre fundo escuro. */
export const BOTAO_CONTORNO_CLARO = `${BASE} border border-white/30 px-6 py-3 text-white hover:border-white/60 hover:bg-white/10 focus-visible:outline-white`;

/** Branco cheio sobre fundo escuro. */
export const BOTAO_CLARO = `${BASE} bg-white px-6 py-3 text-verde-950 hover:bg-areia-100 focus-visible:outline-white`;

/** Versão compacta pra dentro de cards e barras. */
export const BOTAO_PEQUENO =
  "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2";

/** Pílula neutra — filtros, chips, "Ver todos". */
export const PILULA = `${BOTAO_PEQUENO} border border-linha bg-white text-tinta hover:border-tinta-400 focus-visible:outline-verde-700`;

/** Card branco padrão do site. */
export const CARTAO = "rounded-2xl border border-linha bg-white";

/** Campo de formulário (select e input) da barra de busca e dos filtros. */
export const CAMPO =
  "w-full rounded-xl border border-linha bg-white px-3 py-2.5 text-sm text-tinta outline-none transition focus:border-verde-600 focus:ring-2 focus:ring-verde-100";

/** Rótulo pequeno em maiúsculas que abre as seções ("DESTAQUES", "BAIRROS"). */
export const SOBRANCELHA =
  "text-xs font-semibold uppercase tracking-[0.18em] text-sage";
