/*
  Warnings:

  - Added the required column `paymentMethod` to the `orderitems` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionSuccessful` to the `orderitems` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orderitems" ADD COLUMN     "paymentMethod" TEXT NOT NULL,
ADD COLUMN     "transactionSuccessful" BOOLEAN NOT NULL;
