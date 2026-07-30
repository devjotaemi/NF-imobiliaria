/**
 * Ícones do site — SVG inline, sem dependência.
 *
 * O projeto já desenhava o glifo do WhatsApp à mão (whatsapp-cta.tsx); manter
 * o resto no mesmo padrão evita somar ~600 kB de biblioteca de ícones a um site
 * cuja métrica principal é conversão de tráfego pago.
 *
 * Todos aceitam `className` e herdam a cor do texto (`currentColor`).
 */

type Props = { className?: string };

const PADRAO = "h-5 w-5 shrink-0";

/** Casca comum dos ícones de traço. */
function Traco({
  className,
  children,
}: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? PADRAO}
    >
      {children}
    </svg>
  );
}

/* ---------------------------------------------------------------- navegação */

export function IconeBusca(p: Props) {
  return (
    <Traco {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </Traco>
  );
}

export function IconeMenu(p: Props) {
  return (
    <Traco {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Traco>
  );
}

export function IconeFechar(p: Props) {
  return (
    <Traco {...p}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Traco>
  );
}

export function IconeSeta(p: Props) {
  return (
    <Traco {...p}>
      <path d="M4 12h15m0 0-6-6m6 6-6 6" />
    </Traco>
  );
}

export function IconeChevronBaixo(p: Props) {
  return (
    <Traco {...p}>
      <path d="m6 9.5 6 6 6-6" />
    </Traco>
  );
}

export function IconeChevronEsquerda(p: Props) {
  return (
    <Traco {...p}>
      <path d="m15 18-6-6 6-6" />
    </Traco>
  );
}

export function IconeChevronDireita(p: Props) {
  return (
    <Traco {...p}>
      <path d="m9 18 6-6-6-6" />
    </Traco>
  );
}

export function IconeCheck(p: Props) {
  return (
    <Traco {...p}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Traco>
  );
}

export function IconeMais(p: Props) {
  return (
    <Traco {...p}>
      <path d="M12 5v14M5 12h14" />
    </Traco>
  );
}

export function IconeLimpar(p: Props) {
  return (
    <Traco {...p}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3L3 8.5" />
      <path d="M3 4v4.5h4.5" />
    </Traco>
  );
}

export function IconeGrade(p: Props) {
  return (
    <Traco {...p}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </Traco>
  );
}

export function IconeLista(p: Props) {
  return (
    <Traco {...p}>
      <path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12M3.5 6.5h.01M3.5 12h.01M3.5 17.5h.01" />
    </Traco>
  );
}

export function IconeFiltro(p: Props) {
  return (
    <Traco {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
      <circle cx="9" cy="7" r="2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="8" cy="17" r="2" fill="currentColor" stroke="none" />
    </Traco>
  );
}

/* --------------------------------------------------------------- interações */

export function IconeCoracao({
  className,
  preenchido = false,
}: Props & { preenchido?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={preenchido ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? PADRAO}
    >
      <path d="M12 20.4 4.1 12.5a4.85 4.85 0 0 1 6.85-6.85L12 6.7l1.05-1.05a4.85 4.85 0 0 1 6.85 6.85Z" />
    </svg>
  );
}

export function IconeCompartilhar(p: Props) {
  return (
    <Traco {...p}>
      <circle cx="18" cy="5.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="18.5" r="2.5" />
      <path d="m8.2 13.3 7.6 4M15.8 7.2l-7.6 4" />
    </Traco>
  );
}

export function IconePlay({ className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
      className={className ?? PADRAO}
    >
      <path d="M8.5 6.6a.8.8 0 0 1 1.2-.7l7.8 4.7a.8.8 0 0 1 0 1.4l-7.8 4.7a.8.8 0 0 1-1.2-.7z" />
    </svg>
  );
}

/* -------------------------------------------------------- imóvel e terrenos */

export function IconeQuarto(p: Props) {
  return (
    <Traco {...p}>
      <path d="M2.5 19.5v-7a2 2 0 0 1 2-2h15a2 2 0 0 1 2 2v7" />
      <path d="M5 10.5V6.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
      <path d="M12 4.5v6M2.5 17h19" />
    </Traco>
  );
}

export function IconeBanheiro(p: Props) {
  return (
    <Traco {...p}>
      <path d="M5 11.5V6a2 2 0 0 1 3.6-1.2" />
      <path d="M2.5 11.5h19v2.5a5 5 0 0 1-5 5h-9a5 5 0 0 1-5-5z" />
      <path d="m7 19-1 2.5M17 19l1 2.5" />
    </Traco>
  );
}

export function IconeVaga(p: Props) {
  return (
    <Traco {...p}>
      <path d="M4 17.5v-4.7L6 7.5h12l2 5.3v4.7" />
      <path d="M4 12.8h16" />
      <circle cx="7.5" cy="17.5" r="1.6" />
      <circle cx="16.5" cy="17.5" r="1.6" />
    </Traco>
  );
}

/** Área total — planta vista de cima com marcas de canto. */
export function IconeArea(p: Props) {
  return (
    <Traco {...p}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M9 3.5v3M15 3.5v3M3.5 9h3M3.5 15h3" />
    </Traco>
  );
}

/** Frente do terreno — cota horizontal. */
export function IconeFrente(p: Props) {
  return (
    <Traco {...p}>
      <path d="M4 6.5v11M20 6.5v11" />
      <path d="M4 12h16m0 0-3-3m3 3-3 3M4 12l3-3m-3 3 3 3" />
    </Traco>
  );
}

/** Profundidade do terreno — cota vertical. */
export function IconeProfundidade(p: Props) {
  return (
    <Traco {...p}>
      <path d="M6.5 4h11M6.5 20h11" />
      <path d="M12 4v16m0 0-3-3m3 3 3-3M12 4 9 7m3-3 3 3" />
    </Traco>
  );
}

/** Topografia. */
export function IconeTopografia(p: Props) {
  return (
    <Traco {...p}>
      <path d="M2.5 18h19" />
      <path d="m3.5 15 4.5-4 3.5 3 4-5 5 6" />
    </Traco>
  );
}

/** Posição solar. */
export function IconeSol(p: Props) {
  return (
    <Traco {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </Traco>
  );
}

/** Documentação em dia. */
export function IconeDocumento(p: Props) {
  return (
    <Traco {...p}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M13.5 3v5.5H19" />
      <path d="m9 14.5 2 2 4-4" />
    </Traco>
  );
}

export function IconeMapa(p: Props) {
  return (
    <Traco {...p}>
      <path d="M12 21s6.5-5.4 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15.6 12 21 12 21Z" />
      <circle cx="12" cy="10.3" r="2.4" />
    </Traco>
  );
}

export function IconeCasa(p: Props) {
  return (
    <Traco {...p}>
      <path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z" />
      <path d="M9.5 21v-6.5h5V21" />
    </Traco>
  );
}

export function IconeChave(p: Props) {
  return (
    <Traco {...p}>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="m10.7 12.3 8.8-8.8" />
      <path d="m15.5 7.5 2.5 2.5 2.5-2.5L18 5" />
    </Traco>
  );
}

export function IconeProjeto(p: Props) {
  return (
    <Traco {...p}>
      <path d="M3.5 20.5h17" />
      <path d="m5 17 9.5-9.5 3 3L8 20H5z" />
      <path d="m14.5 4.5 2-2 3 3-2 2" />
    </Traco>
  );
}

export function IconeConstrucao(p: Props) {
  return (
    <Traco {...p}>
      <path d="M4.5 15a7.5 7.5 0 0 1 15 0" />
      <path d="M9.5 15V7.2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V15" />
      <rect x="2.5" y="15" width="19" height="3.5" rx="1.75" />
    </Traco>
  );
}

export function IconeCalculadora(p: Props) {
  return (
    <Traco {...p}>
      <rect x="4.5" y="2.5" width="15" height="19" rx="2.5" />
      <path d="M8 7h8" />
      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01" />
    </Traco>
  );
}

/* ---------------------------------------------------------------- confiança */

export function IconeEscudo(p: Props) {
  return (
    <Traco {...p}>
      <path d="M12 21s7-3.4 7-9V6.2L12 3 5 6.2V12c0 5.6 7 9 7 9Z" />
      <path d="m9 12 2 2 4-4" />
    </Traco>
  );
}

export function IconeRaio(p: Props) {
  return (
    <Traco {...p}>
      <path d="M13.2 2.5 4.8 13.4h6.3l-1 8.1 8.6-11.2h-6.3z" />
    </Traco>
  );
}

export function IconeGrafico(p: Props) {
  return (
    <Traco {...p}>
      <path d="M3 20.5h18" />
      <path d="M6.5 20.5v-6M12 20.5V7.5M17.5 20.5v-9" />
    </Traco>
  );
}

export function IconeHeadset(p: Props) {
  return (
    <Traco {...p}>
      <path d="M4.5 14.5v-2.4a7.5 7.5 0 0 1 15 0v2.4" />
      <path d="M4.5 13.5h1.6a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H6a1.5 1.5 0 0 1-1.5-1.5zM19.5 13.5h-1.6a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1H18a1.5 1.5 0 0 0 1.5-1.5z" />
      <path d="M17 18.5v.5a2.5 2.5 0 0 1-2.5 2.5H12" />
    </Traco>
  );
}

export function IconeRelogio(p: Props) {
  return (
    <Traco {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.2l3.2 1.9" />
    </Traco>
  );
}

export function IconeTelefone(p: Props) {
  return (
    <Traco {...p}>
      <path d="M6.2 3.5h3.1l1.5 3.9-2 1.4a12.5 12.5 0 0 0 5.4 5.4l1.4-2 3.9 1.5v3.1a2 2 0 0 1-2.2 2A16.8 16.8 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2Z" />
    </Traco>
  );
}

export function IconeEmail(p: Props) {
  return (
    <Traco {...p}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="m3.5 7.5 8.5 5.8 8.5-5.8" />
    </Traco>
  );
}

/* -------------------------------------------------------- comércios/serviços */

export function IconeMercado(p: Props) {
  return (
    <Traco {...p}>
      <circle cx="9.5" cy="20" r="1.4" />
      <circle cx="17.5" cy="20" r="1.4" />
      <path d="M2.5 3.5h2.3l2.5 11.3a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.4-1.1L21 7.5H5.8" />
    </Traco>
  );
}

export function IconeEscola(p: Props) {
  return (
    <Traco {...p}>
      <path d="m12 3.8 9.5 4.4-9.5 4.4-9.5-4.4z" />
      <path d="M6.8 10.4v5c0 1.5 2.3 2.8 5.2 2.8s5.2-1.3 5.2-2.8v-5" />
    </Traco>
  );
}

export function IconeFarmacia(p: Props) {
  return (
    <Traco {...p}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M12 8.5v7M8.5 12h7" />
    </Traco>
  );
}

export function IconePadaria(p: Props) {
  return (
    <Traco {...p}>
      <path d="M4 13.5a8 8 0 0 1 16 0v3.7a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 17.2z" />
      <path d="M9 13.5v5.5M13 13.5v5.5" />
    </Traco>
  );
}

export function IconeShopping(p: Props) {
  return (
    <Traco {...p}>
      <path d="M4.8 7.5h14.4l-1.1 12.2a1.5 1.5 0 0 1-1.5 1.3H7.4a1.5 1.5 0 0 1-1.5-1.3z" />
      <path d="M8.8 7.5V6a3.2 3.2 0 0 1 6.4 0v1.5" />
    </Traco>
  );
}

/* ------------------------------------------------------------------- redes */

export function IconeInstagram(p: Props) {
  return (
    <Traco {...p}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <path d="M17 7h.01" strokeWidth={2.2} />
    </Traco>
  );
}

export function IconeFacebook({ className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
      className={className ?? PADRAO}
    >
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2.5V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

export function IconeWhatsApp({ className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className ?? `${PADRAO} fill-current`}
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.83 9.83 0 0 1 2.892 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.82 11.82 0 0 0 20.464 3.488" />
    </svg>
  );
}

/**
 * Registro nome -> ícone.
 *
 * `lib/content/site.ts` guarda o nome como string porque é dado, não JSX —
 * assim o conteúdo continua serializável e o arquivo não precisa virar `.tsx`.
 */
export const ICONES: Record<string, (props: Props) => React.ReactElement> = {
  headset: IconeHeadset,
  escudo: IconeEscudo,
  raio: IconeRaio,
  grafico: IconeGrafico,
  mapa: IconeMapa,
  projeto: IconeProjeto,
  construcao: IconeConstrucao,
  documento: IconeDocumento,
  chave: IconeChave,
  casa: IconeCasa,
  mercado: IconeMercado,
  escola: IconeEscola,
  farmacia: IconeFarmacia,
  padaria: IconePadaria,
  shopping: IconeShopping,
  calculadora: IconeCalculadora,
};

export function Icone({ nome, className }: Props & { nome: string }) {
  const Componente = ICONES[nome] ?? IconeCasa;
  return <Componente className={className} />;
}

/** Marca da NF usada no header e no rodapé. */
export function LogoNF({
  className,
  claro = false,
}: Props & { claro?: boolean }) {
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <span
        className={`font-serif text-3xl leading-none ${
          claro ? "text-white" : "text-verde-900"
        }`}
      >
        NF
      </span>
      <span
        className={`text-[0.6rem] font-semibold uppercase leading-[1.25] tracking-[0.14em] ${
          claro ? "text-white/80" : "text-tinta-500"
        }`}
      >
        Negócios
        <br />
        Imobiliários
      </span>
    </span>
  );
}
