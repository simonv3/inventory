/*
  Warnings:

  - Added the required column `salePrice` to the `SaleItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "salePrice" DOUBLE PRECISION NOT NULL;
