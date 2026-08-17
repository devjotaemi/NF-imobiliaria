import Link from "next/link";

import { SeoKeywordsButton } from "@/components/seo/seo-keywords-button";
import { OlxLink } from "@/components/site/olx-link";
import { WhatsAppCta } from "@/components/site/whatsapp-cta";
import {
  IconeEmail,
  IconeFacebook,
  IconeInstagram,
  IconeRelogio,
  IconeSeta,
  IconeTelefone,
  IconeWhatsApp,
  LogoNF,
} from "@/components/ui/icons";
import {
  CONTATO,
  RODAPE_IMOVEIS,
  RODAPE_INSTITUCIONAL,
} from "@/lib/content/site";
import { telefoneExibicao } from "@/lib/config";

export function Footer() {
  const ano = new Date().getFullYear();
  const telefone = telefoneExibicao();

  return (
    <footer id="contato" className="mt-auto bg-verde-950 text-white/70">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr_1.3fr]">
          <div>
            <LogoNF claro />
            <p className="mt-5 max-w-xs text-sm leading-relaxed">
              Mais que imóveis, realizamos planos. Encontre o lugar perfeito
              para você construir sua história.
            </p>
            <p className="mt-3 text-sm font-semibold text-white">
              {CONTATO.creci}
            </p>
            <div className="mt-6 flex gap-3">
              <RedeSocial href={CONTATO.instagram} rotulo="Instagram">
                <IconeInstagram className="h-4 w-4" />
              </RedeSocial>
              <RedeSocial href={CONTATO.facebook} rotulo="Facebook">
                <IconeFacebook className="h-4 w-4" />
              </RedeSocial>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white">
                <IconeWhatsApp className="h-4 w-4" />
              </span>
            </div>
          </div>

          <ColunaLinks titulo="Institucional" itens={RODAPE_INSTITUCIONAL} />
          <ColunaLinks titulo="Imóveis" itens={RODAPE_IMOVEIS} />

          <div>
            <TituloColuna>Atendimento</TituloColuna>
            <ul className="mt-5 flex flex-col gap-3 text-sm">
              {telefone && (
                <li className="flex items-center gap-2.5">
                  <IconeTelefone className="h-4 w-4 shrink-0 text-verde-300" />
                  <a
                    href={`tel:+55${telefone.replace(/\D/g, "")}`}
                    className="transition hover:text-white"
                  >
                    {telefone}
                  </a>
                  <span className="text-white/25">|</span>
                  <IconeWhatsApp className="h-4 w-4 text-verde-300" />
                </li>
              )}
              <li className="flex items-center gap-2.5">
                <IconeEmail className="h-4 w-4 shrink-0 text-verde-300" />
                <a
                  href={`mailto:${CONTATO.email}`}
                  className="break-all transition hover:text-white"
                >
                  {CONTATO.email}
                </a>
              </li>
              {CONTATO.horarios.map((horario) => (
                <li key={horario} className="flex items-center gap-2.5">
                  <IconeRelogio className="h-4 w-4 shrink-0 text-verde-300" />
                  {horario}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <TituloColuna>Oportunidades</TituloColuna>
            <p className="mt-5 text-sm leading-relaxed">
              Receba as melhores oportunidades direto no seu WhatsApp.
            </p>
            {/*
              O mockup traz um campo de e-mail aqui. Trocamos por CTA de
              WhatsApp: não existe base de newsletter pra alimentar, e um campo
              que não envia nada seria pior que não ter campo.
            */}
            <WhatsAppCta
              origem="rodape_newsletter"
              className="mt-4 flex w-full items-center justify-between gap-3 rounded-full border border-white/20 bg-white/5 py-2 pl-5 pr-2 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/10"
            >
              <span>Quero receber</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-verde-500">
                <IconeSeta className="h-4 w-4" />
              </span>
            </WhatsAppCta>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {ano} NF Negócios Imobiliários. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-5">
            {/* Único lugar do site onde a OLX aparece. */}
            <OlxLink />
            <p>Desenvolvido com ♥ pela Verion Co.</p>
            <SeoKeywordsButton />
          </div>
        </div>
      </div>
    </footer>
  );
}

function TituloColuna({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-semibold text-white">{children}</p>
  );
}

function ColunaLinks({
  titulo,
  itens,
}: {
  titulo: string;
  itens: { rotulo: string; href: string }[];
}) {
  return (
    <div>
      <TituloColuna>{titulo}</TituloColuna>
      <ul className="mt-5 flex flex-col gap-3 text-sm">
        {itens.map((item) => (
          <li key={item.rotulo}>
            <Link href={item.href} className="transition hover:text-white">
              {item.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RedeSocial({
  href,
  rotulo,
  children,
}: {
  href: string;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={rotulo}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
    >
      {children}
    </a>
  );
}
