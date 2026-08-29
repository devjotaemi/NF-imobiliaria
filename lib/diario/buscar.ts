import type { AnuncioDiario } from "@/lib/diario/mapear";

/**
 * Acesso ao Diário Imóveis.
 *
 * Fica separado de `mapear.ts` porque é a parte volátil: mapeamento é lógica
 * pura e testável, isto aqui depende da infra do portal, que já mudou de forma
 * uma vez.
 *
 * ─── A lição que custou 203 imóveis ─────────────────────────────────────────
 * A página `/imobiliarias/<slug>` embute só os 25 primeiros anúncios no
 * `__NEXT_DATA__`. O resto entra por clique no botão "VER MAIS", que chama uma
 * API em OUTRO host. Parâmetros de paginação na URL da página são ignorados
 * pelo servidor, então ela devolve os mesmos 25 com `?page=2`, `?limit=100` ou
 * o que for — o que passa a falsa impressão de que a carteira toda são 25.
 *
 * É por isso que a listagem vem da API, não da página.
 */

const HOST_SITE = "https://diarioimoveis.com.br";
const HOST_API = "https://api.diarioimoveis.com.br";

/** Identifica quem está chamando — cortesia mínima com o portal parceiro. */
const AGENTE = "NFNegocios-Importador/1.0 (+contato@nfimoveis.com.br)";

/** Tamanho de página da API. Lote menor que isso significa última página. */
const POR_PAGINA = 25;

/** Teto de segurança: 60 páginas = 1500 anúncios, muito acima da carteira. */
const MAX_PAGINAS = 60;

export type PerfilDiario = {
  id: string;
  nome: string;
};

async function pegarJson(url: string): Promise<unknown> {
  const resposta = await fetch(url, { headers: { "User-Agent": AGENTE } });
  if (!resposta.ok) {
    throw new Error(`${resposta.status} em ${url}`);
  }
  return resposta.json();
}

/**
 * Resolve o slug do perfil no `clientId` que a API usa.
 *
 * Vale o passo extra: o slug é legível e estável o suficiente pra ficar no
 * `.env`, e o `clientId` que sai daqui é justamente o que o importador usa
 * pra provar que todo anúncio baixado é da NF.
 */
export async function resolverPerfil(slug: string): Promise<PerfilDiario> {
  const url = `${HOST_SITE}/imobiliarias/${slug}`;
  const resposta = await fetch(url, { headers: { "User-Agent": AGENTE } });

  if (!resposta.ok) {
    throw new Error(`Perfil "${slug}" respondeu ${resposta.status} em ${url}`);
  }

  const html = await resposta.text();
  // [\s\S] em vez da flag /s: o tsconfig do projeto mira ES2017.
  const encontrado = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );

  if (!encontrado) {
    throw new Error(
      "Não achei o __NEXT_DATA__ na página do perfil. O portal mudou de " +
        "tecnologia — este importador precisa ser refeito.",
    );
  }

  const dados = JSON.parse(encontrado[1]) as {
    props?: { pageProps?: { realState?: { id?: string; name?: string } } };
  };
  const perfil = dados.props?.pageProps?.realState;

  if (!perfil?.id) {
    throw new Error(
      `Perfil "${slug}" não tem realState.id — confira o slug em ${url}`,
    );
  }

  return { id: perfil.id, nome: perfil.name ?? slug };
}

/**
 * Todos os anúncios ativos de um cliente, percorrendo a paginação da API.
 *
 * Para no primeiro lote incompleto. Deduplica por `id` por precaução: se a API
 * repetir registros entre páginas, é melhor importar de menos do que gravar o
 * mesmo imóvel duas vezes com slugs diferentes.
 */
export async function buscarAnunciosDoCliente(
  clientId: string,
  aoProgredir?: (pagina: number, acumulado: number) => void,
): Promise<AnuncioDiario[]> {
  const anuncios: AnuncioDiario[] = [];
  const vistos = new Set<string>();

  for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
    const url = `${HOST_API}/api/listings/client/${clientId}?page=${pagina}&isActive=true`;
    const lote = await pegarJson(url);

    if (!Array.isArray(lote)) {
      throw new Error(
        `A API devolveu ${typeof lote} em vez de lista na página ${pagina}. ` +
          `O formato mudou — não vou importar dado que não sei ler.`,
      );
    }

    for (const bruto of lote as AnuncioDiario[]) {
      if (!bruto?.id || vistos.has(bruto.id)) continue;
      vistos.add(bruto.id);
      anuncios.push(bruto);
    }

    aoProgredir?.(pagina, anuncios.length);

    // Lote menor que a página cheia = acabou.
    if (lote.length < POR_PAGINA) return anuncios;
  }

  throw new Error(
    `Passei de ${MAX_PAGINAS} páginas sem chegar ao fim. Ou a carteira ` +
      `cresceu muito, ou a API entrou em laço — confira antes de subir o teto.`,
  );
}
