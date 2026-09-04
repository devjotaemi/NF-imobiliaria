import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "@prisma/client";

import { gerarSlug } from "../lib/format";

/** Vem do enum do schema — errar um tipo aqui vira erro de compilação. */
type TipoImovel = Prisma.PropertyCreateInput["tipoImovel"];

/**
 * Imóveis de demonstração.
 *
 * Existe pra que o site possa ser conferido no navegador antes de a NF subir o
 * acervo real (o upload de fotos depende do BLOB_READ_WRITE_TOKEN). As fotos
 * apontam pro Unsplash — por isso `images.unsplash.com` está liberado no
 * `next.config.ts`.
 *
 *   npm run seed:demo            cria/atualiza
 *   npm run seed:demo -- --limpar  remove tudo que este script criou
 *
 * Todo registro leva `referenceCode` começando em DEMO-, então a limpeza nunca
 * encosta em imóvel cadastrado de verdade pelo painel.
 */

const PREFIXO = "DEMO-";

const FOTOS_TERRENO = [
  "photo-1500382017468-9049fed747ef",
  "photo-1416879595882-3373a0480b5b",
  "photo-1470770841072-f978cf4d019e",
  "photo-1441974231531-c6227db76b6e",
  "photo-1522708323590-d24dbb6b0267",
  "photo-1449844908441-8829872d2607",
];

const FOTOS_CASA = [
  "photo-1512917774080-9991f1c4c750",
  "photo-1600596542815-ffad4c1539a9",
  "photo-1580587771525-78b9dba3b914",
  "photo-1568605114967-8130f3a36994",
  "photo-1564013799919-ab600027ffc6",
  "photo-1523217582562-09d0def993a6",
  "photo-1600585154340-be6161a56a0c",
];

const FOTOS_INTERIOR = [
  "photo-1586023492125-27b2c045efd7",
  "photo-1618221195710-dd6b41faaea6",
  "photo-1560448204-e02f11c3d0e2",
  "photo-1554995207-c18c203602cb",
  "photo-1567767292278-a4f21aa2d36e",
  "photo-1600121848594-d8644e57abab",
  "photo-1615529182904-14819c35db37",
  "photo-1583608205776-bfd35f0d9f83",
  "photo-1594026112284-02bb6f3352fe",
  "photo-1600607687939-ce8a6c25118c",
  "photo-1600566753086-00f18fb6b3ea",
  "photo-1600047509807-ba8f99d2cdde",
];

type Semente = {
  titulo: string;
  tipoImovel: TipoImovel;
  tipoTransacao: "venda" | "aluguel";
  preco: number;
  bairro: string;
  cidade: string;
  quartos?: number;
  suites?: number;
  banheiros?: number;
  vagas?: number;
  areaUtilM2?: number;
  areaTerrenoM2?: number;
  condominio?: number;
  iptu?: number;
  iptuPeriodo?: "mensal" | "anual";
  anoConstrucao?: number;
  destaque?: boolean;
  caracteristicas: string[];
  descricao: string;
  banco: "terreno" | "casa" | "interior";
  fotos: number;
};

