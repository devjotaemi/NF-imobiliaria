import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // PALIATIVO 2026-08-31: o otimizador da Vercel (`/_next/image`) passou a
    // devolver 402 — cota de Image Optimization do plano estourada — e derrubou
    // todas as fotos do site. `unoptimized` faz o `next/image` servir a origem
    // direto, sem passar pelo otimizador. Custo: sem resize/WebP, imagens mais
    // pesadas. Remover quando resolver a causa: subir pro plano Pro (excedente
    // cobrado, não bloqueia) ou mover as fotos já redimensionadas pro Blob.
    unoptimized: true,
    remotePatterns: [
      // Fotos dos imóveis ficam no Vercel Blob.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },

      // APENAS pro seed de demonstração (`npm run seed:demo`) e pelas imagens
      // institucionais de `lib/content/site.ts`. Remover junto com o seed
      // quando o acervo real de fotos estiver no Blob.
      { protocol: "https", hostname: "images.unsplash.com" },

      // Fotos dos imóveis importados do Diário Imóveis (`npm run importar:diario`).
      // São fotos da própria NF, hospedadas no portal. Deixa de ser necessário
      // depois de rodar o import com `--fotos=blob`.
      { protocol: "https", hostname: "s3.diario.one" },

      // Capas de bairro escolhidas manualmente pelo dono da NF (CAPAS_BAIRRO
      // em lib/content/site.ts). Hosts de terceiros — se a foto de algum
      // bairro for trocada por um link de outro domínio, adicionar aqui.
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com" },
      { protocol: "https", hostname: "static.arboimoveis.com.br" },
    ],
  },
};

export default nextConfig;
