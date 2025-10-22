/*
  Warnings:

  - You are about to drop the column `costPrice` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `orders` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `cost` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to drop the `orderitems` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `deliveryAddressId` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "orderitems" DROP CONSTRAINT "orderitems_deliveryAddressId_fkey";

-- DropForeignKey
ALTER TABLE "orderitems" DROP CONSTRAINT "orderitems_userId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_orderId_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "costPrice",
DROP COLUMN "orderId",
DROP COLUMN "price",
DROP COLUMN "productId",
DROP COLUMN "quantity",
ADD COLUMN     "deliveryAddressId" INTEGER NOT NULL,
ADD COLUMN     "discountAmount" INTEGER,
ADD COLUMN     "discountPaymentStatus" "DiscountPaymentStatus" DEFAULT 'pending',
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'flutterwave',
ADD COLUMN     "totalAmount" INTEGER NOT NULL,
ADD COLUMN     "transactionStatus" "TransactionStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "cost" SET DATA TYPE DOUBLE PRECISION;

-- DropTable
DROP TABLE "orderitems";

-- CreateTable
CREATE TABLE "order_items" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "costPrice" INTEGER,
    "orderId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cart_userId_idx" ON "cart"("userId");

-- CreateIndex
CREATE INDEX "cart_productId_idx" ON "cart"("productId");

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "orders"("userId");

-- CreateIndex
CREATE INDEX "orders_transactionStatus_idx" ON "orders"("transactionStatus");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_title_idx" ON "products"("title");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_deliveryAddressId_fkey" FOREIGN KEY ("deliveryAddressId") REFERENCES "deliveryaddresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
