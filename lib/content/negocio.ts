/**
 * Identidade do negócio — os dados que descrevem a NF como empresa, não como site.
 *
 * Isto alimenta o JSON-LD (`lib/seo/jsonld.ts`) que o Google e as LLMs leem para
 * entender quem é a NF, onde fica e o que atende. Separado de `site.ts` de
 * propósito: lá é copy de marketing (muda quando o dono quer), aqui é fato
 * cadastral (muda quando a empresa muda).
 *
 * REGRA IMPORTANTE: campo vazio é campo omitido.
 *
 * O `omitirVazios()` do jsonld.ts remove qualquer chave em branco antes de
 * publicar. Nunca preencha com placeholder ("a definir", "https://instagram.com")
 * só para não ficar vazio — dado falso em structured data é o que gera ação
 * manual do Google. Prefira deixar em branco até ter o dado real.
 *
 * Ordem de prioridade pra preencher, do que mais rende pro que menos:
 *   1. endereco + geo  → é o que sustenta busca local ("imobiliária em Mirassol")
 *   2. creci           → sinal de legitimidade que o Google associa ao setor
 *   3. perfis          → conecta o site ao Google Business Profile e às redes
 */

/** Cidade-âncora do negócio. Guia as meta descriptions e o `address` do schema. */
export const CIDADE_SEDE = "Mirassol";
export const ESTADO_SEDE = "SP";

type Endereco = {
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
};

type Horario = {
  /** Dias em inglês — é o vocabulário que o schema.org exige. */
  dias: string[];
  abre: string;
  fecha: string;
};

type Negocio = {
  nomeLegal: string;
  nomeExibicao: string;
  creci: string;
  cnpj: string;
  endereco: Endereco;
  geo: { latitude: string; longitude: string };
  perfis: { instagram: string; facebook: string; googleBusinessProfile: string };
  horarios: Horario[];
  areaServed: string[];
  faixaPreco: string;
};

export const NEGOCIO: Negocio = {
  /** Razão social / nome completo, como aparece no rodapé. */
  nomeLegal: "NF Negócios Imobiliários",
  /** Nome curto de marca, usado em títulos e no `name` do schema. */
  nomeExibicao: "NF Negócios",

  /**
   * CRECI da imobiliária (ex.: "CRECI-SP 12345-J").
   * Vai para `identifier` no schema — não invente formato, copie do documento.
   */
  creci: "CRECI 042193/SP",

  /** CNPJ só com dígitos ou formatado, tanto faz. Vazio = omitido. */
  cnpj: "26.342.496/0001-75",

  /**
   * Endereço do escritório.
   *
   * `logradouro` + `numero` viram `streetAddress`. Se você não tem endereço
   * público (só atende com hora marcada), deixe os dois vazios: o schema cai
   * para cidade/estado, que ainda é melhor que nada.
   */
  endereco: {
    logradouro: "Avenida Djair José Marques",
    numero: "3042",
    bairro: "Loteamento Residencial Regissol",
    cidade: CIDADE_SEDE,
    estado: ESTADO_SEDE,
    cep: "15133-332",
  },

  /**
   * Coordenadas do escritório.
   *
   * Como pegar: Google Maps → clique direito no ponto exato da porta →
   * o primeiro item do menu são as coordenadas, já no formato "lat, lng".
   * Precisa ser a porta mesmo — o Google cruza isto com o Business Profile.
   *
   * Preencher os dois ou nenhum: latitude sem longitude é descartado.
   */
  geo: {
    latitude: "-20.803911",
    longitude: "-49.499696",
  },

  /**
   * Perfis oficiais. Entram em `sameAs`, que é como o Google amarra este site
   * à ficha do Google Business Profile (onde vivem as 66 avaliações).
   *
   * O `googleBusinessProfile` é o mais valioso dos três. Pegue em:
   * Google Maps → sua ficha → Compartilhar → copiar link.
   *
   * NÃO copie os valores de `CONTATO` em `site.ts`: lá estão como
   * "https://instagram.com" (placeholder do template), o que seria lixo aqui.
   *
   * A OLX não entra aqui — já vem de NEXT_PUBLIC_OLX_PERFIL_URL, e o jsonld.ts
   * junta as duas fontes. Duplicar daria dois lugares pra esquecer de atualizar.
   */
  perfis: {
    instagram: "https://www.instagram.com/nfnegociosimobiliarios",
    facebook: "https://www.facebook.com/nfnegociosimobiliariosejuridicos",
    googleBusinessProfile: "https://g.page/r/CcvxuiR1NCr-EAI",
  },

  /**
   * Horários em formato de máquina. O `CONTATO.horarios` de `site.ts` é a
   * versão pra humano ("Seg - Sex: 08h às 18h") e continua sendo o que aparece
   * no rodapé; esta aqui é a mesma informação em `OpeningHoursSpecification`.
   * Se mudar um, mude o outro.
   */
  horarios: [
    {
      dias: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      abre: "08:00",
      fecha: "18:00",
    },
    { dias: ["Saturday"], abre: "08:00", fecha: "12:00" },
  ],

  /**
   * Cidades atendidas, da mais para a menos relevante.
   *
   * Vira `areaServed`. Mirassol vem primeiro porque é a sede — é o sinal de
   * que a NF é local dali, e não uma imobiliária de fora que também atende.
   * Só liste cidade onde vocês realmente têm ou já tiveram carteira.
   */
  areaServed: [
    "Mirassol",
    "São José do Rio Preto",
    "Bady Bassitt",
    "Cedral",
    "Guapiaçu",
  ],

  /** Faixa de preço no formato do schema ($ a $$$$). Carteira ampla ≈ "$$". */
  faixaPreco: "$$",
};

/** Perfis efetivamente preenchidos. Vazio enquanto ninguém preencher. */
export function perfisPreenchidos(): string[] {
  return Object.values(NEGOCIO.perfis).filter((url) => url.trim().length > 0);
}
