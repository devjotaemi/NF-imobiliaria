import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

import { SITE_URL } from "@/lib/config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Serifada só dos títulos de display. Trocar a família aqui muda o site
// inteiro — os componentes usam a utility `font-serif`, nunca o nome da fonte.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  // Sem isto, toda URL relativa em canonical/OG resolve pra localhost e o Next
  // reclama no build. É o que faz `alternates: { canonical: "/imoveis" }`
  // virar a URL absoluta que o Google exige.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NF Negócios — Imobiliária em Mirassol e São José do Rio Preto",
    template: "%s | NF Negócios",
  },
  description:
    "Imobiliária em Mirassol/SP. Casas, apartamentos e terrenos à venda e para alugar em Mirassol e São José do Rio Preto. Fale direto com a gente pelo WhatsApp.",
  // Herdado por todas as páginas; cada uma sobrescreve title/description/url.
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "NF Negócios",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "NF Negócios",
  },
};

// `themeColor` em `metadata` está deprecado desde o Next 14 — mora aqui agora.
// O valor tem que bater com o `theme_color` do public/site.webmanifest.
export const viewport: Viewport = {
  themeColor: "#22c55e",
};

// Layout raiz enxuto de propósito: layouts no App Router são aninhados, então
// qualquer cabeçalho/rodapé aqui vazaria pra dentro do /admin também.
// O visual do site fica em app/(site)/layout.tsx.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-areia-50 text-tinta">
        {children}
      </body>
    </html>
  );
}
