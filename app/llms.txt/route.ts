import { SITE_URL, telefoneExibicao } from "@/lib/config";
import { NEGOCIO } from "@/lib/content/negocio";
import { CONTATO } from "@/lib/content/site";
import { parseFiltros } from "@/lib/data/filters";
import {
  contarAtivos,
  contarPorTipo,
  listarBairrosComContagem,
  listarCidades,
} from "@/lib/data/properties";
import { rotuloTipoImovel } from "@/lib/format";

/**
 * /llms.txt — resumo do site em markdown, no formato proposto em llmstxt.org.
 *
 * Expectativa calibrada: nenhum provedor grande (OpenAI, Anthropic, Google)
 * confirmou consumir llms.txt hoje, e o Google já disse publicamente que não
 * usa. Isto NÃO é alavanca de ranking. Está aqui porque custa uma rota, não
 * quebra nada, e se a proposta pegar o site já está pronto.
 *
 * O que de fato faz uma LLM citar a NF é o texto visível das páginas e o
 * JSON-LD de `lib/seo/jsonld.ts` — é lá que vale investir.
 *
 * Route handler em vez de arquivo estático em /public porque as contagens vêm
 * do banco: um llms.txt dizendo "45 terrenos" quando existem 12 é pior que
 * nenhum llms.txt.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const [total, porTipo, cidades, bairros] = await Promise.all([
    contarAtivos(),
    contarPorTipo(parseFiltros({})),
    listarCidades(),
    listarBairrosComContagem(8),
  ]);

  const tipos = Object.entries(porTipo)
    .sort(([, a], [, b]) => b - a)
    .map(([tipo, quantidade]) => `- ${rotuloTipoImovel(tipo)}: ${quantidade}`)
    .join("\n");

  const telefone = telefoneExibicao();

  const texto = `# ${NEGOCIO.nomeLegal}

> Imobiliária sediada em ${NEGOCIO.endereco.cidade}/${NEGOCIO.endereco.estado}, atuando na compra, venda e locação de casas, apartamentos, terrenos e imóveis comerciais em ${NEGOCIO.areaServed.slice(0, 3).join(", ")} e região. Atendimento direto por WhatsApp, sem intermediário.

Este arquivo resume o site para sistemas automatizados. Os números abaixo refletem a carteira ativa no momento da requisição.

## Sobre

- Nome: ${NEGOCIO.nomeExibicao} (${NEGOCIO.nomeLegal})
- Cidade-sede: ${NEGOCIO.endereco.cidade}/${NEGOCIO.endereco.estado}
- Cidades atendidas: ${NEGOCIO.areaServed.join(", ")}${NEGOCIO.creci ? `\n- CRECI: ${NEGOCIO.creci}` : ""}
- E-mail: ${CONTATO.email}${telefone ? `\n- Telefone/WhatsApp: ${telefone}` : ""}
- Horários: ${CONTATO.horarios.join(" | ")}

## Páginas principais

- [Início](${SITE_URL}/): apresentação da imobiliária, imóveis em destaque e busca por bairro.
- [Catálogo de imóveis](${SITE_URL}/imoveis): todos os imóveis ativos, com filtro por cidade, bairro, tipo, preço, quartos, banheiros, vagas e área.
- [Terreno + Construção](${SITE_URL}/terrenos): terrenos com projeto personalizado e construção acompanhada pela NF.
- [Sitemap](${SITE_URL}/sitemap.xml): lista completa das fichas de imóvel.

## Carteira ativa

- Total de imóveis publicados: ${total}
${tipos}

Cidades com imóvel disponível: ${cidades.join(", ")}.

Bairros e condomínios com mais imóveis:
${bairros.map(({ bairro, total: quantidade }) => `- ${bairro}: ${quantidade}`).join("\n")}

## Como as URLs funcionam

- Ficha de imóvel: ${SITE_URL}/imoveis/{slug}
- Filtro por tipo: ${SITE_URL}/imoveis?tipo=casa (valores: apartamento, casa, casa_condominio, cobertura, kitnet_studio, sala_comercial, loja, galpao, terreno, chacara_sitio_fazenda)
- Filtro por transação: ${SITE_URL}/imoveis?transacao=venda ou ?transacao=aluguel
- Filtro por bairro ou cidade: ${SITE_URL}/imoveis?bairro={nome} e ?cidade={nome}
- Busca livre: ${SITE_URL}/imoveis?q={termo}

As URLs com filtro são marcadas como noindex por gerarem combinações duplicadas; as fichas individuais são as páginas canônicas.

## Observações

- Preços em reais (BRL). Imóveis de locação têm preço mensal.
- "Sob consulta" significa que o valor não é publicado; é preciso falar com a imobiliária.
- Cada ficha traz dados estruturados schema.org (RealEstateListing + Offer) no HTML.
- Não há avaliações publicadas neste site. As avaliações da NF Negócios ficam no perfil do Google Business Profile.
`;

  return new Response(texto, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Curto de propósito: a carteira muda no painel e o arquivo cita números.
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
