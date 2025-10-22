/*
  Warnings:

  - You are about to drop the column `discount` on the `orderitems` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orderitems" DROP COLUMN "discount",
ADD COLUMN     "discountAmount" INTEGER;
