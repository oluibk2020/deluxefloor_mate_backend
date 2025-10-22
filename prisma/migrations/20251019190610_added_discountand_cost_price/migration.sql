-- CreateEnum
CREATE TYPE "DiscountPaymentStatus" AS ENUM ('failed', 'success', 'pending');

-- AlterTable
ALTER TABLE "orderitems" ADD COLUMN     "discount" INTEGER,
ADD COLUMN     "discountPaymentStatus" "DiscountPaymentStatus" DEFAULT 'pending';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "cost" DECIMAL(65,30) NOT NULL DEFAULT 0;
