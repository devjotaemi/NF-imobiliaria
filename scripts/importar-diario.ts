import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { buscarAnunciosDoCliente, resolverPerfil } from "@/lib/diario/buscar";
import { lerOpcoesImportacao } from "@/lib/diario/options";
import {
  desambiguarTitulos,
  mapearAnuncio,
  type Mapeado,
} from "@/lib/diario/mapear";

/**
 * Importa os anúncios da NF que já estão no Diário Imóveis.
 *
 *   npm run importar:diario -- --dry-run     mostra o que faria, sem gravar
 *   npm run importar:diario                  grava
 *   npm run importar:diario -- --rascunho    grava desativado, pra revisar no painel
 *   npm run importar:diario -- --somente-novos   não mexe em quem já foi importado
 *   npm run importar:diario -- --fotos=blob  copia as fotos pro nosso Vercel Blob
 *
 * ─── Por que não é um scraper ───────────────────────────────────────────────
 * O portal expõe uma API JSON (ver `lib/diario/buscar.ts`). Não há Selenium,
 * navegador, nem seletor de CSS pra quebrar quando mudarem o layout — só
 * quebra se mudarem o formato dos dados, e aí o script para com mensagem clara.
 *
 * ─── O guardrail que importa ────────────────────────────────────────────────
 * O Diário Imóveis é um AGREGADOR de imobiliárias, e todo anúncio carrega o
 * `clientId` do dono. Este script busca exclusivamente pelo `clientId` da NF e
 * ABORTA se vier qualquer anúncio de outro dono.
 *
 * Isso não é preciosismo. `listarAtivosParaFeed()` exporta todo imóvel ativo
 * pro `/api/feed/vrsync`, que é o feed que a NF vai pedir pro suporte do
 * próprio Diário da Região cadastrar. Importar imóvel de concorrente aqui
 * republicaria o anúncio dele, com foto e WhatsApp, de volta no portal dele,
 * assinado como NF.
 */

/** Perfil da NF no portal. Sobrescreva com --slug=... se o portal renomear. */
const SLUG_PADRAO = "nf-rodrigues-empreendimentos-imobiliarios-me";

/** Prefixo do código: separa o que veio do portal do que foi cadastrado à mão. */
const PREFIXO = "DI-";

