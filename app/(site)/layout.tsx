import { JsonLd } from "@/components/seo/json-ld";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { telefoneExibicao } from "@/lib/config";
import { negocioJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";

/** Casca do site público. O /admin não passa por aqui. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  // Lido no servidor e passado pra baixo: WHATSAPP_NUMERO não é NEXT_PUBLIC_,
  // então o header (client component) não conseguiria ler sozinho.
  return (
    <>
      {/*
        Identidade do negócio em toda página pública (o /admin não passa aqui).
        Não é só pra home: quando uma LLM chega por um link de ficha, é este
        bloco que diz de quem é o site — sem ele, a ficha é um imóvel órfão.
      */}
      <JsonLd dados={negocioJsonLd()} />
      <JsonLd dados={websiteJsonLd()} />

      <Header telefone={telefoneExibicao()} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
