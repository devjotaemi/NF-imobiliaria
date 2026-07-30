/**
 * Conteúdo institucional do site.
 *
 * Fica aqui, e não no banco, porque nada disto varia por imóvel: é a copy das
 * seções de marketing (como funciona, projetos inspiradores, selos) e a
 * navegação. Colocar no Prisma custaria migration + tela de painel para um
 * texto que muda uma vez por ano.
 *
 * O que É do imóvel — preço, área, fotos, cômodos — continua vindo do banco.
 * Os campos de terreno abaixo (topografia, posição solar) são os rótulos
 * PADRÃO da ficha: o schema ainda não tem colunas próprias pra eles.
 */

/** Monta a URL de uma foto de demonstração. Ver `prisma/seed-demo.ts`. */
export function fotoDemo(id: string, largura = 1600): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${largura}&q=80`;
}

/* ------------------------------------------------------------- navegação */

export type ItemNav = { rotulo: string; href: string };

export const NAV_PRINCIPAL: ItemNav[] = [
  { rotulo: "Comprar", href: "/imoveis?transacao=venda" },
  { rotulo: "Alugar", href: "/imoveis?transacao=aluguel" },
  { rotulo: "Terrenos + Construção", href: "/terrenos" },
  { rotulo: "Lançamentos", href: "/imoveis?destaque=1" },
  { rotulo: "Anunciar meu imóvel", href: "/#anunciar" },
  { rotulo: "Sobre nós", href: "/#sobre" },
  { rotulo: "Contato", href: "/#contato" },
];

export const RODAPE_INSTITUCIONAL: ItemNav[] = [
  { rotulo: "Sobre nós", href: "/#sobre" },
  { rotulo: "Nossos corretores", href: "/#sobre" },
  { rotulo: "Trabalhe conosco", href: "/#contato" },
  { rotulo: "Política de privacidade", href: "/#contato" },
];

export const RODAPE_IMOVEIS: ItemNav[] = [
  { rotulo: "Comprar", href: "/imoveis?transacao=venda" },
  { rotulo: "Alugar", href: "/imoveis?transacao=aluguel" },
  { rotulo: "Terrenos + Construção", href: "/terrenos" },
  { rotulo: "Lançamentos", href: "/imoveis?destaque=1" },
];

export const CONTATO = {
  creci: "CJ31069",
  email: "contato@nfimoveis.com.br",
  horarios: ["Seg - Sex: 08h às 18h", "Sáb: 08h às 12h"],
  instagram: "https://instagram.com",
  facebook: "https://facebook.com",
};

/* ------------------------------------------------------------------ home */

export const HERO_HOME = {
  imagem: fotoDemo("photo-1512917774080-9991f1c4c750", 1920),
  provaSocial: "+ de 500 famílias realizadas em São José do Rio Preto e região",
};

export type Selo = { icone: string; titulo: string; texto: string };

export const SELOS: Selo[] = [
  {
    icone: "headset",
    titulo: "Atendimento humano",
    texto: "Especialistas prontos para te ajudar sempre.",
  },
  {
    icone: "escudo",
    titulo: "Imóveis verificados",
    texto: "Segurança e transparência em cada negociação.",
  },
  {
    icone: "raio",
    titulo: "Agilidade na negociação",
    texto: "Processos simples e sem burocracia.",
  },
  {
    icone: "grafico",
    titulo: "Melhores oportunidades",
    texto: "Imóveis selecionados para o que você precisa.",
  },
];

export const ANUNCIE = {
  imagem: fotoDemo("photo-1568605114967-8130f3a36994", 1200),
  visualizacoes: "+2.500",
  imoveisVendidos: "+120 imóveis vendidos",
};

/**
 * Fotos de capa dos bairros da home, escolhidas à mão pelo dono da NF.
 *
 * A chave precisa bater exatamente com `Property.bairro` no banco — a home
 * mostra os bairros com mais imóveis (`listarBairrosComContagem`), e se a
 * carteira mudar, um bairro novo pode entrar no top 5 sem estar aqui. Nesse
 * caso ele cai no fallback (mesma foto genérica de antes) até alguém escolher
 * uma foto pra ele.
 */
const CAPAS_BAIRRO: Record<string, string> = {
  "Residencial Regissol I":
    "https://i.ibb.co/fGDVX8V7/Chat-GPT-Image-7-de-ago-de-2026-13-50-13.png",
  "Terras Alphaville Mirassol":
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFM9ZOmKl7PnQrqOety4rfoe-LlXKkovyPTU7VqQ5MMok9riautoN8ad0&s=10",
  "Residencial Mais Parque Mirassol":
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToGLfmK3PCPCJJKWUKwlrHlKumzx-vr7fylqFRhvVoJA&s",
  Centro:
    "https://static.arboimoveis.com.br/CA0258_VECTA/whatsapp-image-2026-07-08-at-16-38-301783568975822.jpeg",
  "Jardim Laguna":
    "https://i.ibb.co/qFFkMBcF/c3730172-7aeb-4d8b-83ff-23f59ecd4705-cleanup.png",
};

const CAPA_PADRAO = fotoDemo("photo-1449844908441-8829872d2607", 600);

export function capaBairro(bairro: string): string {
  return CAPAS_BAIRRO[bairro] ?? CAPA_PADRAO;
}

/* -------------------------------------------------------------- terrenos */

export const HERO_TERRENOS = {
  imagem: fotoDemo("photo-1600596542815-ffad4c1539a9", 1400),
};

export type Pilar = { icone: string; titulo: string; texto: string };

export const PILARES_TERRENO: Pilar[] = [
  {
    icone: "mapa",
    titulo: "Escolha seu terreno",
    texto: "Selecionamos as melhores localizações para você.",
  },
  {
    icone: "projeto",
    titulo: "Projeto personalizado",
    texto: "Projetos exclusivos de acordo com seu estilo de vida.",
  },
  {
    icone: "construcao",
    titulo: "Construção com segurança",
    texto: "Acompanhamento completo até a entrega das chaves.",
  },
  {
    icone: "documento",
    titulo: "Sem burocracia",
    texto: "Processo simplificado e transparente.",
  },
];

export type Passo = { icone: string; titulo: string; texto: string };

export const PASSOS_TERRENO: Passo[] = [
  {
    icone: "mapa",
    titulo: "Escolha o terreno",
    texto: "Encontre o terreno ideal na localização perfeita para você.",
  },
  {
    icone: "projeto",
    titulo: "Projeto personalizado",
    texto: "Desenvolvemos um projeto exclusivo de acordo com seu estilo e necessidades.",
  },
  {
    icone: "construcao",
    titulo: "Construção",
    texto: "Executamos sua obra com qualidade, segurança e prazo garantido.",
  },
  {
    icone: "chave",
    titulo: "Entrega das chaves",
    texto: "Receba sua casa pronta para viver os melhores momentos.",
  },
];

export type Projeto = { nome: string; resumo: string; imagem: string };

export const PROJETOS_INSPIRADORES: Projeto[] = [
  {
    nome: "Casa Térrea Moderna",
    resumo: "3 suítes • 180m²",
    imagem: fotoDemo("photo-1600596542815-ffad4c1539a9", 800),
  },
  {
    nome: "Sobrado Contemporâneo",
    resumo: "4 suítes • 250m²",
    imagem: fotoDemo("photo-1512917774080-9991f1c4c750", 800),
  },
  {
    nome: "Casa Minimalista",
    resumo: "3 suítes • 200m²",
    imagem: fotoDemo("photo-1580587771525-78b9dba3b914", 800),
  },
  {
    nome: "Casa de Campo",
    resumo: "4 suítes • 300m²",
    imagem: fotoDemo("photo-1564013799919-ab600027ffc6", 800),
  },
];

/* ------------------------------------------------------------------ ficha */

export const CTA_FICHA = {
  imagem: fotoDemo("photo-1600585154340-be6161a56a0c", 1400),
};

/**
 * Bullets de "Sobre o imóvel" na ficha de terreno.
 *
 * Genéricos porque valem pra todo terreno da carteira. Quando o schema ganhar
 * um campo próprio de diferenciais por imóvel, trocar por `caracteristicas`.
 */
export const CHECKLIST_TERRENO = [
  "Terreno plano, pronto para construir",
  "Localização privilegiada em bairro nobre",
  "Próximo a comércios, escolas e serviços",
  "Documentação 100% regularizada",
  "Infraestrutura completa: água, energia, esgoto e asfalto",
];

/** Rótulos padrão dos campos de terreno que o schema ainda não guarda. */
export const DETALHES_TERRENO_PADRAO = {
  finalidade: "Residencial",
  topografia: "Plano",
  posicaoSolar: "Sol da manhã",
  documentacao: "Em dia",
  prontoParaConstruir: "Pronto para construir",
};

export type Comercio = { icone: string; nome: string; tempo: string };

export const COMERCIOS_PROXIMOS: Comercio[] = [
  { icone: "mercado", nome: "Supermercado", tempo: "3 min" },
  { icone: "escola", nome: "Escola", tempo: "4 min" },
  { icone: "farmacia", nome: "Farmácia", tempo: "3 min" },
  { icone: "padaria", nome: "Padaria", tempo: "2 min" },
  { icone: "shopping", nome: "Shopping", tempo: "7 min" },
];

/**
 * Corretores do bloco "Atendimento rápido" da ficha.
 *
 * Só iniciais — a NF ainda não mandou as fotos da equipe, e um avatar com a
 * inicial é honesto, enquanto uma foto de banco de imagens fingindo ser
 * corretor não é: esse bloco diz "Fale agora com um especialista", ou seja,
 * afirma que é a pessoa que vai responder a mensagem.
 */
export const CORRETORES = [
  { iniciais: "AM", cor: "bg-verde-700" },
  { iniciais: "RS", cor: "bg-verde-600" },
  { iniciais: "CL", cor: "bg-sage" },
  { iniciais: "PT", cor: "bg-verde-900" },
];

export const EQUIPE_EXTRA = 12;

/**
 * Fotos de "prova social" da home (herói e seção "Anuncie seu imóvel").
 *
 * Diferente de `CORRETORES`: aqui a legenda ao lado é genérica ("+500
 * famílias realizadas", "+120 imóveis vendidos") — não afirma que estas são
 * pessoas específicas nem que vão te atender. Por isso fotos ilustrativas
 * tudo bem; o limite ético é não usá-las onde se implica "esta pessoa vai
 * falar com você" (isso é papel do `CORRETORES`).
 */
export const FAMILIAS_PROVA_SOCIAL = [
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQz8lNsppjY5tKXrK8wByza-4fENnjjxVtXN5tP66OAhfSrrbYVpdyzkcs&s=10",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMt45pYxBmk87-_DbhkkvMUhamvllg_u-DHJtUnzg_7w&s=10",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwPNtxroAL2z-2oXDv2F0XExZvVy_hFv8nv67UkmM7wA&s=10",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZxEdncKkDGt_DdG2PJ0yA7FB-jvt6PiPQgajzmUD0bGFRb-aUNnlfSlw&s=10",
];

/* ----------------------------------------------------------------- buscas */

export const FAIXAS_PRECO: { rotulo: string; valor: string }[] = [
  { rotulo: "Qualquer preço", valor: "" },
  { rotulo: "Até R$ 300 mil", valor: "0-300000" },
  { rotulo: "R$ 300 mil a R$ 500 mil", valor: "300000-500000" },
  { rotulo: "R$ 500 mil a R$ 800 mil", valor: "500000-800000" },
  { rotulo: "R$ 800 mil a R$ 1,5 mi", valor: "800000-1500000" },
  { rotulo: "Acima de R$ 1,5 mi", valor: "1500000-" },
];
