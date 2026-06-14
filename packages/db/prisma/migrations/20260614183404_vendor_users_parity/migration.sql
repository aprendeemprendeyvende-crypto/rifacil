-- CreateEnum
CREATE TYPE "VendorRole" AS ENUM ('VENDEDOR', 'ADMIN');

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "idDocument" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "role" "VendorRole" NOT NULL DEFAULT 'VENDEDOR';