const IMOVEIS: Semente[] = [
  {
    titulo: "Terreno no Jardim Tarraf",
    tipoImovel: "terreno",
    tipoTransacao: "venda",
    preco: 480_000,
    bairro: "Jardim Tarraf",
    cidade: "São José do Rio Preto",
    areaTerrenoM2: 360,
    iptu: 1_200,
    iptuPeriodo: "anual",
    destaque: true,
    caracteristicas: ["Portaria 24h", "Área verde", "Asfalto"],
    descricao:
      "Excelente terreno plano no Jardim Tarraf, com ótima localização e pronto para construir. Ideal para quem busca construir com conforto, segurança e qualidade de vida em um dos bairros mais valorizados da cidade.",
    banco: "terreno",
    fotos: 12,
  },
  {
    titulo: "Terreno no Damha I",
    tipoImovel: "terreno",
    tipoTransacao: "venda",
    preco: 620_000,
    bairro: "Damha I",
    cidade: "São José do Rio Preto",
    areaTerrenoM2: 450,
    condominio: 780,
    iptu: 1_600,
    iptuPeriodo: "anual",
    destaque: true,
    caracteristicas: ["Portaria 24h", "Clube", "Área verde"],
    descricao:
      "Terreno em condomínio fechado no Damha I, com infraestrutura completa e segurança 24 horas. Documentação regularizada e pronto para receber seu projeto residencial.",
    banco: "terreno",
    fotos: 8,
  },
  {
    titulo: "Terreno no Residencial Gaivota II",
    tipoImovel: "terreno",
    tipoTransacao: "venda",
    preco: 350_000,
    bairro: "Residencial Gaivota II",
    cidade: "Mirassol",
    areaTerrenoM2: 300,
    iptu: 900,
    iptuPeriodo: "anual",
    destaque: true,
    caracteristicas: ["Asfalto", "Área verde"],
    descricao:
      "Terreno plano no Residencial Gaivota II, em Mirassol. Bairro tranquilo, com infraestrutura completa de água, energia, esgoto e asfalto, próximo a comércios e escolas.",
    banco: "terreno",
    fotos: 6,
  },
  {
    titulo: "Terreno no Village Damha",
    tipoImovel: "terreno",
    tipoTransacao: "venda",
    preco: 750_000,
    bairro: "Village Damha",
    cidade: "São José do Rio Preto",
    areaTerrenoM2: 400,
    condominio: 890,
    iptu: 1_900,
    iptuPeriodo: "anual",
    destaque: true,
    caracteristicas: ["Portaria 24h", "Clube", "Quadra poliesportiva"],
    descricao:
      "Terreno amplo no Village Damha, condomínio de alto padrão com portaria 24 horas, clube e área de lazer completa. Excelente oportunidade para construir a casa dos seus sonhos.",
    banco: "terreno",
    fotos: 7,
  },
  {
    titulo: "Terreno no Cond. Village Damha",
    tipoImovel: "terreno",
    tipoTransacao: "venda",
    preco: 390_000,
    bairro: "Village Damha",
    cidade: "São José do Rio Preto",
    areaTerrenoM2: 450,
    condominio: 890,
    iptu: 1_400,
    iptuPeriodo: "anual",
    caracteristicas: ["Portaria 24h", "Área verde"],
    descricao:
      "Terreno em condomínio fechado com excelente topografia e posição solar privilegiada. Infraestrutura completa e documentação em dia, pronto para iniciar a obra.",
    banco: "terreno",
    fotos: 5,
  },
  {
    titulo: "Casa no Condomínio Damha I",
    tipoImovel: "casa_condominio",
    tipoTransacao: "venda",
    preco: 1_750_000,
    bairro: "Damha I",
    cidade: "São José do Rio Preto",
    quartos: 4,
    suites: 3,
    banheiros: 5,
    vagas: 4,
    areaUtilM2: 250,
    areaTerrenoM2: 450,
    condominio: 980,
    iptu: 4_200,
    iptuPeriodo: "anual",
    anoConstrucao: 2021,
    destaque: true,
    caracteristicas: ["Piscina", "Churrasqueira", "Portaria 24h", "Área gourmet"],
    descricao:
      "Casa térrea de alto padrão no Condomínio Damha I, com quatro dormitórios sendo três suítes, área gourmet integrada e piscina. Acabamento impecável e projeto de iluminação assinado.",
    banco: "casa",
    fotos: 10,
  },
  {
    titulo: "Apartamento no Higienópolis",
    tipoImovel: "apartamento",
    tipoTransacao: "venda",
    preco: 650_000,
    bairro: "Higienópolis",
    cidade: "São José do Rio Preto",
    quartos: 3,
    suites: 1,
    banheiros: 2,
    vagas: 2,
    areaUtilM2: 102,
    condominio: 720,
    iptu: 2_100,
    iptuPeriodo: "anual",
    anoConstrucao: 2019,
    destaque: true,
    caracteristicas: ["Elevador", "Academia", "Piscina", "Salão de festas"],
    descricao:
      "Apartamento reformado no Higienópolis, com três dormitórios, sacada gourmet e duas vagas cobertas. Prédio com academia, piscina e salão de festas, a poucos minutos do centro.",
    banco: "interior",
    fotos: 9,
  },
  {
    titulo: "Apartamento no Jardim Tarraf",
    tipoImovel: "apartamento",
    tipoTransacao: "aluguel",
    preco: 2_800,
    bairro: "Jardim Tarraf",
    cidade: "São José do Rio Preto",
    quartos: 2,
    suites: 1,
    banheiros: 2,
    vagas: 1,
    areaUtilM2: 75,
    condominio: 540,
    iptu: 130,
    iptuPeriodo: "mensal",
    destaque: true,
    caracteristicas: ["Elevador", "Portaria 24h", "Salão de festas"],
    descricao:
      "Apartamento mobiliado no Jardim Tarraf, com dois dormitórios sendo uma suíte e varanda com vista livre. Condomínio com portaria 24 horas e espaço de convivência.",
    banco: "interior",
    fotos: 8,
  },
  {
    titulo: "Casa no Residencial Gaivota II",
    tipoImovel: "casa",
    tipoTransacao: "venda",
    preco: 520_000,
    bairro: "Residencial Gaivota II",
    cidade: "Mirassol",
    quartos: 3,
    suites: 1,
    banheiros: 2,
    vagas: 2,
    areaUtilM2: 140,
    areaTerrenoM2: 250,
    iptu: 1_400,
    iptuPeriodo: "anual",
    anoConstrucao: 2020,
    destaque: true,
    caracteristicas: ["Churrasqueira", "Quintal", "Área gourmet"],
    descricao:
      "Casa nova no Residencial Gaivota II, em Mirassol, com três dormitórios, área gourmet e quintal amplo. Rua tranquila, próxima a escolas, padaria e supermercado.",
    banco: "casa",
    fotos: 7,
  },
  {
    titulo: "Cobertura no Edifício Platinum",
    tipoImovel: "cobertura",
    tipoTransacao: "venda",
    preco: 1_290_000,
    bairro: "Vila Imperial",
    cidade: "São José do Rio Preto",
    quartos: 3,
    suites: 3,
    banheiros: 4,
    vagas: 3,
    areaUtilM2: 180,
    condominio: 1_250,
    iptu: 3_600,
    iptuPeriodo: "anual",
    anoConstrucao: 2018,
    caracteristicas: ["Piscina", "Elevador", "Academia", "Área gourmet"],
    descricao:
      "Cobertura duplex no Edifício Platinum, com três suítes, terraço com piscina privativa e vista panorâmica da cidade. Três vagas de garagem cobertas e depósito privativo.",
    banco: "interior",
    fotos: 11,
  },
  {
    titulo: "Casa no Jardim América",
    tipoImovel: "casa",
    tipoTransacao: "aluguel",
    preco: 3_200,
    bairro: "Jardim América",
    cidade: "São José do Rio Preto",
    quartos: 3,
    suites: 1,
    banheiros: 2,
    vagas: 2,
    areaUtilM2: 120,
    areaTerrenoM2: 200,
    iptu: 150,
    iptuPeriodo: "mensal",
    caracteristicas: ["Quintal", "Churrasqueira"],
    descricao:
      "Casa para locação no Jardim América, com três dormitórios, garagem para dois carros e quintal com churrasqueira. Bairro central, bem servido de comércio e transporte.",
    banco: "casa",
    fotos: 6,
  },
  {
    titulo: "Apartamento no Redentora",
    tipoImovel: "apartamento",
    tipoTransacao: "venda",
    preco: 420_000,
    bairro: "Redentora",
    cidade: "São José do Rio Preto",
    quartos: 2,
    suites: 1,
    banheiros: 2,
    vagas: 1,
    areaUtilM2: 68,
    condominio: 480,
    iptu: 1_300,
    iptuPeriodo: "anual",
    anoConstrucao: 2022,
    caracteristicas: ["Elevador", "Salão de festas", "Portaria 24h"],
    descricao:
      "Apartamento novo na Redentora, com dois dormitórios sendo uma suíte, cozinha planejada e sacada. Prédio recém-entregue, com portaria 24 horas e espaço fitness.",
    banco: "interior",
    fotos: 8,
  },
  {
    titulo: "Sobrado no Vila do Golf",
    tipoImovel: "casa",
    tipoTransacao: "venda",
    preco: 1_100_000,
    bairro: "Vila do Golf",
    cidade: "São José do Rio Preto",
    quartos: 4,
    suites: 2,
    banheiros: 4,
    vagas: 4,
    areaUtilM2: 200,
    areaTerrenoM2: 300,
    iptu: 2_900,
    iptuPeriodo: "anual",
    anoConstrucao: 2017,
    caracteristicas: ["Piscina", "Área gourmet", "Churrasqueira", "Quintal"],
    descricao:
      "Sobrado no Vila do Golf, com quatro dormitórios, sendo duas suítes, sala de estar e jantar integradas, área gourmet com piscina e garagem para quatro carros.",
    banco: "casa",
    fotos: 9,
  },
];

