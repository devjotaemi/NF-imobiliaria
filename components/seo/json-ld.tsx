/**
 * Injeta um bloco de structured data na página.
 *
 * Escapar o sinal de menor pelo equivalente unicode é a recomendação oficial
 * da doc do Next (node_modules/next/dist/docs/01-app/02-guides/json-ld.md):
 * `JSON.stringify` não escapa HTML, então uma descrição de imóvel contendo uma
 * tag de fechamento de script encerraria o bloco e viraria injeção. A descrição
 * vem do painel — é texto digitado por usuário, não constante do código.
 *
 * Tag nativa de propósito, não `next/script`: isto é dado, não código a executar.
 */
export function JsonLd({ dados }: { dados: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(dados).replace(/</g, "\\u003c"),
      }}
    />
  );
}
