/*
  Warnings:

  - You are about to drop the `StoreProduct` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `storeId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "StoreProduct_storeId_productId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "StoreProduct";
PRAGMA foreign_keys=on;

-- Create default store if it doesn't exist
INSERT OR IGNORE INTO "Store" (name, createdAt, updatedAt) VALUES ('Main Store', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("createdAt", "id", "isOrganic", "minimumStock", "name", "pricePerUnit", "showInStorefront", "sourceId", "unitOfMeasurement", "updatedAt", "storeId") SELECT "createdAt", "id", "isOrganic", "minimumStock", "name", "pricePerUnit", "showInStorefront", "sourceId", "unitOfMeasurement", "updatedAt", (SELECT id FROM "Store" WHERE name = 'Main Store' LIMIT 1) FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
