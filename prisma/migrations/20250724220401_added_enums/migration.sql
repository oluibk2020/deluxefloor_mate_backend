/*
  Warnings:

  - The `paymentMethod` column on the `orderitems` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `transactionStatus` column on the `orderitems` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('flutterwave', 'paystack', 'cash');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('failed', 'success', 'pending');

-- AlterTable
ALTER TABLE "orderitems" DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'flutterwave',
DROP COLUMN "transactionStatus",
ADD COLUMN     "transactionStatus" "TransactionStatus" NOT NULL DEFAULT 'pending';
