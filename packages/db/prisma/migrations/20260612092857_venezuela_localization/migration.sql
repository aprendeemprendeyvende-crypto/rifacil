-- CreateEnum
CREATE TYPE "Role" AS ENUM ('RIFERO', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "RaffleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'SOLD_OUT', 'DRAWN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NumberStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'PAID');

-- CreateEnum
CREATE TYPE "DrawMethod" AS ENUM ('RANDOM_SYSTEM', 'LIVE_STREAM', 'PHYSICAL_BALLS', 'BLOCKCHAIN');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PENDING', 'RESERVED', 'PAID', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('WHATSAPP', 'SMS', 'EMAIL', 'SOCIAL_POST', 'REMARKETING', 'REFERRAL');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAGO_MOVIL', 'BINANCE', 'ZELLE', 'EFECTIVO_USD', 'EFECTIVO_VES', 'TRANSFERENCIA_VES', 'NEQUI', 'DAVIPLATA', 'PSE', 'BANK_TRANSFER', 'MERCADOPAGO', 'STRIPE', 'WOMPI', 'CASH');

-- CreateEnum
CREATE TYPE "RateSource" AS ENUM ('BCV', 'BINANCE', 'MANUAL');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "phone" TEXT NOT NULL,
    "phoneVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'RIFERO',
    "brandName" TEXT,
    "brandLogo" TEXT,
    "brandColor" TEXT DEFAULT '#3b82f6',
    "brandSlug" TEXT,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "language" TEXT NOT NULL DEFAULT 'es',
    "currency" TEXT NOT NULL DEFAULT 'VES',
    "timezone" TEXT NOT NULL DEFAULT 'America/Caracas',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "whatsappNotifications" BOOLEAN NOT NULL DEFAULT true,
    "whatsappConnected" BOOLEAN NOT NULL DEFAULT false,
    "whatsappPhoneNumber" TEXT,
    "whatsappApiToken" TEXT,
    "acceptedPaymentMethods" "PaymentMethod"[] DEFAULT ARRAY['PAGO_MOVIL', 'BINANCE', 'ZELLE', 'EFECTIVO_USD']::"PaymentMethod"[],
    "receiptTemplate" TEXT DEFAULT 'default',
    "whatsappSaleTemplate" TEXT,
    "emailSaleTemplate" TEXT,
    "autoConfirmPayments" BOOLEAN NOT NULL DEFAULT false,
    "autoSendReceipt" BOOLEAN NOT NULL DEFAULT true,
    "autoSendWhatsApp" BOOLEAN NOT NULL DEFAULT true,
    "reservationExpiryMinutes" INTEGER NOT NULL DEFAULT 30,
    "pmBankCode" TEXT,
    "pmPhone" TEXT,
    "pmIdNumber" TEXT,
    "binanceEmail" TEXT,
    "zelleEmail" TEXT,
    "zelleName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Raffle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "prize" TEXT NOT NULL,
    "prizeValue" DECIMAL(12,2) NOT NULL,
    "prizeImages" TEXT[],
    "totalNumbers" INTEGER NOT NULL,
    "pricePerNumber" DECIMAL(10,2) NOT NULL,
    "numberFormat" TEXT NOT NULL DEFAULT '000',
    "numberPrefix" TEXT,
    "numberSuffix" TEXT,
    "allowPickNumbers" BOOLEAN NOT NULL DEFAULT true,
    "allowRandom" BOOLEAN NOT NULL DEFAULT true,
    "minPurchase" INTEGER NOT NULL DEFAULT 1,
    "maxPurchase" INTEGER,
    "discountPackages" JSONB,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "drawDate" TIMESTAMP(3),
    "status" "RaffleStatus" NOT NULL DEFAULT 'DRAFT',
    "drawMethod" "DrawMethod" NOT NULL DEFAULT 'RANDOM_SYSTEM',
    "winnerNumber" TEXT,
    "winnerId" TEXT,
    "drawVideoUrl" TEXT,
    "drawTimestamp" TIMESTAMP(3),
    "drawSeed" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "allowSharing" BOOLEAN NOT NULL DEFAULT true,
    "passwordProtected" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT,
    "socialImage" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Raffle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaffleNumber" (
    "id" TEXT NOT NULL,
    "raffleId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "NumberStatus" NOT NULL DEFAULT 'AVAILABLE',
    "reservedAt" TIMESTAMP(3),
    "reservedUntil" TIMESTAMP(3),
    "reservedByIp" TEXT,
    "soldAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "paymentMethod" "PaymentMethod",
    "paymentProof" TEXT,
    "paymentReference" TEXT,
    "receiptUrl" TEXT,
    "receiptNumber" TEXT,
    "vendorId" TEXT,
    "commission" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "saleId" TEXT,
    "contactId" TEXT,

    CONSTRAINT "RaffleNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'VE',
    "source" TEXT,
    "importedFrom" TEXT,
    "importedAt" TIMESTAMP(3),
    "tags" TEXT[],
    "notes" TEXT,
    "birthday" TIMESTAMP(3),
    "totalSpent" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalTickets" INTEGER NOT NULL DEFAULT 0,
    "totalRaffles" INTEGER NOT NULL DEFAULT 0,
    "lastPurchase" TIMESTAMP(3),
    "firstPurchase" TIMESTAMP(3),
    "lastContactDate" TIMESTAMP(3),
    "lastContactMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "raffleId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "vendorId" TEXT,
    "userId" TEXT NOT NULL,
    "numbers" TEXT[],
    "totalNumbers" INTEGER NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "discountApplied" DECIMAL(10,2),
    "discountReason" TEXT,
    "finalAmount" DECIMAL(12,2) NOT NULL,
    "rateUsed" DECIMAL(14,4),
    "amountVes" DECIMAL(14,2),
    "status" "SaleStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod",
    "paymentProof" TEXT,
    "paymentReference" TEXT,
    "paidAt" TIMESTAMP(3),
    "receiptNumber" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "receiptSent" BOOLEAN NOT NULL DEFAULT false,
    "receiptSentAt" TIMESTAMP(3),
    "whatsappSent" BOOLEAN NOT NULL DEFAULT false,
    "whatsappSentAt" TIMESTAMP(3),
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "smsSent" BOOLEAN NOT NULL DEFAULT false,
    "smsSentAt" TIMESTAMP(3),
    "source" TEXT,
    "campaignId" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "code" TEXT NOT NULL,
    "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "commissionFixed" DECIMAL(10,2),
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "totalNumbers" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalPending" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "parentVendorId" TEXT,
    "personalLink" TEXT,
    "personalQR" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "raffleId" TEXT,
    "name" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "mediaUrls" TEXT[],
    "ctaLink" TEXT,
    "ctaText" TEXT,
    "targetTags" TEXT[],
    "targetAll" BOOLEAN NOT NULL DEFAULT false,
    "targetContacts" TEXT[],
    "excludeContacts" TEXT[],
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "openedCount" INTEGER NOT NULL DEFAULT 0,
    "clickedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "convertedCount" INTEGER NOT NULL DEFAULT 0,
    "revenueGenerated" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "costPerMessage" DECIMAL(10,4),
    "totalCost" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "maxRaffles" INTEGER NOT NULL DEFAULT 1,
    "maxContacts" INTEGER NOT NULL DEFAULT 50,
    "maxVendors" INTEGER NOT NULL DEFAULT 0,
    "maxNumbers" INTEGER NOT NULL DEFAULT 100,
    "maxCampaignsPerMonth" INTEGER NOT NULL DEFAULT 0,
    "rafflesUsed" INTEGER NOT NULL DEFAULT 0,
    "contactsUsed" INTEGER NOT NULL DEFAULT 0,
    "vendorsUsed" INTEGER NOT NULL DEFAULT 0,
    "numbersUsed" INTEGER NOT NULL DEFAULT 0,
    "campaignsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "trigger" TEXT NOT NULL,
    "triggerConfig" JSONB,
    "conditions" JSONB,
    "actions" JSONB NOT NULL,
    "triggeredCount" INTEGER NOT NULL DEFAULT 0,
    "executedCount" INTEGER NOT NULL DEFAULT 0,
    "lastTriggered" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variables" TEXT[],
    "imageTemplate" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "RateSource" NOT NULL DEFAULT 'BCV',
    "vesPerUsd" DECIMAL(14,4) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_brandSlug_key" ON "User"("brandSlug");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "Raffle_userId_status_idx" ON "Raffle"("userId", "status");

