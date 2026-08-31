import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/config";

/**
 * Crawlers de IA que a gente quer explicitamente dentro.
 *
 * O default já é liberado, então isto não muda comportamento hoje — é uma
 * declaração de intenção. Muita imobiliária bloqueia esses agentes por reflexo
 * de "proteger o conteúdo"; aqui é o contrário, porque ser lido é justamente o
 * que faz o ChatGPT citar a NF quando perguntam por imobiliária em Mirassol.
 *
 * Vale saber quem é quem: GPTBot e ClaudeBot alimentam treino/respostas,
 * OAI-SearchBot e PerplexityBot alimentam busca com citação, e Google-Extended
 * NÃO é crawler — é um controle à parte que só diz se o conteúdo já rastreado
 * pelo Googlebot pode ir pro Gemini. Bloquear ele não afeta a Busca.
 */
const AGENTES_DE_IA = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Higiene, não segurança — o que protege o painel é a sessão.
        disallow: ["/admin", "/api"],
      },
      {
        userAgent: AGENTES_DE_IA,
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
