/*
  Warnings:

  - You are about to drop the column `transactionSuccessful` on the `orderitems` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orderitems" DROP COLUMN "transactionSuccessful",
ADD COLUMN     "transactionStatus" TEXT NOT NULL DEFAULT 'pending';
