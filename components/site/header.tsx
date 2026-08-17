"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  IconeChevronDireita,
  IconeFechar,
  IconeMenu,
  IconeWhatsApp,
  LogoNF,
} from "@/components/ui/icons";
import { NAV_PRINCIPAL } from "@/lib/content/site";

/**
 * Cabeçalho do site.
 *
 * Client component por duas razões: o menu do celular tem estado, e a home usa
 * a versão transparente sobre o hero escuro enquanto as demais páginas usam a
 * branca. A rota decide — evita que cada página precise passar a variante.
 *
 * O telefone chega por prop porque `WHATSAPP_NUMERO` é variável de servidor;
 * ler `process.env` aqui devolveria undefined no navegador.
 */
export function Header({ telefone }: { telefone: string }) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const [rolou, setRolou] = useState(false);

  const sobreHero = pathname === "/";

  useEffect(() => {
    if (!sobreHero) return;
    const aoRolar = () => setRolou(window.scrollY > 24);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, [sobreHero]);

  // Fecha o menu ao trocar de página — sem isso ele fica aberto por cima da
  // rota nova, já que o layout não remonta na navegação do App Router.
  // Ajuste durante o render (e não num efeito) porque a origem da mudança é
  // uma prop derivada da rota, não um sistema externo.
  const [rotaDoMenu, setRotaDoMenu] = useState(pathname);
  if (rotaDoMenu !== pathname) {
    setRotaDoMenu(pathname);
    setAberto(false);
  }

  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberto]);

  const transparente = sobreHero && !rolou;

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        transparente
          ? "bg-transparent"
          : "border-b border-linha bg-white/95 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="NF Negócios Imobiliários — início">
          <LogoNF claro={transparente} />
        </Link>

        <nav className="ml-auto hidden items-center gap-6 xl:flex">
          {NAV_PRINCIPAL.map((item) => (
            <Link
              key={item.rotulo}
              href={item.href}
              className={`text-sm transition ${
                transparente
                  ? "text-white/90 hover:text-white"
                  : "text-tinta-500 hover:text-tinta"
              }`}
            >
              {item.rotulo}
            </Link>
          ))}
        </nav>

        {telefone && (
          <a
            href={`tel:+55${telefone.replace(/\D/g, "")}`}
            className={`ml-auto hidden items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition sm:inline-flex xl:ml-0 ${
              transparente
                ? "border-white/30 text-white hover:bg-white/10"
                : "border-linha text-tinta hover:border-verde-600 hover:text-verde-700"
            }`}
          >
            <IconeWhatsApp className="h-4 w-4 text-verde-500" />
            {telefone}
          </a>
        )}

        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          aria-expanded={aberto}
          className={`ml-auto flex h-11 w-11 items-center justify-center rounded-full transition sm:ml-0 ${
            transparente
              ? "bg-white text-verde-950 hover:bg-areia-100"
              : "bg-verde-950 text-white hover:bg-verde-900"
          }`}
        >
          <IconeMenu />
        </button>
      </div>

      {aberto && <MenuMobile telefone={telefone} aoFechar={() => setAberto(false)} />}
    </header>
  );
}

function MenuMobile({
  telefone,
  aoFechar,
}: {
  telefone: string;
  aoFechar: () => void;
}) {
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  return (
    <div className="fixed inset-0 z-50 bg-verde-950 text-white">
      <div className="mx-auto flex h-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <LogoNF claro />
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar menu"
            className="ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
          >
            <IconeFechar />
          </button>
        </div>

        <nav className="mt-8 flex-1 overflow-y-auto">
          <ul className="flex flex-col">
            {NAV_PRINCIPAL.map((item) => (
              <li key={item.rotulo}>
                <Link
                  href={item.href}
                  onClick={aoFechar}
                  className="flex items-center justify-between border-b border-white/10 py-4 font-serif text-2xl transition hover:text-verde-300"
                >
                  {item.rotulo}
                  <IconeChevronDireita className="h-5 w-5 text-white/40" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {telefone && (
          <a
            href={`tel:+55${telefone.replace(/\D/g, "")}`}
            className="mb-2 inline-flex items-center justify-center gap-2 rounded-full bg-verde-500 px-6 py-3.5 font-semibold text-white transition hover:bg-verde-600"
          >
            <IconeWhatsApp className="h-5 w-5" />
            {telefone}
          </a>
        )}
      </div>
    </div>
  );
}