-- CreateIndex
CREATE INDEX "Raffle_status_idx" ON "Raffle"("status");

-- CreateIndex
CREATE INDEX "Raffle_startDate_idx" ON "Raffle"("startDate");

-- CreateIndex
CREATE INDEX "RaffleNumber_raffleId_status_idx" ON "RaffleNumber"("raffleId", "status");

-- CreateIndex
CREATE INDEX "RaffleNumber_contactId_idx" ON "RaffleNumber"("contactId");

-- CreateIndex
CREATE INDEX "RaffleNumber_vendorId_idx" ON "RaffleNumber"("vendorId");

-- CreateIndex
CREATE INDEX "RaffleNumber_status_idx" ON "RaffleNumber"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RaffleNumber_raffleId_number_key" ON "RaffleNumber"("raffleId", "number");

-- CreateIndex
CREATE INDEX "Contact_userId_name_idx" ON "Contact"("userId", "name");

-- CreateIndex
CREATE INDEX "Contact_userId_phone_idx" ON "Contact"("userId", "phone");

-- CreateIndex
CREATE INDEX "Contact_userId_tags_idx" ON "Contact"("userId", "tags");

-- CreateIndex
CREATE INDEX "Contact_userId_source_idx" ON "Contact"("userId", "source");

-- CreateIndex
CREATE INDEX "Contact_userId_lastPurchase_idx" ON "Contact"("userId", "lastPurchase");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_userId_phone_key" ON "Contact"("userId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_receiptNumber_key" ON "Sale"("receiptNumber");

