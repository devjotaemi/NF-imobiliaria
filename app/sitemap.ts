import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/config";
import { listarParaSitemap } from "@/lib/data/properties";

export const dynamic = "force-dynamic";

/**
 * Sitemap gerado do banco a cada requisição.
 *
 * Só entra aqui o que é canônico e indexável. As URLs de filtro do catálogo
 * (/imoveis?tipo=casa&quartos=3) ficam de fora de propósito: elas são
 * `noindex` na própria página, e listar no sitemap uma URL que pede pra não
 * ser indexada é sinal contraditório.
 *
 * `changeFrequency` e `priority` são dicas fracas — o Google trata como
 * sugestão e confia mais no `lastModified`. Ficam porque não custam nada.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const imoveis = await listarParaSitemap();

  // A carteira inteira muda quando qualquer imóvel muda — é o melhor sinal
  // disponível de "vale a pena revisitar as listagens".
  const ultimaAtualizacao = imoveis[0]?.updatedAt ?? new Date();

  const paginas: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: ultimaAtualizacao,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/imoveis`,
      lastModified: ultimaAtualizacao,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/terrenos`,
      lastModified: ultimaAtualizacao,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const fichas: MetadataRoute.Sitemap = imoveis.map((imovel) => ({
    url: `${SITE_URL}/imoveis/${imovel.slug}`,
    lastModified: imovel.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
    // Image sitemap: em imobiliária a foto é metade do anúncio, e é por aqui
    // que ela entra no Google Imagens com a ficha como página de origem.
    images: imovel.fotos[0] ? [imovel.fotos[0].url] : undefined,
  }));

  return [...paginas, ...fichas];
}
