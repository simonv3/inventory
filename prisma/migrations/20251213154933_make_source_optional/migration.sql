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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("createdAt", "id", "isOrganic", "minimumStock", "name", "pricePerUnit", "showInStorefront", "sourceId", "unitOfMeasurement", "updatedAt") SELECT "createdAt", "id", "isOrganic", "minimumStock", "name", "pricePerUnit", "showInStorefront", "sourceId", "unitOfMeasurement", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
