# NF Negócios — Site Vitrine

Landing page de conversão para tráfego pago. O funil inteiro é:

```
anúncio → vitrine curada → ficha do imóvel → clique no WhatsApp
```

O clique no WhatsApp é a **única** saída de conversão do site.

---

## Escopo

**Dentro:** vitrine curada na home · **catálogo com busca e filtros** (`/imoveis`) · **vertical Terreno + Construção** (`/terrenos`) · ficha própria por imóvel · CTA único de WhatsApp com clique rastreado · painel mínimo de cadastro · feed VRSync para o Diário Imóveis · CPL por campanha.

**Fora (decisão do conselho, não é pendência):** sincronização/API com a OLX · CTA levando a portal parceiro · WhatsApp Business API · bairro/condomínio como entidade separada · dashboard analítico.

> **O catálogo era escopo cortado e voltou.** O dono do projeto reabriu, junto
> com a vertical de terrenos, ao aprovar o redesenho das quatro telas. A regra
> que continua valendo é a que importa: **o WhatsApp segue sendo a única saída
> de conversão.** Filtrar e navegar não são saídas — são caminhos até a ficha,
> e da ficha só existe um botão. Os CTAs que o desenho pedia e que não têm
> backend (agendar visita, simular projeto, anunciar, newsletter) apontam todos
> pro mesmo `/api/whatsapp-click`, cada um com seu `placement` próprio pra
> continuarem legíveis no relatório de CPL.

Os *guardrails* estão anotados no código nos pontos onde a tentação de reabrir o escopo aparece.

---

## Rodando localmente

Requisitos: Node 20+ e um PostgreSQL local ou remoto. Não é necessário
Supabase para desenvolver ou executar o projeto.

> **Supabase:** use a connection string do **pooler**
> (`aws-0-<regiao>.pooler.supabase.com`), não o host direto
> (`db.<ref>.supabase.co`) — o direto só tem registro IPv6 e não resolve na
> maioria das máquinas. O usuário no pooler é `postgres.<ref>`, não `postgres`.
> Se a senha tiver `@ : / ? #`, escape em percent-encoding (`@` vira `%40`).

```bash
npm ci
```

Crie um usuário e um banco no PostgreSQL. Por exemplo, no `psql` como
administrador (substitua a senha antes de usar):

```sql
CREATE ROLE nf_local LOGIN PASSWORD 'troque-esta-senha';
CREATE DATABASE nf_local OWNER nf_local;
```

No Windows, também dá para usar PostgreSQL no Ubuntu/WSL (`sudo apt-get
install postgresql`). Mantenha a distribuição aberta enquanto roda o Next no
Windows; se o banco parar, confira `pg_lsclusters` e inicie o cluster com
`sudo pg_ctlcluster <versao> main start` dentro do WSL.

Copie `.env.example` para `.env` (no PowerShell, use
`Copy-Item .env.example .env`) e preencha. Para o exemplo acima,
`DATABASE_URL` fica
`postgresql://nf_local:troque-esta-senha@127.0.0.1:5432/nf_local?schema=public`.
O mínimo para usar os CTAs exige também um `WHATSAPP_NUMERO` real:

```bash
cp .env.example .env
```

| Variável | Para quê |
|---|---|
| `DATABASE_URL` | Postgres |
| `SESSION_SECRET` | assina o cookie de sessão do painel |
| `WHATSAPP_NUMERO` | destino do CTA (só dígitos, com DDI+DDD) |
| `NEXT_PUBLIC_OLX_PERFIL_URL` | link do rodapé — **vazio = link não aparece** |
| `NEXT_PUBLIC_SITE_URL` | usada em metadata, sitemap e no feed |
| `BLOB_READ_WRITE_TOKEN` | upload de fotos (a Vercel injeta em produção) |

