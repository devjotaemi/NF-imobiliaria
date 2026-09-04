/**
 * Verificação end-to-end contra banco real.
 *
 * Exercita o caminho que a lógica pura não alcança: gravação, clique rastreado,
 * agregação de CPL e o feed lendo do banco.
 *
 * SEGURO DE RODAR: cria tudo com o prefixo abaixo e apaga no final, inclusive
 * se algum passo falhar. Não toca em nenhum outro registro.
 *
 *   npm run verify:db
 */
import "dotenv/config";
import assert from "node:assert/strict";

import { XMLValidator } from "fast-xml-parser";

import { contatoFeed } from "@/lib/config";
import { db } from "@/lib/db";
import {
  intervaloDoMes,
  resumoPorCampanha,
  SEM_CAMPANHA,
} from "@/lib/data/metrics";
import { listarAtivosParaFeed, listarDestaques } from "@/lib/data/properties";
import { proximoReferenceCode, slugUnico } from "@/lib/data/property-admin";
import { gerarFeedVRSync } from "@/lib/vrsync/generate-feed";
import { mapearParaVRSync } from "@/lib/vrsync/map-property";
import { registrarCliqueWhatsApp } from "@/lib/whatsapp/track-click";
import type { Atribuicao } from "@/lib/attribution";

/** Tudo que este script cria carrega esta marca e é removido no final. */
const MARCA = `ZZTESTE-${Date.now()}`;
const CAMPANHA_TESTE = `${MARCA}-campanha`;

let passou = 0;
const falhas: string[] = [];

async function teste(nome: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    passou++;
    console.log(`  ok  ${nome}`);
  } catch (erro) {
    falhas.push(`${nome}: ${erro instanceof Error ? erro.message : erro}`);
    console.error(`  XX  ${nome}`);
  }
}

