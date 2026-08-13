"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { PhotoUploader } from "@/components/admin/photo-uploader";
import type { EstadoFormulario } from "@/app/admin/imoveis/actions";
import {
  PERIODOS_IPTU,
  TIPOS_IMOVEL,
  TIPOS_TRANSACAO,
} from "@/lib/validation/property";
import { rotuloTipoImovel } from "@/lib/format";

export type ValoresImovel = {
  titulo: string;
  descricao: string;
  tipoTransacao: string;
  tipoImovel: string;
  preco: string;
  precoSobConsulta: boolean;
  condominio: string;
  iptu: string;
  iptuPeriodo: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  quartos: string;
  suites: string;
  banheiros: string;
  vagas: string;
  areaUtilM2: string;
  areaTerrenoM2: string;
  andar: string;
  totalAndares: string;
  torres: string;
  anoConstrucao: string;
  caracteristicas: string;
  garantiasAceitas: string;
  destaque: boolean;
  ativo: boolean;
};

export const VALORES_PADRAO: ValoresImovel = {
  titulo: "",
  descricao: "",
  tipoTransacao: "venda",
  tipoImovel: "apartamento",
  preco: "",
  precoSobConsulta: false,
  condominio: "",
  iptu: "",
  iptuPeriodo: "mensal",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
  quartos: "",
  suites: "",
  banheiros: "",
  vagas: "",
  areaUtilM2: "",
  areaTerrenoM2: "",
  andar: "",
  totalAndares: "",
  torres: "",
  anoConstrucao: "",
  caracteristicas: "",
  garantiasAceitas: "",
  destaque: false,
  ativo: true,
};

const ESTADO_INICIAL: EstadoFormulario = {};

