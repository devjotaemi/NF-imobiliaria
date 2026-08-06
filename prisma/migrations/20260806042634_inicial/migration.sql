-- CreateEnum
CREATE TYPE "TipoTransacao" AS ENUM ('venda', 'aluguel');

-- CreateEnum
CREATE TYPE "TipoImovel" AS ENUM ('apartamento', 'casa', 'casa_condominio', 'cobertura', 'kitnet_studio', 'sala_comercial', 'loja', 'galpao', 'terreno', 'chacara_sitio_fazenda', 'outro');

-- CreateEnum
CREATE TYPE "PeriodoIptu" AS ENUM ('mensal', 'anual');

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipoTransacao" "TipoTransacao" NOT NULL,
    "tipoImovel" "TipoImovel" NOT NULL,
    "precoCentavos" INTEGER,
    "precoSobConsulta" BOOLEAN NOT NULL DEFAULT false,
    "condominioCentavos" INTEGER,
    "iptuCentavos" INTEGER,
    "iptuPeriodo" "PeriodoIptu",
    "bairro" TEXT,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "cep" TEXT,
    "quartos" INTEGER,
    "suites" INTEGER,
    "banheiros" INTEGER,
    "vagas" INTEGER,
    "areaUtilM2" INTEGER,
    "areaTerrenoM2" INTEGER,
    "andar" INTEGER,
    "totalAndares" INTEGER,
    "torres" INTEGER,
    "anoConstrucao" INTEGER,
    "caracteristicas" TEXT[],
    "garantiasAceitas" TEXT[],
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyPhoto" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "altText" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppClick" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "propertySlugSnapshot" TEXT,
    "propertyTituloSnapshot" TEXT,
    "placement" TEXT NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "referrer" TEXT,
    "userAgentRaw" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignSpend" (
    "id" TEXT NOT NULL,
    "campanha" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "mesReferencia" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignSpend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Property_referenceCode_key" ON "Property"("referenceCode");

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");

-- CreateIndex
CREATE INDEX "Property_destaque_ativo_idx" ON "Property"("destaque", "ativo");

-- CreateIndex
CREATE INDEX "Property_ativo_idx" ON "Property"("ativo");

-- CreateIndex
CREATE INDEX "PropertyPhoto_propertyId_ordem_idx" ON "PropertyPhoto"("propertyId", "ordem");

-- CreateIndex
CREATE INDEX "WhatsAppClick_createdAt_idx" ON "WhatsAppClick"("createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppClick_utmCampaign_createdAt_idx" ON "WhatsAppClick"("utmCampaign", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppClick_propertyId_idx" ON "WhatsAppClick"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignSpend_campanha_mesReferencia_key" ON "CampaignSpend"("campanha", "mesReferencia");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- AddForeignKey
ALTER TABLE "PropertyPhoto" ADD CONSTRAINT "PropertyPhoto_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppClick" ADD CONSTRAINT "WhatsAppClick_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