async function main() {
  console.log(`\nVerificação com banco (marca: ${MARCA})\n`);

  let imovelId: string | null = null;

  try {
    // ------------------------------------------------------------ escrita
    const slug = await slugUnico(`${MARCA} Apartamento Teste`);
    const referenceCode = await proximoReferenceCode();

    await teste("cria imóvel com foto", async () => {
      const criado = await db.property.create({
        data: {
          referenceCode,
          slug,
          titulo: `${MARCA} Apartamento Teste`,
          descricao:
            "Descrição de teste com mais de cinquenta caracteres para satisfazer a regra do feed VRSync.",
          tipoTransacao: "venda",
          tipoImovel: "apartamento",
          precoCentavos: 45_000_000,
          cidade: "Campinas",
          estado: "SP",
          bairro: "Centro",
          quartos: 3,
          banheiros: 2,
          areaUtilM2: 90,
          caracteristicas: ["Piscina", "Portaria 24h"],
          garantiasAceitas: [],
          destaque: true,
          ativo: true,
          fotos: {
            create: [
              {
                url: "https://exemplo.public.blob.vercel-storage.com/teste.jpg",
                storageKey: "teste.jpg",
                ordem: 0,
              },
            ],
          },
        },
        select: { id: true },
      });
      imovelId = criado.id;
      assert.ok(imovelId);
    });

    await teste("referenceCode segue o padrão NF-0000", () => {
      assert.match(referenceCode, /^NF-\d{4}$/);
    });

    // ------------------------------------------------------------- leitura
    await teste("imóvel em destaque aparece na vitrine", async () => {
      const destaques = await listarDestaques();
      assert.ok(
        destaques.some((imovel) => imovel.slug === slug),
        "deveria estar na home",
      );
    });

    await teste("desativar tira da vitrine e da ficha", async () => {
      await db.property.update({
        where: { id: imovelId! },
        data: { ativo: false },
      });

      const destaques = await listarDestaques();
      assert.ok(
        !destaques.some((imovel) => imovel.slug === slug),
        "não deveria mais aparecer na home",
      );

      const paraFeed = await listarAtivosParaFeed();
      assert.ok(
        !paraFeed.some((imovel) => imovel.slug === slug),
        "não deveria mais sair no feed",
      );

      // devolve pro estado ativo pro resto dos testes
      await db.property.update({
        where: { id: imovelId! },
        data: { ativo: true },
      });
    });

    // -------------------------------------------------------- clique/UTM
    const atribuicaoPaga: Atribuicao = {
      utmSource: "meta",
      utmMedium: "cpc",
      utmCampaign: CAMPANHA_TESTE,
      pago: true,
    };

    await teste("clique no WhatsApp grava UTM e devolve URL do wa.me", async () => {
      const { urlRedirecionamento } = await registrarCliqueWhatsApp({
        slugImovel: slug,
        placement: "ficha_cta",
        atribuicao: atribuicaoPaga,
        referrer: null,
        userAgent: "verificacao",
      });

      assert.match(urlRedirecionamento, /^https:\/\/wa\.me\/\d+\?text=/);
      assert.ok(
        decodeURIComponent(urlRedirecionamento).includes(referenceCode),
        "mensagem deve citar o código do imóvel",
      );

      const clique = await db.whatsAppClick.findFirst({
        where: { utmCampaign: CAMPANHA_TESTE },
        orderBy: { createdAt: "desc" },
      });
      assert.ok(clique, "clique deveria ter sido gravado");
      assert.equal(clique.utmSource, "meta");
      assert.equal(clique.propertySlugSnapshot, slug);
      assert.equal(clique.placement, "ficha_cta");
    });

    await teste("clique em imóvel inexistente não gera registro órfão", async () => {
      const { urlRedirecionamento } = await registrarCliqueWhatsApp({
        slugImovel: "slug-que-nao-existe-mesmo",
        placement: "ficha_cta",
        atribuicao: { ...atribuicaoPaga, utmCampaign: `${CAMPANHA_TESTE}-x` },
      });
      // Ainda manda pro WhatsApp (mensagem genérica), mas sem vincular imóvel.
      assert.match(urlRedirecionamento, /^https:\/\/wa\.me\//);

      const clique = await db.whatsAppClick.findFirst({
        where: { utmCampaign: `${CAMPANHA_TESTE}-x` },
      });
      assert.ok(clique);
      assert.equal(clique.propertyId, null);
    });

    await teste("imóvel desativado não conta clique vinculado", async () => {
      await db.property.update({
        where: { id: imovelId! },
        data: { ativo: false },
      });

      await registrarCliqueWhatsApp({
        slugImovel: slug,
        placement: "ficha_cta",
        atribuicao: { ...atribuicaoPaga, utmCampaign: `${CAMPANHA_TESTE}-off` },
      });

      const clique = await db.whatsAppClick.findFirst({
        where: { utmCampaign: `${CAMPANHA_TESTE}-off` },
      });
      assert.ok(clique);
      assert.equal(
        clique.propertyId,
        null,
        "imóvel inativo não deve ser vinculado ao clique",
      );

      await db.property.update({
        where: { id: imovelId! },
        data: { ativo: true },
      });
    });

    // ----------------------------------------------------------- CPL
    await teste("CPL = gasto / cliques da campanha", async () => {
      const agora = new Date();
      const { inicio, fim } = intervaloDoMes(agora);
      const mesReferencia = new Date(
        Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1),
      );

      await db.campaignSpend.create({
        data: {
          campanha: CAMPANHA_TESTE,
          mesReferencia,
          valorCentavos: 30_000, // R$ 300,00
        },
      });

      const linhas = await resumoPorCampanha(inicio, fim);
      const linha = linhas.find((l) => l.campanha === CAMPANHA_TESTE);

      assert.ok(linha, "campanha deveria aparecer no resumo");
      assert.equal(linha.cliques, 1);
      assert.equal(linha.gastoCentavos, 30_000);
      assert.equal(linha.cplCentavos, 30_000, "1 clique, R$300 => CPL R$300");
    });

    await teste("campanha sem gasto lançado fica com CPL nulo", async () => {
      const { inicio, fim } = intervaloDoMes(new Date());
      const linhas = await resumoPorCampanha(inicio, fim);
      const semGasto = linhas.find((l) => l.campanha === `${CAMPANHA_TESTE}-x`);
      assert.ok(semGasto);
      assert.equal(semGasto.gastoCentavos, null);
      assert.equal(semGasto.cplCentavos, null, "sem gasto não inventa CPL");
    });

    await teste("resumo não quebra com clique sem campanha", async () => {
      await registrarCliqueWhatsApp({
        slugImovel: slug,
        placement: "rodape",
        atribuicao: { pago: false },
      });

      const { inicio, fim } = intervaloDoMes(new Date());
      const linhas = await resumoPorCampanha(inicio, fim);
      assert.ok(
        linhas.some((l) => l.campanha === SEM_CAMPANHA),
        "clique orgânico deve cair em '(sem campanha)'",
      );
    });

    // ---------------------------------------------------------- feed real
    await teste("feed gerado do banco é XML válido e contém o imóvel", async () => {
      const imoveis = await listarAtivosParaFeed();
      const contato = contatoFeed();
      const xml = gerarFeedVRSync(
        imoveis.map(mapearParaVRSync),
        {
          provider: "NF Negócios",
          email: contato.email,
          contactName: contato.nome,
          telephone: contato.telefone,
        },
        {
          name: contato.nome,
          email: contato.email,
          telephone: contato.telefone,
        },
      );

      assert.equal(XMLValidator.validate(xml), true, "XML deveria ser válido");
      assert.ok(
        xml.indexOf("<Media>") === -1 ||
          xml.indexOf("<Media>") < xml.indexOf("<Details>"),
        "Media tem que preceder Details",
      );
      assert.ok(xml.includes(referenceCode), "imóvel deveria estar no feed");
      assert.ok(
        xml.includes(`/imoveis/${slug}`),
        "DetailViewUrl deve apontar pro nosso domínio",
      );
    });

    // -------------------------------------------- integridade do histórico
    await teste(
      "excluir imóvel preserva o histórico de cliques (snapshot)",
      async () => {
        await db.property.delete({ where: { id: imovelId! } });
        imovelId = null;

        const clique = await db.whatsAppClick.findFirst({
          where: { utmCampaign: CAMPANHA_TESTE },
        });
        assert.ok(clique, "o clique não pode sumir junto com o imóvel");
        assert.equal(clique.propertyId, null, "referência vira null");
        // gerarSlug normaliza pra minúsculo, então a comparação é case-insensitive.
        assert.ok(
          clique.propertySlugSnapshot?.toLowerCase().includes(MARCA.toLowerCase()),
          `snapshot mantém o relatório legível (veio: ${clique.propertySlugSnapshot})`,
        );
      },
    );
  } finally {
    // ------------------------------------------------------------ limpeza
    console.log("\nLimpando dados de teste...");
    await db.whatsAppClick.deleteMany({
      where: { utmCampaign: { startsWith: CAMPANHA_TESTE } },
    });
    // mode insensitive: o slug é minúsculo e a MARCA é maiúscula — sem isso
    // o clique sem campanha ficaria órfão no banco.
    await db.whatsAppClick.deleteMany({
      where: { propertySlugSnapshot: { contains: MARCA, mode: "insensitive" } },
    });
    await db.campaignSpend.deleteMany({
      where: { campanha: { startsWith: CAMPANHA_TESTE } },
    });
    await db.property.deleteMany({ where: { titulo: { contains: MARCA } } });
    await db.$disconnect();
  }

  console.log(`\n${passou} verificações passaram.`);
  if (falhas.length > 0) {
    console.error(`\n${falhas.length} FALHARAM:\n`);
    for (const falha of falhas) console.error(`  x ${falha}`);
    process.exit(1);
  }
  console.log("Tudo certo — banco, clique, CPL e feed funcionando.");
}

main().catch(async (erro) => {
  console.error("\nErro fatal:", erro instanceof Error ? erro.message : erro);
  await db.$disconnect().catch(() => {});
  process.exit(1);
});