function fotosDoBanco(banco: Semente["banco"]): string[] {
  if (banco === "terreno") return FOTOS_TERRENO;
  if (banco === "casa") return FOTOS_CASA;
  return FOTOS_INTERIOR;
}

function url(id: string): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não definida. Preencha o .env.");
  }

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const limpar = process.argv.includes("--limpar");

  try {
    if (limpar) {
      const alvos = await db.property.findMany({
        where: { referenceCode: { startsWith: PREFIXO } },
        select: { id: true },
      });
      const ids = alvos.map((alvo) => alvo.id);

      // Cliques não têm cascade — soltar o vínculo antes evita erro de chave
      // estrangeira e preserva o histórico de CPL, que guarda snapshot do slug.
      await db.whatsAppClick.updateMany({
        where: { propertyId: { in: ids } },
        data: { propertyId: null },
      });
      const { count } = await db.property.deleteMany({
        where: { referenceCode: { startsWith: PREFIXO } },
      });

      console.log(`Removidos ${count} imóveis de demonstração.`);
      return;
    }

    for (const [indice, semente] of IMOVEIS.entries()) {
      const referenceCode = `${PREFIXO}${String(indice + 1).padStart(4, "0")}`;
      const slug = gerarSlug(semente.titulo);
      const banco = fotosDoBanco(semente.banco);

      const campos = {
        slug,
        titulo: semente.titulo,
        descricao: semente.descricao,
        tipoTransacao: semente.tipoTransacao,
        tipoImovel: semente.tipoImovel,
        precoCentavos: semente.preco * 100,
        precoSobConsulta: false,
        condominioCentavos: semente.condominio ? semente.condominio * 100 : null,
        iptuCentavos: semente.iptu ? semente.iptu * 100 : null,
        iptuPeriodo: semente.iptu ? (semente.iptuPeriodo ?? "anual") : null,
        bairro: semente.bairro,
        cidade: semente.cidade,
        estado: "SP",
        quartos: semente.quartos ?? null,
        suites: semente.suites ?? null,
        banheiros: semente.banheiros ?? null,
        vagas: semente.vagas ?? null,
        areaUtilM2: semente.areaUtilM2 ?? null,
        areaTerrenoM2: semente.areaTerrenoM2 ?? null,
        anoConstrucao: semente.anoConstrucao ?? null,
        caracteristicas: semente.caracteristicas,
        garantiasAceitas:
          semente.tipoTransacao === "aluguel"
            ? ["Fiador", "Seguro fiança", "Depósito caução"]
            : [],
        destaque: semente.destaque ?? false,
        ativo: true,
      } as const;

      const imovel = await db.property.upsert({
        where: { referenceCode },
        update: campos,
        create: { referenceCode, ...campos },
        select: { id: true, slug: true },
      });

      // Regrava a galeria inteira: rodar o seed duas vezes não pode duplicar foto.
      await db.propertyPhoto.deleteMany({ where: { propertyId: imovel.id } });
      await db.propertyPhoto.createMany({
        data: Array.from({ length: semente.fotos }, (_, ordem) => {
          const id = banco[ordem % banco.length];
          return {
            propertyId: imovel.id,
            url: url(id),
            storageKey: `demo/${slug}-${ordem + 1}`,
            ordem,
            altText: `${semente.titulo} — foto ${ordem + 1}`,
          };
        }),
      });

      console.log(`${referenceCode}  /imoveis/${imovel.slug}`);
    }

    console.log(`\n${IMOVEIS.length} imóveis de demonstração prontos.`);
    console.log("Para remover: npm run seed:demo -- --limpar");
  } finally {
    await db.$disconnect();
  }
}

main().catch((erro) => {
  console.error(erro instanceof Error ? erro.message : erro);
  process.exit(1);
});