Gere um `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Crie as tabelas e o primeiro usuário do painel:

```bash
npx prisma generate
npm run db:migrate
npm run seed
```

O `seed` pergunta nome/e-mail/senha no terminal — a senha não fica em arquivo nem no histórico do shell.

```bash
npm run dev
```

Site em `/`, painel em `/admin/login`.

Para ver o site preenchido antes de cadastrar imóveis, rode
`npm run seed:demo`. Esses 13 registros são identificados por `DEMO-` e podem
ser removidos com `npm run seed:demo -- --limpar`. Upload de fotos pelo painel
continua exigindo `BLOB_READ_WRITE_TOKEN`; as fotos da demonstração já vêm
apontadas para URLs públicas.

---

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | desenvolvimento |
| `npm run build` | build de produção (roda `prisma generate` antes) |
| `npm run typecheck` | TypeScript sem emitir |
| `npm run verify` | testa a lógica pura: slug, dinheiro, atribuição, sessão, validação e feed XML |
| `npm run verify:db` | testa cadastro, cliques, métricas e feed contra um PostgreSQL configurado |
| `npm run db:migrate` | migration em desenvolvimento |
| `npm run db:deploy` | aplica migrations em produção |
| `npm run db:studio` | Prisma Studio |
| `npm run seed` | cria/atualiza usuário do painel |
| `npm run seed:demo` | 13 imóveis de demonstração (ver *Dados de demonstração*) |
| `npm run importar:diario` | traz os anúncios da NF que já estão no Diário Imóveis |

---

## Como as partes se encaixam

### Atribuição de campanha

O ponto não óbvio: **os links de CTA não carregam UTM**.

`proxy.ts` captura `utm_*`/`gclid`/`fbclid` na **primeira** resposta que o navegador recebe e grava num cookie (`nf_attr`, 90 min, HttpOnly). Quem precisa da origem depois lê o cookie.

Isso resolve dois problemas de uma vez:

1. a atribuição não depende de parâmetro sobreviver de link em link (card → ficha → botão);
2. já existe cookie antes de qualquer clique possível, então não há corrida.

Navegação interna sem UTM **não** sobrescreve o cookie — senão o segundo clique perderia a origem.

> No Next.js 16 o antigo `middleware.ts` chama-se `proxy.ts`. Mesma função, runtime Node.

### Clique no WhatsApp

`components/site/whatsapp-cta.tsx` renderiza um `<a href="/api/whatsapp-click?...">` comum — sem `onClick`, sem beacon. Funciona sem JS e abre em nova aba.

A rota registra o clique e **depois** redireciona (302, `Cache-Control: no-store` — sem isso um redirect cacheado faria a métrica parar de contar silenciosamente).

`lib/whatsapp/track-click.ts` monta a URL do WhatsApp **antes** de gravar no banco: se o banco estiver fora, o visitante ainda chega no WhatsApp. Perder a métrica é ruim; perder o lead é pior.

### Link da OLX

Fica só em `components/site/olx-link.tsx`, dentro do rodapé, e **some quando a visita veio de campanha paga** — usando o mesmo cookie da atribuição.

É Server Component de propósito: a decisão acontece antes do HTML sair, então o link nunca pisca na tela de quem veio de anúncio.

Se `NEXT_PUBLIC_OLX_PERFIL_URL` estiver vazio, não renderiza nada.

### Painel

Sessão = cookie assinado com HMAC (`node:crypto`), senha com `scrypt`. Sem dependência de auth — são ~130 linhas em `lib/auth/`, adequado para 1–3 usuários internos.

Proteção em duas camadas: `proxy.ts` barra `/admin/*` sem cookie válido (checagem otimista, evita renderizar a tela), e `exigirUsuario()` revalida no servidor em toda página e Server Action — **esta é a que protege os dados**.

Fotos passam pela rota autenticada `/api/admin/upload`, que grava no Vercel Blob sem expor o token. O limite é **4 MB por foto**, imposto pela plataforma da Vercel.

### Feed VRSync → Diário Imóveis

`GET /api/feed/vrsync`.

**Como funciona:** o Diário Imóveis (Classitudo / Diário da Região) não tem formato próprio nem painel de upload — ele lê o **padrão VRSync do Grupo OLX**, o mesmo que VivaReal e ZAP usam. O fluxo é:

```
cadastra no painel → entra no banco
        ↓
GET /api/feed/vrsync monta o XML na hora, direto do banco
        ↓
o portal busca essa URL sozinho, no ritmo dele
        ↓
os anúncios dele atualizam
```

Consequências: **não se "envia" nada** (o portal puxa), **não precisa de cron** do nosso lado, e a janela de propagação é do portal, não nossa.

Para ativar: mandar a URL pública do feed para o **suporte comercial do Diário da Região / Classitudo**, que a equipe técnica cadastra no sistema de leitura deles.

Isso é o oposto da integração com a OLX que o conselho cortou — aquilo era API bidirecional; isto é arquivo estático de mão única.

**Estrutura:**

- `lib/vrsync/map-property.ts` — cola do nosso banco pro formato do feed;
- `lib/vrsync/generate-feed.ts` — montagem do XML conforme a [spec oficial](https://developers.grupozap.com/feeds/vrsync/examples.html).

⚠ **A ordem dos elementos importa.** O XSD declara `sequence`: um elemento fora de posição reprova o arquivo inteiro, mesmo com XML bem-formado. `npm run verify` tem asserções de ordem e atributos justamente pra travar isso — não reordene por estética.

O `DetailViewUrl` sempre aponta pro nosso domínio.

### Métricas

`/admin/metricas`: tabela campanha | cliques | gasto | CPL, mais export CSV. Sem gráfico, funil ou tempo real — por escopo. Quem quiser ir além cruza o CSV numa planilha.

O CPL depende do nome da campanha bater com o `utm_campaign` do anúncio. O formulário sugere os nomes já vistos nos cliques justamente pra reduzir erro de digitação.

---

### Catálogo e filtros

Toda a busca mora na URL. `lib/data/filters.ts` faz os três passos —
`parseFiltros` (querystring → objeto validado), `montarWhere` (objeto → consulta
Prisma) e `serializarFiltros` (objeto → querystring de volta) — e a página é um
Server Component que só lê `searchParams`.

Não existe estado de filtro no cliente, e isso é de propósito: o link fica
compartilhável (o corretor cola no WhatsApp e o cliente vê o mesmo resultado), o
botão voltar desfaz o filtro, e **o formulário funciona com JavaScript
desligado** — é `<form method="get">` com `<details>` no lugar de accordion
scriptado e `radio` estilizado por `peer-checked` no lugar de botão com estado.

O `FormGet` (client component de ~30 linhas) é melhoria progressiva pura: só
tira da URL os campos que ficaram em branco. Sem ele o filtro continua correto,
só com a querystring mais suja.

A contagem por tipo na barra lateral ignora o filtro de tipo — senão marcar
"Casa" zeraria os outros e as caixas ficariam inúteis.

### Importação do Diário Imóveis

Mão contrária do feed: o VRSync **manda** imóvel pro portal, este script
**traz** de volta os que a NF já tinha publicado lá, sem redigitar nada, já
que o código do sistema antigo está perdido (pendência nº 7). O total muda
conforme o portal; confira sempre com `--dry-run` antes de gravar.

```bash
npm run importar:diario -- --dry-run
```

**Não é um scraper.** O portal expõe uma API JSON. Sem Selenium, sem navegador,
sem seletor de CSS. Só quebra se mudarem o formato dos dados — e aí o script
para com mensagem clara em vez de importar lixo.

⚠ **A pegadinha da paginação** (custou 203 imóveis numa primeira tentativa):
a página `/imobiliarias/<slug>` embute só os **25 primeiros** anúncios no
`__NEXT_DATA__`. O resto entra por clique no botão "VER MAIS", que chama outro
host:

```
GET https://api.diarioimoveis.com.br/api/listings/client/{clientId}?page=N&isActive=true
```

Parâmetros de paginação na URL **da página** são ignorados pelo servidor, então
ela devolve os mesmos 25 com `?page=2`, `?limit=100` ou o que for — o que passa
a falsa impressão de que a carteira toda são 25 imóveis. Por isso a listagem
vem da API (`lib/diario/buscar.ts`), e a página serve só pra resolver o slug do
perfil no `clientId`.

Os dois endpoints também **divergem no formato**: a página manda
`transactionType: "For Rent"` e a API manda `"FOR_RENT"`. O `mapearTransacao`
normaliza as duas grafias, e há asserção em `npm run verify` pra isso — sem
ela, os aluguéis da carteira entrariam como venda e sem preço.

> ⚠ **O Diário Imóveis é um agregador de imobiliárias**, e todo anúncio
> carrega o `clientId` do dono. O script busca **exclusivamente** pelo
> `clientId` da NF e **aborta** se aparecer anúncio de outro dono.
>
> Isso não é preciosismo. `listarAtivosParaFeed()` exporta todo imóvel ativo pro
> `/api/feed/vrsync` — o feed que a NF vai pedir pro suporte do próprio Diário
> da Região cadastrar. Importar imóvel de concorrente republicaria a foto e o
> WhatsApp dele no portal dele, assinado como NF.

| Flag | O que faz |
|---|---|
| `--dry-run` | mostra o que faria, sem gravar |
| `--rascunho` | grava com `ativo = false`, pra revisar no painel antes de publicar |
| `--somente-novos` | não toca em quem já foi importado |
| `--limpar-telefone` | remove telefone das descrições (ver abaixo) |
| `--destaques=N` | marca os N mais caros como destaque, pra home não ficar vazia |
| `--fotos=blob` | copia as imagens do portal pro nosso Vercel Blob |
| `--slug=...` | outro perfil, se o portal renomear o da NF |

O importador interrompe a execução quando recebe uma flag inválida ou uma
transação do portal que não reconhece. Atualizar um imóvel e substituir suas
fotos acontece na mesma transação do banco.

Reimportar é seguro: a chave é `referenceCode` (`DI-` + código do portal), e a
atualização **não mexe em `ativo` nem em `destaque`** — essas são decisões de
curadoria feitas no painel, e o script não pode desfazer o que o corretor marcou.

**O que o import avisa e vale atenção:**

1. **Telefone na descrição.** Números escritos no texto
   (`(17) 99635-9490`, `(17) 99105-1696`, `(17) 3243-1579`). Quem lê e liga
   direto não passa pelo CTA rastreado: o lead chega, mas some do relatório de
   CPL, e a campanha que pagou pela visita parece pior do que foi. Por padrão o
   texto é preservado como o corretor escreveu; `--limpar-telefone` remove.
2. **Título recomposto.** O portal gera "Casa à venda, 120m²";
   vários desses viram cards e `<title>` iguais. Viram
   "Casa no <bairro>", e quando dois caem no mesmo bairro ganham o dado que os
   separa ("Casa de 3 quartos e 200m² no Residencial Regissol I").
3. **Cômodos faltando na origem**, inclusive uma casa de
   R$ 1.380.000. Ficam com a linha de specs vazia e o filtro por quartos nunca
   os alcança. Completar pelo `/admin/imoveis`.
4. **Sem foto nenhuma.** O card mostra o bloco "Sem foto".
5. **Pulados:** anúncios sem descrição alguma. Não dá pra importar: o feed
   VRSync exige 50 caracteres, e um anúncio sem texto reprovaria o arquivo.

A vitrine da home mostra só o que estiver marcado como **destaque**, e o import
não marca nada — curadoria é decisão do painel. `--destaques=8` preenche a home
com os mais caros pra sair do zero; a seleção definitiva se faz no
`/admin/imoveis`.

### Dados de demonstração

`npm run seed:demo` cria 13 imóveis batendo com as telas aprovadas, com fotos do
Unsplash. Tudo leva `referenceCode` começando em `DEMO-`, e
`npm run seed:demo -- --limpar` remove só esses — nunca encosta em imóvel
cadastrado pelo painel.

**Antes de publicar:** rodar a limpeza e tirar `images.unsplash.com` do
`next.config.ts`. Os blocos institucionais de `lib/content/site.ts` (projetos
inspiradores, imagens de hero) também apontam pro Unsplash e precisam das fotos
reais da NF.

### Conteúdo que não vem do banco

`lib/content/site.ts` guarda o que não varia por imóvel: navegação, selos,
passos do "como funciona", projetos inspiradores, comércios próximos e os
rótulos padrão de terreno (topografia, posição solar, documentação).

Isso evitou uma migration e uma reforma no formulário de cadastro. **A
contrapartida está em `DETALHES_TERRENO_PADRAO` e `COMERCIOS_PROXIMOS`: são os
mesmos valores em todo terreno da carteira.** Se um lote em declive entrar no
acervo, a ficha dele vai dizer "Plano" — a hora de promover esses campos a
coluna do `Property` é essa.

## Decisões que valem saber

**Sem camada de cache nas páginas públicas.** São duas páginas e volume de imobiliária regional; uma consulta por pageview é irrelevante. Em troca não existe cache pra invalidar: marcar destaque no painel aparece na home no refresh seguinte. Se o volume crescer muito, o caminho é `use cache` + `cacheTag` invalidado pelos Server Actions.

**Dinheiro em centavos (int).** Evita erro de arredondamento de float.

**Slug não é regerado ao editar o título.** Anúncios já publicados apontam pra ele. Trocar é ação manual e consciente.

**Desativar ≠ excluir.** `ativo = false` tira do site e do feed preservando o histórico de cliques. Excluir é escape hatch e exige confirmação digitada. Se um imóvel for excluído mesmo assim, o `WhatsAppClick` guarda snapshot do slug/título, então o relatório de CPL continua legível.

**Sem IP nos cliques.** Não há necessidade de produto e evita exposição desnecessária (LGPD).

---

## Pendências

**Antes de publicar:**

1. **Criar o usuário do painel:** `npm run seed` (pede nome/e-mail/senha no terminal).
2. **Subir fotos.** O `BLOB_READ_WRITE_TOKEN` está vazio — sem ele o upload falha. Em produção a Vercel injeta sozinha; localmente, pegue um token em Vercel → Storage → Blob.
3. **Conferir `NEXT_PUBLIC_SITE_URL` no ambiente de produção.** O `DetailViewUrl` de cada anúncio do feed sai daí. Precisa do `https://` — sem protocolo, os links vão quebrados pro portal.
4. Mandar a URL do feed (`https://SEU-DOMINIO/api/feed/vrsync`) pro suporte comercial do Diário da Região / Classitudo cadastrar.
5. **Tirar os dados de demonstração:** `npm run seed:demo -- --limpar` e remover `images.unsplash.com` do `next.config.ts`.
6. **Criar as páginas institucionais.** "Sobre nós", "Nossos corretores", "Trabalhe conosco" e "Política de privacidade" existem no menu e no rodapé porque o desenho pede, mas apontam pra âncoras da home — não há página por trás delas ainda.

**Não bloqueiam:**

7. Código-fonte das 3 peças do projeto antigo. O feed foi escrito conforme a spec oficial do Grupo OLX e não depende mais disso — serve só como conferência.
8. Confirmar com a OLX se existe caminho de feed/lote fora da API negada.
9. Confirmar: o feed exporta **todos os ativos** (assumido) ou só os destaques?
10. Confirmar: um número de WhatsApp para tudo, ou varia por imóvel/corretor?
11. Promover topografia / posição solar / documentação a colunas do `Property` quando entrar terreno que fuja do padrão (ver *Conteúdo que não vem do banco*).

O `.env` local não vai para o Git. Configure banco, WhatsApp, perfil da OLX e
contato do feed no ambiente de publicação.

---

## Estado da verificação

Verificações executadas:

- `npm run build`, `npm run typecheck` e `npm run lint` passam.
- `npm run verify` — **73 verificações** da lógica pura: sessão, atribuição, dinheiro, filtros, mês de métricas, opções do importador e ordem/atributos do XML. A descrição do feed preserva `]]>` após a leitura do XML.
- `npm run verify:db` — **12 verificações** contra PostgreSQL: cadastro, desativação, clique com UTM, CPL, feed e histórico após exclusão. Cria registros com a marca `ZZTESTE-` e os apaga no fim.
- **Navegador local com os 13 imóveis de demonstração:** home, catálogo filtrado, ficha, login e métricas abriram; a galeria navegou com seta e fechou com `Esc`, devolvendo o foco ao botão. Home, catálogo e ficha não tiveram rolagem horizontal nos tamanhos testados de 375×812 e 1280×800. Feed, sitemap e `llms.txt` responderam 200.
- **Importação em `--dry-run`:** o portal retornou 240 anúncios em 10 páginas; 238 seriam criados e 2 foram pulados por descrição curta. O teste não gravou anúncios na base local.

**Ainda não exercitado nesta rodada:** upload de fotos (exige `BLOB_READ_WRITE_TOKEN`) e importação com gravação. Antes de publicar, substitua o número de WhatsApp de exemplo do ambiente local pelo número real da NF.

## Aviso de Direitos Autorais / Copyright Notice

Este projeto foi desenvolvido exclusivamente para fins de portfólio.
Todos os direitos são reservados. Não é permitida a cópia, distribuição
ou uso comercial deste código sem autorização prévia.
