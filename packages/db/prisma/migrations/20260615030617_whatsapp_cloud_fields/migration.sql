-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "whatsappBusinessId" TEXT,
ADD COLUMN     "whatsappPhoneNumberId" TEXT,
ADD COLUMN     "whatsappProvider" TEXT DEFAULT 'NONE';
