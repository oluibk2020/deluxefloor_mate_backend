/*
  Warnings:

  - You are about to drop the column `email` on the `deliveryaddresses` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "deliveryaddresses_email_key";

-- AlterTable
ALTER TABLE "deliveryaddresses" DROP COLUMN "email";
