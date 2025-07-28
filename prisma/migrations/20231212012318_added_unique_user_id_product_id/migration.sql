/*
  Warnings:

  - A unique constraint covering the columns `[productId,userId]` on the table `carts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "carts" DROP CONSTRAINT "carts_userId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "carts_productId_userId_key" ON "carts"("productId", "userId");