function moeda(centavos: number | null): string {
  if (centavos === null) return "sob consulta";
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

async function main() {
  const {
    dryRun: DRY_RUN,
    rascunho: RASCUNHO,
    somenteNovos: SOMENTE_NOVOS,
    limparTelefone: LIMPAR_TELEFONE,
    modoFotos: MODO_FOTOS,
    destaques: DESTAQUES,
    slug: SLUG,
  } = lerOpcoesImportacao(
    process.argv.slice(2),
    SLUG_PADRAO,
    process.env.DIARIO_IMOVEIS_SLUG,
  );

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL não definida. Preencha o .env.");

  console.log(`\nDiário Imóveis -> NF Negócios`);
  console.log(`perfil: ${SLUG}`);
  console.log(
    `modo:   ${DRY_RUN ? "DRY-RUN (nada será gravado)" : "gravando"}` +
      `${RASCUNHO ? " · como rascunho (ativo = false)" : ""}` +
      `${SOMENTE_NOVOS ? " · só imóveis novos" : ""}` +
      ` · fotos por ${MODO_FOTOS === "blob" ? "cópia no Vercel Blob" : "link do portal"}\n`,
  );

  const perfil = await resolverPerfil(SLUG);
  console.log(`perfil encontrado: ${perfil.nome} (${perfil.id})`);

  const anuncios = await buscarAnunciosDoCliente(perfil.id, (pagina, acumulado) => {
    console.log(`  página ${pagina} · ${acumulado} anúncios`);
  });
  console.log(`anúncios na carteira: ${anuncios.length}`);

  // ── Guardrail ────────────────────────────────────────────────────────────
  // Só entra imóvel cujo dono é a própria NF. Se o portal um dia devolver
  // anúncio de terceiro nesta rota, o script para em vez de importar.
  const intrusos = anuncios.filter((a) => a.clientId !== perfil.id);
  if (intrusos.length > 0) {
    const donos = [...new Set(intrusos.map((a) => a.clientId))].join(", ");
    throw new Error(
      `ABORTADO: ${intrusos.length} anúncio(s) de outro dono (clientId: ${donos}).\n` +
        `Importar imóvel de concorrente publicaria a foto e o WhatsApp dele no nosso site\n` +
        `e no nosso feed VRSync de volta pro portal. Confira o slug do perfil.`,
    );
  }
  console.log(`guardrail: todos os ${anuncios.length} são da NF ✓`);

  const mapeados = anuncios.map((a) =>
    mapearAnuncio(a, PREFIXO, { limparTelefone: LIMPAR_TELEFONE }),
  );
  desambiguarTitulos(mapeados);

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const slugsUsados = new Set(
      (await db.property.findMany({ select: { slug: true } })).map((p) => p.slug),
    );
    const existentes = new Map(
      (
        await db.property.findMany({
          where: { referenceCode: { startsWith: PREFIXO } },
          select: { id: true, referenceCode: true, slug: true },
        })
      ).map((p) => [p.referenceCode, p]),
    );

    let criados = 0;
    let atualizados = 0;
    let pulados = 0;
    const avisos: string[] = [];

    for (const item of mapeados) {
      const jaExiste = existentes.get(item.referenceCode);

      for (const problema of item.problemas) {
        // Telefone sai no resumo agrupado do fim — 23 linhas iguais viram ruído
        // e a pessoa para de ler exatamente o aviso que mais importa.
        if (problema.tipo === "telefone_na_descricao") continue;
        avisos.push(`${item.referenceCode} · ${problema.tipo}: ${problema.detalhe}`);
      }

      if (jaExiste && SOMENTE_NOVOS) {
        pulados++;
        continue;
      }

      // Sem descrição válida o imóvel reprovaria o feed VRSync inteiro.
      if (item.campos.descricao.length < 50) {
        avisos.push(`${item.referenceCode} · PULADO: descrição curta demais pro feed`);
        pulados++;
        continue;
      }
      if (!item.campos.cidade) {
        avisos.push(`${item.referenceCode} · PULADO: sem cidade`);
        pulados++;
        continue;
      }

      const slug = jaExiste?.slug ?? slugUnico(item.slugBase, slugsUsados);
      slugsUsados.add(slug);

      // Com ~230 imóveis, listar cada atualização vira parede de texto. Só o
      // que entra pela primeira vez merece uma linha; o resto vira contador.
      if (!jaExiste || DRY_RUN) {
        const rotulo = jaExiste ? "atualiza" : "cria    ";
        console.log(
          `  ${rotulo} ${item.referenceCode.padEnd(12)} ${item.campos.titulo.slice(0, 46).padEnd(48)}` +
            `${moeda(item.campos.precoCentavos).padStart(14)}  ${item.fotos.length} fotos`,
        );
      } else if (atualizados % 25 === 0) {
        console.log(`  ...${atualizados} atualizados`);
      }

      if (DRY_RUN) {
        if (jaExiste) atualizados++;
        else criados++;
        continue;
      }

      const fotos =
        MODO_FOTOS === "blob"
          ? await copiarParaBlob(item, slug)
          : item.fotos.map((f) => ({
              url: f.url,
              storageKey: `diario/${item.referenceCode}/${f.ordem}`,
              ordem: f.ordem,
              altText: f.altText,
            }));

      if (jaExiste) {
        // `ativo` e `destaque` ficam de fora: são decisões de curadoria feitas
        // no painel, e reimportar não pode desfazer o que o corretor marcou.
        await db.$transaction(async (transacao) => {
          await transacao.property.update({
            where: { id: jaExiste.id },
            data: item.campos,
          });
          await transacao.propertyPhoto.deleteMany({
            where: { propertyId: jaExiste.id },
          });
          await transacao.propertyPhoto.createMany({
            data: fotos.map((f) => ({ ...f, propertyId: jaExiste.id })),
          });
        });
        atualizados++;
      } else {
        const criado = await db.property.create({
          data: {
            ...item.campos,
            referenceCode: item.referenceCode,
            slug,
            destaque: false,
            ativo: RASCUNHO ? false : item.ativoNoPortal,
            fotos: { create: fotos },
          },
          select: { id: true },
        });
        if (!criado.id) throw new Error("falha ao criar");
        criados++;
      }
    }

    console.log(
      `\n${criados} criados · ${atualizados} atualizados · ${pulados} pulados` +
        `${DRY_RUN ? "  (DRY-RUN — nada foi gravado)" : ""}`,
    );

    const compostos = mapeados.filter((m) => m.tituloComposto).length;
    if (compostos > 0) {
      console.log(
        `\n${compostos} títulos foram recompostos: o portal gera "Casa à venda, 120m²",\n` +
          `que repetido vira card e <title> duplicado. Viraram "Casa no <bairro>".\n` +
          `Ajuste fino no /admin/imoveis.`,
      );
    }

    if (DESTAQUES > 0 && !DRY_RUN) {
      await marcarDestaques(db, DESTAQUES);
    } else if (DESTAQUES > 0) {
      console.log(`\n(dry-run) marcaria ${DESTAQUES} imóveis como destaque.`);
    } else {
      console.log(
        `\nA vitrine da home mostra só o que estiver marcado como destaque, e o\n` +
          `import não marca nada — curadoria é decisão do painel. Para preencher a\n` +
          `home agora: npm run importar:diario -- --destaques=8`,
      );
    }

    relatarTelefones(mapeados, LIMPAR_TELEFONE);

    if (avisos.length > 0) {
      console.log(`\n─── ${avisos.length} avisos ───`);
      for (const aviso of avisos) console.log(`  ${aviso}`);
    }

    if (!DRY_RUN && MODO_FOTOS === "link") {
      console.log(
        `\nAs fotos apontam pro s3.diario.one (servidor do portal). Funciona hoje,\n` +
          `mas o acervo fica na mão deles. Com o BLOB_READ_WRITE_TOKEN preenchido,\n` +
          `rode de novo com --fotos=blob pra trazer as imagens pra casa.`,
      );
    }
  } finally {
    await db.$disconnect();
  }
}