export function PropertyForm({
  acao,
  valores,
  modo,
  mostrarUploader = true,
}: {
  acao: (
    estado: EstadoFormulario,
    formData: FormData,
  ) => Promise<EstadoFormulario>;
  valores: ValoresImovel;
  modo: "novo" | "editar";
  mostrarUploader?: boolean;
}) {
  const [estado, despachar] = useActionState(acao, ESTADO_INICIAL);
  const erros = estado.errosPorCampo ?? {};

  return (
    <form action={despachar} className="flex flex-col gap-8">
      {estado.erro && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {estado.erro}
        </p>
      )}

      <Secao titulo="Identificação">
        <Campo
          label="Título do anúncio"
          erro={erros.titulo}
          className="sm:col-span-2"
        >
          <input
            name="titulo"
            defaultValue={valores.titulo}
            required
            maxLength={150}
            placeholder="Apartamento 3 quartos com varanda gourmet"
            className={estiloInput}
          />
        </Campo>

        <Campo
          label="Descrição"
          erro={erros.descricao}
          dica="Entre 50 e 3000 caracteres. As quebras de linha são preservadas no site."
          className="sm:col-span-2"
        >
          <textarea
            name="descricao"
            defaultValue={valores.descricao}
            required
            rows={8}
            className={estiloInput}
          />
        </Campo>

        <Campo label="Negócio" erro={erros.tipoTransacao}>
          <select
            name="tipoTransacao"
            defaultValue={valores.tipoTransacao}
            className={estiloInput}
          >
            {TIPOS_TRANSACAO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo === "venda" ? "Venda" : "Aluguel"}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Tipo de imóvel" erro={erros.tipoImovel}>
          <select
            name="tipoImovel"
            defaultValue={valores.tipoImovel}
            className={estiloInput}
          >
            {TIPOS_IMOVEL.map((tipo) => (
              <option key={tipo} value={tipo}>
                {rotuloTipoImovel(tipo)}
              </option>
            ))}
          </select>
        </Campo>
      </Secao>

      <Secao titulo="Valores">
        <Campo label="Preço (R$)" erro={erros.preco}>
          <input
            name="preco"
            defaultValue={valores.preco}
            inputMode="decimal"
            placeholder="450.000"
            className={estiloInput}
          />
        </Campo>

        <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="precoSobConsulta"
            defaultChecked={valores.precoSobConsulta}
            className="h-4 w-4"
          />
          Preço sob consulta
        </label>

        <Campo label="Condomínio (R$/mês)" erro={erros.condominio}>
          <input
            name="condominio"
            defaultValue={valores.condominio}
            inputMode="decimal"
            className={estiloInput}
          />
        </Campo>

        <Campo label="IPTU (R$)" erro={erros.iptu}>
          <div className="flex gap-2">
            <input
              name="iptu"
              defaultValue={valores.iptu}
              inputMode="decimal"
              className={`${estiloInput} flex-1`}
            />
            <select
              name="iptuPeriodo"
              defaultValue={valores.iptuPeriodo}
              className={estiloInput}
            >
              {PERIODOS_IPTU.map((periodo) => (
                <option key={periodo} value={periodo}>
                  {periodo === "mensal" ? "por mês" : "por ano"}
                </option>
              ))}
            </select>
          </div>
        </Campo>
      </Secao>

      <Secao titulo="Localização">
        <Campo label="Bairro" erro={erros.bairro}>
          <input
            name="bairro"
            defaultValue={valores.bairro}
            className={estiloInput}
          />
        </Campo>

        <Campo label="Cidade" erro={erros.cidade}>
          <input
            name="cidade"
            defaultValue={valores.cidade}
            required
            className={estiloInput}
          />
        </Campo>

        <Campo label="Estado (UF)" erro={erros.estado}>
          <input
            name="estado"
            defaultValue={valores.estado}
            required
            maxLength={2}
            placeholder="SP"
            className={`${estiloInput} uppercase`}
          />
        </Campo>

        <Campo label="CEP" erro={erros.cep}>
          <input name="cep" defaultValue={valores.cep} className={estiloInput} />
        </Campo>
      </Secao>

      <Secao titulo="Características">
        <CampoNumero label="Quartos" nome="quartos" valores={valores} erros={erros} />
        <CampoNumero label="Suítes" nome="suites" valores={valores} erros={erros} />
        <CampoNumero
          label="Banheiros"
          nome="banheiros"
          valores={valores}
          erros={erros}
        />
        <CampoNumero label="Vagas" nome="vagas" valores={valores} erros={erros} />
        <CampoNumero
          label="Área útil (m²)"
          nome="areaUtilM2"
          valores={valores}
          erros={erros}
        />
        <CampoNumero
          label="Área do terreno (m²)"
          nome="areaTerrenoM2"
          valores={valores}
          erros={erros}
        />
        <CampoNumero label="Andar" nome="andar" valores={valores} erros={erros} />
        <CampoNumero
          label="Total de andares"
          nome="totalAndares"
          valores={valores}
          erros={erros}
        />
        <CampoNumero label="Torres" nome="torres" valores={valores} erros={erros} />
        <CampoNumero
          label="Ano de construção"
          nome="anoConstrucao"
          valores={valores}
          erros={erros}
        />

        <Campo
          label="Diferenciais"
          dica="Um por linha: piscina, portaria 24h, aceita pet..."
          erro={erros.caracteristicas}
          className="sm:col-span-2"
        >
          <textarea
            name="caracteristicas"
            defaultValue={valores.caracteristicas}
            rows={5}
            className={estiloInput}
          />
        </Campo>

        <Campo
          label="Garantias aceitas (aluguel)"
          dica="Um por linha: fiador, seguro-fiança, caução..."
          erro={erros.garantiasAceitas}
          className="sm:col-span-2"
        >
          <textarea
            name="garantiasAceitas"
            defaultValue={valores.garantiasAceitas}
            rows={3}
            className={estiloInput}
          />
        </Campo>
      </Secao>

      {mostrarUploader && (
        <Secao titulo="Fotos">
          <div className="sm:col-span-2">
            <PhotoUploader />
          </div>
        </Secao>
      )}

      <Secao titulo="Publicação">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="destaque"
            defaultChecked={valores.destaque}
            className="h-4 w-4"
          />
          Mostrar na vitrine da home
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={valores.ativo}
            className="h-4 w-4"
          />
          Ativo (visível no site e no feed)
        </label>
      </Secao>

      <div className="flex items-center gap-3 border-t border-slate-200 pt-6">
        <BotaoSalvar modo={modo} />
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------

const estiloInput =
  "rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none";

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {titulo}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Campo({
  label,
  dica,
  erro,
  className = "",
  children,
}: {
  label: string;
  dica?: string;
  erro?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {dica && <span className="text-xs text-slate-500">{dica}</span>}
      {erro && (
        <span role="alert" className="text-xs text-red-600">
          {erro}
        </span>
      )}
    </label>
  );
}

function CampoNumero({
  label,
  nome,
  valores,
  erros,
}: {
  label: string;
  nome: keyof ValoresImovel;
  valores: ValoresImovel;
  erros: Record<string, string>;
}) {
  return (
    <Campo label={label} erro={erros[nome]}>
      <input
        name={nome}
        defaultValue={String(valores[nome] ?? "")}
        type="number"
        min={0}
        className={estiloInput}
      />
    </Campo>
  );
}

function BotaoSalvar({ modo }: { modo: "novo" | "editar" }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-900 px-6 py-2.5 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
    >
      {pending
        ? "Salvando..."
        : modo === "novo"
          ? "Cadastrar imóvel"
          : "Salvar alterações"}
    </button>
  );
}
