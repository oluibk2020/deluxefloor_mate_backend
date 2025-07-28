/*
  Warnings:

  - You are about to drop the column `deliveryAddress` on the `deliveryaddresses` table. All the data in the column will be lost.
  - Added the required column `address` to the `deliveryaddresses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "deliveryaddresses" DROP COLUMN "deliveryAddress",
ADD COLUMN     "address" TEXT NOT NULL;