/**
 * Marca os N mais caros como destaque.
 *
 * Só roda com `--destaques=N` explícito. Sem a flag o import não mexe em
 * curadoria: quem decide o que vai pra vitrine é o corretor, no painel. O
 * critério "mais caros" é um chute razoável pra tirar a home do zero, não uma
 * regra de negócio — a ideia é que seja substituído no /admin.
 */
async function marcarDestaques(db: PrismaClient, quantos: number) {
  const alvos = await db.property.findMany({
    where: { referenceCode: { startsWith: PREFIXO }, ativo: true },
    orderBy: { precoCentavos: "desc" },
    take: quantos,
    select: { id: true, titulo: true },
  });

  await db.property.updateMany({
    where: { id: { in: alvos.map((a) => a.id) } },
    data: { destaque: true },
  });

  console.log(`\n${alvos.length} marcados como destaque (os mais caros):`);
  for (const alvo of alvos) console.log(`  ${alvo.titulo}`);
  console.log(`  → troque a seleção em /admin/imoveis quando quiser.`);
}

/**
 * Telefone escrito dentro da descrição do anúncio.
 *
 * Vale um bloco próprio porque bate de frente com a razão de existir do site:
 * o CTA rastreado é a única saída medida. Quem lê o número no texto e liga
 * direto vira lead invisível, e a campanha que pagou por essa visita aparece
 * no relatório de CPL pior do que realmente foi.
 */
function relatarTelefones(mapeados: Mapeado[], limparTelefone: boolean) {
  const porNumero = new Map<string, string[]>();

  for (const item of mapeados) {
    const achado = item.problemas.find((p) => p.tipo === "telefone_na_descricao");
    if (!achado) continue;
    for (const numero of achado.detalhe.replace(/^removido: /, "").split(", ")) {
      porNumero.set(numero, [...(porNumero.get(numero) ?? []), item.referenceCode]);
    }
  }

  if (porNumero.size === 0) return;

  const total = new Set([...porNumero.values()].flat()).size;
  console.log(
    `\n─── telefone na descrição: ${total} de ${mapeados.length} anúncios ───`,
  );
  for (const [numero, codigos] of [...porNumero.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  )) {
    console.log(`  ${numero.padEnd(18)} em ${codigos.length} anúncio(s)`);
  }

  console.log(
    limparTelefone
      ? `  → removidos das descrições importadas (--limpar-telefone).`
      : `  → mantidos como o corretor escreveu. Quem ligar direto no número não\n` +
        `    passa pelo CTA rastreado e some do relatório de CPL.\n` +
        `    Para remover na importação: npm run importar:diario -- --limpar-telefone`,
  );
}

/** Acrescenta -2, -3... até achar um slug livre. */
function slugUnico(base: string, usados: Set<string>): string {
  const limpo = base || "imovel";
  if (!usados.has(limpo)) return limpo;
  for (let n = 2; n < 200; n++) {
    const candidato = `${limpo}-${n}`;
    if (!usados.has(candidato)) return candidato;
  }
  return `${limpo}-${Date.now()}`;
}

/**
 * Copia as fotos do portal pro nosso Vercel Blob.
 *
 * Opcional porque depende do BLOB_READ_WRITE_TOKEN, que ainda está vazio
 * (pendência nº 2 do README). Enquanto isso o import referencia a URL do
 * portal, que é o mesmo lugar de onde a NF já serve as próprias fotos.
 */
async function copiarParaBlob(item: Mapeado, slug: string) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      "--fotos=blob precisa do BLOB_READ_WRITE_TOKEN no .env " +
        "(Vercel → Storage → Blob). Sem ele, rode sem a flag.",
    );
  }

  const { put } = await import("@vercel/blob");
  const saida: { url: string; storageKey: string; ordem: number; altText: string }[] = [];

  for (const foto of item.fotos) {
    const resposta = await fetch(foto.url);
    if (!resposta.ok) {
      console.log(`    foto ${foto.ordem} falhou (${resposta.status}), mantendo o link`);
      saida.push({
        url: foto.url,
        storageKey: `diario/${item.referenceCode}/${foto.ordem}`,
        ordem: foto.ordem,
        altText: foto.altText,
      });
      continue;
    }

    const chave = `imoveis/${slug}/${foto.ordem}.webp`;
    const enviado = await put(chave, await resposta.blob(), {
      access: "public",
      token,
      addRandomSuffix: true,
    });

    saida.push({
      url: enviado.url,
      storageKey: enviado.pathname,
      ordem: foto.ordem,
      altText: foto.altText,
    });
  }

  return saida;
}

main().catch((erro) => {
  console.error(`\n${erro instanceof Error ? erro.message : erro}`);
  process.exit(1);
});
