/*
  Warnings:

  - Added the required column `sku` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isOrganic" BOOLEAN NOT NULL DEFAULT false,
    "showInStorefront" BOOLEAN NOT NULL DEFAULT true,
    "unitOfMeasurement" TEXT NOT NULL,
    "pricePerUnit" REAL NOT NULL,
    "minimumStock" INTEGER NOT NULL,
    "sourceId" INTEGER,
    "storeId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("createdAt", "id", "isOrganic", "minimumStock", "name", "pricePerUnit", "showInStorefront", "sourceId", "storeId", "unitOfMeasurement", "updatedAt", "sku") SELECT "createdAt", "id", "isOrganic", "minimumStock", "name", "pricePerUnit", "showInStorefront", "sourceId", "storeId", "unitOfMeasurement", "updatedAt", UPPER(SUBSTR(REPLACE(REPLACE(REPLACE("name", ' ', '-'), ',', ''), '.', ''), 1, 8) || '-' || PRINTF('%04d', "id")) FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_storeId_sku_key" ON "Product"("storeId", "sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
