import { z } from "zod";

import { brlParaCentavos } from "@/lib/format";

export const TIPOS_TRANSACAO = ["venda", "aluguel"] as const;

export const TIPOS_IMOVEL = [
  "apartamento",
  "casa",
  "casa_condominio",
  "cobertura",
  "kitnet_studio",
  "sala_comercial",
  "loja",
  "galpao",
  "terreno",
  "chacara_sitio_fazenda",
  "outro",
] as const;

export const PERIODOS_IPTU = ["mensal", "anual"] as const;

/** Campo numérico opcional vindo de FormData: "" vira null. */
const inteiroOpcional = (max: number) =>
  z
    .string()
    .trim()
    .transform((valor) =>
      valor === "" ? null : /^\d+$/.test(valor) ? Number(valor) : Number.NaN,
    )
    .refine(
      (valor) =>
        valor === null ||
        (Number.isInteger(valor) && valor >= 0 && valor <= max),
      { message: "Número inválido" },
    );

/** Campo de dinheiro opcional: aceita formato pt-BR, guarda centavos. */
const dinheiroOpcional = z
  .string()
  .trim()
  .refine((valor) => valor === "" || brlParaCentavos(valor) !== null, {
    message: "Valor inválido",
  })
  .transform((valor) => (valor === "" ? null : brlParaCentavos(valor)));

const textoOpcional = z
  .string()
  .trim()
  .transform((valor) => (valor === "" ? null : valor));

/** Uma por linha no textarea -> array, sem vazios nem duplicatas. */
const listaDeLinhas = z
  .string()
  .transform((valor) =>
    Array.from(
      new Set(
        valor
          .split(/[\n;]/)
          .map((linha) => linha.trim())
          .filter(Boolean),
      ),
    ),
  );

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal(""), z.null()])
  .transform((valor) => valor === "on" || valor === "true");

export const EsquemaImovel = z.object({
  titulo: z.string().trim().min(5, "Título muito curto").max(150),

  // VRSync aceita descrição de 50 a 3000 caracteres — validar aqui evita
  // descobrir o problema só quando o portal rejeitar o feed.
  descricao: z
    .string()
    .trim()
    .min(50, "A descrição precisa de pelo menos 50 caracteres (exigência do feed)")
    .max(3000, "A descrição passou de 3000 caracteres (limite do feed)"),

  tipoTransacao: z.enum(TIPOS_TRANSACAO),
  tipoImovel: z.enum(TIPOS_IMOVEL),

  preco: dinheiroOpcional,
  precoSobConsulta: checkbox,
  condominio: dinheiroOpcional,
  iptu: dinheiroOpcional,
  iptuPeriodo: z.enum(PERIODOS_IPTU).nullable().catch(null),

  bairro: textoOpcional,
  cidade: z.string().trim().min(2, "Informe a cidade"),
  estado: z
    .string()
    .trim()
    .length(2, "Use a sigla do estado (ex.: SP)")
    .transform((valor) => valor.toUpperCase()),
  cep: textoOpcional,

  quartos: inteiroOpcional(50),
  suites: inteiroOpcional(50),
  banheiros: inteiroOpcional(50),
  vagas: inteiroOpcional(100),
  areaUtilM2: inteiroOpcional(1_000_000),
  areaTerrenoM2: inteiroOpcional(10_000_000),
  andar: inteiroOpcional(200),
  totalAndares: inteiroOpcional(200),
  torres: inteiroOpcional(100),
  anoConstrucao: inteiroOpcional(new Date().getFullYear() + 5),

  caracteristicas: listaDeLinhas,
  garantiasAceitas: listaDeLinhas,

  destaque: checkbox,
  ativo: checkbox,
});

export type DadosImovel = z.infer<typeof EsquemaImovel>;

/** FormData -> objeto plano no formato que o esquema espera. */
export function lerFormDataImovel(formData: FormData) {
  const texto = (campo: string) => {
    const valor = formData.get(campo);
    return typeof valor === "string" ? valor : "";
  };

  return {
    titulo: texto("titulo"),
    descricao: texto("descricao"),
    tipoTransacao: texto("tipoTransacao"),
    tipoImovel: texto("tipoImovel"),
    preco: texto("preco"),
    precoSobConsulta: formData.get("precoSobConsulta"),
    condominio: texto("condominio"),
    iptu: texto("iptu"),
    iptuPeriodo: texto("iptuPeriodo") || null,
    bairro: texto("bairro"),
    cidade: texto("cidade"),
    estado: texto("estado"),
    cep: texto("cep"),
    quartos: texto("quartos"),
    suites: texto("suites"),
    banheiros: texto("banheiros"),
    vagas: texto("vagas"),
    areaUtilM2: texto("areaUtilM2"),
    areaTerrenoM2: texto("areaTerrenoM2"),
    andar: texto("andar"),
    totalAndares: texto("totalAndares"),
    torres: texto("torres"),
    anoConstrucao: texto("anoConstrucao"),
    caracteristicas: texto("caracteristicas"),
    garantiasAceitas: texto("garantiasAceitas"),
    destaque: formData.get("destaque"),
    ativo: formData.get("ativo"),
  };
}

/** Campos do modelo Prisma, já no formato de gravação. */
export function paraCamposPrisma(dados: DadosImovel) {
  return {
    titulo: dados.titulo,
    descricao: dados.descricao,
    tipoTransacao: dados.tipoTransacao,
    tipoImovel: dados.tipoImovel,
    precoCentavos: dados.precoSobConsulta ? null : dados.preco,
    precoSobConsulta: dados.precoSobConsulta,
    condominioCentavos: dados.condominio,
    iptuCentavos: dados.iptu,
    iptuPeriodo: dados.iptu === null ? null : dados.iptuPeriodo,
    bairro: dados.bairro,
    cidade: dados.cidade,
    estado: dados.estado,
    cep: dados.cep,
    quartos: dados.quartos,
    suites: dados.suites,
    banheiros: dados.banheiros,
    vagas: dados.vagas,
    areaUtilM2: dados.areaUtilM2,
    areaTerrenoM2: dados.areaTerrenoM2,
    andar: dados.andar,
    totalAndares: dados.totalAndares,
    torres: dados.torres,
    anoConstrucao: dados.anoConstrucao,
    caracteristicas: dados.caracteristicas,
    garantiasAceitas: dados.garantiasAceitas,
    destaque: dados.destaque,
    ativo: dados.ativo,
  };
}