-- CreateIndex
CREATE INDEX "Sale_raffleId_idx" ON "Sale"("raffleId");

-- CreateIndex
CREATE INDEX "Sale_contactId_idx" ON "Sale"("contactId");

-- CreateIndex
CREATE INDEX "Sale_userId_idx" ON "Sale"("userId");

-- CreateIndex
CREATE INDEX "Sale_vendorId_idx" ON "Sale"("vendorId");

-- CreateIndex
CREATE INDEX "Sale_status_idx" ON "Sale"("status");

-- CreateIndex
CREATE INDEX "Sale_createdAt_idx" ON "Sale"("createdAt");

-- CreateIndex
CREATE INDEX "Sale_campaignId_idx" ON "Sale"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_code_key" ON "Vendor"("code");

-- CreateIndex
CREATE INDEX "Vendor_userId_idx" ON "Vendor"("userId");

-- CreateIndex
CREATE INDEX "Vendor_code_idx" ON "Vendor"("code");

-- CreateIndex
CREATE INDEX "Vendor_userId_active_idx" ON "Vendor"("userId", "active");

-- CreateIndex
CREATE INDEX "Campaign_userId_idx" ON "Campaign"("userId");

-- CreateIndex
CREATE INDEX "Campaign_raffleId_idx" ON "Campaign"("raffleId");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_scheduledAt_idx" ON "Campaign"("scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_stripeCustomerId_idx" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AutomationRule_userId_idx" ON "AutomationRule"("userId");

-- CreateIndex
CREATE INDEX "AutomationRule_active_idx" ON "AutomationRule"("active");

-- CreateIndex
CREATE INDEX "Template_userId_idx" ON "Template"("userId");

-- CreateIndex
CREATE INDEX "Template_type_idx" ON "Template"("type");

-- CreateIndex
CREATE INDEX "Template_category_idx" ON "Template"("category");

-- CreateIndex
CREATE INDEX "ExchangeRate_userId_isActive_idx" ON "ExchangeRate"("userId", "isActive");

-- CreateIndex
CREATE INDEX "ExchangeRate_userId_source_idx" ON "ExchangeRate"("userId", "source");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Raffle" ADD CONSTRAINT "Raffle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleNumber" ADD CONSTRAINT "RaffleNumber_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleNumber" ADD CONSTRAINT "RaffleNumber_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleNumber" ADD CONSTRAINT "RaffleNumber_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleNumber" ADD CONSTRAINT "RaffleNumber_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_parentVendorId_fkey" FOREIGN KEY ("parentVendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================
-- Búsqueda fuzzy de contactos (regla de oro #5) — tolerante a errores
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX contact_name_trgm ON "Contact" USING gin (name gin_trgm_ops);
CREATE INDEX contact_phone_trgm ON "Contact" USING gin (phone gin_trgm_ops);
