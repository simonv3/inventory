/*
  Warnings:

  - You are about to drop the column `customerTypeId` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `markupPercent` on the `Customer` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_customerTypeId_fkey";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "customerTypeId",
DROP COLUMN "markupPercent";

-- AlterTable
ALTER TABLE "CustomerStore" ADD COLUMN     "customerTypeId" INTEGER,
ADD COLUMN     "markupPercent" DOUBLE PRECISION NOT NULL DEFAULT 5.0;

-- AddForeignKey
ALTER TABLE "CustomerStore" ADD CONSTRAINT "CustomerStore_customerTypeId_fkey" FOREIGN KEY ("customerTypeId") REFERENCES "CustomerType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
